import { useState } from "react";
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, BookOpen, Layers, HelpCircle, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LanguageIcon } from "@/components/LanguageIcon";
import { cn } from "@/lib/utils";

import {
  useLanguages, useCreateLanguage, useUpdateLanguage,
  useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit,
  useLessons, useCreateLesson, useUpdateLesson, useDeleteLesson,
  useQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion,
  useUnitNotes, useCreateUnitNote, useUpdateUnitNote, useDeleteUnitNote
} from "@/hooks/useAdmin";

import { AdminEditDialog } from "@/components/admin/AdminEditDialog";
import { ContextualBulkImport } from "@/components/admin/ContextualBulkImport";

export function CurriculumManager() {
  const { toast } = useToast();

  // Selection state
  const [selectedLangId, setSelectedLangId] = useState("");
  const [expandedUnitId, setExpandedUnitId] = useState(null);
  const [expandedLessonId, setExpandedLessonId] = useState(null);

  // Data Queries
  const { data: languages = [] } = useLanguages();
  const { data: units = [] } = useUnits(selectedLangId);
  const { data: lessons = [] } = useLessons(expandedUnitId);
  const { data: notes = [] } = useUnitNotes(expandedUnitId);
  const { data: questions = [] } = useQuestions(expandedLessonId);

  // Mutations
  const createLanguage = useCreateLanguage();
  const updateLanguage = useUpdateLanguage();
  
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  
  const createNote = useCreateUnitNote();
  const updateNote = useUpdateUnitNote();
  const deleteNote = useDeleteUnitNote();
  
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  // Dialog states
  const [editDialog, setEditDialog] = useState({ open: false, title: "", fields: [], initialValues: {}, onSave: async () => {} });
  const [importDialog, setImportDialog] = useState({ open: false, type: null, parentId: null });

  // --- Handlers for Creation ---

  const handleCreateLanguage = async () => {
    editLanguage({ name: "", slug: "", icon: "💻", description: "" }, true);
  };

  const handleCreateUnit = async () => {
    if (!selectedLangId) return;
    const title = prompt("Enter new unit title:");
    if (!title) return;
    try {
      await createUnit.mutateAsync({
        language_id: selectedLangId,
        title,
        description: "",
        color: "green",
        order_index: units.length,
        is_active: true,
      });
      toast({ title: "Unit created!" });
    } catch {
      toast({ title: "Failed to create unit", variant: "destructive" });
    }
  };

  const handleCreateLesson = async (e) => {
    e.stopPropagation(); // prevent collapsing unit
    if (!expandedUnitId) return;
    const title = prompt("Enter new lesson title:");
    if (!title) return;
    try {
      await createLesson.mutateAsync({
        unit_id: expandedUnitId,
        title,
        order_index: lessons.length,
        is_active: true,
      });
      toast({ title: "Lesson created!" });
    } catch {
      toast({ title: "Failed to create lesson", variant: "destructive" });
    }
  };

  const handleCreateNote = async (e) => {
    e.stopPropagation();
    if (!expandedUnitId) return;
    editNote({ title: "", content: "", order_index: notes.length }, true);
  };

  const handleCreateQuestion = async (e) => {
    e.stopPropagation();
    if (!expandedLessonId) return;
    editQuestion(
      { type: "fill-blank", instruction: "", code: "", answer: "", options: [], hint: "", order_index: questions.length }, 
      true
    );
  };

  // --- Handlers for Editing ---

  const editLanguage = (lang, isNew = false) => {
    setEditDialog({
      open: true, title: isNew ? "Create Language" : `Edit ${lang.name}`,
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "slug", label: "Slug", type: "text" },
        { key: "icon", label: "Icon (Emoji)", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
      ],
      initialValues: { name: lang.name, slug: lang.slug, icon: lang.icon, description: lang.description || "" },
      onSave: async (values) => {
        if (isNew) {
          await createLanguage.mutateAsync({ ...values, is_active: true, updated_at: new Date().toISOString() });
        } else {
          await updateLanguage.mutateAsync({ id: lang.id, ...values });
        }
        toast({ title: isNew ? "Language created!" : "Language updated!" });
      },
    });
  };

  const editUnit = (unit, e) => {
    if (e) e.stopPropagation();
    setEditDialog({
      open: true, title: `Edit ${unit.title}`,
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "color", label: "Color", type: "select", options: [
            { value: "green", label: "Green" }, { value: "blue", label: "Blue" },
            { value: "orange", label: "Orange" }, { value: "purple", label: "Purple" }
          ]
        },
        { key: "order_index", label: "Order Index", type: "text" }
      ],
      initialValues: { title: unit.title, description: unit.description || "", color: unit.color, order_index: String(unit.order_index) },
      onSave: async (values) => {
        await updateUnit.mutateAsync({ id: unit.id, ...values, order_index: parseInt(values.order_index) || 0 });
        toast({ title: "Unit updated!" });
      },
    });
  };

  const editLesson = (lesson, e) => {
    if (e) e.stopPropagation();
    setEditDialog({
      open: true, title: `Edit ${lesson.title}`,
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "order_index", label: "Order Index", type: "text" }
      ],
      initialValues: { title: lesson.title, order_index: String(lesson.order_index) },
      onSave: async (values) => {
        await updateLesson.mutateAsync({ id: lesson.id, unitId: expandedUnitId, ...values, order_index: parseInt(values.order_index) || 0 });
        toast({ title: "Lesson updated!" });
      },
    });
  };

  const editNote = (note, isNew = false, e) => {
    if (e) e.stopPropagation();
    setEditDialog({
      open: true, title: isNew ? "Create Note" : `Edit Note`,
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "content", label: "Content (Markdown Supported)", type: "textarea" },
        { key: "order_index", label: "Order Index", type: "text" }
      ],
      initialValues: { title: note.title, content: note.content, order_index: String(note.order_index) },
      onSave: async (values) => {
        if (isNew) {
          await createNote.mutateAsync({ unit_id: expandedUnitId, ...values, order_index: parseInt(values.order_index) || 0 });
        } else {
          await updateNote.mutateAsync({ id: note.id, unitId: expandedUnitId, ...values, order_index: parseInt(values.order_index) || 0 });
        }
        toast({ title: isNew ? "Note created!" : "Note updated!" });
      },
    });
  };

  const editQuestion = (q, isNew = false, e) => {
    if (e) e.stopPropagation();
    const opts = Array.isArray(q.options) ? q.options : [];
    
    setEditDialog({
      open: true, title: isNew ? "Create Question" : "Edit Question",
      fields: [
        { key: "type", label: "Type", type: "select", options: [
            { value: "fill-blank", label: "Fill in the Blank" },
            { value: "multiple-choice", label: "Multiple Choice" },
            { value: "drag-order", label: "Drag & Order" },
            { value: "code-runner", label: "Code Runner" },
          ]
        },
        { key: "instruction", label: "Instruction", type: "textarea" },
        { key: "code", label: "Code Template", type: "textarea" },
        { key: "answer", label: "Answer", type: "text" },
        { key: "option0", label: "Option 1", type: "text" },
        { key: "option1", label: "Option 2", type: "text" },
        { key: "option2", label: "Option 3", type: "text" },
        { key: "option3", label: "Option 4", type: "text" },
        { key: "hint", label: "Hint", type: "text" },
        { key: "initial_code", label: "Initial Code (code-runner)", type: "textarea" },
        { key: "expected_output", label: "Expected Output (code-runner)", type: "text" },
        { key: "xp_reward", label: "XP Reward", type: "text" },
        { key: "order_index", label: "Order Index", type: "text" }
      ],
      initialValues: {
        type: q.type || "fill-blank",
        instruction: q.instruction || "",
        code: q.code || "",
        answer: q.answer || "",
        option0: opts[0] || "", option1: opts[1] || "", option2: opts[2] || "", option3: opts[3] || "",
        hint: q.hint || "",
        initial_code: q.initial_code || "",
        expected_output: q.expected_output || "",
        xp_reward: String(q.xp_reward || 10),
        order_index: String(q.order_index || 0)
      },
      onSave: async (values) => {
        const options = [values.option0, values.option1, values.option2, values.option3].filter(Boolean);
        const payload = {
          type: values.type,
          instruction: values.instruction,
          code: values.code || null,
          answer: values.answer || null,
          options: options.length > 0 ? options : null,
          hint: values.hint || null,
          initial_code: values.initial_code || null,
          expected_output: values.expected_output || null,
          xp_reward: parseInt(values.xp_reward) || 10,
          order_index: parseInt(values.order_index) || 0
        };

        if (isNew) {
          await createQuestion.mutateAsync({ lesson_id: expandedLessonId, ...payload });
        } else {
          await updateQuestion.mutateAsync({ id: q.id, lessonId: expandedLessonId, ...payload });
        }
        toast({ title: isNew ? "Question created!" : "Question updated!" });
      },
    });
  };

  // --- Deletion Handlers ---

  const handleDeleteUnit = (unit, e) => {
    e.stopPropagation();
    if (confirm(`Delete unit "${unit.title}" and all its contents?`)) {
      deleteUnit.mutate({ unitId: unit.id, languageId: selectedLangId });
      if (expandedUnitId === unit.id) setExpandedUnitId(null);
    }
  };

  const handleDeleteLesson = (lesson, e) => {
    e.stopPropagation();
    if (confirm(`Delete lesson "${lesson.title}" and all its questions?`)) {
      deleteLesson.mutate({ lessonId: lesson.id, unitId: expandedUnitId });
      if (expandedLessonId === lesson.id) setExpandedLessonId(null);
    }
  };

  const handleDeleteNote = (note, e) => {
    e.stopPropagation();
    if (confirm(`Delete note "${note.title}"?`)) {
      deleteNote.mutate({ noteId: note.id, unitId: expandedUnitId });
    }
  };

  const handleDeleteQuestion = (q, e) => {
    e.stopPropagation();
    if (confirm("Delete this question?")) {
      deleteQuestion.mutate({ questionId: q.id, lessonId: expandedLessonId });
    }
  };

  const openBulkImport = (type, parentId, e) => {
    if (e) e.stopPropagation();
    setImportDialog({ open: true, type, parentId });
  };

  // Sort lists safely
  const sortedUnits = [...units].sort((a,b) => (a.order_index||0) - (b.order_index||0));
  const sortedLessons = [...lessons].sort((a,b) => (a.order_index||0) - (b.order_index||0));
  const sortedNotes = [...notes].sort((a,b) => (a.order_index||0) - (b.order_index||0));
  const sortedQuestions = [...questions].sort((a,b) => (a.order_index||0) - (b.order_index||0));

  return (
    <div className="space-y-6">
      <AdminEditDialog {...editDialog} onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))} />
      <ContextualBulkImport 
        {...importDialog} 
        onOpenChange={(open) => setImportDialog(prev => ({ ...prev, open }))} 
        selectedLanguage={selectedLangId}
      />

      {/* 1. Language Level */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <Label className="text-slate-300 mb-2 block">Select Language</Label>
          <Select value={selectedLangId} onValueChange={(v) => { setSelectedLangId(v); setExpandedUnitId(null); setExpandedLessonId(null); }}>
            <SelectTrigger className="bg-slate-900 border-slate-600">
              <SelectValue placeholder="Choose a language to edit its content" />
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
        <div className="flex gap-2">
          {selectedLangId && (
            <Button variant="outline" onClick={() => editLanguage(languages.find(l => l.id === selectedLangId))} className="bg-slate-700 border-slate-600 hover:bg-slate-600">
              <Edit2 className="w-4 h-4 mr-2" /> Edit Lang
            </Button>
          )}
          <Button onClick={handleCreateLanguage} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> New Lang
          </Button>
        </div>
      </div>

      {/* 2. Unit Level (Only if Language is selected) */}
      {selectedLangId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Layers className="text-amber-500 w-5 h-5"/> Units
            </h2>
            <Button onClick={handleCreateUnit} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add Unit
            </Button>
          </div>

          {sortedUnits.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p>No units found for this language.</p>
              <Button variant="link" onClick={handleCreateUnit} className="text-amber-500">Create the first unit</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedUnits.map((unit) => {
                const isExpanded = expandedUnitId === unit.id;
                
                return (
                  <div key={unit.id} className={`bg-slate-800 rounded-xl border transition-colors ${isExpanded ? 'border-amber-500/50 shadow-lg shadow-amber-900/10' : 'border-slate-700 hover:border-slate-600'}`}>
                    {/* Unit Header (Clickable) */}
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        setExpandedUnitId(isExpanded ? null : unit.id);
                        if (!isExpanded) setExpandedLessonId(null);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white bg-${unit.color}-500/20 text-${unit.color}-400`}>
                          {unit.order_index}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">
                            {unit.title}
                          </h3>
                          {unit.description && <p className="text-sm text-slate-400 truncate max-w-md">{unit.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={(e) => editUnit(unit, e)} className="text-slate-400 hover:text-white">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={(e) => handleDeleteUnit(unit, e)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="ml-2 w-8 flex items-center justify-center text-slate-500">
                          {isExpanded ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                        </div>
                      </div>
                    </div>

                    {/* Unit Content (Expandable) */}
                    {isExpanded && (
                      <div className="border-t border-slate-700 p-4 bg-slate-900/50 rounded-b-xl space-y-8">
                        
                        {/* Notes Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold flex items-center gap-2 text-slate-200">
                              <FileText className="w-4 h-4 text-emerald-400"/> Study Notes ({notes.length})
                            </h4>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={(e) => openBulkImport('notes', unit.id, e)} className="bg-slate-800 border-slate-600 text-xs text-slate-300">
                                <Upload className="w-3 h-3 mr-1" /> Import JSON/CSV
                              </Button>
                              <Button size="sm" onClick={(e) => handleCreateNote(e)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                                <Plus className="w-3 h-3 mr-1" /> Add Note
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sortedNotes.map(note => (
                              <div key={note.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex justify-between items-start group">
                                <div className="min-w-0 pr-2">
                                  <p className="font-medium text-sm truncate">{note.order_index}. {note.title}</p>
                                  <p className="text-xs text-slate-400 truncate mt-1">{note.content.substring(0, 40)}...</p>
                                </div>
                                <div className="flex flex-col gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-amber-400" onClick={(e) => editNote(note, false, e)}>
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={(e) => handleDeleteNote(note, e)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {notes.length === 0 && <p className="text-sm text-slate-500 italic col-span-full">No notes added.</p>}
                          </div>
                        </div>

                        {/* Lessons Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3 border-t border-slate-700 pt-6">
                            <h4 className="font-semibold flex items-center gap-2 text-slate-200">
                              <BookOpen className="w-4 h-4 text-sky-400"/> Lessons ({lessons.length})
                            </h4>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={(e) => openBulkImport('lessons', unit.id, e)} className="bg-slate-800 border-slate-600 text-xs text-slate-300">
                                <Upload className="w-3 h-3 mr-1" /> Import JSON/CSV
                              </Button>
                              <Button size="sm" onClick={(e) => handleCreateLesson(e)} className="bg-sky-600 hover:bg-sky-700 text-white text-xs">
                                <Plus className="w-3 h-3 mr-1" /> Add Lesson
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {sortedLessons.map(lesson => {
                              const isLessonExpanded = expandedLessonId === lesson.id;
                              return (
                                <div key={lesson.id} className={`bg-slate-800 rounded-lg border transition-colors ${isLessonExpanded ? 'border-sky-500/50' : 'border-slate-700 hover:border-slate-600'}`}>
                                  
                                  {/* Lesson Header */}
                                  <div 
                                    className="p-3 flex items-center justify-between cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedLessonId(isLessonExpanded ? null : lesson.id);
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded bg-sky-500/10 text-sky-400 text-xs flex items-center justify-center font-bold">
                                        {lesson.order_index}
                                      </div>
                                      <p className="font-medium text-sm">{lesson.title}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={(e) => editLesson(lesson, e)}>
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={(e) => handleDeleteLesson(lesson, e)}>
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                      <div className="w-6 flex justify-center text-slate-500">
                                        {isLessonExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Lesson Content (Questions) */}
                                  {isLessonExpanded && (
                                    <div className="border-t border-slate-700 p-4 bg-slate-900/30 rounded-b-lg">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium flex items-center gap-2 text-sm text-slate-300">
                                          <HelpCircle className="w-3 h-3 text-purple-400"/> Questions ({questions.length})
                                        </h5>
                                        <div className="flex gap-2">
                                          <Button size="sm" variant="outline" onClick={(e) => openBulkImport('questions', lesson.id, e)} className="h-7 px-2 bg-slate-800 border-slate-600 text-[10px] text-slate-300">
                                            <Upload className="w-3 h-3 mr-1" /> Import
                                          </Button>
                                          <Button size="sm" onClick={(e) => handleCreateQuestion(e)} className="h-7 px-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px]">
                                            <Plus className="w-3 h-3 mr-1" /> Add
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      <div className="grid gap-2">
                                        {sortedQuestions.map(q => (
                                          <div key={q.id} className="bg-slate-800/80 p-2.5 rounded border border-slate-700/50 flex items-center justify-between text-xs group">
                                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                              <span className="shrink-0 w-6 text-center text-slate-500 font-mono">{q.order_index}</span>
                                              <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-700 text-amber-400 uppercase text-[9px] font-bold tracking-wider">{q.type}</span>
                                              <span className="truncate text-slate-300">{q.instruction}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                              <Button size="icon" variant="ghost" className="h-6 w-6 text-amber-400 hover:bg-slate-700" onClick={(e) => editQuestion(q, false, e)}>
                                                <Edit2 className="w-3 h-3" />
                                              </Button>
                                              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:bg-slate-700" onClick={(e) => handleDeleteQuestion(q, e)}>
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                        {questions.length === 0 && <p className="text-xs text-slate-500 italic p-2 rounded bg-slate-800/50">No questions in this lesson.</p>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {lessons.length === 0 && <p className="text-sm text-slate-500 italic p-4 text-center rounded-xl bg-slate-800/50 border border-slate-700/50 flex-col items-center justify-center flex"><BookOpen className="w-6 h-6 mb-2 opacity-50"/> No lessons yet. Add a lesson to insert questions.</p>}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
