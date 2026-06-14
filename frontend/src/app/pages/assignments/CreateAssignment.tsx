import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";
import { toast } from "../../../lib/toast";

export function CreateAssignment() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { classes, subjects, teachers, getTeacherById, getTeacherClasses, addAssignment } = useData();

  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;
  const availableClasses = isAdmin() ? classes : (teacher ? getTeacherClasses(teacher.id) : []);

  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    classId: "",
    subjectId: "",
    teacherId: teacher?.id || "",
    dueDate: "",
    totalMarks: 20,
    status: "active" as "active" | "closed",
  });

  const set = (field: string, value: string | number) => setForm(p => ({ ...p, [field]: value }));

  const availableSubjects = form.classId
    ? (() => {
        const cls = classes.find(c => c.id === form.classId);
        if (!cls) return subjects;
        const subjectIds = cls.subjectTeachers.map(st => st.subjectId);
        return subjects.filter(s => subjectIds.includes(s.id));
      })()
    : subjects;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.classId || !form.subjectId || !form.dueDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const teacherId = isAdmin() ? form.teacherId : (teacher?.id || "");
    if (!teacherId) {
      toast.error("No teacher assigned.");
      return;
    }
    addAssignment({ ...form, teacherId });
    toast.success("Assignment created successfully!");
    navigate("/assignments");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/assignments" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Assignment</h1>
          <p className="text-muted-foreground text-sm">Assign work to a class</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Title <span className="text-destructive">*</span></label>
          <input value={form.title} onChange={e => set("title", e.target.value)}
            placeholder="e.g. Chapter 5 Practice Problems"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background" required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description <span className="text-destructive">*</span></label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)}
            rows={3} placeholder="Describe what students need to do..."
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none" required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Instructions / Guidelines</label>
          <textarea value={form.instructions} onChange={e => set("instructions", e.target.value)}
            rows={2} placeholder="Optional: submission format, requirements..."
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Class <span className="text-destructive">*</span></label>
            <select value={form.classId} onChange={e => { set("classId", e.target.value); set("subjectId", ""); }}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background" required>
              <option value="">Select class</option>
              {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Subject <span className="text-destructive">*</span></label>
            <select value={form.subjectId} onChange={e => set("subjectId", e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background" required>
              <option value="">Select subject</option>
              {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {isAdmin() && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Assign To Teacher <span className="text-destructive">*</span></label>
            <select value={form.teacherId} onChange={e => set("teacherId", e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background">
              <option value="">Select teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.designation}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">Due Date <span className="text-destructive">*</span></label>
            <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Total Marks</label>
            <input type="number" value={form.totalMarks} onChange={e => set("totalMarks", Number(e.target.value))}
              min={1} max={500}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background" />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
            <ClipboardList className="w-4 h-4" /> Create Assignment
          </button>
          <Link to="/assignments" className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-accent">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
