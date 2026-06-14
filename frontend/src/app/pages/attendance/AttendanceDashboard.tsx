import { Link } from "react-router";
import { Calendar, Users, UserCheck, UserX, Clock, Plus, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";

export function AttendanceDashboard() {
  const { user, isAdmin } = useAuth();
  const {
    classes, students,
    getTeacherById, getTeacherClasses,
    getClassAttendanceSummary, getStudentAttendanceRate, getAttendanceByDate,
  } = useData();

  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;
  const accessibleClasses = isAdmin() ? classes : (teacher ? getTeacherClasses(teacher.id) : []);
  const accessibleStudentIds = new Set(accessibleClasses.flatMap(c => c.studentIds));
  const accessibleStudents = students.filter(s => accessibleStudentIds.has(s.id));

  const today = new Date().toISOString().split("T")[0];

  // Today's totals across accessible classes
  const todayRecords = accessibleClasses.flatMap(c => getAttendanceByDate(c.id, today));
  const todayPresent = todayRecords.filter(r => r.status === "present").length;
  const todayAbsent  = todayRecords.filter(r => r.status === "absent").length;
  const todayLate    = todayRecords.filter(r => r.status === "late").length;

  // Per-class summaries for chart + table
  const classSummaries = accessibleClasses.map(cls => {
    const s = getClassAttendanceSummary(cls.id);
    return {
      id: cls.id,
      name: cls.name,
      present: s.present,
      absent: s.absent,
      late: s.late,
      rate: s.rate,
      students: cls.studentIds.length,
    };
  });

  // At-risk students: below 75% attendance
  const atRisk = accessibleStudents
    .map(s => ({ ...s, rate: getStudentAttendanceRate(s.id) }))
    .filter(s => s.rate > 0 && s.rate < 75)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 8);

  const totalAccessible = accessibleStudents.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin()
              ? `Institution-wide attendance · ${accessibleClasses.length} classes`
              : `Your ${accessibleClasses.length} class(es) attendance`}
          </p>
        </div>
        <Link
          to="/attendance/mark"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Mark Attendance
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: totalAccessible, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
          { label: "Present Today", value: todayPresent || "—", icon: UserCheck, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
          { label: "Absent Today", value: todayAbsent || "—", icon: UserX, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
          { label: "Late Today", value: todayLate || "—", icon: Clock, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Class-wise Attendance Chart */}
      {classSummaries.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Class-wise Attendance Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classSummaries} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="present" name="Present" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Class Summary Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold">Class Attendance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Students</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Present</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Absent</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Late</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attendance Rate</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {classSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No attendance records yet
                  </td>
                </tr>
              ) : classSummaries.map(cls => (
                <tr key={cls.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">{cls.students} enrolled</p>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{cls.students}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">{cls.present}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">{cls.absent}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-medium">{cls.late}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-accent rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${cls.rate >= 85 ? "bg-green-500" : cls.rate >= 75 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${cls.rate}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${cls.rate >= 85 ? "text-green-600" : cls.rate >= 75 ? "text-yellow-600" : "text-red-600"}`}>
                        {cls.rate.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      to={`/attendance/mark`}
                      className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      Mark
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* At-Risk Students */}
      {atRisk.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Low Attendance — Needs Attention
            <span className="ml-auto text-xs text-muted-foreground font-normal">Below 75%</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {atRisk.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-sm font-bold text-red-600 flex-shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-20 bg-accent rounded-full h-1.5">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${s.rate}%` }} />
                    </div>
                    <span className="text-xs text-red-600 font-semibold">{s.rate.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium flex-shrink-0">
                  At Risk
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
