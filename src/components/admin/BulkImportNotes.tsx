import { useState, useRef } from "react";
import { Upload, FileJson, FileSpreadsheet, Loader2, AlertCircle, CheckCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { useLanguages, useUnits } from "@/hooks/useAdmin";
import { useQueryClient } from "@tanstack/react-query";

interface ImportResult {
  success: number;
  errors: string[];
}

interface ImportProgress {
  current: number;
  total: number;
  percent: number;
}

const BATCH_SIZE = 50;

export function BulkImportNotes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [jsonContent, setJsonContent] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  const { data: languages = [] } = useLanguages();
  const { data: units = [] } = useUnits(selectedLanguage);

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

  const importNotes = async (data: any[]): Promise<ImportResult> => {
    let success = 0;
    const errors: string[] = [];
    
    // Process in batches
    const batches: any[][] = [];
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      batches.push(data.slice(i, i + BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      for (const item of batch) {
        try {
          const { error } = await supabase.from("unit_notes").insert({
            unit_id: selectedUnit,
            title: item.title,
            content: item.content,
            order_index: item.order_index || 0,
          });

          if (error) throw error;
          success++;
        } catch (err: any) {
          errors.push(`Note "${item.title}": ${err.message}`);
        }
      }
      
      // Update progress
      const imported = (batchIndex + 1) * BATCH_SIZE;
      setProgress({
        current: Math.min(imported, data.length),
        total: data.length,
        percent: Math.round((Math.min(imported, data.length) / data.length) * 100),
      });

      // Yield to UI thread
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return { success, errors };
  };

  const handleImport = async () => {
    if (!selectedUnit) {
      toast({ title: "Please select a unit", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setResult(null);
    setProgress(null);

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

      setProgress({ current: 0, total: data.length, percent: 0 });
      
      const importResult = await importNotes(data);
      setResult(importResult);

      if (importResult.success > 0) {
        toast({ title: `Successfully imported ${importResult.success} notes!` });
        queryClient.invalidateQueries({ queryKey: ["unit-notes"] });
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

  const sampleNotesCSV = `title,content,order_index
"Introduction to Variables","Variables store data values. In Python, you create a variable by assigning a value to it using the = operator.",0
"Data Types","Python has several data types: int, float, str, bool, list, tuple, dict, and set.",1`;

  const sampleNotesJSON = JSON.stringify(
    [
      { 
        title: "Introduction to Variables", 
        content: "Variables store data values. In Python, you create a variable by assigning a value to it using the = operator.\n\n## Key Concepts\n- Variables don't need explicit type declaration\n- Use meaningful variable names\n- Follow snake_case naming convention",
        order_index: 0 
      },
      { 
        title: "Data Types", 
        content: "Python has several built-in data types:\n\n### Numeric Types\n- int: whole numbers\n- float: decimal numbers\n\n### Text Type\n- str: string of characters",
        order_index: 1 
      },
    ],
    null,
    2
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Import Study Notes
        </h3>

        <div className="space-y-4">
          {/* Selectors */}
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
                <pre className="text-xs text-slate-300 overflow-x-auto max-h-40">
                  {sampleNotesJSON}
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
                  {sampleNotesCSV}
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

          {/* Progress Bar */}
          {progress && isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Importing...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={progress.percent} className="h-2" />
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={isImporting || (!jsonContent && !csvContent)}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing... {progress ? `${progress.percent}%` : ""}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Notes
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="space-y-2">
              {result.success > 0 && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Successfully imported {result.success} notes</span>
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
