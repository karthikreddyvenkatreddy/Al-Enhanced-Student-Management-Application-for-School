import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "../lib/api";

export type Role = "admin" | "teacher";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  teacherId?: string;
  status?: "active" | "inactive";
  demoPassword?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headTeacherId?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  departmentId: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  section: string;
  classTeacherId: string;
  departmentId: string;
  subjectTeachers: { subjectId: string; teacherId: string }[];
  studentIds: string[];
  academicYear: string;
}

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  employeeId: string;
  departmentId: string;
  subjects: string[];
  assignedClasses: string[];
  phone: string;
  qualification: string;
  joinDate: string;
  status: "active" | "inactive";
  designation: string;
}

export interface Student {
  id: string;
  name: string;
  roll: string;
  classId: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  address: string;
  dob: string;
  gender: string;
  admissionDate: string;
  bloodGroup: string;
  status: "active" | "inactive";
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dueDate: string;
  createdDate: string;
  totalMarks: number;
  status: "active" | "closed";
  instructions?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedDate: string;
  content: string;
  marks?: number;
  feedback?: string;
  status: "submitted" | "graded" | "late" | "missing";
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: "present" | "absent" | "late";
  markedBy: string;
}

export interface MarksRecord {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  examType: "unit" | "midterm" | "final" | "assignment";
  marks: number;
  totalMarks: number;
  date: string;
  teacherId: string;
}

interface BootstrapData {
  users: AuthUser[];
  departments: Department[];
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassRoom[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  attendanceRecords: AttendanceRecord[];
  marksRecords: MarksRecord[];
}

interface DataContextType extends BootstrapData {
  isDataLoading: boolean;
  refreshData: () => Promise<void>;

  addUser: (u: Omit<AuthUser, "id"> & { password: string }) => void;
  addDepartment: (d: Omit<Department, "id">) => void;
  updateDepartment: (id: string, d: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  addTeacher: (t: Omit<Teacher, "id">) => void;
  updateTeacher: (id: string, t: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addClass: (c: Omit<ClassRoom, "id">) => void;
  updateClass: (id: string, c: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => void;
  addStudent: (s: Omit<Student, "id">) => void;
  updateStudent: (id: string, s: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addAssignment: (a: Omit<Assignment, "id" | "createdDate">) => void;
  updateAssignment: (id: string, a: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  addSubmission: (s: Omit<Submission, "id">) => void;
  gradeSubmission: (id: string, marks: number, feedback: string) => void;

  getTeacherById: (id: string) => Teacher | undefined;
  getStudentById: (id: string) => Student | undefined;
  getClassById: (id: string) => ClassRoom | undefined;
  getSubjectById: (id: string) => Subject | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getStudentsByClass: (classId: string) => Student[];
  getAssignmentsByClass: (classId: string) => Assignment[];
  getAssignmentsByTeacher: (teacherId: string) => Assignment[];
  getSubmissionsByAssignment: (assignmentId: string) => Submission[];
  getTeacherClasses: (teacherId: string) => ClassRoom[];
  saveAttendance: (records: Omit<AttendanceRecord, "id">[]) => void;
  getAttendanceByDate: (classId: string, date: string) => AttendanceRecord[];
  getAttendanceByStudent: (studentId: string) => AttendanceRecord[];
  getStudentAttendanceRate: (studentId: string) => number;
  getClassAttendanceSummary: (classId: string) => { present: number; absent: number; late: number; total: number; rate: number };
  saveMarks: (records: Omit<MarksRecord, "id">[]) => void;
  getMarksByClass: (classId: string, subjectId?: string, examType?: string) => MarksRecord[];
  getMarksByStudent: (studentId: string) => MarksRecord[];
  getStudentAverage: (studentId: string) => number;
  getSubjectAverage: (classId: string, subjectId: string) => number;
}

const emptyData: BootstrapData = {
  users: [],
  departments: [],
  subjects: [],
  teachers: [],
  classes: [],
  students: [],
  assignments: [],
  submissions: [],
  attendanceRecords: [],
  marksRecords: [],
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<BootstrapData>(emptyData);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const refreshData = async () => {
    if (!isAuthenticated) {
      setData(emptyData);
      return;
    }
    setIsDataLoading(true);
    try {
      setData(await apiRequest<BootstrapData>("/bootstrap"));
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    refreshData().catch(console.error);
  }, [isAuthenticated]);

  const replace = <K extends keyof BootstrapData>(key: K, value: BootstrapData[K]) =>
    setData(prev => ({ ...prev, [key]: value }));

  const addUser = async (u: Omit<AuthUser, "id"> & { password: string }) => {
    const created = await apiRequest<AuthUser>("/users", { method: "POST", body: JSON.stringify(u) });
    replace("users", [...data.users, created]);
  };

  const addDepartment = async (d: Omit<Department, "id">) => {
    const created = await apiRequest<Department>("/departments", { method: "POST", body: JSON.stringify(d) });
    replace("departments", [...data.departments, created]);
  };
  const updateDepartment = async (id: string, d: Partial<Department>) => {
    const current = data.departments.find(x => x.id === id);
    if (!current) return;
    const updated = await apiRequest<Department>(`/departments/${id}`, { method: "PATCH", body: JSON.stringify({ ...current, ...d }) });
    replace("departments", data.departments.map(x => x.id === id ? updated : x));
  };
  const deleteDepartment = async (id: string) => {
    await apiRequest<void>(`/departments/${id}`, { method: "DELETE" });
    replace("departments", data.departments.filter(x => x.id !== id));
  };

  const addTeacher = async (t: Omit<Teacher, "id">) => {
    const created = await apiRequest<Teacher>("/teachers", { method: "POST", body: JSON.stringify(t) });
    replace("teachers", [...data.teachers, created]);
  };
  const updateTeacher = async (id: string, t: Partial<Teacher>) => {
    const updated = await apiRequest<Teacher>(`/teachers/${id}`, { method: "PATCH", body: JSON.stringify(t) });
    replace("teachers", data.teachers.map(x => x.id === id ? updated : x));
  };
  const deleteTeacher = async (id: string) => {
    await apiRequest<void>(`/teachers/${id}`, { method: "DELETE" });
    replace("teachers", data.teachers.filter(x => x.id !== id));
  };

  const addClass = async (c: Omit<ClassRoom, "id">) => {
    const created = await apiRequest<ClassRoom>("/classes", { method: "POST", body: JSON.stringify(c) });
    replace("classes", [...data.classes, created]);
  };
  const updateClass = async (id: string, c: Partial<ClassRoom>) => {
    const updated = await apiRequest<ClassRoom>(`/classes/${id}`, { method: "PATCH", body: JSON.stringify(c) });
    replace("classes", data.classes.map(x => x.id === id ? updated : x));
  };
  const deleteClass = async (id: string) => {
    await apiRequest<void>(`/classes/${id}`, { method: "DELETE" });
    replace("classes", data.classes.filter(x => x.id !== id));
  };

  const addStudent = async (s: Omit<Student, "id">) => {
    const created = await apiRequest<Student>("/students", { method: "POST", body: JSON.stringify(s) });
    replace("students", [...data.students, created]);
    replace("classes", data.classes.map(c => c.id === created.classId ? { ...c, studentIds: [...c.studentIds, created.id] } : c));
  };
  const updateStudent = async (id: string, s: Partial<Student>) => {
    const before = data.students.find(x => x.id === id);
    const updated = await apiRequest<Student>(`/students/${id}`, { method: "PATCH", body: JSON.stringify(s) });
    replace("students", data.students.map(x => x.id === id ? updated : x));
    if (before?.classId !== updated.classId) {
      replace("classes", data.classes.map(c => {
        const without = c.studentIds.filter(sid => sid !== id);
        return c.id === updated.classId ? { ...c, studentIds: [...without, id] } : { ...c, studentIds: without };
      }));
    }
  };
  const deleteStudent = async (id: string) => {
    await apiRequest<void>(`/students/${id}`, { method: "DELETE" });
    replace("students", data.students.filter(x => x.id !== id));
    replace("classes", data.classes.map(c => ({ ...c, studentIds: c.studentIds.filter(sid => sid !== id) })));
  };

  const addAssignment = async (a: Omit<Assignment, "id" | "createdDate">) => {
    const created = await apiRequest<Assignment>("/assignments", { method: "POST", body: JSON.stringify(a) });
    replace("assignments", [...data.assignments, created]);
  };
  const updateAssignment = async (id: string, a: Partial<Assignment>) => {
    const updated = await apiRequest<Assignment>(`/assignments/${id}`, { method: "PATCH", body: JSON.stringify(a) });
    replace("assignments", data.assignments.map(x => x.id === id ? updated : x));
  };
  const deleteAssignment = async (id: string) => {
    await apiRequest<void>(`/assignments/${id}`, { method: "DELETE" });
    replace("assignments", data.assignments.filter(x => x.id !== id));
  };

  const addSubmission = async (s: Omit<Submission, "id">) => {
    const created = await apiRequest<Submission>("/submissions", { method: "POST", body: JSON.stringify(s) });
    replace("submissions", [...data.submissions, created]);
  };
  const gradeSubmission = async (id: string, marks: number, feedback: string) => {
    const updated = await apiRequest<Submission>(`/submissions/${id}/grade`, { method: "PATCH", body: JSON.stringify({ marks, feedback }) });
    replace("submissions", data.submissions.map(x => x.id === id ? updated : x));
  };

  const getTeacherById = (id: string) => data.teachers.find(t => t.id === id);
  const getStudentById = (id: string) => data.students.find(s => s.id === id);
  const getClassById = (id: string) => data.classes.find(c => c.id === id);
  const getSubjectById = (id: string) => data.subjects.find(s => s.id === id);
  const getDepartmentById = (id: string) => data.departments.find(d => d.id === id);
  const getStudentsByClass = (classId: string) => data.students.filter(s => s.classId === classId);
  const getAssignmentsByClass = (classId: string) => data.assignments.filter(a => a.classId === classId);
  const getAssignmentsByTeacher = (teacherId: string) => data.assignments.filter(a => a.teacherId === teacherId);
  const getSubmissionsByAssignment = (assignmentId: string) => data.submissions.filter(s => s.assignmentId === assignmentId);
  const getTeacherClasses = (teacherId: string) => data.classes.filter(c =>
    c.classTeacherId === teacherId || c.subjectTeachers.some(st => st.teacherId === teacherId)
  );

  const saveAttendance = async (records: Omit<AttendanceRecord, "id">[]) => {
    if (!records.length) return;
    const saved = await apiRequest<AttendanceRecord[]>("/attendance/bulk", { method: "PUT", body: JSON.stringify(records) });
    const { classId, date } = records[0];
    replace("attendanceRecords", [
      ...data.attendanceRecords.filter(r => !(r.classId === classId && r.date === date)),
      ...saved,
    ]);
  };
  const getAttendanceByDate = (classId: string, date: string) =>
    data.attendanceRecords.filter(r => r.classId === classId && r.date === date);
  const getAttendanceByStudent = (studentId: string) =>
    data.attendanceRecords.filter(r => r.studentId === studentId);
  const getStudentAttendanceRate = (studentId: string) => {
    const recs = data.attendanceRecords.filter(r => r.studentId === studentId);
    if (!recs.length) return 0;
    return (recs.filter(r => r.status === "present").length / recs.length) * 100;
  };
  const getClassAttendanceSummary = (classId: string) => {
    const recs = data.attendanceRecords.filter(r => r.classId === classId);
    const present = recs.filter(r => r.status === "present").length;
    const absent = recs.filter(r => r.status === "absent").length;
    const late = recs.filter(r => r.status === "late").length;
    const total = present + absent + late;
    const rate = total > 0 ? (present / total) * 100 : 0;
    return { present, absent, late, total, rate };
  };

  const saveMarks = async (records: Omit<MarksRecord, "id">[]) => {
    if (!records.length) return;
    const saved = await apiRequest<MarksRecord[]>("/marks/bulk", { method: "PUT", body: JSON.stringify(records) });
    const { classId, subjectId, examType } = records[0];
    replace("marksRecords", [
      ...data.marksRecords.filter(r => !(r.classId === classId && r.subjectId === subjectId && r.examType === examType)),
      ...saved,
    ]);
  };
  const getMarksByClass = (classId: string, subjectId?: string, examType?: string) =>
    data.marksRecords.filter(r =>
      r.classId === classId &&
      (!subjectId || r.subjectId === subjectId) &&
      (!examType || r.examType === examType)
    );
  const getMarksByStudent = (studentId: string) => data.marksRecords.filter(r => r.studentId === studentId);
  const getStudentAverage = (studentId: string) => {
    const recs = data.marksRecords.filter(r => r.studentId === studentId);
    if (!recs.length) return 0;
    return recs.reduce((sum, r) => sum + (r.marks / r.totalMarks) * 100, 0) / recs.length;
  };
  const getSubjectAverage = (classId: string, subjectId: string) => {
    const recs = data.marksRecords.filter(r => r.classId === classId && r.subjectId === subjectId);
    if (!recs.length) return 0;
    return recs.reduce((sum, r) => sum + (r.marks / r.totalMarks) * 100, 0) / recs.length;
  };

  return (
    <DataContext.Provider value={{
      ...data,
      isDataLoading,
      refreshData,
      addUser,
      addDepartment, updateDepartment, deleteDepartment,
      addTeacher, updateTeacher, deleteTeacher,
      addClass, updateClass, deleteClass,
      addStudent, updateStudent, deleteStudent,
      addAssignment, updateAssignment, deleteAssignment,
      addSubmission, gradeSubmission,
      getTeacherById, getStudentById, getClassById, getSubjectById, getDepartmentById,
      getStudentsByClass, getAssignmentsByClass, getAssignmentsByTeacher,
      getSubmissionsByAssignment, getTeacherClasses,
      saveAttendance, getAttendanceByDate, getAttendanceByStudent,
      getStudentAttendanceRate, getClassAttendanceSummary,
      saveMarks, getMarksByClass, getMarksByStudent, getStudentAverage, getSubjectAverage,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
