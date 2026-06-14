import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";
import { toast } from "../../../lib/toast";

type ExamType = "unit" | "midterm" | "final" | "assignment";

export function MarksEntry() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { classes, getTeacherById, getTeacherClasses, getSubjectById, getStudentById, getMarksByClass, saveMarks } = useData();

  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;
  const accessibleClasses = isAdmin() ? classes : (teacher ? getTeacherClasses(teacher.id) : []);

  const [selectedClassId, setSelectedClassId] = useState(accessibleClasses[0]?.id || "");
  const [examType, setExamType] = useState<ExamType>("unit");
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});

  const cls = classes.find(c => c.id === selectedClassId);

  // For teachers: only subjects they teach in this class. For admins: all subjects in class
  const classSubjectEntries = cls
    ? cls.subjectTeachers.filter(st => isAdmin() || st.teacherId === teacher?.id)
    : [];

  const [selectedSubjectId, setSelectedSubjectId] = useState(classSubjectEntries[0]?.subjectId || "");

  useEffect(() => {
    const entries = cls
      ? cls.subjectTeachers.filter(st => isAdmin() || st.teacherId === teacher?.id)
      : [];
    setSelectedSubjectId(entries[0]?.subjectId || "");
  }, [selectedClassId]);

  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId) return;
    const existing = getMarksByClass(selectedClassId, selectedSubjectId, examType);
    const init: Record<string, string> = {};
    existing.forEach(r => { init[r.studentId] = String(r.marks); });
    setMarksMap(init);
  }, [selectedClassId, selectedSubjectId, examType]);

  const subject = getSubjectById(selectedSubjectId);
  const classStudents = cls ? cls.studentIds.map(id => getStudentById(id)).filter(Boolean) : [];

  const totalMarksDefaults: Record<ExamType, number> = { unit: 25, midterm: 50, final: 100, assignment: 20 };
  const totalMarks = totalMarksDefaults[examType];

  const handleSave = () => {
    if (!selectedClassId || !selectedSubjectId) return;
    const teacherId = teacher?.id || "admin";
    const records = classStudents
      .filter(Boolean)
      .filter(s => marksMap[s!.id] !== undefined && marksMap[s!.id] !== "")
      .map(s => ({
        studentId: s!.id,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        examType,
        marks: Math.min(parseFloat(marksMap[s!.id]) || 0, totalMarks),
        totalMarks,
        date: new Date().toISOString().split("T")[0],
        teacherId,
      }));
    saveMarks(records);
    toast.success(`Marks saved: ${subject?.name} · ${examType} · ${cls?.name}`);
    navigate("/marks");
  };

  const avg = (() => {
    const vals = classStudents
      .filter(Boolean)
      .map(s => parseFloat(marksMap[s!.id] || ""))
      .filter(v => !isNaN(v));
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/marks" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Enter Marks</h1>
          <p className="text-muted-foreground text-sm">Record exam scores for students</p>
        </div>
      </div>

      {/* Config Row */}
      <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Class</label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          >
            {accessibleClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          >
            {classSubjectEntries.map(st => {
              const sub = getSubjectById(st.subjectId);
              return sub ? <option key={sub.id} value={sub.id}>{sub.name}</option> : null;
            })}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Exam Type</label>
          <select
            value={examType}
            onChange={e => setExamType(e.target.value as ExamType)}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          >
            <option value="unit">Unit Test (/{totalMarksDefaults.unit})</option>
            <option value="midterm">Midterm (/{totalMarksDefaults.midterm})</option>
            <option value="final">Final Exam (/{totalMarksDefaults.final})</option>
            <option value="assignment">Assignment (/{totalMarksDefaults.assignment})</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Total Marks: <strong className="text-foreground">{totalMarks}</strong></span>
        <span>Students: <strong className="text-foreground">{classStudents.length}</strong></span>
        {avg && <span>Class Avg: <strong className="text-foreground">{avg}/{totalMarks}</strong></span>}
      </div>

      {/* Marks Input */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-accent/30">
          <p className="text-sm font-medium">{subject?.name} — {examType.charAt(0).toUpperCase() + examType.slice(1)} — {cls?.name}</p>
        </div>
        <div className="divide-y divide-border">
          {classStudents.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">No students in this class</p>
          ) : (
            classStudents.map(student => {
              if (!student) return null;
              const val = marksMap[student.id] || "";
              const numVal = parseFloat(val);
              const pct = !isNaN(numVal) ? (numVal / totalMarks) * 100 : null;
              return (
                <div key={student.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.roll}</p>
                  </div>
                  {pct !== null && (
                    <span className={`text-xs font-medium ${pct >= 75 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                      {pct.toFixed(0)}%
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={totalMarks}
                      value={val}
                      onChange={e => setMarksMap(prev => ({ ...prev, [student.id]: e.target.value }))}
                      placeholder="—"
                      className="w-20 px-3 py-1.5 border border-input rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                    />
                    <span className="text-sm text-muted-foreground">/ {totalMarks}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link to="/marks" className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">Cancel</Link>
        <button
          onClick={handleSave}
          disabled={classStudents.length === 0}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> Save Marks
        </button>
      </div>
    </div>
  );
}
