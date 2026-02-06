/**
 * AdminEditDialog – Reusable dialog for editing admin items (languages, units, lessons, questions, notes).
 * Renders form fields dynamically based on the fields configuration passed in.
 */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export interface EditField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: { value: string; label: string }[];
}

interface AdminEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: EditField[];
  initialValues: Record<string, string>;
  onSave: (values: Record<string, string>) => Promise<void>;
  loading?: boolean;
}

export function AdminEditDialog({
  open, onOpenChange, title, fields, initialValues, onSave, loading
}: AdminEditDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  // Reset values when dialog opens with new data
  useEffect(() => {
    if (open) setValues(initialValues);
  }, [open, initialValues]);

  const handleSave = async () => {
    await onSave(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {fields.map((field) => (
            <div key={field.key}>
              <Label>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  value={values[field.key] || ""}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  className="bg-slate-700 border-slate-600 mt-1"
                />
              ) : field.type === "select" ? (
                <select
                  value={values[field.key] || ""}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-md bg-slate-700 border border-slate-600 text-white"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={values[field.key] || ""}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  className="bg-slate-700 border-slate-600 mt-1"
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
