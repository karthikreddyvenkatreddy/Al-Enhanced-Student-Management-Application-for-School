import { Users, GraduationCap, TrendingUp, UserCheck, AlertTriangle, ClipboardList, Calendar, UserPlus, Building2, School, BookOpen, Award, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const {
    students, teachers, classes, departments, assignments, submissions,
    getTeacherById, getTeacherClasses,
    getStudentAverage, getStudentAttendanceRate, getClassAttendanceSummary,
  } = useData();

  // ── Admin Dashboard ────────────────────────────────────────────────
  if (isAdmin()) {
    const activeStudents = students.filter(s => s.status === "active").length;
    const activeTeachers = teachers.filter(t => t.status === "active").length;
    const activeAssignments = assignments.filter(a => a.status === "active").length;
    const pendingSubs = submissions.filter(s => s.status === "submitted").length;

    const classSummaries = classes.map(c => {
      const att = getClassAttendanceSummary(c.id);
      const studs = c.studentIds.map(id => students.find(s => s.id === id)).filter(Boolean);
      const avgs = studs.map(s => getStudentAverage(s!.id)).filter(v => v > 0);
      const avg = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;
      return { class: c.name.replace("Grade ", "Gr."), students: c.studentIds.length, attRate: att.rate, avgScore: avg };
    });

    const studentRankings = students
      .map(s => ({ ...s, avg: getStudentAverage(s.id), att: getStudentAttendanceRate(s.id) }))
      .filter(s => s.avg > 0).sort((a, b) => b.avg - a.avg);
    const atRisk = studentRankings.filter(s => s.avg < 50 || s.att < 75).slice(0, 5);

    const perfDist = [
      { name: "Excellent (≥80%)", value: studentRankings.filter(s => s.avg >= 80).length, color: "#22c55e" },
      { name: "Good (60-79%)", value: studentRankings.filter(s => s.avg >= 60 && s.avg < 80).length, color: "#3b82f6" },
      { name: "Average (50-59%)", value: studentRankings.filter(s => s.avg >= 50 && s.avg < 60).length, color: "#f59e0b" },
      { name: "At Risk (<50%)", value: studentRankings.filter(s => s.avg < 50).length, color: "#ef4444" },
    ].filter(d => d.value > 0);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back, {user?.name} · Full institution overview</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Students", value: activeStudents, sub: `${students.length} total`, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
            { label: "Teaching Staff", value: activeTeachers, sub: `${departments.length} departments`, icon: GraduationCap, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950" },
            { label: "Classes", value: classes.length, sub: "Academic year 2025-26", icon: School, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
            { label: "Pending Reviews", value: pendingSubs, sub: `${activeAssignments} active assignments`, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
          ].map(k => (
            <div key={k.label} className="bg-card border border-border rounded-xl p-5">
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                <k.icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="text-sm font-medium mt-0.5">{k.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class overview chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Class Overview</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classSummaries} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="attRate" name="Attendance %" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgScore" name="Avg Score %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance distribution */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Performance Distribution</h2>
            {perfDist.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-10">No data</p>
            ) : (
              <>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={perfDist} dataKey="value" cx="50%" cy="50%" innerRadius={36} outerRadius={60}>
                        {perfDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {perfDist.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* At-risk */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> At-Risk Students</h2>
              <Link to="/performance" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
            </div>
            {atRisk.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">All students performing well</p>
            ) : atRisk.map(s => (
              <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-sm font-bold text-red-600">{s.name.charAt(0)}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Score {s.avg.toFixed(0)}% · Att {s.att.toFixed(0)}%</p>
                </div>
                {s.avg < 50 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Low Score</span>}
                {s.att < 75 && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 ml-1">Low Att</span>}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Add Student", icon: UserPlus, path: "/students/add", color: "bg-blue-600" },
                { label: "Mark Attendance", icon: Calendar, path: "/attendance/mark", color: "bg-green-600" },
                { label: "Enter Marks", icon: BookOpen, path: "/marks/entry", color: "bg-purple-600" },
                { label: "AI Reports", icon: TrendingUp, path: "/ai-reports", color: "bg-orange-600" },
                { label: "Departments", icon: Building2, path: "/departments", color: "bg-indigo-600" },
                { label: "User Mgmt", icon: Users, path: "/users", color: "bg-rose-600" },
              ].map(a => (
                <Link key={a.path} to={a.path} className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-accent transition-colors group">
                  <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center flex-shrink-0`}>
                    <a.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Teacher Dashboard ──────────────────────────────────────────────
  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;
  const myClasses = teacher ? getTeacherClasses(teacher.id) : [];
  const myStudentIds = new Set(myClasses.flatMap(c => c.studentIds));
  const myStudents = students.filter(s => myStudentIds.has(s.id));
  const myAssignments = assignments.filter(a => a.teacherId === teacher?.id);
  const pendingGrading = submissions.filter(s =>
    myAssignments.some(a => a.id === s.assignmentId) && s.status === "submitted"
  ).length;

  const myClassSummaries = myClasses.map(c => {
    const att = getClassAttendanceSummary(c.id);
    const studs = c.studentIds.map(id => students.find(s => s.id === id)).filter(Boolean);
    const avgs = studs.map(s => getStudentAverage(s!.id)).filter(v => v > 0);
    const avg = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;
    return { class: c.name.replace("Grade ", "Gr."), attRate: att.rate, avgScore: avg, students: c.studentIds.length };
  });

  const myTopStudents = myStudents
    .map(s => ({ ...s, avg: getStudentAverage(s.id) }))
    .filter(s => s.avg > 0).sort((a, b) => b.avg - a.avg).slice(0, 5);

  const needsAttention = myStudents
    .map(s => ({ ...s, avg: getStudentAverage(s.id), att: getStudentAttendanceRate(s.id) }))
    .filter(s => s.avg < 50 || s.att < 75).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome, {user?.name} · {teacher?.designation} — {myClasses.length} class(es) assigned
        </p>
      </div>

      {/* Teacher KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "My Students", value: myStudents.length, sub: `${myClasses.length} classes`, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
          { label: "My Assignments", value: myAssignments.length, sub: `${myAssignments.filter(a => a.status === "active").length} active`, icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
          { label: "Pending Grading", value: pendingGrading, sub: "Submissions awaiting review", icon: BookOpen, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
          { label: "Needs Attention", value: needsAttention.length, sub: "Low score or attendance", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-sm font-medium mt-0.5">{k.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* My Classes Chart */}
      {myClassSummaries.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">My Classes — Attendance & Performance</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={myClassSummaries} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="attRate" name="Attendance %" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgScore" name="Avg Score %" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top students */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> Top Performers</h2>
          {myTopStudents.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No marks data yet</p>
          ) : myTopStudents.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : "bg-accent text-muted-foreground"}`}>{i + 1}</span>
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

        {/* Quick actions + attention */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Mark Attendance", icon: Calendar, path: "/attendance/mark", color: "bg-green-600" },
                { label: "Enter Marks", icon: BookOpen, path: "/marks/entry", color: "bg-purple-600" },
                { label: "Create Assignment", icon: ClipboardList, path: "/assignments/create", color: "bg-blue-600" },
                { label: "AI Prediction", icon: TrendingUp, path: "/ai-prediction", color: "bg-orange-600" },
              ].map(a => (
                <Link key={a.path} to={a.path} className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-accent transition-colors group">
                  <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center flex-shrink-0`}>
                    <a.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {needsAttention.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-3 text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Needs Attention</h2>
              {needsAttention.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.avg.toFixed(0)}% · {s.att.toFixed(0)}% att</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
