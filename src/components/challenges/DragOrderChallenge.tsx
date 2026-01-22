import { useState, useCallback } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlock {
  id: string;
  code: string;
}

interface DragOrderChallengeProps {
  blocks: CodeBlock[];
  correctOrder: string[];
  onAnswer: (isCorrect: boolean) => void;
  disabled?: boolean;
}

export function DragOrderChallenge({
  blocks,
  correctOrder,
  onAnswer,
  disabled = false,
}: DragOrderChallengeProps) {
  const [items, setItems] = useState<CodeBlock[]>(() => 
    [...blocks].sort(() => Math.random() - 0.5)
  );
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  const handleDragStart = useCallback((id: string) => {
    if (disabled) return;
    setDraggedItem(id);
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (disabled || id === draggedItem) return;
    setDragOverItem(id);
  }, [disabled, draggedItem]);

  const handleDrop = useCallback((targetId: string) => {
    if (disabled || !draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    setItems((prev) => {
      const newItems = [...prev];
      const draggedIndex = newItems.findIndex((item) => item.id === draggedItem);
      const targetIndex = newItems.findIndex((item) => item.id === targetId);
      
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, removed);
      
      return newItems;
    });

    setDraggedItem(null);
    setDragOverItem(null);
  }, [disabled, draggedItem]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverItem(null);
  }, []);

  const checkAnswer = useCallback(() => {
    const currentOrder = items.map((item) => item.id);
    const isCorrect = JSON.stringify(currentOrder) === JSON.stringify(correctOrder);
    onAnswer(isCorrect);
  }, [items, correctOrder, onAnswer]);

  // Touch support for mobile
  const handleTouchStart = useCallback((id: string) => {
    if (disabled) return;
    setDraggedItem(id);
  }, [disabled]);

  const moveItem = useCallback((fromId: string, direction: 'up' | 'down') => {
    if (disabled) return;
    
    setItems((prev) => {
      const newItems = [...prev];
      const fromIndex = newItems.findIndex((item) => item.id === fromId);
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      
      if (toIndex < 0 || toIndex >= newItems.length) return prev;
      
      [newItems[fromIndex], newItems[toIndex]] = [newItems[toIndex], newItems[fromIndex]];
      return newItems;
    });
  }, [disabled]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Drag and drop the code blocks to arrange them in the correct order
      </p>
      
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDrop={() => handleDrop(item.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 bg-card transition-all cursor-grab active:cursor-grabbing",
              draggedItem === item.id && "opacity-50 scale-95",
              dragOverItem === item.id && "border-primary bg-primary/10",
              !draggedItem && !dragOverItem && "border-border hover:border-primary/50",
              disabled && "cursor-not-allowed opacity-75"
            )}
          >
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => moveItem(item.id, 'up')}
                disabled={disabled || index === 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move up"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => moveItem(item.id, 'down')}
                disabled={disabled || index === items.length - 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move down"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
            </div>
            
            <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />
            
            <div className="flex-1 font-mono text-sm bg-sidebar rounded-lg px-3 py-2">
              <code className="text-sidebar-foreground whitespace-pre">{item.code}</code>
            </div>
            
            <span className="text-xs text-muted-foreground font-semibold w-6 text-center">
              {index + 1}
            </span>
          </div>
        ))}
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={checkAnswer}
          className="w-full mt-4 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          Check Order
        </button>
      )}
    </div>
  );
}
