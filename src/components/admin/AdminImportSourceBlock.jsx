import { Upload, FileJson, FileSpreadsheet } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const surface = {
  card: {
    tabsList: "bg-slate-700",
    triggerActive: "data-[state=active]:bg-amber-600",
    textarea: "bg-slate-700 border-slate-600",
    details: "bg-slate-700/50",
    dropzone: "border-slate-600 hover:border-amber-500",
  },
  dialog: {
    tabsList: "bg-slate-800",
    triggerActive: "data-[state=active]:bg-amber-600",
    textarea: "bg-slate-800 border-slate-700",
    details: "bg-slate-800/80",
    dropzone: "border-slate-700 bg-slate-800/50 hover:border-amber-500 hover:bg-slate-800",
  },
};

/**
 * JSON / CSV paste + file upload with optional format examples.
 */
export function AdminImportSourceBlock({
  variant = "card",
  jsonContent,
  onJsonChange,
  csvContent,
  onCsvChange,
  fileInputRef,
  onFileChange,
  examples,
  jsonPlaceholder = "Paste a JSON array here…",
  csvPlaceholder = "Paste CSV here…",
  defaultTab = "json",
}) {
  const s = surface[variant] || surface.card;

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className={cn(s.tabsList, "w-full h-11 justify-start gap-1")}>
        <TabsTrigger value="json" className={cn(s.triggerActive, "gap-2")}>
          <FileJson className="w-4 h-4 shrink-0" />
          JSON
        </TabsTrigger>
        <TabsTrigger value="csv" className={cn(s.triggerActive, "gap-2")}>
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          CSV
        </TabsTrigger>
        <TabsTrigger value="upload" className={cn(s.triggerActive, "gap-2")}>
          <Upload className="w-4 h-4 shrink-0" />
          Upload
        </TabsTrigger>
      </TabsList>

      <TabsContent value="json" className="space-y-3 mt-4">
        <Textarea
          value={jsonContent}
          onChange={(e) => onJsonChange(e.target.value)}
          className={cn(
            s.textarea,
            "min-h-[280px] md:min-h-[380px] font-mono text-sm w-full resize-y",
          )}
          placeholder={jsonPlaceholder}
        />
        {examples?.json != null && (
          <details className={cn("p-3 rounded-lg", s.details)}>
            <summary className="text-xs text-slate-300 cursor-pointer select-none">
              Example JSON
            </summary>
            <pre className="mt-2 text-xs text-slate-300 overflow-x-auto max-h-64 whitespace-pre-wrap">
              {examples.json}
            </pre>
          </details>
        )}
      </TabsContent>

      <TabsContent value="csv" className="space-y-3 mt-4">
        <Textarea
          value={csvContent}
          onChange={(e) => onCsvChange(e.target.value)}
          className={cn(
            s.textarea,
            "min-h-[280px] md:min-h-[380px] font-mono text-sm w-full resize-y",
          )}
          placeholder={csvPlaceholder}
        />
        {examples?.csv != null && (
          <details className={cn("p-3 rounded-lg", s.details)}>
            <summary className="text-xs text-slate-300 cursor-pointer select-none">
              Example CSV
            </summary>
            <pre className="mt-2 text-xs text-slate-300 overflow-x-auto max-h-64 whitespace-pre-wrap">
              {examples.csv}
            </pre>
          </details>
        )}
      </TabsContent>

      <TabsContent value="upload" className="space-y-3 mt-4">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-12 md:p-16 min-h-[200px] flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
            s.dropzone,
          )}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-300">Click to upload .json or .csv</p>
          <p className="text-xs text-slate-500 mt-1">File contents replace the active paste fields</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,text/csv,application/json"
          onChange={onFileChange}
          className="hidden"
        />
      </TabsContent>
    </Tabs>
  );
}

export function ImportProgressBar({ progress, isImporting, variant = "card" }) {
  if (!progress || !isImporting) return null;
  const wrap =
    variant === "dialog"
      ? "bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-2"
      : "space-y-2";

  return (
    <div className={wrap}>
      <div className="flex justify-between text-xs text-slate-400">
        <span>Importing…</span>
        <span>
          {progress.current} / {progress.total}
        </span>
      </div>
      <Progress value={progress.percent} className="h-2" />
    </div>
  );
}

export function ImportResultSummary({ result }) {
  if (!result) return null;
  return (
    <div className="space-y-2">
      {result.success > 0 && (
        <p className="text-sm text-emerald-400">
          Imported {result.success} row{result.success === 1 ? "" : "s"} successfully.
        </p>
      )}
      {result.errors?.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm text-red-400">{result.errors.length} error(s)</p>
          <ul className="text-xs text-red-300 pl-4 list-disc max-h-36 overflow-y-auto space-y-0.5">
            {result.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
