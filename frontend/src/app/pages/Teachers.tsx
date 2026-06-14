import { useState } from "react";
import { Search, Plus, Mail, Phone, Building2, BookOpen, Trash2, X, Users, GraduationCap } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "../../lib/toast";

export function Teachers() {
  const { teachers, departments, subjects, classes, students, addTeacher, deleteTeacher, getDepartmentById, getStudentAverage, getTeacherClasses } = useData();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", employeeId: "",
    departmentId: "", designation: "", qualification: "",
    joinDate: new Date().toISOString().split("T")[0],
    status: "active" as "active" | "inactive",
    subjects: [] as string[], assignedClasses: [], userId: "",
  });

  const filtered = teachers.filter(t => {
    if (deptFilter !== "all" && t.departmentId !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.employeeId.toLowerCase().includes(q);
    }
    return true;
  });

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Remove teacher "${name}"?`)) return;
    deleteTeacher(id);
    toast.success(`${name} removed.`);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.departmentId) { toast.error("Name, email and department are required."); return; }
    addTeacher({ ...form, assignedClasses: [] });
    toast.success(`${form.name} added!`);
    setShowAdd(false);
    setForm({ name: "", email: "", phone: "", employeeId: "", departmentId: "", designation: "", qualification: "", joinDate: new Date().toISOString().split("T")[0], status: "active", subjects: [], assignedClasses: [], userId: "" });
  };

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teachers</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} of {teachers.length} staff members</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search teachers..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(teacher => {
          const dept = getDepartmentById(teacher.departmentId);
          const teacherSubjects = subjects.filter(s => teacher.subjects.includes(s.id));
          const teacherClasses = getTeacherClasses(teacher.id);
          const teacherStudentIds = new Set(teacherClasses.flatMap(c => c.studentIds));
          const teacherStudents = students.filter(s => teacherStudentIds.has(s.id));
          const avgScore = teacherStudents.length
            ? Math.round(teacherStudents.reduce((sum, s) => sum + getStudentAverage(s.id), 0) / teacherStudents.length)
            : null;
          return (
            <div key={teacher.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
                    {teacher.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{teacher.name}</h3>
                    <p className="text-xs text-muted-foreground">{teacher.employeeId}</p>
                    <p className="text-xs text-muted-foreground">{teacher.designation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${teacher.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700"}`}>
                    {teacher.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /><span className="truncate">{teacher.email}</span></div>
                {teacher.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{teacher.phone}</div>}
                {dept && <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" />{dept.name}</div>}
              </div>

              {teacherSubjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {teacherSubjects.map(s => (
                    <span key={s.id} className="text-xs bg-accent px-2 py-0.5 rounded">{s.name}</span>
                  ))}
                </div>
              )}

              {teacher.qualification && (
                <p className="text-xs text-muted-foreground mb-3 italic">{teacher.qualification}</p>
              )}
              <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-border">
                <div className="text-center">
                  <p className="text-sm font-bold">{teacherClasses.length}</p>
                  <p className="text-xs text-muted-foreground">Classes</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">{teacherStudents.length}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <div className="text-center">
                  <p className={`text-sm font-bold ${avgScore !== null ? (avgScore >= 75 ? "text-green-600" : avgScore >= 50 ? "text-yellow-600" : "text-red-600") : "text-muted-foreground"}`}>
                    {avgScore !== null ? `${avgScore}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button onClick={() => handleDelete(teacher.id, teacher.name)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-muted-foreground hover:text-red-600 flex items-center gap-1 text-xs">
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-sm">No teachers found.</p>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Add Teacher</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Full Name <span className="text-destructive">*</span></label>
                  <input value={form.name} onChange={e => set("name", e.target.value)} required
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Employee ID</label>
                  <input value={form.employeeId} onChange={e => set("employeeId", e.target.value)}
                    placeholder="EMP005"
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email <span className="text-destructive">*</span></label>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department <span className="text-destructive">*</span></label>
                  <select value={form.departmentId} onChange={e => set("departmentId", e.target.value)} required
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Designation</label>
                  <input value={form.designation} onChange={e => set("designation", e.target.value)}
                    placeholder="Senior Teacher"
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Qualification</label>
                  <input value={form.qualification} onChange={e => set("qualification", e.target.value)}
                    placeholder="M.Sc Mathematics"
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90">Add Teacher</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
