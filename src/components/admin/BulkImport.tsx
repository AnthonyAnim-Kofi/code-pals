import { useState, useRef } from "react";
import { Upload, FileJson, FileSpreadsheet, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguages, useUnits, useLessons } from "@/hooks/useAdmin";
import { useQueryClient } from "@tanstack/react-query";

interface ImportResult {
  success: number;
  errors: string[];
}

export function BulkImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importType, setImportType] = useState<"lessons" | "questions">("lessons");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [jsonContent, setJsonContent] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { data: languages = [] } = useLanguages();
  const { data: units = [] } = useUnits(selectedLanguage);
  const { data: lessons = [] } = useLessons(selectedUnit);

  const parseCSV = (csv: string): Record<string, string>[] => {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let currentValue = "";
      let insideQuotes = false;

      for (const char of lines[i]) {
        if (char === '"' && !insideQuotes) {
          insideQuotes = true;
        } else if (char === '"' && insideQuotes) {
          insideQuotes = false;
        } else if (char === "," && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || "";
      });
      rows.push(row);
    }

    return rows;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const isJSON = file.name.endsWith(".json");

    if (isJSON) {
      setJsonContent(content);
      setCsvContent("");
    } else {
      setCsvContent(content);
      setJsonContent("");
    }
  };

  const importLessons = async (data: any[]): Promise<ImportResult> => {
    let success = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        const { error } = await supabase.from("lessons").insert({
          unit_id: selectedUnit,
          title: item.title,
          order_index: item.order_index || 0,
          is_active: item.is_active !== false,
        });

        if (error) throw error;
        success++;
      } catch (err: any) {
        errors.push(`Lesson "${item.title}": ${err.message}`);
      }
    }

    return { success, errors };
  };

  const importQuestions = async (data: any[]): Promise<ImportResult> => {
    let success = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // Parse options if it's a string
        let options = item.options;
        if (typeof options === "string") {
          try {
            options = JSON.parse(options);
          } catch {
            options = options.split("|").map((o: string) => o.trim());
          }
        }

        // Parse blocks for drag-order
        let blocks = item.blocks;
        if (typeof blocks === "string") {
          try {
            blocks = JSON.parse(blocks);
          } catch {
            blocks = undefined;
          }
        }

        // Parse correct_order for drag-order
        let correct_order = item.correct_order;
        if (typeof correct_order === "string") {
          try {
            correct_order = JSON.parse(correct_order);
          } catch {
            correct_order = correct_order.split("|").map((o: string) => o.trim());
          }
        }

        const { error } = await supabase.from("questions").insert({
          lesson_id: selectedLesson,
          type: item.type,
          instruction: item.instruction,
          code: item.code || null,
          answer: item.answer || null,
          options: options || null,
          blocks: blocks || null,
          correct_order: correct_order || null,
          hint: item.hint || null,
          initial_code: item.initial_code || null,
          expected_output: item.expected_output || null,
          order_index: item.order_index || 0,
          xp_reward: item.xp_reward || 10,
        });

        if (error) throw error;
        success++;
      } catch (err: any) {
        errors.push(`Question "${item.instruction?.substring(0, 30)}...": ${err.message}`);
      }
    }

    return { success, errors };
  };

  const handleImport = async () => {
    if (importType === "lessons" && !selectedUnit) {
      toast({ title: "Please select a unit", variant: "destructive" });
      return;
    }
    if (importType === "questions" && !selectedLesson) {
      toast({ title: "Please select a lesson", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      let data: any[];

      if (jsonContent) {
        data = JSON.parse(jsonContent);
        if (!Array.isArray(data)) {
          data = [data];
        }
      } else if (csvContent) {
        data = parseCSV(csvContent);
      } else {
        toast({ title: "No data to import", variant: "destructive" });
        return;
      }

      const importResult =
        importType === "lessons" ? await importLessons(data) : await importQuestions(data);

      setResult(importResult);

      if (importResult.success > 0) {
        toast({ title: `Successfully imported ${importResult.success} ${importType}!` });
        queryClient.invalidateQueries({ queryKey: ["lessons"] });
        queryClient.invalidateQueries({ queryKey: ["questions"] });
      }

      if (importResult.errors.length > 0) {
        toast({
          title: `${importResult.errors.length} errors occurred`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: `Import failed: ${err.message}`, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const sampleLessonsCSV = `title,order_index
"Introduction to Loops",0
"While Loops",1
"For Loops",2`;

  const sampleQuestionsCSV = `type,instruction,code,answer,options,hint
"fill-blank","Complete the print statement","print(___)","Hello|World","""Hello""|""World""|""Hi""|""Bye""","Use print to display text"
"multiple-choice","What does print() do?","","0","""Displays output""|""Takes input""|""Creates variable""|""Imports module""","Think about output"`;

  const sampleLessonsJSON = JSON.stringify(
    [
      { title: "Introduction to Loops", order_index: 0 },
      { title: "While Loops", order_index: 1 },
      { title: "For Loops", order_index: 2 },
    ],
    null,
    2
  );

  const sampleQuestionsJSON = JSON.stringify(
    [
      {
        type: "fill-blank",
        instruction: "Complete the print statement",
        code: 'print(___)',
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
    2
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Bulk Import
        </h3>

        <div className="space-y-4">
          {/* Import Type Selection */}
          <div>
            <Label>What do you want to import?</Label>
            <Select
              value={importType}
              onValueChange={(v) => setImportType(v as "lessons" | "questions")}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lessons">Lessons</SelectItem>
                <SelectItem value="questions">Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selectors */}
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

          {/* Input Methods */}
          <Tabs defaultValue="json" className="w-full">
            <TabsList className="bg-slate-700">
              <TabsTrigger value="json" className="data-[state=active]:bg-amber-600">
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="csv" className="data-[state=active]:bg-amber-600">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-amber-600">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="json" className="space-y-3">
              <Textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                className="bg-slate-700 border-slate-600 min-h-[200px] font-mono text-sm"
                placeholder="Paste your JSON array here..."
              />
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-400 mb-2">Example format:</p>
                <pre className="text-xs text-slate-300 overflow-x-auto">
                  {importType === "lessons" ? sampleLessonsJSON : sampleQuestionsJSON}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-3">
              <Textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="bg-slate-700 border-slate-600 min-h-[200px] font-mono text-sm"
                placeholder="Paste your CSV content here..."
              />
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-400 mb-2">Example format:</p>
                <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {importType === "lessons" ? sampleLessonsCSV : sampleQuestionsCSV}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500 transition-colors"
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-300">Click to upload a JSON or CSV file</p>
                <p className="text-xs text-slate-500 mt-1">Supports .json and .csv files</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </TabsContent>
          </Tabs>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={isImporting || (!jsonContent && !csvContent)}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {importType}
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="space-y-2">
              {result.success > 0 && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Successfully imported {result.success} items</span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{result.errors.length} errors:</span>
                  </div>
                  <ul className="text-xs text-red-300 pl-6 list-disc max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
