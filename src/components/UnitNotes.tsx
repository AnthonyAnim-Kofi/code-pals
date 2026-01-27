import { useState } from "react";
import { X, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUnitNotes, type UnitNote } from "@/hooks/useAdmin";

interface UnitNotesProps {
  unitId: string;
  isAccessible: boolean;
}

export function UnitNotes({ unitId, isAccessible }: UnitNotesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<UnitNote | null>(null);
  const { data: notes = [], isLoading } = useUnitNotes(isAccessible ? unitId : undefined);

  if (!isAccessible) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="bg-muted/50 border-muted text-muted-foreground cursor-not-allowed opacity-50"
        disabled
        title="Complete previous lessons to unlock notes"
      >
        <BookOpen className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="bg-white/20 border-white/30 hover:bg-white/30 text-white"
        onClick={() => setIsOpen(true)}
        title="View unit notes"
      >
        <BookOpen className="w-5 h-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85dvh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Study Notes
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row h-[70dvh] sm:h-[60vh]">
            {/* Notes List */}
            <div className="w-full sm:w-1/3 sm:border-r border-border bg-muted/30">
              <ScrollArea className="h-[22dvh] sm:h-full">
                <div className="p-3 space-y-2">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground p-2">Loading...</p>
                  ) : notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No notes available yet</p>
                  ) : (
                    notes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => setSelectedNote(note)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedNote?.id === note.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <p className="font-medium text-sm truncate">{note.title}</p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Note Content */}
            <div className="flex-1 min-w-0">
              <ScrollArea className="h-[48dvh] sm:h-full">
                {selectedNote ? (
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">{selectedNote.title}</h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {selectedNote.content.split("\n").map((line, i) => {
                        if (line.startsWith("## ")) {
                          return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace("## ", "")}</h2>;
                        }
                        if (line.startsWith("### ")) {
                          return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.replace("### ", "")}</h3>;
                        }
                        if (line.startsWith("- ")) {
                          return <li key={i} className="ml-4">{line.replace("- ", "")}</li>;
                        }
                        if (line.startsWith("```")) {
                          return null;
                        }
                        if (line.trim() === "") {
                          return <br key={i} />;
                        }
                        return <p key={i} className="mb-2">{line}</p>;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Select a note to read</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
