import { useNavigate, useSearchParams, Link } from "react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Brain, TrendingUp, AlertTriangle, CheckCircle, Target, Lightbulb, BookOpen, Users } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";
import { apiRequest, StudentPrediction } from "../../../lib/api";

export function PredictionResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student");
  const { isAdmin } = useAuth();
  const { user } = useAuth();
  const {
    students, classes, getStudentById, getClassById,
    getTeacherById, getTeacherClasses,
    getStudentAverage, getStudentAttendanceRate, getMarksByStudent,
  } = useData();

  const student = studentId ? getStudentById(studentId) : undefined;
  const [predictionData, setPredictionData] = useState<StudentPrediction | null>(null);

  useEffect(() => {
    if (!studentId) return;
    apiRequest<StudentPrediction>(`/ai/predictions/${studentId}`)
      .then(setPredictionData)
      .catch(() => setPredictionData(null));
  }, [studentId]);

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No student selected. </p>
        <Link to="/ai-prediction" className="text-primary hover:underline text-sm mt-2 inline-block">Back to Predictions</Link>
      </div>
    );
  }

  const cls = getClassById(student.classId);
  const avgScore = Math.round(predictionData?.averageMarks ?? getStudentAverage(student.id));
  const attRate = Math.round(predictionData?.attendancePercentage ?? getStudentAttendanceRate(student.id));
  const marks = getMarksByStudent(student.id);

  const score = avgScore * 0.6 + attRate * 0.4;
  const prediction = predictionData?.prediction ?? (score >= 72 ? "High Performer" : score >= 55 ? "Average Performer" : "At Risk");
  const confidence = Math.round(predictionData?.confidence ?? Math.min(95, Math.round(50 + Math.abs(score - 63.5) * 1.2)));
  const riskLevel = predictionData?.riskLevel ?? (prediction === "High Performer" ? "Low" : prediction === "At Risk" ? "High" : "Medium");

  const radarData = [
    { metric: "Avg Marks", value: avgScore },
    { metric: "Attendance", value: attRate },
    { metric: "Assignment Rate", value: marks.length > 0 ? Math.min(100, marks.length * 12) : 0 },
  ];

  const predColor = prediction === "High Performer" ? "text-green-600" : prediction === "At Risk" ? "text-red-600" : "text-yellow-600";
  const predBg = prediction === "High Performer" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : prediction === "At Risk" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";

  const recommendations = [
    avgScore >= 75
      ? { type: "strength", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20", title: "Strong Academic Performance", description: `Average score of ${avgScore}% reflects solid understanding of course material. Encourage advanced exercises.` }
      : { type: "improvement", icon: Target, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", title: "Academic Improvement Needed", description: `Average score of ${avgScore}% is below target. Recommend additional tutoring and focused revision sessions.` },
    attRate >= 85
      ? { type: "strength", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20", title: "Excellent Attendance", description: `${attRate}% attendance rate. This positive habit directly contributes to academic success.` }
      : { type: "risk", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/20", title: "Attendance Concern", description: `${attRate}% attendance is below the 85% target. Missing classes is correlated with lower academic performance. Recommend parent contact.` },
    { type: "action", icon: Lightbulb, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", title: "Recommended Actions", description: predictionData?.recommendations?.join(" ") || (prediction === "At Risk" ? "Schedule parent-teacher meeting, provide additional study resources, assign peer mentor." : prediction === "Average Performer" ? "Provide targeted practice in weaker subjects, monitor progress weekly." : "Maintain current trajectory. Consider leadership roles, enrichment programs.") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/ai-prediction")} className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="w-5 h-5 text-primary" /> Prediction Result</h1>
          <p className="text-muted-foreground text-sm">{student.name} · {cls?.name}</p>
        </div>
      </div>

      {/* Student Overview */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
            {student.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{student.name}</h2>
                <p className="text-sm text-muted-foreground">{student.roll} · {cls?.name}</p>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full font-semibold ${predBg}`}>{prediction}</span>
            </div>
            <div className="flex items-center gap-6 mt-3">
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-24 bg-accent rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${confidence}%` }} />
                  </div>
                  <span className="text-sm font-semibold">{confidence}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <p className={`text-sm font-semibold mt-1 ${riskLevel === "High" ? "text-red-600" : riskLevel === "Medium" ? "text-yellow-600" : "text-green-600"}`}>{riskLevel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metrics */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Performance Metrics</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                <Tooltip formatter={(v: number) => `${v}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-accent/50 rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold ${avgScore >= 75 ? "text-green-600" : avgScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>{avgScore}%</p>
              <p className="text-xs text-muted-foreground">Average Score</p>
            </div>
            <div className="bg-accent/50 rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold ${attRate >= 85 ? "text-green-600" : attRate >= 75 ? "text-yellow-600" : "text-red-600"}`}>{attRate}%</p>
              <p className="text-xs text-muted-foreground">Attendance Rate</p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-500" /> AI Recommendations</h2>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <div key={i} className={`flex gap-3 p-3 rounded-xl ${r.bg}`}>
                <r.icon className={`w-4 h-4 ${r.color} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => navigate("/ai-prediction")} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
          <Users className="w-4 h-4" /> All Predictions
        </button>
        <Link to={`/students/${student.id}`} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
          <BookOpen className="w-4 h-4" /> Student Profile
        </Link>
      </div>
    </div>
  );
}
