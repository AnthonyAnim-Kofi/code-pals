import { useState } from "react";
import { BookOpen, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUnitNotes, type UnitNote } from "@/hooks/useAdmin";
import { useIsMobile } from "@/hooks/use-mobile";

interface UnitNotesProps {
  unitId: string;
  isAccessible: boolean;
}

export function UnitNotes({ unitId, isAccessible }: UnitNotesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<UnitNote | null>(null);
  const { data: notes = [], isLoading } = useUnitNotes(isAccessible ? unitId : undefined);
  const isMobile = useIsMobile();

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

  const handleOpen = () => {
    setSelectedNote(null);
    setIsOpen(true);
  };

  const renderNoteContent = (note: UnitNote) => (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {note.content.split("\n").map((line, i) => {
        if (line.startsWith("## ")) {
          return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace("## ", "")}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.replace("### ", "")}</h3>;
        }
        if (line.startsWith("- ")) {
          return <li key={i} className="ml-4">{line.replace("- ", "")}</li>;
        }
        if (line.startsWith("```")) return null;
        if (line.trim() === "") return <br key={i} />;
        return <p key={i} className="mb-2">{line}</p>;
      })}
    </div>
  );

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="bg-white/20 border-white/30 hover:bg-white/30 text-white"
        onClick={handleOpen}
        title="View unit notes"
      >
        <BookOpen className="w-5 h-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="fixed inset-0 z-50 w-screen h-screen max-w-none max-h-none rounded-none translate-x-0 translate-y-0 flex flex-col p-0 gap-0 border-0"
          aria-describedby={undefined}
        >
          <DialogHeader className="p-4 sm:p-6 pb-2 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {selectedNote && isMobile ? (
                <Button variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={() => setSelectedNote(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              ) : (
                <BookOpen className="w-5 h-5 text-primary" />
              )}
              {selectedNote ? selectedNote.title : "Study Notes"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Browse and read study notes for this unit
            </DialogDescription>
          </DialogHeader>

          {isMobile ? (
            /* Mobile: single column, list or detail – full height */
            <ScrollArea className="flex-1 min-h-0">
              {selectedNote ? (
                <div className="p-5 pb-8">{renderNoteContent(selectedNote)}</div>
              ) : (
                <div className="p-4 space-y-2 pb-8">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground p-2">Loading...</p>
                  ) : notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No notes available yet</p>
                  ) : (
                    notes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => setSelectedNote(note)}
                        className="w-full text-left p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-primary shrink-0" />
                          <p className="font-medium">{note.title}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          ) : (
            /* Desktop: two-column split – full height */
            <div className="flex flex-row flex-1 min-h-0">
              <div className="w-72 sm:w-80 border-r border-border bg-muted/30 shrink-0">
                <ScrollArea className="h-full">
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

              <div className="flex-1 min-w-0 flex flex-col">
                <ScrollArea className="flex-1">
                  {selectedNote ? (
                    <div className="p-6 max-w-3xl">
                      <h2 className="text-xl font-bold mb-4">{selectedNote.title}</h2>
                      {renderNoteContent(selectedNote)}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground min-h-[50vh]">
                      <div className="text-center">
                        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Select a note to read</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
