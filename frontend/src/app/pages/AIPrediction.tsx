import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Brain, TrendingUp, AlertCircle, Target, Sparkles, Users, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { apiRequest, PredictionSummary, StudentPrediction } from "../../lib/api";

export function AIPrediction() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { students, classes, getTeacherById, getTeacherClasses, getStudentAverage, getStudentAttendanceRate } = useData();

  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;
  const accessibleClasses = isAdmin() ? classes : (teacher ? getTeacherClasses(teacher.id) : []);
  const accessibleStudentIds = new Set(accessibleClasses.flatMap(c => c.studentIds));
  const accessibleStudents = students.filter(s => accessibleStudentIds.has(s.id));

  const [selectedStudentId, setSelectedStudentId] = useState(accessibleStudents[0]?.id || "");
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [loadError, setLoadError] = useState("");

  const localPredictions: StudentPrediction[] = accessibleStudents.map(s => {
    const avg = getStudentAverage(s.id);
    const att = getStudentAttendanceRate(s.id);
    const score = avg * 0.6 + att * 0.4;
    const prediction = score >= 72 ? "High Performer" : score >= 55 ? "Average Performer" : "At Risk";
    const confidence = Math.min(95, Math.round(50 + Math.abs(score - 63.5) * 1.2));
    return {
      studentId: s.id,
      studentName: s.name,
      roll: s.roll,
      classId: s.classId,
      className: classes.find(c => c.id === s.classId)?.name,
      attendancePercentage: Math.round(att),
      averageMarks: Math.round(avg),
      assignmentScore: 0,
      marksCount: 0,
      prediction,
      confidence,
      riskLevel: prediction === "At Risk" ? "High" : prediction === "Average Performer" ? "Medium" : "Low",
      factors: [],
      recommendations: [],
    };
  });

  useEffect(() => {
    apiRequest<PredictionSummary>("/ai/predictions")
      .then(data => {
        setSummary(data);
        setLoadError("");
        if (!selectedStudentId && data.predictions.length) setSelectedStudentId(data.predictions[0].studentId);
      })
      .catch(error => {
        setLoadError(error instanceof Error ? error.message : "Unable to load ML predictions");
      });
  }, []);

  const predictions = useMemo(
    () => summary?.predictions.length ? summary.predictions : localPredictions,
    [summary, localPredictions]
  );

  const dist = [
    { category: "High Performer", count: summary?.highPerformers ?? predictions.filter(p => p.prediction === "High Performer").length, color: "#22c55e" },
    { category: "Average", count: summary?.averagePerformers ?? predictions.filter(p => p.prediction === "Average Performer").length, color: "#f59e0b" },
    { category: "At Risk", count: summary?.atRisk ?? predictions.filter(p => p.prediction === "At Risk").length, color: "#ef4444" },
  ];

  const classRiskData = accessibleClasses.map(cls => {
    const studs = predictions.filter(p => cls.studentIds.includes(p.studentId));
    return {
      class: cls.name.replace("Grade ", "Gr."),
      highRisk: studs.filter(s => s.prediction === "At Risk").length,
      average: studs.filter(s => s.prediction === "Average Performer").length,
      highPerf: studs.filter(s => s.prediction === "High Performer").length,
    };
  });

  const featureImportance = [
    { feature: "Avg Marks", importance: Math.round(summary?.featureImportances?.average_marks ?? 60) },
    { feature: "Attendance", importance: Math.round(summary?.featureImportances?.attendance_percentage ?? 40) },
    { feature: "Assignments", importance: Math.round(summary?.featureImportances?.assignment_score ?? 0) },
  ];

  const handleRunPrediction = () => {
    if (!selectedStudentId) return;
    setRunning(true);
    setTimeout(() => {
      navigate(`/ai-prediction/result?student=${selectedStudentId}`);
    }, 1200);
  };

  const predBadge = (p: string) => {
    if (p === "High Performer") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (p === "At Risk") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" /> AI Performance Prediction
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {summary ? `${summary.modelName} - ${summary.modelAccuracy}% accuracy` : isAdmin() ? "Institution-wide ML predictions" : `Predictions for your ${accessibleStudents.length} student(s)`}
          </p>
          {loadError && <p className="text-xs text-orange-600 mt-1">Using local fallback: {loadError}</p>}
        </div>
      </div>

      {/* Distribution KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {dist.map(d => (
          <div key={d.category} className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-3xl font-bold" style={{ color: d.color }}>{d.count}</p>
            <p className="text-sm font-medium mt-1">{d.category}</p>
            <p className="text-xs text-muted-foreground">{accessibleStudents.length > 0 ? Math.round((d.count / accessibleStudents.length) * 100) : 0}% of students</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Risk Breakdown */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-orange-500" /> Class Risk Breakdown</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classRiskData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="highPerf" name="High Performer" stackId="a" fill="#22c55e" />
                <Bar dataKey="average" name="Average" stackId="a" fill="#f59e0b" />
                <Bar dataKey="highRisk" name="At Risk" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Importance + Run Prediction */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" /> Prediction Model Factors</h2>
            <div className="space-y-3">
              {featureImportance.map(f => (
                <div key={f.feature}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{f.feature}</span>
                    <span className="text-muted-foreground">{f.importance}% weight</span>
                  </div>
                  <div className="w-full bg-accent rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${f.importance}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500" /> Run Student Prediction</h2>
            <div className="space-y-3">
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                {predictions.map(s => <option key={s.studentId} value={s.studentId}>{s.studentName}</option>)}
              </select>
              <button
                onClick={handleRunPrediction}
                disabled={running || !selectedStudentId}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {running ? (
                  <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" /> Analyzing...</>
                ) : (
                  <><Brain className="w-4 h-4" /> Run Prediction</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* All Students Predictions Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Student Predictions</h2>
          <span className="text-xs text-muted-foreground">{predictions.length} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avg Score</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attendance</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prediction</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Confidence</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...predictions].sort((a, b) => a.prediction === "At Risk" ? -1 : b.prediction === "At Risk" ? 1 : 0).map(p => (
                <tr key={p.studentId} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">{p.studentName.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium">{p.studentName}</p>
                        <p className="text-xs text-muted-foreground">{p.roll}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-medium ${p.averageMarks >= 75 ? "text-green-600" : p.averageMarks >= 50 ? "text-yellow-600" : "text-red-600"}`}>{Math.round(p.averageMarks)}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-medium ${p.attendancePercentage >= 85 ? "text-green-600" : p.attendancePercentage >= 75 ? "text-yellow-600" : "text-red-600"}`}>{Math.round(p.attendancePercentage)}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${predBadge(p.prediction)}`}>{p.prediction}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 bg-accent rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${p.confidence}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{p.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/ai-prediction/result?student=${p.studentId}`)}
                      className="text-xs text-primary hover:underline flex items-center gap-0.5 ml-auto"
                    >
                      View <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
