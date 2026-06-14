import { useState } from "react";
import { Link } from "react-router";
import { Search, Plus, Edit, Eye, Trash2, UserX } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";
import { toast } from "../../../lib/toast";

export function StudentList() {
  const { user, isAdmin } = useAuth();
  const { students, classes, deleteStudent, getClassById, getTeacherById } = useData();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const teacher = user?.teacherId ? getTeacherById(user.teacherId) : undefined;

  // Classes where this teacher is the homeroom teacher
  const homeroomClassIds = new Set(
    classes.filter(c => c.classTeacherId === teacher?.id).map(c => c.id)
  );
  const isClassTeacher = homeroomClassIds.size > 0;

  // Accessible classes: admin sees all, teachers see all their assigned classes (for viewing)
  const allAccessibleClassIds = isAdmin()
    ? new Set(classes.map(c => c.id))
    : new Set(classes.filter(c =>
        c.classTeacherId === teacher?.id ||
        c.subjectTeachers.some(st => st.teacherId === teacher?.id)
      ).map(c => c.id));

  const visibleClasses = classes.filter(c => allAccessibleClassIds.has(c.id));

  // Students visible to this user
  const visibleStudents = students.filter(s => allAccessibleClassIds.has(s.classId));

  const filtered = visibleStudents.filter(s => {
    if (classFilter !== "all" && s.classId !== classFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const cls = getClassById(s.classId);
      return (
        s.name.toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        cls?.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Can add students: admin always; class teachers for their homeroom classes
  const canAdd = isAdmin() || isClassTeacher;

  // Can edit/delete a student: admin always; class teacher only for their homeroom class students
  const canManage = (studentClassId: string) =>
    isAdmin() || homeroomClassIds.has(studentClassId);

  const handleDelete = (id: string, name: string, classId: string) => {
    if (!canManage(classId)) return;
    if (!confirm(`Remove student "${name}" from the system?`)) return;
    deleteStudent(id);
    toast.success(`${name} has been removed.`);
  };

  const statusBadge = (status: string) =>
    status === "active"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin()
              ? `${filtered.length} of ${students.length} students`
              : `${filtered.length} students in your classes`}
          </p>
        </div>
        {canAdd && (
          <Link
            to="/students/add"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Student
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, roll, email..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          />
        </div>
        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        >
          <option value="all">All Classes</option>
          {visibleClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Roll No.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Class</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Parent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <UserX className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No students found</p>
                    {canAdd && (
                      <Link to="/students/add" className="text-primary text-sm hover:underline mt-1 inline-block">Add a student</Link>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map(student => {
                  const cls = getClassById(student.classId);
                  const manage = canManage(student.classId);
                  return (
                    <tr key={student.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm font-mono text-muted-foreground">{student.roll}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div>
                          <span className="text-sm">{cls?.name || "—"}</span>
                          {homeroomClassIds.has(student.classId) && !isAdmin() && (
                            <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">My Class</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div>
                          <p className="text-sm">{student.parentName}</p>
                          <p className="text-xs text-muted-foreground">{student.parentPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/students/${student.id}`}
                            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="View Profile">
                            <Eye className="w-4 h-4" />
                          </Link>
                          {manage && (
                            <>
                              <Link to={`/students/edit/${student.id}`}
                                className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(student.id, student.name, student.classId)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-muted-foreground hover:text-red-600 transition-colors" title="Remove">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filtered.length} of {visibleStudents.length} students</span>
        <span>{visibleStudents.filter(s => s.status === "active").length} active · {visibleStudents.filter(s => s.status === "inactive").length} inactive</span>
      </div>
    </div>
  );
}
