from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


RoleEnum = Enum("admin", "teacher", name="role_enum")
StatusEnum = Enum("active", "inactive", name="status_enum")
AssignmentStatusEnum = Enum("active", "closed", name="assignment_status_enum")
SubmissionStatusEnum = Enum("submitted", "graded", "late", "missing", name="submission_status_enum")
AttendanceStatusEnum = Enum("present", "absent", "late", name="attendance_status_enum")
ExamTypeEnum = Enum("unit", "midterm", "final", "assignment", name="exam_type_enum")


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    role: Mapped[str] = mapped_column(RoleEnum, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    teacher_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(StatusEnum, default="active", nullable=False)

    teacher: Mapped["Teacher | None"] = relationship(back_populates="user", foreign_keys=[teacher_id])


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    code: Mapped[str] = mapped_column(String(24), unique=True, nullable=False)
    head_teacher_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class Subject(Base, TimestampMixin):
    __tablename__ = "subjects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    code: Mapped[str] = mapped_column(String(24), unique=True, nullable=False)
    department_id: Mapped[str] = mapped_column(String(36), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)


class Teacher(Base, TimestampMixin):
    __tablename__ = "teachers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    department_id: Mapped[str] = mapped_column(String(36), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    subjects: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    assigned_classes: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    qualification: Mapped[str | None] = mapped_column(String(180), nullable=True)
    join_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(StatusEnum, default="active", nullable=False)
    designation: Mapped[str | None] = mapped_column(String(160), nullable=True)

    user: Mapped[User | None] = relationship(back_populates="teacher", primaryjoin="Teacher.id == User.teacher_id")


class ClassRoom(Base, TimestampMixin):
    __tablename__ = "classes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    grade: Mapped[str] = mapped_column(String(24), nullable=False)
    section: Mapped[str] = mapped_column(String(24), nullable=False)
    class_teacher_id: Mapped[str] = mapped_column(String(36), ForeignKey("teachers.id", ondelete="RESTRICT"), nullable=False)
    department_id: Mapped[str] = mapped_column(String(36), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    subject_teachers: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    student_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    academic_year: Mapped[str] = mapped_column(String(24), nullable=False)


class Student(Base, TimestampMixin):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    roll: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id", ondelete="RESTRICT"), nullable=False)
    email: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    parent_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    parent_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(30), nullable=True)
    admission_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    status: Mapped[str] = mapped_column(StatusEnum, default="active", nullable=False)


class Assignment(Base, TimestampMixin):
    __tablename__ = "assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id", ondelete="RESTRICT"), nullable=False)
    subject_id: Mapped[str] = mapped_column(String(36), ForeignKey("subjects.id", ondelete="RESTRICT"), nullable=False)
    teacher_id: Mapped[str] = mapped_column(String(36), ForeignKey("teachers.id", ondelete="RESTRICT"), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_marks: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(AssignmentStatusEnum, default="active", nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)


class Submission(Base, TimestampMixin):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    assignment_id: Mapped[str] = mapped_column(String(36), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    submitted_date: Mapped[date] = mapped_column(Date, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    marks: Mapped[float | None] = mapped_column(Float, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(SubmissionStatusEnum, nullable=False)


class AttendanceRecord(Base, TimestampMixin):
    __tablename__ = "attendance_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(AttendanceStatusEnum, nullable=False)
    marked_by: Mapped[str] = mapped_column(String(36), nullable=False)


class MarksRecord(Base, TimestampMixin):
    __tablename__ = "marks_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_id: Mapped[str] = mapped_column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    exam_type: Mapped[str] = mapped_column(ExamTypeEnum, nullable=False)
    marks: Mapped[float] = mapped_column(Float, nullable=False)
    total_marks: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    teacher_id: Mapped[str] = mapped_column(String(36), nullable=False)
