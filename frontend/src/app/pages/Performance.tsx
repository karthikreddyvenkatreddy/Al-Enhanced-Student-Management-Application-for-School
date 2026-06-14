import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { TrendingUp, Users, Award, AlertTriangle } from "lucide-react";

export function Performance() {
  const { user, isAdmin } = useAuth();
  const {
    classes, students,
    getTeacherById, getTeacherClasses,
    getStudentAverage, getStudentAttendanceRate,
    getMarksByClass, getSubjectById,
  } = useData();

  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;
  const accessibleClasses = isAdmin() ? classes : (teacher ? getTeacherClasses(teacher.id) : []);
  const accessibleStudentIds = new Set(accessibleClasses.flatMap(c => c.studentIds));
  const accessibleStudents = students.filter(s => accessibleStudentIds.has(s.id));

  // Per-class performance
  const classPerformance = accessibleClasses.map(cls => {
    const studs = cls.studentIds.map(id => students.find(s => s.id === id)).filter(Boolean);
    const avgs = studs.map(s => getStudentAverage(s!.id)).filter(v => v > 0);
    const avg = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;
    const attRates = studs.map(s => getStudentAttendanceRate(s!.id));
    const att = attRates.length ? Math.round(attRates.reduce((a, b) => a + b, 0) / attRates.length) : 0;
    return { class: cls.name, average: avg, attendance: att, students: studs.length };
  });

  // Per-subject performance (across accessible classes)
  const subjectPerformance = (() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    accessibleClasses.forEach(cls => {
      const subjectEntries = isAdmin()
        ? cls.subjectTeachers
        : cls.subjectTeachers.filter(st => st.teacherId === teacher?.id);
      subjectEntries.forEach(st => {
        const sub = getSubjectById(st.subjectId);
        if (!sub) return;
        const marks = getMarksByClass(cls.id, st.subjectId);
        marks.forEach(m => {
          if (!map[sub.id]) map[sub.id] = { name: sub.name, total: 0, count: 0 };
          map[sub.id].total += (m.marks / m.totalMarks) * 100;
          map[sub.id].count++;
        });
      });
    });
    return Object.values(map).map(v => ({ subject: v.name, average: Math.round(v.total / v.count) }));
  })();

  // Top and at-risk students
  const studentRankings = accessibleStudents
    .map(s => ({ ...s, avg: getStudentAverage(s.id), att: getStudentAttendanceRate(s.id) }))
    .filter(s => s.avg > 0)
    .sort((a, b) => b.avg - a.avg);

  const topStudents = studentRankings.slice(0, 5);
  const atRisk = studentRankings.filter(s => s.avg < 50 || s.att < 75).slice(0, 5);

  // Radar data for class comparison
  const radarData = subjectPerformance.map(sp => ({ subject: sp.subject, score: sp.average }));

  const totalStudents = accessibleStudents.length;
  const overallAvg = studentRankings.length
    ? Math.round(studentRankings.reduce((s, x) => s + x.avg, 0) / studentRankings.length)
    : 0;
  const overallAtt = accessibleStudents.length
    ? Math.round(accessibleStudents.reduce((s, st) => s + getStudentAttendanceRate(st.id), 0) / accessibleStudents.length)
    : 0;
  const passCount = studentRankings.filter(s => s.avg >= 50).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdmin() ? "Institution-wide academic performance" : `Performance for your ${accessibleClasses.length} class(es)`}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
          { label: "Overall Average", value: `${overallAvg}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
          { label: "Pass Rate", value: `${totalStudents ? Math.round((passCount / totalStudents) * 100) : 0}%`, icon: Award, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
          { label: "Avg Attendance", value: `${overallAtt}%`, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Performance Chart */}
        {classPerformance.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Class Performance vs Attendance</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformance} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="average" name="Avg Score %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attendance" name="Attendance %" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Subject Radar */}
        {radarData.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Subject-wise Average</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar name="Avg %" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Students */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" /> Top Performers
          </h2>
          {topStudents.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topStudents.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-accent text-muted-foreground"
                  }`}>{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <div className="w-full bg-accent rounded-full h-1.5 mt-1">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${s.avg}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{s.avg.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* At-Risk Students */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Needs Attention
          </h2>
          {atRisk.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">All students are performing well</p>
          ) : (
            <div className="space-y-3">
              {atRisk.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-sm font-bold text-red-600 flex-shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">Score: {s.avg.toFixed(0)}% · Attendance: {s.att.toFixed(0)}%</p>
                  </div>
                  <div className="text-right">
                    {s.avg < 50 && <span className="block text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Low Score</span>}
                    {s.att < 75 && <span className="block text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 mt-1">Low Attendance</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
