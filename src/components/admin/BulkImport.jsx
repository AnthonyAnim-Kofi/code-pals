import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguages, useUnits, useLessons } from "@/hooks/useAdmin";
import { useQueryClient } from "@tanstack/react-query";
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

const EXAMPLES = {
  lessons: {
    json: JSON.stringify(
      [
        { title: "Introduction to Loops", order_index: 0 },
        { title: "While Loops", order_index: 1 },
        { title: "For Loops", order_index: 2 },
      ],
      null,
      2,
    ),
    csv: `title,order_index
"Introduction to Loops",0
"While Loops",1
"For Loops",2`,
  },
  questions: {
    json: JSON.stringify(
      [
        {
          type: "fill-blank",
          instruction: "Complete the print statement",
          code: "print(___)",
          answer: '"Hello, World!"',
          options: ['"Hello, World!"', '"Hi"', '"Bye"', '"Test"'],
          hint: "Use quotes around the string",
        },
        {
          type: "multiple-choice",
          instruction: "What does print() do?",
          options: ["Displays output", "Takes input", "Creates variable", "Imports module"],
          answer: "0",
        },
      ],
      null,
      2,
    ),
    csv: `type,instruction,code,answer,options,hint
"fill-blank","Complete the print statement","print(___)","Hello|World","""Hello""|""World""|""Hi""|""Bye""","Use print to display text"
"multiple-choice","What does print() do?","","0","""Displays output""|""Takes input""|""Creates variable""|""Imports module""","Think about output"`,
  },
};

export function BulkImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [importType, setImportType] = useState("lessons");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);

  const { data: languages = [] } = useLanguages();
  const { data: units = [] } = useUnits(selectedLanguage);
  const { data: lessons = [] } = useLessons(selectedUnit);

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
    if (importType === "lessons" && !selectedUnit) {
      toast({ title: "Select a unit", variant: "destructive" });
      return;
    }
    if (importType === "questions" && !selectedLesson) {
      toast({ title: "Select a lesson", variant: "destructive" });
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

      if (importType === "lessons") {
        importResult = await runSequentialImport({
          rows,
          onProgress: setProgress,
          processRow: async (item) => {
            const { error } = await supabase.from("lessons").insert({
              unit_id: selectedUnit,
              title: item.title,
              order_index: item.order_index ?? 0,
              is_active: item.is_active !== false,
            });
            if (error) throw new Error(error.message);
          },
          labelError: (item, _i, msg) =>
            `Lesson "${item.title ?? "?"}": ${msg}`,
        });
      } else {
        importResult = await runSequentialImport({
          rows,
          onProgress: setProgress,
          processRow: async (item) => {
            const row = normalizeQuestionPayload(item);
            const { error } = await supabase.from("questions").insert({
              lesson_id: selectedLesson,
              ...row,
            });
            if (error) throw new Error(error.message);
          },
          labelError: (item, _i, msg) => {
            const hint = String(item.instruction ?? "").slice(0, 40);
            return `Question "${hint}…": ${msg}`;
          },
        });
      }

      setResult(importResult);

      if (importResult.success > 0) {
        toast({ title: `Imported ${importResult.success} ${importType}` });
        queryClient.invalidateQueries({ queryKey: ["lessons"] });
        queryClient.invalidateQueries({ queryKey: ["questions"] });
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

  const examples = importType === "lessons" ? EXAMPLES.lessons : EXAMPLES.questions;
  const hasPayload = Boolean(jsonContent.trim() || csvContent.trim());

  return (
    <div className="w-full space-y-6">
      <div className="w-full bg-slate-800 rounded-xl border border-slate-700 p-6 md:p-8">
        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Upload className="w-6 h-6 shrink-0" />
          Bulk import
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Choose lessons or questions, pick the destination, then paste JSON/CSV or upload a file.
        </p>

        <div className="space-y-4">
          <div>
            <Label>Import type</Label>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lessons">Lessons</SelectItem>
                <SelectItem value="questions">Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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
            {importType === "questions" && (
              <div>
                <Label>Lesson</Label>
                <Select
                  value={selectedLesson}
                  onValueChange={setSelectedLesson}
                  disabled={!selectedUnit}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select lesson" />
                  </SelectTrigger>
                  <SelectContent>
                    {lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <AdminImportSourceBlock
            variant="card"
            jsonContent={jsonContent}
            onJsonChange={setJsonContent}
            csvContent={csvContent}
            onCsvChange={setCsvContent}
            fileInputRef={fileInputRef}
            onFileChange={handleFileUpload}
            examples={examples}
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
                Import {importType}
              </>
            )}
          </Button>

          <ImportResultSummary result={result} />
        </div>
      </div>
    </div>
  );
}
