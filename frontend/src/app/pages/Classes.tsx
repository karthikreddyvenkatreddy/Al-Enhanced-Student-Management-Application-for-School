import { useState } from "react";
import { Users, GraduationCap, BookOpen, Plus, X, Trash2, Pencil, ChevronRight } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "../../lib/toast";
import type { ClassRoom } from "../../contexts/DataContext";

type EditForm = {
  name: string;
  grade: string;
  section: string;
  departmentId: string;
  academicYear: string;
  classTeacherId: string;
};

export function Classes() {
  const { isAdmin } = useAuth();
  const {
    classes, teachers, departments, subjects, students,
    addClass, deleteClass, updateClass,
    getTeacherById, getDepartmentById,
    getClassAttendanceSummary, getStudentAverage,
  } = useData();

  // ── Add modal ──
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", grade: "", section: "A", classTeacherId: "", departmentId: "", academicYear: "2025-2026",
    subjectTeachers: [] as { subjectId: string; teacherId: string }[], studentIds: [] as string[],
  });
  const setF = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  // ── Edit modal ──
  const [editClass, setEditClass] = useState<ClassRoom | null>(null);
  const [editTab, setEditTab] = useState<"info" | "teacher" | "subjects">("info");
  const [editForm, setEditForm] = useState<EditForm>({
    name: "", grade: "", section: "A", departmentId: "", academicYear: "", classTeacherId: "",
  });
  const [subjectTeacherMap, setSubjectTeacherMap] = useState<Record<string, string>>({});
  const [classSubjectIds, setClassSubjectIds] = useState<string[]>([]);

  const openEdit = (cls: ClassRoom) => {
    setEditClass(cls);
    setEditTab("info");
    setEditForm({
      name: cls.name,
      grade: cls.grade,
      section: cls.section,
      departmentId: cls.departmentId,
      academicYear: cls.academicYear,
      classTeacherId: cls.classTeacherId,
    });
    const map: Record<string, string> = {};
    cls.subjectTeachers.forEach(st => { map[st.subjectId] = st.teacherId; });
    setSubjectTeacherMap(map);
    setClassSubjectIds(cls.subjectTeachers.map(st => st.subjectId));
  };

  const toggleSubject = (subjectId: string) => {
    setClassSubjectIds(prev => {
      if (prev.includes(subjectId)) {
        const next = prev.filter(id => id !== subjectId);
        setSubjectTeacherMap(m => { const n = { ...m }; delete n[subjectId]; return n; });
        return next;
      }
      return [...prev, subjectId];
    });
  };

  const handleSaveEdit = () => {
    if (!editClass) return;
    if (!editForm.grade || !editForm.classTeacherId || !editForm.departmentId) {
      toast.error("Grade, class teacher and department are required.");
      return;
    }
    const subjectTeachers = classSubjectIds
      .filter(sid => subjectTeacherMap[sid])
      .map(sid => ({ subjectId: sid, teacherId: subjectTeacherMap[sid] }));

    updateClass(editClass.id, {
      name: editForm.name || `Grade ${editForm.grade} - ${editForm.section}`,
      grade: editForm.grade,
      section: editForm.section,
      departmentId: editForm.departmentId,
      academicYear: editForm.academicYear,
      classTeacherId: editForm.classTeacherId,
      subjectTeachers,
    });
    toast.success("Class updated successfully.");
    setEditClass(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.grade || !form.classTeacherId || !form.departmentId) {
      toast.error("Grade, class teacher and department are required.");
      return;
    }
    const name = form.name || `Grade ${form.grade} - ${form.section}`;
    addClass({ ...form, name });
    toast.success(`${name} created!`);
    setShowAdd(false);
    setForm({ name: "", grade: "", section: "A", classTeacherId: "", departmentId: "", academicYear: "2025-2026", subjectTeachers: [], studentIds: [] });
  };

  const handleDelete = (id: string, name: string) => {
    const cls = classes.find(c => c.id === id);
    if (cls && cls.studentIds.length > 0) { toast.error("Cannot delete: class has enrolled students."); return; }
    if (!confirm(`Delete "${name}"?`)) return;
    deleteClass(id);
    toast.success("Class deleted.");
  };

  const totalStudents = classes.reduce((sum, c) => sum + c.studentIds.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage class sections · {classes.length} classes</p>
        </div>
        {isAdmin() && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Add Class
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Classes", value: classes.length, icon: GraduationCap, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
          { label: "Total Students", value: totalStudents, icon: Users, color: "text-teal-600 bg-teal-50 dark:bg-teal-950" },
          { label: "Departments", value: departments.length, icon: BookOpen, color: "text-purple-600 bg-purple-50 dark:bg-purple-950" },
          { label: "Teachers", value: teachers.length, icon: GraduationCap, color: "text-orange-600 bg-orange-50 dark:bg-orange-950" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map(cls => {
          const classTeacher = getTeacherById(cls.classTeacherId);
          const dept = getDepartmentById(cls.departmentId);
          const classSubjects = subjects.filter(s => cls.subjectTeachers.some(st => st.subjectId === s.id));
          const attSummary = getClassAttendanceSummary(cls.id);
          const classStudents = students.filter(s => cls.studentIds.includes(s.id));
          const avgScore = classStudents.length
            ? Math.round(classStudents.reduce((sum, s) => sum + getStudentAverage(s.id), 0) / classStudents.length)
            : null;

          return (
            <div key={cls.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{cls.name}</h3>
                    <p className="text-xs text-muted-foreground">{cls.academicYear}</p>
                    {dept && <p className="text-xs text-muted-foreground">{dept.name}</p>}
                  </div>
                </div>
                {isAdmin() && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(cls)}
                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded text-muted-foreground hover:text-blue-600 transition-colors"
                      title="Edit class">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cls.id, cls.name)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-muted-foreground hover:text-red-600 transition-colors"
                      title="Delete class">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 text-sm mb-4">
                <div className="bg-accent/50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-primary">{cls.studentIds.length}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <div className="bg-accent/50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-primary">{cls.subjectTeachers.length}</p>
                  <p className="text-xs text-muted-foreground">Subjects</p>
                </div>
                <div className="bg-accent/50 rounded-lg p-2 text-center">
                  <p className={`text-lg font-bold ${attSummary.rate >= 85 ? "text-green-600" : attSummary.rate >= 75 ? "text-yellow-600" : "text-red-600"}`}>
                    {attSummary.rate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
                <div className="bg-accent/50 rounded-lg p-2 text-center">
                  <p className={`text-lg font-bold ${avgScore !== null ? (avgScore >= 75 ? "text-green-600" : avgScore >= 50 ? "text-yellow-600" : "text-red-600") : "text-muted-foreground"}`}>
                    {avgScore !== null ? `${avgScore}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>

              {classTeacher && (
                <div className="flex items-center gap-2 text-sm mb-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {classTeacher.name.charAt(0)}
                  </div>
                  <span className="text-muted-foreground text-xs">Class Teacher:</span>
                  <span className="text-xs font-medium">{classTeacher.name}</span>
                </div>
              )}

              {classSubjects.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {classSubjects.map(s => {
                    const subTeacher = cls.subjectTeachers.find(st => st.subjectId === s.id);
                    const t = subTeacher ? getTeacherById(subTeacher.teacherId) : undefined;
                    return (
                      <span key={s.id} className="text-xs bg-accent px-2 py-0.5 rounded" title={t ? `Taught by ${t.name}` : ""}>
                        {s.name}{t ? ` · ${t.name.split(" ")[0]}` : ""}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Edit Class Modal ── */}
      {editClass && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="font-semibold text-lg">Edit Class</h2>
                <p className="text-xs text-muted-foreground">{editClass.name}</p>
              </div>
              <button onClick={() => setEditClass(null)} className="p-1.5 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex border-b border-border px-6 flex-shrink-0">
              {(["info", "teacher", "subjects"] as const).map(tab => (
                <button key={tab} onClick={() => setEditTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${editTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {tab === "info" ? "Basic Info" : tab === "teacher" ? "Class Teacher" : "Subject Teachers"}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">

              {editTab === "info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Grade <span className="text-destructive">*</span></label>
                      <input value={editForm.grade} onChange={e => setEditForm(p => ({ ...p, grade: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Section</label>
                      <select value={editForm.section} onChange={e => setEditForm(p => ({ ...p, section: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                        {["A","B","C","D","E"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Display Name</label>
                      <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                        placeholder={`Grade ${editForm.grade} - ${editForm.section}`}
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Department <span className="text-destructive">*</span></label>
                      <select value={editForm.departmentId} onChange={e => setEditForm(p => ({ ...p, departmentId: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Select department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Academic Year</label>
                      <input value={editForm.academicYear} onChange={e => setEditForm(p => ({ ...p, academicYear: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={() => setEditTab("teacher")}
                      className="flex items-center gap-1 text-sm text-primary hover:underline">
                      Next: Class Teacher <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {editTab === "teacher" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Select the homeroom / class teacher responsible for this class.</p>
                  <div className="space-y-2">
                    {teachers.map(t => {
                      const dept = getDepartmentById(t.departmentId);
                      const isSelected = editForm.classTeacherId === t.id;
                      return (
                        <button key={t.id} onClick={() => setEditForm(p => ({ ...p, classTeacherId: t.id }))}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/40"}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}>
                            {t.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.designation}{dept ? ` · ${dept.name}` : ""}</p>
                          </div>
                          {isSelected && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex-shrink-0">Selected</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between pt-2">
                    <button onClick={() => setEditTab("info")} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                    <button onClick={() => setEditTab("subjects")} className="flex items-center gap-1 text-sm text-primary hover:underline">
                      Next: Subject Teachers <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {editTab === "subjects" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Toggle subjects taught in this class, then assign a teacher to each.</p>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Subjects in this class</p>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map(sub => {
                        const active = classSubjectIds.includes(sub.id);
                        return (
                          <button key={sub.id} onClick={() => toggleSubject(sub.id)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"}`}>
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {classSubjectIds.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assign teachers</p>
                      <div className="border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-accent/40 border-b border-border">
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Subject</th>
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Assigned Teacher</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {classSubjectIds.map(sid => {
                              const sub = subjects.find(s => s.id === sid);
                              if (!sub) return null;
                              return (
                                <tr key={sid} className="hover:bg-accent/20">
                                  <td className="px-4 py-2.5">
                                    <span className="font-medium">{sub.name}</span>
                                    {sub.code && <span className="text-xs text-muted-foreground ml-1">({sub.code})</span>}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <select
                                      value={subjectTeacherMap[sid] || ""}
                                      onChange={e => setSubjectTeacherMap(m => ({ ...m, [sid]: e.target.value }))}
                                      className="w-full px-2 py-1.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                                      <option value="">— Unassigned —</option>
                                      {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                      No subjects selected. Toggle subjects above to assign teachers.
                    </div>
                  )}

                  <div className="flex justify-start pt-1">
                    <button onClick={() => setEditTab("teacher")} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
              <button onClick={() => setEditClass(null)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent">Cancel</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Class Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Add Class</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Grade <span className="text-destructive">*</span></label>
                  <input value={form.grade} onChange={e => setF("grade", e.target.value)} placeholder="e.g. 10" required
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <select value={form.section} onChange={e => setF("section", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    {["A","B","C","D","E"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Custom Name (optional)</label>
                  <input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Auto: Grade 10 - A"
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Class Teacher <span className="text-destructive">*</span></label>
                  <select value={form.classTeacherId} onChange={e => setF("classTeacherId", e.target.value)} required
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.designation}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Department <span className="text-destructive">*</span></label>
                  <select value={form.departmentId} onChange={e => setF("departmentId", e.target.value)} required
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Academic Year</label>
                  <input value={form.academicYear} onChange={e => setF("academicYear", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90">Create Class</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
