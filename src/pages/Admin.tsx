import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  FileText,
  Target,
  Languages,
  Settings,
  LogOut,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useIsAdmin,
  useAdminUsers,
  useLanguages,
  useCreateLanguage,
  useUnits,
  useCreateUnit,
  useDeleteUnit,
  useLessons,
  useCreateLesson,
  useDeleteLesson,
  useQuestions,
  useCreateQuestion,
  useDeleteQuestion,
  useUnitNotes,
  useCreateUnitNote,
  useDeleteUnitNote,
} from "@/hooks/useAdmin";
import { BulkImport } from "@/components/admin/BulkImport";
import { QuestManager } from "@/components/admin/QuestManager";
import { LeagueThresholdsManager } from "@/components/admin/LeagueThresholdsManager";
import { cn } from "@/lib/utils";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();

  const [activeTab, setActiveTab] = useState("users");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");

  // Queries
  const { data: users = [], isLoading: loadingUsers } = useAdminUsers();
  const { data: languages = [] } = useLanguages();
  const { data: units = [] } = useUnits(selectedLanguage);
  const { data: lessons = [] } = useLessons(selectedUnit);
  const { data: questions = [] } = useQuestions(selectedLesson);
  const { data: notes = [] } = useUnitNotes(selectedUnit);

  // Mutations
  const createLanguage = useCreateLanguage();
  const createUnit = useCreateUnit();
  const deleteUnit = useDeleteUnit();
  const createLesson = useCreateLesson();
  const deleteLesson = useDeleteLesson();
  const createQuestion = useCreateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const createNote = useCreateUnitNote();
  const deleteNote = useDeleteUnitNote();

  // Form states
  const [newLanguage, setNewLanguage] = useState({ name: "", slug: "", icon: "💻", description: "" });
  const [newUnit, setNewUnit] = useState({ title: "", description: "", color: "green" });
  const [newLesson, setNewLesson] = useState({ title: "" });
  const [newQuestion, setNewQuestion] = useState({
    type: "fill-blank",
    instruction: "",
    code: "",
    answer: "",
    options: ["", "", "", ""],
    hint: "",
    expected_output: "",
    initial_code: "",
  });
  const [newNote, setNewNote] = useState({ title: "", content: "" });

  useEffect(() => {
    if (!checkingAdmin && !isAdmin) {
      navigate("/admin-login");
    }
  }, [checkingAdmin, isAdmin, navigate]);

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleCreateLanguage = async () => {
    try {
      await createLanguage.mutateAsync({
        name: newLanguage.name,
        slug: newLanguage.slug,
        icon: newLanguage.icon,
        description: newLanguage.description,
        is_active: true,
        updated_at: new Date().toISOString(),
      });
      setNewLanguage({ name: "", slug: "", icon: "💻", description: "" });
      toast({ title: "Language created successfully!" });
    } catch (error) {
      toast({ title: "Error creating language", variant: "destructive" });
    }
  };

  const handleCreateUnit = async () => {
    if (!selectedLanguage) return;
    try {
      await createUnit.mutateAsync({
        language_id: selectedLanguage,
        title: newUnit.title,
        description: newUnit.description,
        color: newUnit.color,
        order_index: units.length,
        is_active: true,
        updated_at: new Date().toISOString(),
      });
      setNewUnit({ title: "", description: "", color: "green" });
      toast({ title: "Unit created successfully!" });
    } catch (error) {
      toast({ title: "Error creating unit", variant: "destructive" });
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedUnit) return;
    try {
      await createLesson.mutateAsync({
        unit_id: selectedUnit,
        title: newLesson.title,
        order_index: lessons.length,
        is_active: true,
        updated_at: new Date().toISOString(),
      });
      setNewLesson({ title: "" });
      toast({ title: "Lesson created successfully!" });
    } catch (error) {
      toast({ title: "Error creating lesson", variant: "destructive" });
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedLesson) return;
    try {
      await createQuestion.mutateAsync({
        lesson_id: selectedLesson,
        type: newQuestion.type as "fill-blank" | "multiple-choice" | "drag-order" | "code-runner",
        instruction: newQuestion.instruction,
        code: newQuestion.code || undefined,
        answer: newQuestion.answer || undefined,
        options: newQuestion.options.filter(o => o),
        hint: newQuestion.hint || undefined,
        expected_output: newQuestion.expected_output || undefined,
        initial_code: newQuestion.initial_code || undefined,
        order_index: questions.length,
        xp_reward: 10,
      });
      setNewQuestion({
        type: "fill-blank",
        instruction: "",
        code: "",
        answer: "",
        options: ["", "", "", ""],
        hint: "",
        expected_output: "",
        initial_code: "",
      });
      toast({ title: "Question created successfully!" });
    } catch (error) {
      toast({ title: "Error creating question", variant: "destructive" });
    }
  };

  const handleCreateNote = async () => {
    if (!selectedUnit) return;
    try {
      await createNote.mutateAsync({
        unit_id: selectedUnit,
        title: newNote.title,
        content: newNote.content,
        order_index: notes.length,
        updated_at: new Date().toISOString(),
      });
      setNewNote({ title: "", content: "" });
      toast({ title: "Note created successfully!" });
    } catch (error) {
      toast({ title: "Error creating note", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-slate-400">Manage your learning platform</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border border-slate-700 p-1 mb-6 w-full overflow-x-auto flex flex-nowrap justify-start gap-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Users</span>
            </TabsTrigger>
            <TabsTrigger value="languages" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Languages className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Languages</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Content</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="quests" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Target className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Quests</span>
            </TabsTrigger>
            <TabsTrigger value="leagues" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Leagues</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Upload className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Import</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-bold">All Users ({users.length})</h2>
              </div>
              {loadingUsers ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">XP</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">League</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Streak</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Hearts</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Gems</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-700/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="" className="w-full h-full rounded-full" />
                                ) : (
                                  <span className="text-sm">{user.display_name?.[0] || "U"}</span>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{user.display_name || "Unknown"}</p>
                                <p className="text-xs text-slate-400">{user.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-amber-400 font-bold">{user.xp?.toLocaleString()}</td>
                          <td className="px-4 py-3 capitalize">{user.league}</td>
                          <td className="px-4 py-3">🔥 {user.streak_count}</td>
                          <td className="px-4 py-3">❤️ {user.hearts}</td>
                          <td className="px-4 py-3">💎 {user.gems}</td>
                          <td className="px-4 py-3 text-slate-400 text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Languages Tab */}
          <TabsContent value="languages">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Create Language */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-bold mb-4">Create New Language</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newLanguage.name}
                      onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                      placeholder="Python"
                    />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={newLanguage.slug}
                      onChange={(e) => setNewLanguage({ ...newLanguage, slug: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                      placeholder="python"
                    />
                  </div>
                  <div>
                    <Label>Icon (Emoji)</Label>
                    <Input
                      value={newLanguage.icon}
                      onChange={(e) => setNewLanguage({ ...newLanguage, icon: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                      placeholder="🐍"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newLanguage.description}
                      onChange={(e) => setNewLanguage({ ...newLanguage, description: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                      placeholder="Learn the most popular programming language"
                    />
                  </div>
                  <Button
                    onClick={handleCreateLanguage}
                    disabled={createLanguage.isPending}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {createLanguage.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Language
                  </Button>
                </div>
              </div>

              {/* Existing Languages */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-bold mb-4">Existing Languages</h3>
                <div className="space-y-3">
                  {languages.map((lang) => (
                    <div key={lang.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.icon}</span>
                        <div>
                          <p className="font-semibold">{lang.name}</p>
                          <p className="text-xs text-slate-400">{lang.slug}</p>
                        </div>
                      </div>
                      <span className={cn("px-2 py-1 rounded text-xs", lang.is_active ? "bg-green-600" : "bg-red-600")}>
                        {lang.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                  {languages.length === 0 && (
                    <p className="text-slate-400 text-center py-4">No languages created yet</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <div className="space-y-6">
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
                  <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={!selectedLanguage}>
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
                <div>
                  <Label>Lesson</Label>
                  <Select value={selectedLesson} onValueChange={setSelectedLesson} disabled={!selectedUnit}>
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
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Create Unit */}
                {selectedLanguage && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-bold mb-4">Create Unit</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newUnit.title}
                          onChange={(e) => setNewUnit({ ...newUnit, title: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                          placeholder="Unit 1: Introduction"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newUnit.description}
                          onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                          placeholder="Learn the basics"
                        />
                      </div>
                      <div>
                        <Label>Color</Label>
                        <Select value={newUnit.color} onValueChange={(v) => setNewUnit({ ...newUnit, color: v })}>
                          <SelectTrigger className="bg-slate-700 border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="orange">Orange</SelectItem>
                            <SelectItem value="purple">Purple</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleCreateUnit} className="w-full bg-amber-600 hover:bg-amber-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Unit
                      </Button>
                    </div>
                  </div>
                )}

                {/* Existing Units List with Delete */}
                {selectedLanguage && units.length > 0 && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-bold mb-4">Units ({units.length})</h3>
                    <div className="space-y-2">
                      {units.map((unit) => (
                        <div key={unit.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                          <div>
                            <p className="font-medium">{unit.title}</p>
                            <p className="text-xs text-slate-400">Order: {unit.order_index} • Color: {unit.color}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Delete unit "${unit.title}" and all its lessons and questions?`)) {
                                deleteUnit.mutate({ unitId: unit.id, languageId: selectedLanguage });
                              }
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Lessons List */}
                {selectedUnit && lessons.length > 0 && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-bold mb-4">Lessons ({lessons.length})</h3>
                    <div className="space-y-2">
                      {lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-xs text-slate-400">Order: {lesson.order_index}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteLesson.mutate({ lessonId: lesson.id, unitId: selectedUnit })}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedUnit && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-bold mb-4">Create Lesson</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newLesson.title}
                          onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                          placeholder="Print Statements"
                        />
                      </div>
                      <Button onClick={handleCreateLesson} className="w-full bg-amber-600 hover:bg-amber-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Lesson
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Create Question */}
              {selectedLesson && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h3 className="text-lg font-bold mb-4">Create Question</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Type</Label>
                      <Select value={newQuestion.type} onValueChange={(v) => setNewQuestion({ ...newQuestion, type: v })}>
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                          <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                          <SelectItem value="drag-order">Drag & Order</SelectItem>
                          <SelectItem value="code-runner">Code Runner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Instruction</Label>
                      <Textarea
                        value={newQuestion.instruction}
                        onChange={(e) => setNewQuestion({ ...newQuestion, instruction: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder="Complete the code to print 'Hello, World!'"
                      />
                    </div>
                    {(newQuestion.type === "fill-blank" || newQuestion.type === "code-runner") && (
                      <div className="md:col-span-2">
                        <Label>Code Template</Label>
                        <Textarea
                          value={newQuestion.code || newQuestion.initial_code}
                          onChange={(e) =>
                            setNewQuestion({
                              ...newQuestion,
                              code: e.target.value,
                              initial_code: e.target.value,
                            })
                          }
                          className="bg-slate-700 border-slate-600 font-mono"
                          placeholder="print(___)"
                        />
                      </div>
                    )}
                    {newQuestion.type === "fill-blank" && (
                      <div>
                        <Label>Answer</Label>
                        <Input
                          value={newQuestion.answer}
                          onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                          placeholder='"Hello, World!"'
                        />
                      </div>
                    )}
                    {newQuestion.type === "code-runner" && (
                      <div>
                        <Label>Expected Output</Label>
                        <Input
                          value={newQuestion.expected_output}
                          onChange={(e) => setNewQuestion({ ...newQuestion, expected_output: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                          placeholder="Hello, World!"
                        />
                      </div>
                    )}
                    {(newQuestion.type === "fill-blank" || newQuestion.type === "multiple-choice") && (
                      <div className="md:col-span-2">
                        <Label>Options (one per line)</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {newQuestion.options.map((opt, i) => (
                            <Input
                              key={i}
                              value={opt}
                              onChange={(e) => {
                                const opts = [...newQuestion.options];
                                opts[i] = e.target.value;
                                setNewQuestion({ ...newQuestion, options: opts });
                              }}
                              className="bg-slate-700 border-slate-600"
                              placeholder={`Option ${i + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <Label>Hint (optional)</Label>
                      <Input
                        value={newQuestion.hint}
                        onChange={(e) => setNewQuestion({ ...newQuestion, hint: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder="Use the print() function"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateQuestion} className="mt-4 bg-amber-600 hover:bg-amber-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Question
                  </Button>

                  {/* Existing Questions */}
                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold text-slate-300">Questions ({questions.length})</h4>
                    {questions.map((q, i) => (
                      <div key={q.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div>
                          <span className="text-xs text-amber-400 mr-2">{q.type}</span>
                          <span className="text-sm">{q.instruction}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteQuestion.mutate({ questionId: q.id, lessonId: selectedLesson })}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <div className="space-y-6">
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
                  <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={!selectedLanguage}>
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

              {selectedUnit && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Create Note */}
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-bold mb-4">Create Note</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newNote.title}
                          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                          placeholder="Introduction to Variables"
                        />
                      </div>
                      <div>
                        <Label>Content (Markdown supported)</Label>
                        <Textarea
                          value={newNote.content}
                          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                          className="bg-slate-700 border-slate-600 min-h-[200px]"
                          placeholder="## Variables&#10;&#10;A variable is a container for storing data..."
                        />
                      </div>
                      <Button onClick={handleCreateNote} className="w-full bg-amber-600 hover:bg-amber-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Note
                      </Button>
                    </div>
                  </div>

                  {/* Existing Notes */}
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-bold mb-4">Unit Notes ({notes.length})</h3>
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div key={note.id} className="p-4 bg-slate-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{note.title}</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteNote.mutate({ noteId: note.id, unitId: selectedUnit })}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-3">{note.content}</p>
                        </div>
                      ))}
                      {notes.length === 0 && (
                        <p className="text-slate-400 text-center py-4">No notes for this unit</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Quests Tab */}
          <TabsContent value="quests">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <QuestManager />
            </div>
          </TabsContent>

          {/* Leagues Tab */}
          <TabsContent value="leagues">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <LeagueThresholdsManager />
            </div>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import">
            <BulkImport />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
