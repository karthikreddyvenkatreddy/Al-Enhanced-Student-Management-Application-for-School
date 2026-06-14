
// import { Link } from "react-router";
// import { useEffect, useState } from "react";
// import { FileText, Download, Eye, Sparkles } from "lucide-react";
// import { useData } from "../../contexts/DataContext";
// import { apiRequest, AIReport, PredictionSummary, StudentPrediction } from "../../lib/api";

// export function AIReports() {

//   const { students } = useData();
//   const [predictions, setPredictions] = useState<StudentPrediction[]>([]);
//   const [downloadingId, setDownloadingId] = useState("");

//   useEffect(() => {
//     apiRequest<PredictionSummary>("/ai/predictions")
//       .then(summary => setPredictions(summary.predictions))
//       .catch(() => setPredictions([]));
//   }, []);

//   const reports = (predictions.length ? predictions : students.map(student => ({
//     studentId: student.id,
//     studentName: student.name,
//     roll: student.roll,
//     classId: student.classId,
//     prediction: "Average Performer" as const,
//     confidence: 0,
//     attendancePercentage: 0,
//     averageMarks: 0,
//     assignmentScore: 0,
//     marksCount: 0,
//     riskLevel: "Medium" as const,
//     factors: [],
//     recommendations: [],
//   }))).map(student => ({
//     id: student.studentId,
//     name: student.studentName,
//     prediction: student.prediction,
//     generatedDate: new Date().toLocaleDateString(),
//   }));

//   const downloadReport = async (studentId: string) => {
//     setDownloadingId(studentId);
//     try {
//       const report = await apiRequest<AIReport>("/ai/reports", {
//         method: "POST",
//         body: JSON.stringify({ studentId, reportType: "student" }),
//       });
//       const blob = new Blob([report.reportText], { type: "text/plain" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = `${report.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.txt`;
//       link.click();
//       URL.revokeObjectURL(url);
//     } finally {
//       setDownloadingId("");
//     }
//   };

//   return (
//     <div className="space-y-6">

//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold flex items-center gap-2">
//             <FileText className="w-8 h-8 text-primary" />
//             AI Reports
//           </h1>

//           <p className="text-muted-foreground">
//             Student-wise AI generated reports
//           </p>
//         </div>

//         <Link
//           to="/ai-reports/generate"
//           className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg"
//         >
//           <Sparkles className="w-4 h-4" />
//           Generate Report
//         </Link>
//       </div>

//       <div className="bg-card border border-border rounded-xl overflow-hidden">

//         <table className="w-full">

//           <thead className="bg-muted">
//             <tr>
//               <th className="text-left px-6 py-4">Student</th>
//               <th className="text-left px-6 py-4">Prediction</th>
//               <th className="text-left px-6 py-4">Generated Date</th>
//               <th className="text-left px-6 py-4">Status</th>
//               <th className="text-left px-6 py-4">Action</th>
//             </tr>
//           </thead>

//           <tbody>

//             {reports.map(report => (

//               <tr
//                 key={report.id}
//                 className="border-t border-border"
//               >

//                 <td className="px-6 py-4">
//                   {report.name}
//                 </td>

//                 <td className="px-6 py-4">

//                   <span
//                     className={`px-2 py-1 rounded text-xs font-medium
//                     ${
//                       report.prediction === "High Performer"
//                         ? "bg-green-100 text-green-700"
//                         : report.prediction === "Average Performer"
//                         ? "bg-yellow-100 text-yellow-700"
//                         : "bg-red-100 text-red-700"
//                     }`}
//                   >
//                     {report.prediction}
//                   </span>

//                 </td>

//                 <td className="px-6 py-4">
//                   {report.generatedDate}
//                 </td>

//                 <td className="px-6 py-4">
//                   Ready
//                 </td>

//                 <td className="px-6 py-4">

//                   <div className="flex gap-2">

//                     <Link
//                       to={`/ai-reports/generate?student=${report.id}`}
//                       className="flex items-center gap-1 px-3 py-1 border rounded-lg"
//                     >
//                       <Eye className="w-4 h-4" />
//                       View
//                     </Link>

//                     <button
//                       onClick={() => downloadReport(report.id)}
//                       disabled={downloadingId === report.id}
//                       className="flex items-center gap-1 px-3 py-1 border rounded-lg disabled:opacity-60"
//                     >
//                       <Download className="w-4 h-4" />
//                       {downloadingId === report.id ? "Preparing" : "Download"}
//                     </button>

//                   </div>

//                 </td>

//               </tr>

//             ))}

//           </tbody>

//         </table>

//       </div>

//     </div>
//   );
// }
import { Link } from "react-router";
import { useEffect, useState } from "react";
import { FileText, Download, Eye, Sparkles } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { apiRequest, AIReport, PredictionSummary, StudentPrediction } from "../../lib/api";

export function AIReports() {
  const { students } = useData();
  const [predictions, setPredictions] = useState<StudentPrediction[]>([]);
  const [downloadingId, setDownloadingId] = useState("");

  useEffect(() => {
    apiRequest<PredictionSummary>("/ai/predictions")
      .then(summary => setPredictions(summary.predictions))
      .catch(() => setPredictions([]));
  }, []);

  const reports = (predictions.length ? predictions : students.map(student => ({
    studentId: student.id,
    studentName: student.name,
    roll: student.roll,
    classId: student.classId,
    prediction: "Average Performer" as const,
    confidence: 0,
    attendancePercentage: 0,
    averageMarks: 0,
    assignmentScore: 0,
    marksCount: 0,
    riskLevel: "Medium" as const,
    factors: [],
    recommendations: [],
  }))).map(student => ({
    id: student.studentId,
    name: student.studentName,
    prediction: student.prediction,
    generatedDate: new Date().toLocaleDateString(),
  }));

  const downloadReport = async (studentId: string) => {
    setDownloadingId(studentId);
    try {
      const report = await apiRequest<AIReport>("/ai/reports", {
        method: "POST",
        body: JSON.stringify({ studentId, reportType: "student" }),
      });
      const blob = new Blob([report.reportText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch(error) {
      console.error(error);
    } finally {
      setDownloadingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            AI Reports
          </h1>
          <p className="text-muted-foreground">
            Student-wise AI generated reports
          </p>
        </div>

        <Link
          to="/ai-reports/generate"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Generate Report
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-6 py-4">Student</th>
              <th className="text-left px-6 py-4">Prediction</th>
              <th className="text-left px-6 py-4">Generated Date</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="text-left px-6 py-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {reports.map(report => (
              <tr key={report.id} className="border-t border-border">
                <td className="px-6 py-4">{report.name}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      report.prediction === "High Performer"
                        ? "bg-green-100 text-green-700"
                        : report.prediction === "Average Performer"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {report.prediction}
                  </span>
                </td>
                <td className="px-6 py-4">{report.generatedDate}</td>
                <td className="px-6 py-4">Ready</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link
                      to={`/ai-reports/generate?student=${report.id}`}
                      className="flex items-center gap-1 px-3 py-1 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>

                    <button
                      onClick={() => downloadReport(report.id)}
                      disabled={downloadingId === report.id}
                      className="flex items-center gap-1 px-3 py-1 border rounded-lg disabled:opacity-60"
                    >
                      <Download className="w-4 h-4" />
                      {downloadingId === report.id ? "Preparing" : "Download"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}