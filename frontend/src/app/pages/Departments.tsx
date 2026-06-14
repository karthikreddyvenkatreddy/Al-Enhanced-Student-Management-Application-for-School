import { useState } from "react";
import { Building2, Plus, X, Users, BookOpen, Trash2, Edit2 } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { toast } from "../../lib/toast";

export function Departments() {
  const { departments, teachers, subjects, addDepartment, deleteDepartment } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error("Name and code are required."); return; }
    addDepartment({ name: form.name, code: form.code.toUpperCase() });
    toast.success(`Department "${form.name}" added.`);
    setForm({ name: "", code: "" });
    setShowAdd(false);
  };

  const handleDelete = (id: string, name: string) => {
    const hasTeachers = teachers.some(t => t.departmentId === id);
    if (hasTeachers) { toast.error("Cannot delete: department has teachers assigned."); return; }
    if (!confirm(`Delete department "${name}"?`)) return;
    deleteDepartment(id);
    toast.success("Department deleted.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage academic departments · {departments.length} total</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Add Department</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department Name</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Science & Technology"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department Code</label>
                <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                  placeholder="e.g. SCI"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" required maxLength={5} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium">Add Department</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => {
          const deptTeachers = teachers.filter(t => t.departmentId === dept.id);
          const deptSubjects = subjects.filter(s => s.departmentId === dept.id);
          const head = deptTeachers.find(t => t.id === dept.headTeacherId);

          return (
            <div key={dept.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{dept.name}</h3>
                    <span className="text-xs bg-accent px-2 py-0.5 rounded font-mono">{dept.code}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-accent rounded text-muted-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(dept.id, dept.name)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-muted-foreground hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="w-3.5 h-3.5" />Teachers</span>
                  <span className="font-medium">{deptTeachers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><BookOpen className="w-3.5 h-3.5" />Subjects</span>
                  <span className="font-medium">{deptSubjects.length}</span>
                </div>
              </div>

              {head && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">HOD: <span className="font-medium text-foreground">{head.name}</span></p>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1">
                {deptSubjects.map(s => (
                  <span key={s.id} className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">{s.name}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
