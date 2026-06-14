import { useState } from "react";
import { Link } from "react-router";
import { Plus, Search, ClipboardList, Clock, Users, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";
import { toast } from "../../../lib/toast";

export function AssignmentList() {
  const { user, isAdmin } = useAuth();
  const { assignments, classes, deleteAssignment, updateAssignment, getClassById, getSubjectById, getTeacherById, getSubmissionsByAssignment } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");

  // Compute accessible class IDs for teachers
  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;
  const accessibleClassIds = isAdmin()
    ? new Set(classes.map(c => c.id))
    : new Set(classes.filter(c =>
        c.classTeacherId === teacher?.id ||
        c.subjectTeachers.some(st => st.teacherId === teacher?.id)
      ).map(c => c.id));

  const filtered = assignments
    .filter(a => {
      if (!isAdmin() && !accessibleClassIds.has(a.classId)) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const cls = getClassById(a.classId);
        const sub = getSubjectById(a.subjectId);
        return a.title.toLowerCase().includes(q) || cls?.name.toLowerCase().includes(q) || sub?.name.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => b.createdDate.localeCompare(a.createdDate));

  // Teachers can only manage assignments they created
  const canManageAssignment = (teacherId: string) =>
    isAdmin() || user?.teacherId === teacherId;

  const handleDelete = (id: string, assignTeacherId: string) => {
    if (!canManageAssignment(assignTeacherId)) {
      toast.error("You can only delete your own assignments.");
      return;
    }
    if (!confirm("Delete this assignment?")) return;
    deleteAssignment(id);
    toast.success("Assignment deleted");
  };

  const toggleStatus = (id: string, current: "active" | "closed", assignTeacherId: string) => {
    if (!canManageAssignment(assignTeacherId)) {
      toast.error("You can only change status of your own assignments.");
      return;
    }
    const next = current === "active" ? "closed" : "active";
    updateAssignment(id, { status: next });
    toast.success(`Assignment ${next}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin() ? `All assignments · ${filtered.length} total` : `Your classes' assignments · ${filtered.length} total`}
          </p>
        </div>
        <Link
          to="/assignments/create"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Create Assignment
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, class, subject..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "closed"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-accent"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No assignments found</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first assignment to get started.</p>
          <Link to="/assignments/create" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm">
            <Plus className="w-4 h-4" /> Create Assignment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(asgn => {
            const cls = getClassById(asgn.classId);
            const sub = getSubjectById(asgn.subjectId);
            const teacher = getTeacherById(asgn.teacherId);
            const subs = getSubmissionsByAssignment(asgn.id);
            const graded = subs.filter(s => s.status === "graded").length;
            const isOverdue = new Date(asgn.dueDate) < new Date() && asgn.status === "active";

            return (
              <div key={asgn.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${asgn.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                        {asgn.status}
                      </span>
                      {isOverdue && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">overdue</span>
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{asgn.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Link to={`/assignments/${asgn.id}`}
                      className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button onClick={() => toggleStatus(asgn.id, asgn.status, asgn.teacherId)}
                      className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground" title={asgn.status === "active" ? "Close" : "Reopen"}>
                      {asgn.status === "active" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(asgn.id, asgn.teacherId)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-muted-foreground hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{asgn.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{cls?.name || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>{sub?.name || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due: {asgn.dueDate}</span>
                  </div>
                  <div>
                    <span>{asgn.totalMarks} marks</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                  <span className="text-muted-foreground">By {teacher?.name || "—"}</span>
                  <span className="text-muted-foreground">{graded}/{subs.length} graded</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
