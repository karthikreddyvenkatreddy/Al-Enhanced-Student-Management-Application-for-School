import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, UserPlus, ShieldOff } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";
import { toast } from "../../../lib/toast";

const defaultForm = {
  name: "", roll: "", email: "", phone: "",
  classId: "", dob: "", gender: "male",
  parentName: "", parentPhone: "", address: "",
  admissionDate: new Date().toISOString().split("T")[0],
  bloodGroup: "A+", status: "active" as "active" | "inactive",
};

export function AddStudent() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { classes, addStudent, getTeacherById } = useData();
  const [form, setForm] = useState(defaultForm);

  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;
  const homeroomClasses = classes.filter(c => c.classTeacherId === teacher?.id);
  const isClassTeacher = homeroomClasses.length > 0;

  // Allowed classes for this user
  const allowedClasses = isAdmin() ? classes : homeroomClasses;

  // Access guard: only admin or class teachers
  if (!isAdmin() && !isClassTeacher) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldOff className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-semibold text-lg mb-1">Access Restricted</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Only administrators and class teachers can add students.
        </p>
        <Link to="/students" className="mt-4 text-primary text-sm hover:underline">Back to Students</Link>
      </div>
    );
  }

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.roll || !form.classId) {
      toast.error("Name, roll number and class are required.");
      return;
    }
    // Class teachers can only add to their homeroom class
    if (!isAdmin() && !homeroomClasses.some(c => c.id === form.classId)) {
      toast.error("You can only add students to your assigned class.");
      return;
    }
    addStudent(form);
    toast.success(`${form.name} added successfully!`);
    navigate("/students");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/students" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Student</h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin() ? "Enroll a new student" : `Enroll a student in your class`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name <span className="text-destructive">*</span></label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="e.g. Alice Brown" required
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Roll Number <span className="text-destructive">*</span></label>
              <input value={form.roll} onChange={e => set("roll", e.target.value)}
                placeholder="e.g. 10A006" required
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Date of Birth</label>
              <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Gender</label>
              <select value={form.gender} onChange={e => set("gender", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Blood Group</label>
              <select value={form.bloodGroup} onChange={e => set("bloodGroup", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Admission Date</label>
              <input type="date" value={form.admissionDate} onChange={e => set("admissionDate", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Academic & Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Class <span className="text-destructive">*</span></label>
              <select value={form.classId} onChange={e => set("classId", e.target.value)} required
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select class</option>
                {allowedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {!isAdmin() && (
                <p className="text-xs text-muted-foreground mt-1">You can only enroll students in your homeroom class.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="student@school.edu"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="555-0001"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Address</label>
              <input value={form.address} onChange={e => set("address", e.target.value)}
                placeholder="123 Main St, City"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Parent / Guardian</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Parent Name</label>
              <input value={form.parentName} onChange={e => set("parentName", e.target.value)}
                placeholder="Robert Brown"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Parent Phone</label>
              <input value={form.parentPhone} onChange={e => set("parentPhone", e.target.value)}
                placeholder="555-0002"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
            <UserPlus className="w-4 h-4" /> Add Student
          </button>
          <Link to="/students" className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-accent">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
