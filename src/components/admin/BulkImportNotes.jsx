import { useState, useRef } from "react";
import { Upload, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguages, useUnits } from "@/hooks/useAdmin";
import { useQueryClient } from "@tanstack/react-query";
import { parseImportPayload, runSequentialImport } from "@/lib/adminImport";
import {
  AdminImportSourceBlock,
  ImportProgressBar,
  ImportResultSummary,
} from "@/components/admin/AdminImportSourceBlock";

const EXAMPLES = {
  json: JSON.stringify(
    [
      {
        title: "Introduction to Variables",
        content:
          "Variables store data values. In Python, you create a variable by assigning a value to it using the = operator.\n\n## Key Concepts\n- Variables don't need explicit type declaration",
        order_index: 0,
      },
      {
        title: "Data Types",
        content:
          "Python has several built-in data types:\n\n### Numeric Types\n- int: whole numbers\n- float: decimal numbers",
        order_index: 1,
      },
    ],
    null,
    2,
  ),
  csv: `title,content,order_index
"Introduction to Variables","Variables store data values. In Python, you create a variable by assigning a value to it using the = operator.",0
"Data Types","Python has several data types: int, float, str, bool, list, tuple, dict, and set.",1`,
};

export function BulkImportNotes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);

  const { data: languages = [] } = useLanguages();
  const { data: units = [] } = useUnits(selectedLanguage);

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

  const handleImport = async () => {
    if (!selectedUnit) {
      toast({ title: "Select a unit", variant: "destructive" });
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
      const importResult = await runSequentialImport({
        rows,
        onProgress: setProgress,
        processRow: async (item) => {
          const { error } = await supabase.from("unit_notes").insert({
            unit_id: selectedUnit,
            title: item.title,
            content: item.content,
            order_index: item.order_index ?? 0,
          });
          if (error) throw new Error(error.message);
        },
        labelError: (item, _i, msg) => `Note "${item.title ?? "?"}": ${msg}`,
      });

      setResult(importResult);

      if (importResult.success > 0) {
        toast({ title: `Imported ${importResult.success} note(s)` });
        queryClient.invalidateQueries({ queryKey: ["unit-notes"] });
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

  const hasPayload = Boolean(jsonContent.trim() || csvContent.trim());

  return (
    <div className="w-full space-y-6">
      <div className="w-full bg-slate-800 rounded-xl border border-slate-700 p-6 md:p-8">
        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
          <BookOpen className="w-6 h-6 shrink-0" />
          Import study notes
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Select a unit, then import rows with <code className="text-amber-200">title</code>,{" "}
          <code className="text-amber-200">content</code>, and optional{" "}
          <code className="text-amber-200">order_index</code>.
        </p>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.icon} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unit</Label>
              <Select
                value={selectedUnit}
                onValueChange={setSelectedUnit}
                disabled={!selectedLanguage}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <AdminImportSourceBlock
            variant="card"
            jsonContent={jsonContent}
            onJsonChange={setJsonContent}
            csvContent={csvContent}
            onCsvChange={setCsvContent}
            fileInputRef={fileInputRef}
            onFileChange={handleFileUpload}
            examples={EXAMPLES}
          />

          <ImportProgressBar progress={progress} isImporting={isImporting} variant="card" />

          <Button
            onClick={handleImport}
            disabled={isImporting || !hasPayload}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import notes
              </>
            )}
          </Button>

          <ImportResultSummary result={result} />
        </div>
      </div>
    </div>
  );
}
