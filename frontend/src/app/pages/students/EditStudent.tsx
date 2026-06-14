import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ArrowLeft, Save, ShieldOff } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";
import { toast } from "../../../lib/toast";

export function EditStudent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const { students, classes, updateStudent, getStudentById, getTeacherById } = useData();

  const student = id ? getStudentById(id) : undefined;
  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;

  const homeroomClassIds = new Set(
    classes.filter(c => c.classTeacherId === teacher?.id).map(c => c.id)
  );
  const isClassTeacher = homeroomClassIds.size > 0;

  // Can manage this specific student?
  const canManage = isAdmin() || (student ? homeroomClassIds.has(student.classId) : false);

  // Classes available for reassignment
  const allowedClasses = isAdmin() ? classes : classes.filter(c => homeroomClassIds.has(c.id));

  const [form, setForm] = useState(student || {
    name: "", roll: "", email: "", phone: "",
    classId: "", dob: "", gender: "male",
    parentName: "", parentPhone: "", address: "",
    admissionDate: "", bloodGroup: "A+", status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (student) setForm(student);
  }, [id]);

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Student not found.</p>
        <Link to="/students" className="text-primary hover:underline text-sm mt-2 inline-block">Back to Students</Link>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldOff className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-semibold text-lg mb-1">Access Restricted</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          You can only edit students in your assigned homeroom class.
        </p>
        <Link to="/students" className="mt-4 text-primary text-sm hover:underline">Back to Students</Link>
      </div>
    );
  }

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    // Class teachers cannot reassign a student to a class outside their homeroom
    if (!isAdmin() && !homeroomClassIds.has(form.classId)) {
      toast.error("You can only keep students in your homeroom class.");
      return;
    }
    updateStudent(id, form);
    toast.success(`${form.name} updated successfully!`);
    navigate(`/students/${id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/students/${id}`} className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Student</h1>
          <p className="text-muted-foreground text-sm">Update {student.name}'s information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name <span className="text-destructive">*</span></label>
              <input value={form.name} onChange={e => set("name", e.target.value)} required
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Roll Number</label>
              <input value={form.roll} onChange={e => set("roll", e.target.value)}
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
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Academic & Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Class</label>
              <select value={form.classId} onChange={e => set("classId", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select class</option>
                {allowedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Address</label>
              <input value={form.address} onChange={e => set("address", e.target.value)}
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
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Parent Phone</label>
              <input value={form.parentPhone} onChange={e => set("parentPhone", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
            <Save className="w-4 h-4" /> Save Changes
          </button>
          <Link to={`/students/${id}`} className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-accent">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
