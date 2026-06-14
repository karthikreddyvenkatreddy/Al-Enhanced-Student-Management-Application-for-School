from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


Role = Literal["admin", "teacher"]
Status = Literal["active", "inactive"]


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class TokenResponse(ApiModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class LoginRequest(ApiModel):
    email: EmailStr
    password: str


class UserOut(ApiModel):
    id: str
    name: str
    email: EmailStr
    role: Role
    teacherId: str | None = None
    status: Status = "active"


class UserAdminOut(UserOut):
    demoPassword: str | None = None


class UserCreate(ApiModel):
    name: str
    email: EmailStr
    role: Role = "teacher"
    password: str = Field(min_length=4)
    teacherId: str | None = None


class DepartmentIn(ApiModel):
    name: str
    code: str
    headTeacherId: str | None = None


class DepartmentOut(DepartmentIn):
    id: str


class SubjectOut(ApiModel):
    id: str
    name: str
    code: str
    departmentId: str


class SubjectTeacher(ApiModel):
    subjectId: str
    teacherId: str


class ClassRoomIn(ApiModel):
    name: str
    grade: str
    section: str
    classTeacherId: str
    departmentId: str
    subjectTeachers: list[SubjectTeacher] = []
    studentIds: list[str] = []
    academicYear: str


class ClassRoomPatch(ApiModel):
    name: str | None = None
    grade: str | None = None
    section: str | None = None
    classTeacherId: str | None = None
    departmentId: str | None = None
    subjectTeachers: list[SubjectTeacher] | None = None
    studentIds: list[str] | None = None
    academicYear: str | None = None


class ClassRoomOut(ClassRoomIn):
    id: str


class TeacherIn(ApiModel):
    userId: str | None = ""
    name: str
    email: EmailStr
    employeeId: str
    departmentId: str
    subjects: list[str] = []
    assignedClasses: list[str] = []
    phone: str | None = ""
    qualification: str | None = ""
    joinDate: date | None = None
    status: Status = "active"
    designation: str | None = ""


class TeacherPatch(ApiModel):
    userId: str | None = None
    name: str | None = None
    email: EmailStr | None = None
    employeeId: str | None = None
    departmentId: str | None = None
    subjects: list[str] | None = None
    assignedClasses: list[str] | None = None
    phone: str | None = None
    qualification: str | None = None
    joinDate: date | None = None
    status: Status | None = None
    designation: str | None = None


class TeacherOut(TeacherIn):
    id: str


class StudentIn(ApiModel):
    name: str
    roll: str
    classId: str
    email: EmailStr
    phone: str | None = ""
    parentName: str | None = ""
    parentPhone: str | None = ""
    address: str | None = ""
    dob: date | None = None
    gender: str | None = ""
    admissionDate: date | None = None
    bloodGroup: str | None = ""
    status: Status = "active"


class StudentPatch(ApiModel):
    name: str | None = None
    roll: str | None = None
    classId: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    parentName: str | None = None
    parentPhone: str | None = None
    address: str | None = None
    dob: date | None = None
    gender: str | None = None
    admissionDate: date | None = None
    bloodGroup: str | None = None
    status: Status | None = None


class StudentOut(StudentIn):
    id: str


class AssignmentIn(ApiModel):
    title: str
    description: str
    classId: str
    subjectId: str
    teacherId: str
    dueDate: date
    totalMarks: int
    status: Literal["active", "closed"] = "active"
    instructions: str | None = ""


class AssignmentPatch(ApiModel):
    title: str | None = None
    description: str | None = None
    classId: str | None = None
    subjectId: str | None = None
    teacherId: str | None = None
    dueDate: date | None = None
    createdDate: date | None = None
    totalMarks: int | None = None
    status: Literal["active", "closed"] | None = None
    instructions: str | None = None


class AssignmentOut(AssignmentIn):
    id: str
    createdDate: date


class SubmissionIn(ApiModel):
    assignmentId: str
    studentId: str
    submittedDate: date
    content: str
    marks: float | None = None
    feedback: str | None = ""
    status: Literal["submitted", "graded", "late", "missing"] = "submitted"


class SubmissionOut(SubmissionIn):
    id: str


class GradeSubmissionRequest(ApiModel):
    marks: float
    feedback: str


class AttendanceIn(ApiModel):
    studentId: str
    classId: str
    date: date
    status: Literal["present", "absent", "late"]
    markedBy: str


class AttendanceOut(AttendanceIn):
    id: str


class MarksIn(ApiModel):
    studentId: str
    classId: str
    subjectId: str
    examType: Literal["unit", "midterm", "final", "assignment"]
    marks: float
    totalMarks: float
    date: date
    teacherId: str


class MarksOut(MarksIn):
    id: str


class BootstrapOut(ApiModel):
    users: list[UserAdminOut]
    departments: list[DepartmentOut]
    subjects: list[SubjectOut]
    teachers: list[TeacherOut]
    classes: list[ClassRoomOut]
    students: list[StudentOut]
    assignments: list[AssignmentOut]
    submissions: list[SubmissionOut]
    attendanceRecords: list[AttendanceOut]
    marksRecords: list[MarksOut]


class StudentPredictionOut(ApiModel):
    studentId: str
    studentName: str
    roll: str
    classId: str
    className: str | None = None
    attendancePercentage: float
    averageMarks: float
    assignmentScore: float
    marksCount: int
    prediction: Literal["High Performer", "Average Performer", "At Risk"]
    confidence: float
    riskLevel: Literal["Low", "Medium", "High"]
    factors: list[str]
    recommendations: list[str]


class PredictionSummaryOut(ApiModel):
    studentsAnalysed: int
    highPerformers: int
    averagePerformers: int
    atRisk: int
    modelAccuracy: float
    modelName: str
    featureImportances: dict[str, float]
    predictions: list[StudentPredictionOut]


class AIReportRequest(ApiModel):
    studentId: str | None = None
    classId: str | None = None
    reportType: Literal["student", "performance", "attendance", "risk"] = "student"


class AIReportOut(ApiModel):
    title: str
    scope: str
    generatedAt: str
    summary: str
    strengths: list[str]
    areasForImprovement: list[str]
    academicInsights: list[str]
    recommendations: list[str]
    parentSuggestions: list[str]
    prediction: StudentPredictionOut | None = None
    reportText: str
