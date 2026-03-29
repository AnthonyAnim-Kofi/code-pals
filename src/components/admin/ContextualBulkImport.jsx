import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  parseImportPayload,
  runSequentialImport,
  normalizeQuestionPayload,
} from "@/lib/adminImport";
import {
  AdminImportSourceBlock,
  ImportProgressBar,
  ImportResultSummary,
} from "@/components/admin/AdminImportSourceBlock";

/**
 * Modal bulk import with a fixed parent (unit or lesson).
 * @param {"notes" | "lessons" | "questions"} type
 * @param {string} parentId - unit id (notes/lessons) or lesson id (questions)
 * @param {string} [selectedLanguage] - used for cache invalidation
 */
export function ContextualBulkImport({
  open,
  onOpenChange,
  type,
  parentId,
  selectedLanguage,
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [jsonContent, setJsonContent] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);

  const resetState = () => {
    setJsonContent("");
    setCsvContent("");
    setResult(null);
    setProgress(null);
    setIsImporting(false);
  };

  const handleOpenChange = (next) => {
    if (!next) resetState();
    onOpenChange(next);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (file.name.toLowerCase().endsWith(".json")) {
      setJsonContent(text);
      setCsvContent("");
    } else {
      setCsvContent(text);
      setJsonContent("");
    }
    e.target.value = "";
  };

  const invalidateCaches = () => {
    if (type === "notes") {
      queryClient.invalidateQueries({ queryKey: ["unit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["unit-notes", parentId] });
    }
    if (type === "lessons") {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lessons", parentId] });
    }
    if (type === "questions") {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["questions", parentId] });
    }
    if (selectedLanguage) {
      queryClient.invalidateQueries({ queryKey: ["units", selectedLanguage] });
    }
  };

  const handleImport = async () => {
    if (!parentId) {
      toast({ title: "Missing destination", variant: "destructive" });
      return;
    }

    const parsed = parseImportPayload(jsonContent, csvContent);
    if (!parsed.ok) {
      toast({ title: parsed.error, variant: "destructive" });
      return;
    }

    const rows = parsed.data;
    if (rows.length === 0) {
      toast({ title: "No rows to import", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setResult(null);
    setProgress({ current: 0, total: rows.length, percent: 0 });

    try {
      let importResult;

      if (type === "notes") {
        importResult = await runSequentialImport({
          rows,
          onProgress: setProgress,
          processRow: async (item) => {
            const { error } = await supabase.from("unit_notes").insert({
              unit_id: parentId,
              title: item.title,
              content: item.content,
              order_index: item.order_index ?? 0,
            });
            if (error) throw new Error(error.message);
          },
          labelError: (item, _i, msg) => `Note "${item.title ?? "?"}": ${msg}`,
        });
      } else if (type === "lessons") {
        importResult = await runSequentialImport({
          rows,
          onProgress: setProgress,
          processRow: async (item) => {
            const { error } = await supabase.from("lessons").insert({
              unit_id: parentId,
              title: item.title,
              order_index: item.order_index ?? 0,
              is_active: item.is_active !== false,
            });
            if (error) throw new Error(error.message);
          },
          labelError: (item, _i, msg) => `Lesson "${item.title ?? "?"}": ${msg}`,
        });
      } else {
        importResult = await runSequentialImport({
          rows,
          onProgress: setProgress,
          processRow: async (item) => {
            const row = normalizeQuestionPayload(item);
            const { error } = await supabase.from("questions").insert({
              lesson_id: parentId,
              ...row,
            });
            if (error) throw new Error(error.message);
          },
          labelError: (item, _i, msg) => {
            const hint = String(item.instruction ?? "").slice(0, 36);
            return `Question "${hint}…": ${msg}`;
          },
        });
      }

      setResult(importResult);

      if (importResult.success > 0) {
        toast({ title: `Imported ${importResult.success} ${type}` });
        invalidateCaches();
        if (importResult.errors.length === 0) {
          setTimeout(() => handleOpenChange(false), 1500);
        }
      }
      if (importResult.errors.length > 0) {
        toast({
          title: `${importResult.errors.length} row(s) failed`,
          variant: "destructive",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import failed";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setIsImporting(false);
      setProgress(null);
    }
  };

  const title =
    type === "notes"
      ? "Import notes"
      : type === "lessons"
        ? "Import lessons"
        : "Import questions";

  const hasPayload = Boolean(jsonContent.trim() || csvContent.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Data is attached to the current{" "}
            {type === "questions" ? "lesson" : "unit"}. Use JSON array or CSV with headers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <AdminImportSourceBlock
            variant="dialog"
            jsonContent={jsonContent}
            onJsonChange={setJsonContent}
            csvContent={csvContent}
            onCsvChange={setCsvContent}
            fileInputRef={fileInputRef}
            onFileChange={handleFileUpload}
            examples={null}
            jsonPlaceholder='[ { "title": "…" } ]'
            csvPlaceholder="Header row, then one row per record…"
          />

          <ImportProgressBar progress={progress} isImporting={isImporting} variant="dialog" />

          <ImportResultSummary result={result} />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isImporting}
              className="bg-slate-800 border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || !hasPayload}
              className="bg-amber-600 hover:bg-amber-700 min-w-[120px]"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
