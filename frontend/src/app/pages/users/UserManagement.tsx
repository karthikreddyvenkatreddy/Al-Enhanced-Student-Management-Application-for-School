import { useState } from "react";
import { ShieldCheck, Plus, X, Mail, Eye, EyeOff, Key } from "lucide-react";
import { useData } from "../../../contexts/DataContext";
import { toast } from "../../../lib/toast";

export function UserManagement() {
  const { users, teachers, getDepartmentById, addUser } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "teacher" as "admin" | "teacher", password: "" });

  const usersWithDetails = users.map(u => ({
    ...u,
    teacher: u.teacherId ? teachers.find(t => t.id === u.teacherId) : undefined,
  }));

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("All fields required");
      return;
    }
    addUser(newUser);
    toast.success(`${newUser.name} created.`);
    setShowAdd(false);
    setNewUser({ name: "", email: "", role: "teacher", password: "" });
  };

  const roleBadge = (role: string) => role === "admin"
    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

  const togglePw = (id: string) => setShowPasswords(p => ({ ...p, [id]: !p[id] }));

  const adminCount = usersWithDetails.filter(u => u.role === "admin").length;
  const teacherCount = usersWithDetails.filter(u => u.role === "teacher").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> User Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            System users, roles and access control - Administrator only
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: usersWithDetails.length, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
          { label: "Administrators", value: adminCount, color: "text-red-600 bg-red-50 dark:bg-red-950" },
          { label: "Teachers", value: teacherCount, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <p className={`text-2xl font-bold ${s.color.split(" ")[0]}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Add New User</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              {[
                { label: "Full Name", key: "name", type: "text" },
                { label: "Email Address", key: "email", type: "email" },
                { label: "Password", key: "password", type: "password" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={(newUser as any)[f.key]}
                    onChange={e => setNewUser(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser(p => ({ ...p, role: e.target.value as "admin" | "teacher" }))}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="teacher">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 text-xs text-yellow-700 dark:text-yellow-400">
                New accounts are created in MySQL and can sign in immediately.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Key className="w-4 h-4" /> Role Access Policy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              role: "Administrator",
              color: "border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10",
              badge: "bg-red-600 text-white",
              perms: ["Full institution access", "Manage teachers, classes, departments", "View all students across classes", "Manage users and settings", "Access all AI reports and predictions", "Override any record"],
            },
            {
              role: "Teacher",
              color: "border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/10",
              badge: "bg-blue-600 text-white",
              perms: ["Access assigned classes only", "Mark attendance for own classes", "Enter marks for own subjects", "Manage own assignments", "View students in own classes", "AI predictions for own students"],
            },
          ].map(r => (
            <div key={r.role} className={`rounded-xl border p-4 ${r.color}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${r.badge}`}>{r.role}</span>
              </div>
              <ul className="space-y-1.5">
                {r.perms.map(p => (
                  <li key={p} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">System Users ({usersWithDetails.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Email</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Department / Designation</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seed Password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersWithDetails.map(u => (
                <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${u.role === "admin" ? "bg-red-500" : "bg-blue-500"}`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {u.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${roleBadge(u.role)}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {u.teacher ? (
                      <div>
                        <p className="text-sm font-medium">{u.teacher.designation}</p>
                        <p className="text-xs text-muted-foreground">{getDepartmentById(u.teacher.departmentId)?.name}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Principal / Admin</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="text-sm font-mono bg-accent px-2 py-0.5 rounded">
                        {showPasswords[u.id] ? (u.demoPassword || "Set at creation") : "********"}
                      </span>
                      <button onClick={() => togglePw(u.id)} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
                        {showPasswords[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
