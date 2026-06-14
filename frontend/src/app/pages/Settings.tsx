import { useState } from "react";
import { User, Bell, Lock, Shield, Building2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { toast } from "../../lib/toast";
import { useTheme } from "next-themes";

export function Settings() {
  const { user, isAdmin } = useAuth();
  const { getTeacherById, departments, classes } = useData();
  const { theme, setTheme } = useTheme();

  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;

  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated successfully!");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) return toast.error("All fields are required.");
    if (newPw !== confirmPw) return toast.error("New passwords do not match.");
    if (newPw.length < 6) return toast.error("Password must be at least 6 characters.");
    toast.success("Password changed successfully!");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Role badge */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${isAdmin() ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20" : "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20"}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isAdmin() ? "bg-red-600 text-white" : "bg-blue-600 text-white"}`}>
          {user?.name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {teacher && <p className="text-xs text-muted-foreground mt-0.5">{teacher.designation} · {teacher.employeeId}</p>}
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wide ${isAdmin() ? "bg-red-600 text-white" : "bg-blue-600 text-white"}`}>
          {user?.role}
        </span>
      </div>

      {/* Profile */}
      <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2"><User className="w-4 h-4" /> Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Full Name</label>
            <input type="text" defaultValue={user?.name} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Email Address</label>
            <input type="email" defaultValue={user?.email} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background" />
          </div>
          {teacher && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Phone</label>
                <input type="tel" defaultValue={teacher.phone} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Qualification</label>
                <input type="text" defaultValue={teacher.qualification} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background" />
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Role</label>
            <input type="text" value={isAdmin() ? "Administrator" : teacher?.designation || "Teacher"} disabled className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-muted text-muted-foreground capitalize" />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="submit" className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Save Profile</button>
        </div>
      </form>

      {/* Access Summary (for teachers) */}
      {!isAdmin() && teacher && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-5 flex items-center gap-2"><Shield className="w-4 h-4" /> My Access Scope</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Assigned Classes</p>
              {classes.filter(c => c.classTeacherId === teacher.id || c.subjectTeachers.some(st => st.teacherId === teacher.id)).map(c => {
                const isHomeroom = c.classTeacherId === teacher.id;
                const subjectEntry = c.subjectTeachers.find(st => st.teacherId === teacher.id);
                return (
                  <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                    <div>
                      <span>{c.name}</span>
                      {isHomeroom && (
                        <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">Class Teacher</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {isHomeroom ? `${c.studentIds.length} students` : "Subject Teacher"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Department</p>
              <p className="text-sm font-medium">{departments.find(d => d.id === teacher.departmentId)?.name || "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">Employee ID: {teacher.employeeId}</p>
              <p className="text-xs text-muted-foreground mt-1">Joined: {teacher.joinDate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Institution Info (admin only) */}
      {isAdmin() && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-5 flex items-center gap-2"><Building2 className="w-4 h-4" /> Institution Overview</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-accent/50 rounded-xl">
              <p className="text-2xl font-bold">{departments.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Departments</p>
            </div>
            <div className="p-4 bg-accent/50 rounded-xl">
              <p className="text-2xl font-bold">{classes.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Classes</p>
            </div>
            <div className="p-4 bg-accent/50 rounded-xl">
              <p className="text-2xl font-bold">2025–26</p>
              <p className="text-xs text-muted-foreground mt-1">Academic Year</p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2"><Bell className="w-4 h-4" /> Notification Preferences</h3>
        {[
          { label: "Email Notifications", sub: "Receive alerts via email", val: emailNotif, set: setEmailNotif },
          { label: "Push Notifications", sub: "In-app real-time alerts", val: pushNotif, set: setPushNotif },
          { label: "SMS Alerts", sub: "Urgent alerts via SMS", val: smsNotif, set: setSmsNotif },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
            <button
              onClick={() => item.set(!item.val)}
              className={`relative w-11 h-6 rounded-full transition-colors ${item.val ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.val ? "translate-x-5" : ""}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Appearance */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2"><span className="w-4 h-4 text-base">🎨</span> Appearance</h3>
        <div className="flex gap-3">
          {["light", "dark", "system"].map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${theme === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h3>
        <div className="space-y-4">
          {[
            { label: "Current Password", val: currentPw, set: setCurrentPw },
            { label: "New Password", val: newPw, set: setNewPw },
            { label: "Confirm New Password", val: confirmPw, set: setConfirmPw },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">{f.label}</label>
              <input
                type="password"
                value={f.val}
                onChange={e => f.set(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button type="submit" className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Update Password</button>
        </div>
      </form>
    </div>
  );
}
