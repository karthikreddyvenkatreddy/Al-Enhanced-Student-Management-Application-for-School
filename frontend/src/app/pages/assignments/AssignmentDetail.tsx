import { useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Users, Clock, Award, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { useData } from "../../../contexts/DataContext";
import { toast } from "../../../lib/toast";

export function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    assignments, getClassById, getSubjectById, getTeacherById,
    getStudentsByClass, getSubmissionsByAssignment, gradeSubmission, addSubmission,
  } = useData();

  const assignment = assignments.find(a => a.id === id);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [marks, setMarks] = useState<number>(0);
  const [feedback, setFeedback] = useState("");

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Assignment not found.</p>
        <Link to="/assignments" className="text-primary hover:underline text-sm mt-2 inline-block">Back to Assignments</Link>
      </div>
    );
  }

  const cls = getClassById(assignment.classId);
  const sub = getSubjectById(assignment.subjectId);
  const teacher = getTeacherById(assignment.teacherId);
  const allStudents = cls ? getStudentsByClass(cls.id) : [];
  const submissions = getSubmissionsByAssignment(assignment.id);

  const getStudentSubmission = (studentId: string) =>
    submissions.find(s => s.studentId === studentId);

  const handleGrade = (subId: string) => {
    if (marks < 0 || marks > assignment.totalMarks) {
      toast.error(`Marks must be between 0 and ${assignment.totalMarks}`);
      return;
    }
    gradeSubmission(subId, marks, feedback);
    toast.success("Submission graded!");
    setGradingId(null);
    setMarks(0);
    setFeedback("");
  };

  const submittedCount = submissions.length;
  const gradedCount = submissions.filter(s => s.status === "graded").length;
  const isOverdue = new Date(assignment.dueDate) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/assignments" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{assignment.title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${assignment.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600"}`}>
              {assignment.status}
            </span>
            {isOverdue && assignment.status === "active" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">overdue</span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{cls?.name} · {sub?.name} · By {teacher?.name}</p>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{assignment.description}</p>
            {assignment.instructions && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="font-medium text-sm mb-1">Instructions</h4>
                <p className="text-sm text-muted-foreground">{assignment.instructions}</p>
              </div>
            )}
          </div>

          {/* Submission Tracker */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Student Submissions ({submittedCount}/{allStudents.length})</h3>
              <span className="text-sm text-muted-foreground">{gradedCount} graded</span>
            </div>

            <div className="space-y-3">
              {allStudents.map(student => {
                const submission = getStudentSubmission(student.id);
                const isGrading = gradingId === (submission?.id || "");

                return (
                  <div key={student.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.roll}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!submission ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Missing</span>
                        ) : submission.status === "graded" ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Graded: {submission.marks}/{assignment.totalMarks}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Submitted</span>
                        )}
                      </div>
                    </div>

                    {submission && (
                      <div className="mt-3 pl-11">
                        <p className="text-xs text-muted-foreground italic">"{submission.content}"</p>
                        <p className="text-xs text-muted-foreground mt-1">Submitted: {submission.submittedDate}</p>
                        {submission.feedback && (
                          <p className="text-xs text-green-700 dark:text-green-400 mt-1 flex items-start gap-1">
                            <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {submission.feedback}
                          </p>
                        )}

                        {submission.status !== "graded" && (
                          <>
                            {isGrading ? (
                              <div className="mt-3 flex items-center gap-2">
                                <input type="number" min={0} max={assignment.totalMarks}
                                  value={marks} onChange={e => setMarks(Number(e.target.value))}
                                  className="w-20 px-2 py-1 border border-input rounded text-xs bg-background"
                                  placeholder="Marks" />
                                <input value={feedback} onChange={e => setFeedback(e.target.value)}
                                  className="flex-1 px-2 py-1 border border-input rounded text-xs bg-background"
                                  placeholder="Feedback (optional)" />
                                <button onClick={() => handleGrade(submission.id)}
                                  className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs">Grade</button>
                                <button onClick={() => setGradingId(null)}
                                  className="px-3 py-1 border border-border rounded text-xs hover:bg-accent">Cancel</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setGradingId(submission.id); setMarks(0); setFeedback(""); }}
                                className="mt-2 text-xs text-primary hover:underline">
                                Grade Submission
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">Assignment Stats</h3>
            {[
              { label: "Total Students", value: allStudents.length, Icon: Users, color: "text-blue-600" },
              { label: "Submitted", value: submittedCount, Icon: CheckCircle, color: "text-green-600" },
              { label: "Not Submitted", value: allStudents.length - submittedCount, Icon: XCircle, color: "text-red-600" },
              { label: "Graded", value: gradedCount, Icon: Award, color: "text-purple-600" },
            ].map(stat => (
              <div key={stat.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <stat.Icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-muted-foreground">{stat.label}</span>
                </div>
                <span className="font-semibold text-sm">{stat.value}</span>
              </div>
            ))}

            <div className="pt-2 border-t border-border">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Submission rate</span>
                <span className="font-medium">{allStudents.length > 0 ? Math.round((submittedCount / allStudents.length) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${allStudents.length > 0 ? (submittedCount / allStudents.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Class</span>
                <span>{cls?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subject</span>
                <span>{sub?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teacher</span>
                <span>{teacher?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{assignment.createdDate}</span>
              </div>
              <div className={`flex justify-between ${isOverdue ? "text-red-600" : ""}`}>
                <span className="text-muted-foreground">Due Date</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />{assignment.dueDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Marks</span>
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{assignment.totalMarks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
