
// import { useEffect, useMemo, useState } from "react";
// import { useNavigate, useSearchParams } from "react-router";
// import { ArrowLeft, Sparkles, User, Copy, Download, FileText, Clock, CheckCircle, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
// import { apiRequest, AIReport } from "../../../lib/api";
// import { toast } from "../../../lib/toast";
// import { useData } from "../../../contexts/DataContext";

// export function AIReportGenerator() {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const { students, classes } = useData();
//   const initialStudentId = searchParams.get("student") || "";

//   const [selectedStudent, setSelectedStudent] = useState(initialStudentId);
//   const [selectedClass, setSelectedClass] = useState("all");
//   const [reportType, setReportType] = useState<"student" | "performance" | "attendance" | "risk">("student");
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [report, setReport] = useState<AIReport | null>(null);

//   const classStudents = useMemo(() => {
//     if (selectedClass === "all") return students;
//     return students.filter(student => student.classId === selectedClass);
//   }, [selectedClass, students]);

//   useEffect(() => {
//     if (initialStudentId) {
//       setSelectedStudent(initialStudentId);
//       setReportType("student");
//     }
//   }, [initialStudentId]);

//   const handleGenerate = async () => {
//     if (reportType === "student" && !selectedStudent) {
//       toast.error("Please select a student");
//       return;
//     }

//     setIsGenerating(true);
//     setReport(null);
//     toast.info("Generating AI report...");
//     try {
//       const generated = await apiRequest<AIReport>("/ai/reports", {
//         method: "POST",
//         body: JSON.stringify({
//           reportType,
//           studentId: reportType === "student" ? selectedStudent : undefined,
//           classId: reportType !== "student" && selectedClass !== "all" ? selectedClass : undefined,
//         }),
//       });
//       setReport(generated);
//       toast.success("Report generated successfully!");
//     } catch (error) {
//       toast.error(error instanceof Error ? error.message : "Failed to generate report");
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const copyReport = async () => {
//     if (!report) return;
//     try {
//       await navigator.clipboard.writeText(report.reportText);
//       toast.success("Report copied to clipboard!");
//     } catch {
//       toast.error("Failed to copy report");
//     }
//   };

//   const downloadReport = () => {
//     if (!report) return;
//     const blob = new Blob([report.reportText], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `${report.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.txt`;
//     link.click();
//     URL.revokeObjectURL(url);
//   };

//   const generatedDate = report ? new Date(report.generatedAt).toLocaleString() : "";

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center gap-3">
//         <button onClick={() => navigate("/ai-reports")} className="p-2 hover:bg-accent rounded-lg">
//           <ArrowLeft className="w-5 h-5" />
//         </button>
//         <div>
//           <h1 className="text-3xl font-bold flex items-center gap-2">
//             <Sparkles className="w-8 h-8 text-primary" />
//             AI Report Generator
//           </h1>
//           <p className="text-muted-foreground mt-1">Generate reports from live SQLite data and ML predictions</p>
//         </div>
//       </div>

//       <div className="bg-card border border-border rounded-xl p-6">
//         <h3 className="text-lg font-semibold mb-4">Generate New Report</h3>
//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
//           <div>
//             <label className="block text-sm font-medium mb-2">Report Type</label>
//             <select
//               value={reportType}
//               onChange={(e) => setReportType(e.target.value as typeof reportType)}
//               className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
//             >
//               <option value="student">Student Performance</option>
//               <option value="performance">Class Performance</option>
//               <option value="attendance">Attendance Analysis</option>
//               <option value="risk">At-Risk Students</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">Class Scope</label>
//             <select
//               value={selectedClass}
//               onChange={(e) => {
//                 setSelectedClass(e.target.value);
//                 setSelectedStudent("");
//               }}
//               className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
//             >
//               <option value="all">All Classes</option>
//               {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">Student</label>
//             <select
//               value={selectedStudent}
//               onChange={(e) => setSelectedStudent(e.target.value)}
//               disabled={reportType !== "student"}
//               className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
//             >
//               <option value="">Choose a student...</option>
//               {classStudents.map(student => <option key={student.id} value={student.id}>{student.name} - {student.roll}</option>)}
//             </select>
//           </div>

//           <div className="flex items-end">
//             <button
//               onClick={handleGenerate}
//               disabled={isGenerating}
//               className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow disabled:opacity-60"
//             >
//               {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
//               {isGenerating ? "Generating..." : "Generate Report"}
//             </button>
//           </div>
//         </div>
//       </div>

//       {isGenerating && (
//         <div className="bg-card border border-border rounded-xl p-12">
//           <div className="flex flex-col items-center justify-center space-y-4">
//             <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
//             <h3 className="text-xl font-semibold">AI is analyzing student data...</h3>
//             <p className="text-muted-foreground text-center max-w-md">
//               Processing attendance, marks, assignment scores, and model predictions.
//             </p>
//           </div>
//         </div>
//       )}

//       {report && !isGenerating && (
//         <div className="bg-card border border-border rounded-xl overflow-hidden">
//           <div className="bg-primary text-primary-foreground p-6">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <h2 className="text-2xl font-bold">{report.title}</h2>
//                 <p className="text-primary-foreground/90 mt-1">Generated by EduAI - {generatedDate}</p>
//               </div>
//               <div className="flex gap-2">
//                 <button onClick={copyReport} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
//                   <Copy className="w-4 h-4" /> Copy
//                 </button>
//                 <button onClick={downloadReport} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
//                   <Download className="w-4 h-4" /> TXT
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="p-8 space-y-8">
//             <div className="flex items-center gap-4 p-4 bg-accent rounded-xl">
//               <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
//                 {report.scope.charAt(0)}
//               </div>
//               <div>
//                 <h3 className="text-xl font-bold">{report.scope}</h3>
//                 <p className="text-sm text-muted-foreground">
//                   Prediction: {typeof report.prediction === 'object' && report.prediction !== null ? (report.prediction as any).prediction : report.prediction || "Group report"}
//                 </p>
//               </div>
//             </div>

//             <section className="space-y-3">
//               <h3 className="text-xl font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Performance Summary</h3>
//               <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-6">
//                 <p className="text-base leading-relaxed">{report.summary}</p>
//               </div>
//             </section>

//             <section className="space-y-3">
//               <h3 className="text-xl font-semibold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Key Strengths</h3>
//               {report.strengths.map((item, index) => (
//                 <div key={index} className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
//                   <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
//                   <p className="text-sm">{item}</p>
//                 </div>
//               ))}
//             </section>

//             <section className="space-y-3">
//               <h3 className="text-xl font-semibold flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-600" /> Areas for Improvement</h3>
//               {report.areasForImprovement.map((item, index) => (
//                 <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg">
//                   <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
//                   <p className="text-sm">{item}</p>
//                 </div>
//               ))}
//             </section>

//             <section className="space-y-3">
//               <h3 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Academic Insights</h3>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 {report.academicInsights.map((item, index) => (
//                   <div key={index} className="bg-card border border-border rounded-xl p-4">
//                     <p className="text-sm text-muted-foreground">{item}</p>
//                   </div>
//                 ))}
//               </div>
//             </section>

//             <section className="space-y-3">
//               <h3 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI Recommendations</h3>
//               <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
//                 <ul className="space-y-3">
//                   {report.recommendations.map((item, index) => (
//                     <li key={index} className="flex items-start gap-3">
//                       <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0 mt-0.5">{index + 1}</span>
//                       <p className="text-sm">{item}</p>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </section>

//             <section className="space-y-3">
//               <h3 className="text-xl font-semibold flex items-center gap-2"><User className="w-5 h-5 text-secondary" /> Suggestions for Parents</h3>
//               <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-6">
//                 <ul className="space-y-3">
//                   {report.parentSuggestions.map((item, index) => (
//                     <li key={index} className="flex items-start gap-3">
//                       <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-white text-xs font-bold flex-shrink-0 mt-0.5">{index + 1}</span>
//                       <p className="text-sm">{item}</p>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </section>
//           </div>

//           <div className="bg-muted px-8 py-4 flex items-center justify-between border-t border-border">
//             <p className="text-sm text-muted-foreground">Generated from live school records and the saved Decision Tree model.</p>
//             <div className="flex gap-2">
//               <button onClick={copyReport} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm">
//                 <Copy className="w-4 h-4" /> Copy Report
//               </button>
//               <button onClick={downloadReport} className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors text-sm">
//                 <Download className="w-4 h-4" /> Export TXT
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="bg-card border border-border rounded-xl p-6">
//         <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
//           <Clock className="w-5 h-5" />
//           Report Inputs
//         </h3>
//         <p className="text-sm text-muted-foreground">
//           Reports use attendance percentage, marks average, assignment scores, and the saved ML prediction for each student.
//         </p>
//       </div>
//     </div>
//   );
// }
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Sparkles, User, Copy, Download, FileText, Clock, CheckCircle, TrendingUp, AlertCircle, RefreshCw, FileCode } from "lucide-react";
import { apiRequest, AIReport } from "../../../lib/api";
import { toast } from "../../../lib/toast";
import { useData } from "../../../contexts/DataContext";

export function AIReportGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { students, classes } = useData();
  const initialStudentId = searchParams.get("student") || "";

  const [selectedStudent, setSelectedStudent] = useState(initialStudentId);
  const [selectedClass, setSelectedClass] = useState("all");
  const [reportType, setReportType] = useState<"student" | "performance" | "attendance" | "risk">("student");
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<AIReport | null>(null);

  const classStudents = useMemo(() => {
    if (selectedClass === "all") return students;
    return students.filter(student => student.classId === selectedClass);
  }, [selectedClass, students]);

  // Handle manual or automatic generation requests
  const handleGenerate = async (targetStudentId?: string) => {
    const studentToFetch = targetStudentId || selectedStudent;
    
    if (reportType === "student" && !studentToFetch) {
      toast.error("Please select a student");
      return;
    }

    setIsGenerating(true);
    setReport(null);
    try {
      const generated = await apiRequest<AIReport>("/ai/reports", {
        method: "POST",
        body: JSON.stringify({
          reportType,
          studentId: reportType === "student" ? studentToFetch : undefined,
          classId: reportType !== "student" && selectedClass !== "all" ? selectedClass : undefined,
        }),
      });
      setReport(generated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load report");
    } finally {
      setIsGenerating(false);
    }
  };

  // AUTOMATIC TRIGGER: If arriving via the "View" button, pull data instantly
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudent(initialStudentId);
      setReportType("student");
      handleGenerate(initialStudentId);
    }
  }, [initialStudentId]);

  const copyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.reportText);
      toast.success("Report copied to clipboard!");
    } catch {
      toast.error("Failed to copy report");
    }
  };

  const downloadReportTxt = () => {
    if (!report) return;
    const blob = new Blob([report.reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generatedDate = report ? new Date(report.generatedAt).toLocaleString() : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/ai-reports")} className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            AI Report Generator
          </h1>
          <p className="text-muted-foreground mt-1">Live SQLite data and ML structural predictions</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Generate New Report</h3>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as typeof reportType)}
              className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg"
            >
              <option value="student">Student Performance</option>
              <option value="performance">Class Performance</option>
              <option value="attendance">Attendance Analysis</option>
              <option value="risk">At-Risk Students</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Class Scope</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStudent("");
              }}
              className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={reportType !== "student"}
              className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg disabled:opacity-60"
            >
              <option value="">Choose a student...</option>
              {classStudents.map(student => <option key={student.id} value={student.id}>{student.name} - {student.roll}</option>)}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow disabled:opacity-60"
            >
              {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {isGenerating ? "Loading..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      {isGenerating && (
        <div className="bg-card border border-border rounded-xl p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-xl font-semibold">AI is compiling performance records...</h3>
          </div>
        </div>
      )}

      {report && !isGenerating && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="bg-primary text-primary-foreground p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{report.title}</h2>
                <p className="text-primary-foreground/90 mt-1">EduAI Document View - {generatedDate}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={copyReport} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm">
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button onClick={downloadReportTxt} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm">
                  <Download className="w-4 h-4" /> TXT
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="flex items-center gap-4 p-4 bg-accent rounded-xl">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold flex-shrink-0">
                {report.scope.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold">{report.scope}</h3>
                <p className="text-sm text-muted-foreground">
                  Prediction: {typeof report.prediction === 'object' && report.prediction !== null ? (report.prediction as any).prediction : report.prediction || "Group report"}
                </p>
              </div>
            </div>

            <section className="space-y-3">
              <h3 className="text-xl font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Performance Summary</h3>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-6">
                <p className="text-base leading-relaxed">{report.summary}</p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-semibold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Key Strengths</h3>
              {report.strengths.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-semibold flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-600" /> Areas for Improvement</h3>
              {report.areasForImprovement.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Academic Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.academicInsights.map((item, index) => (
                  <div key={index} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI Recommendations</h3>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                <ul className="space-y-3">
                  {report.recommendations.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0 mt-0.5">{index + 1}</span>
                      <p className="text-sm">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-semibold flex items-center gap-2"><User className="w-5 h-5 text-secondary" /> Suggestions for Parents</h3>
              <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-6">
                <ul className="space-y-3">
                  {report.parentSuggestions.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-white text-xs font-bold flex-shrink-0 mt-0.5">{index + 1}</span>
                      <p className="text-sm">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}