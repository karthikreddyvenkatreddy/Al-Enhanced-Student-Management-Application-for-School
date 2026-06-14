import { Link, useParams } from "react-router";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User, Users, Edit } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";

export function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const { getStudentById, getClassById, getAssignmentsByClass, getSubmissionsByAssignment, classes, getTeacherById } = useData();

  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;
  const homeroomClassIds = new Set(classes.filter(c => c.classTeacherId === teacher?.id).map(c => c.id));

  const student = id ? getStudentById(id) : undefined;

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Student not found.</p>
        <Link to="/students" className="text-primary hover:underline text-sm mt-2 inline-block">Back to Students</Link>
      </div>
    );
  }

  const cls = getClassById(student.classId);
  const assignments = cls ? getAssignmentsByClass(cls.id) : [];
  const submissions = assignments.flatMap(a => getSubmissionsByAssignment(a.id).filter(s => s.studentId === student.id));
  const gradedSubs = submissions.filter(s => s.status === "graded" && s.marks !== undefined);
  const avgScore = gradedSubs.length > 0
    ? (gradedSubs.reduce((sum, s) => sum + (s.marks || 0), 0) / gradedSubs.length).toFixed(1)
    : "—";

  const infoRows = [
    { icon: Mail, label: "Email", value: student.email || "—" },
    { icon: Phone, label: "Phone", value: student.phone || "—" },
    { icon: MapPin, label: "Address", value: student.address || "—" },
    { icon: Calendar, label: "Date of Birth", value: student.dob || "—" },
    { icon: User, label: "Gender", value: student.gender || "—" },
    { icon: Users, label: "Parent", value: student.parentName || "—" },
    { icon: Phone, label: "Parent Phone", value: student.parentPhone || "—" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/students" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{student.name}</h1>
          <p className="text-muted-foreground text-sm">{student.roll} · {cls?.name || "—"}</p>
        </div>
        {(isAdmin() || homeroomClassIds.has(student.classId)) && (
          <Link to={`/students/edit/${student.id}`}
            className="flex items-center gap-2 border border-border px-3 py-2 rounded-lg text-sm hover:bg-accent">
            <Edit className="w-4 h-4" /> Edit
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary mx-auto mb-3">
              {student.name.charAt(0)}
            </div>
            <h2 className="font-semibold text-lg">{student.name}</h2>
            <p className="text-muted-foreground text-sm">{cls?.name}</p>
            <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${student.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700"}`}>
              {student.status}
            </span>
          </div>

          {/* Stats */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-sm">Quick Stats</h3>
            <div className="space-y-2">
              {[
                { label: "Blood Group", value: student.bloodGroup || "—" },
                { label: "Admission Date", value: student.admissionDate || "—" },
                { label: "Assignments", value: `${submissions.length} / ${assignments.length} submitted` },
                { label: "Avg Score", value: avgScore },
              ].map(stat => (
                <div key={stat.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{stat.label}</span>
                  <span className="font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoRows.map(row => (
                <div key={row.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <row.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="text-sm font-medium capitalize">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment Submissions */}
          {assignments.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Recent Assignments</h3>
              <div className="space-y-2">
                {assignments.slice(0, 5).map(a => {
                  const sub = getSubmissionsByAssignment(a.id).find(s => s.studentId === student.id);
                  return (
                    <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">Due: {a.dueDate}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        !sub ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : sub.status === "graded" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {!sub ? "Missing" : sub.status === "graded" ? `${sub.marks}/${a.totalMarks}` : "Submitted"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
