import { useState } from "react";
import { Link } from "react-router";
import { Plus, BookOpen } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";

const gradeFromPercent = (pct: number) => {
  if (pct >= 90) return { label: "A+", cls: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400" };
  if (pct >= 80) return { label: "A", cls: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400" };
  if (pct >= 70) return { label: "B+", cls: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400" };
  if (pct >= 60) return { label: "B", cls: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400" };
  if (pct >= 50) return { label: "C", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400" };
  return { label: "D", cls: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400" };
};

export function MarksTable() {
  const { user, isAdmin } = useAuth();
  const { classes, students, getTeacherById, getTeacherClasses, getMarksByClass, getSubjectById, getStudentById } = useData();

  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;
  const accessibleClasses = isAdmin() ? classes : (teacher ? getTeacherClasses(teacher.id) : []);

  const [selectedClassId, setSelectedClassId] = useState(accessibleClasses[0]?.id || "");
  const [selectedExamType, setSelectedExamType] = useState<string>("all");

  const cls = classes.find(c => c.id === selectedClassId);

  // For teachers, only show subjects they teach in this class
  const classSubjects = cls
    ? cls.subjectTeachers
        .filter(st => isAdmin() || st.teacherId === teacher?.id)
        .map(st => getSubjectById(st.subjectId))
        .filter(Boolean)
    : [];

  const classStudents = cls ? cls.studentIds.map(id => getStudentById(id)).filter(Boolean) : [];

  const marks = getMarksByClass(
    selectedClassId,
    undefined,
    selectedExamType === "all" ? undefined : selectedExamType
  );

  // Build per-student row: for each subject, find avg marks across selected exam type
  const rows = classStudents.map(student => {
    if (!student) return null;
    const subjectScores = classSubjects.map(sub => {
      if (!sub) return { subjectId: "", avg: null };
      const relevant = marks.filter(m => m.studentId === student.id && m.subjectId === sub.id);
      if (!relevant.length) return { subjectId: sub.id, avg: null };
      const pct = (relevant.reduce((s, m) => s + m.marks / m.totalMarks * 100, 0)) / relevant.length;
      return { subjectId: sub.id, avg: Math.round(pct) };
    });
    const valid = subjectScores.filter(s => s.avg !== null);
    const overall = valid.length ? Math.round(valid.reduce((s, x) => s + (x.avg || 0), 0) / valid.length) : null;
    return { student, subjectScores, overall };
  }).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin() ? "Institution-wide academic records" : "Your classes' academic records"}
          </p>
        </div>
        <Link
          to="/marks/entry"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Enter Marks
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          className="flex-1 px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        >
          {accessibleClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={selectedExamType}
          onChange={e => setSelectedExamType(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        >
          <option value="all">All Exams</option>
          <option value="unit">Unit Test</option>
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
          <option value="assignment">Assignment</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky left-0 bg-accent/30">Student</th>
                {classSubjects.map(sub => sub && (
                  <th key={sub.id} className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{sub.name}</th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overall</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={classSubjects.length + 3} className="text-center py-12">
                    <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No marks data available</p>
                    <Link to="/marks/entry" className="text-primary text-sm hover:underline mt-1 inline-block">Enter marks</Link>
                  </td>
                </tr>
              ) : (
                rows.map(row => {
                  if (!row) return null;
                  const grade = row.overall !== null ? gradeFromPercent(row.overall) : null;
                  return (
                    <tr key={row.student.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                            {row.student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{row.student.name}</p>
                            <p className="text-xs text-muted-foreground">{row.student.roll}</p>
                          </div>
                        </div>
                      </td>
                      {row.subjectScores.map((sc, i) => (
                        <td key={i} className="px-4 py-3 text-center">
                          {sc.avg !== null ? (
                            <span className={`text-sm font-medium ${sc.avg >= 75 ? "text-green-600" : sc.avg >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                              {sc.avg}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold">{row.overall !== null ? `${row.overall}%` : "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {grade ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${grade.cls}`}>{grade.label}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
