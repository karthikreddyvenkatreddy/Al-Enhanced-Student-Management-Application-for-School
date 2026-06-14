import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Check, X, Clock, Save } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";
import { toast } from "../../../lib/toast";

type AttStatus = "present" | "absent" | "late";

export function MarkAttendance() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { classes, getTeacherById, getTeacherClasses, getAttendanceByDate, saveAttendance, getStudentById } = useData();

  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;
  const accessibleClasses = isAdmin() ? classes : (teacher ? getTeacherClasses(teacher.id) : []);

  const [selectedClassId, setSelectedClassId] = useState(accessibleClasses[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, AttStatus>>({});

  useEffect(() => {
    if (!selectedClassId) return;
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return;
    const existing = getAttendanceByDate(selectedClassId, date);
    const init: Record<string, AttStatus> = {};
    cls.studentIds.forEach(sid => {
      const rec = existing.find(r => r.studentId === sid);
      init[sid] = rec ? (rec.status as AttStatus) : "present";
    });
    setAttendance(init);
  }, [selectedClassId, date]);

  const cls = classes.find(c => c.id === selectedClassId);
  const classStudents = cls ? cls.studentIds.map(sid => getStudentById(sid)).filter(Boolean) : [];

  const setAll = (status: AttStatus) => {
    const next: Record<string, AttStatus> = {};
    classStudents.forEach(s => { if (s) next[s.id] = status; });
    setAttendance(next);
  };

  const handleSave = () => {
    if (!selectedClassId || !date) return;
    const records = classStudents.filter(Boolean).map(s => ({
      studentId: s!.id,
      classId: selectedClassId,
      date,
      status: attendance[s!.id] || "present",
      markedBy: user?.id || "system",
    }));
    saveAttendance(records);
    toast.success(`Attendance saved — ${cls?.name} · ${date}`);
    navigate("/attendance");
  };

  const counts = {
    present: Object.values(attendance).filter(s => s === "present").length,
    absent: Object.values(attendance).filter(s => s === "absent").length,
    late: Object.values(attendance).filter(s => s === "late").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/attendance" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Mark Attendance</h1>
          <p className="text-muted-foreground text-sm">Record student attendance for the day</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Class</label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          >
            {accessibleClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          />
        </div>
      </div>

      {/* Summary + bulk */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium">✓ Present: {counts.present}</span>
        <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium">✗ Absent: {counts.absent}</span>
        <span className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-sm font-medium">⏱ Late: {counts.late}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setAll("present")} className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors">All Present</button>
          <button onClick={() => setAll("absent")} className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors">All Absent</button>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-accent/30">
          <p className="text-sm font-medium">{cls?.name} — {classStudents.length} students</p>
        </div>
        <div className="divide-y divide-border">
          {classStudents.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">No students in this class</p>
          ) : classStudents.map(student => {
            if (!student) return null;
            const status = attendance[student.id] || "present";
            return (
              <div key={student.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.roll}</p>
                </div>
                <div className="flex gap-2">
                  {(["present", "absent", "late"] as AttStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setAttendance(prev => ({ ...prev, [student.id]: s }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        status === s
                          ? s === "present" ? "bg-green-500 text-white"
                            : s === "absent" ? "bg-red-500 text-white"
                            : "bg-orange-500 text-white"
                          : "border border-border hover:bg-accent"
                      }`}
                    >
                      {s === "present" ? <Check className="w-3 h-3" /> : s === "absent" ? <X className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span className="hidden sm:inline">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link to="/attendance" className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">Cancel</Link>
        <button
          onClick={handleSave}
          disabled={classStudents.length === 0}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> Save Attendance
        </button>
      </div>
    </div>
  );
}
