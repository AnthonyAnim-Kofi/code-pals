import { useState, useRef } from "react";
import { Upload, FileJson, FileSpreadsheet, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BATCH_SIZE = 50;

/**
 * A dialog-based bulk importer that already knows its destination.
 * @param {string} type - "notes" | "lessons" | "questions"
 * @param {string} parentId - unitId (for notes/lessons) or lessonId (for questions)
 * @param {string} selectedLanguage - languageId (useful for cache invalidation)
 */
export function ContextualBulkImport({ open, onOpenChange, type, parentId, selectedLanguage }) {
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

  const handleOpenChange = (newOpen) => {
    if (!newOpen) resetState();
    onOpenChange(newOpen);
  };

  const parseCSV = (csv) => {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let currentValue = "";
        let insideQuotes = false;
        for (const char of lines[i]) {
            if (char === '"' && !insideQuotes) {
                insideQuotes = true;
            }
            else if (char === '"' && insideQuotes) {
                insideQuotes = false;
            }
            else if (char === "," && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = "";
            }
            else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx] || "";
        });
        rows.push(row);
    }
    return rows;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const isJSON = file.name.endsWith(".json");
    if (isJSON) {
        setJsonContent(content);
        setCsvContent("");
        toast({ title: "JSON file loaded" });
    } else {
        setCsvContent(content);
        setJsonContent("");
        toast({ title: "CSV file loaded" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const importData = async (data) => {
    let success = 0;
    const errors = [];
    const batches = [];
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        batches.push(data.slice(i, i + BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        for (const item of batch) {
            try {
                let payload = {};
                if (type === "notes") {
                  payload = {
                    unit_id: parentId,
                    title: item.title,
                    content: item.content,
                    order_index: item.order_index || 0,
                  };
                  const { error } = await supabase.from("unit_notes").insert(payload);
                  if (error) throw error;
                } else if (type === "lessons") {
                  payload = {
                    unit_id: parentId,
                    title: item.title,
                    order_index: item.order_index || 0,
                    is_active: item.is_active !== false,
                  };
                  const { error } = await supabase.from("lessons").insert(payload);
                  if (error) throw error;
                } else if (type === "questions") {
                  let options = item.options;
                  if (typeof options === "string") {
                      try { options = JSON.parse(options); }
                      catch { options = options.split("|").map((o) => o.trim()); }
                  }
                  let blocks = item.blocks;
                  if (typeof blocks === "string") {
                      try { blocks = JSON.parse(blocks); }
                      catch { blocks = undefined; }
                  }
                  let correct_order = item.correct_order;
                  if (typeof correct_order === "string") {
                      try { correct_order = JSON.parse(correct_order); }
                      catch { correct_order = correct_order.split("|").map((o) => o.trim()); }
                  }
                  payload = {
                    lesson_id: parentId,
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
                  };
                  const { error } = await supabase.from("questions").insert(payload);
                  if (error) throw error;
                }
                success++;
            }
            catch (err) {
                errors.push(`Failed row (${item.title || item.instruction?.substring(0, 30)}...): ${err.message}`);
            }
        }
        
        const imported = (batchIndex + 1) * BATCH_SIZE;
        setProgress({
            current: Math.min(imported, data.length),
            total: data.length,
            percent: Math.round((Math.min(imported, data.length) / data.length) * 100),
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return { success, errors };
  };

  const handleImport = async () => {
    if (!parentId) {
        toast({ title: "Missing parent context", variant: "destructive" });
        return;
    }
    setIsImporting(true);
    setResult(null);
    setProgress(null);
    
    try {
        let data;
        if (jsonContent) {
            data = JSON.parse(jsonContent);
            if (!Array.isArray(data)) data = [data];
        } else if (csvContent) {
            data = parseCSV(csvContent);
        } else {
            toast({ title: "No data to import", variant: "destructive" });
            return;
        }

        setProgress({ current: 0, total: data.length, percent: 0 });
        const importResult = await importData(data);
        setResult(importResult);

        if (importResult.success > 0) {
            toast({ title: `Successfully imported ${importResult.success} ${type}!` });
            // Invalidate the specific queries to refresh the UI
            if (type === "notes") queryClient.invalidateQueries({ queryKey: ["unit-notes", parentId] });
            if (type === "lessons") queryClient.invalidateQueries({ queryKey: ["lessons", parentId] });
            if (type === "questions") queryClient.invalidateQueries({ queryKey: ["questions", parentId] });
            
            // Wait 2 seconds then close
            setTimeout(() => {
              if (importResult.errors.length === 0) {
                handleOpenChange(false);
              }
            }, 2000);
        }
        
        if (importResult.errors.length > 0) {
            toast({
                title: `${importResult.errors.length} errors occurred`,
                variant: "destructive",
            });
        }
    }
    catch (err) {
        toast({ title: `Import failed: ${err.message}`, variant: "destructive" });
    }
    finally {
        setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-500" />
            Bulk Import {type ? type.charAt(0).toUpperCase() + type.slice(1) : ''}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Paste JSON/CSV data below or upload a file. Data will be explicitly tied to the selected {type === 'questions' ? 'lesson' : 'unit'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <Tabs defaultValue="json" className="w-full">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="json" className="data-[state=active]:bg-amber-600">
                <FileJson className="w-4 h-4 mr-2"/> JSON
              </TabsTrigger>
              <TabsTrigger value="csv" className="data-[state=active]:bg-amber-600">
                <FileSpreadsheet className="w-4 h-4 mr-2"/> CSV
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-amber-600">
                <Upload className="w-4 h-4 mr-2"/> Upload File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="json" className="space-y-3 mt-4">
              <Textarea 
                value={jsonContent} 
                onChange={(e) => setJsonContent(e.target.value)} 
                className="bg-slate-800 border-slate-700 min-h-[200px] font-mono text-sm" 
                placeholder="Paste your JSON array here... [{...}, {...}]"
              />
            </TabsContent>

            <TabsContent value="csv" className="space-y-3 mt-4">
              <Textarea 
                value={csvContent} 
                onChange={(e) => setCsvContent(e.target.value)} 
                className="bg-slate-800 border-slate-700 min-h-[200px] font-mono text-sm" 
                placeholder="Paste your CSV content here..."
              />
            </TabsContent>

            <TabsContent value="upload" className="space-y-3 mt-4">
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="border-2 border-dashed border-slate-700 bg-slate-800/50 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500 hover:bg-slate-800 transition-all"
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400"/>
                <p className="text-slate-300">Click to upload a JSON or CSV file</p>
                <p className="text-xs text-slate-500 mt-1">Supports .json and .csv formats</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".json,.csv" onChange={handleFileUpload} className="hidden"/>
            </TabsContent>
          </Tabs>

          {/* Progress Bar */}
          {progress && isImporting && (
            <div className="space-y-2 bg-slate-800 p-3 rounded-lg border border-slate-700">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Importing...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={progress.percent} className="h-2 bg-slate-700 [&>div]:bg-amber-500"/>
            </div>
          )}

          {/* Result Messages */}
          {result && !isImporting && (
            <div className="space-y-2 bg-slate-800 p-3 rounded-lg border border-slate-700 text-sm">
              {result.success > 0 && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-4 h-4"/>
                  <span>Successfully imported {result.success} items.</span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="space-y-2 mt-2 pt-2 border-t border-slate-700">
                  <div className="flex items-center gap-2 text-red-400 font-medium">
                    <AlertCircle className="w-4 h-4"/>
                    <span>{result.errors.length} errors occurred:</span>
                  </div>
                  <ul className="text-xs text-red-300 pl-6 list-disc max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (<li key={i} className="mb-1">{err}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 space-x-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isImporting} className="bg-slate-800 border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting || (!jsonContent && !csvContent)} className="bg-amber-600 hover:bg-amber-700 min-w-[120px]">
              {isImporting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Importing...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2"/> Import Data</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
