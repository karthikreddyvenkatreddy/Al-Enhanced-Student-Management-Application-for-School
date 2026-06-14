from datetime import date
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import ml_service, models, schemas
from .config import get_settings
from .database import Base, SessionLocal, engine, get_db
from .deps import get_current_user, require_admin
from .security import create_access_token, hash_password, verify_password
from .seed import seed_demo_data
from app import ml_service
from app import genai_service
from dotenv import load_dotenv

# Load the environment variables from the .env file immediately at boot
load_dotenv()
settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()


def uid() -> str:
    return uuid4().hex[:12]


def user_out(user: models.User, include_demo_password: bool = False) -> schemas.UserAdminOut:
    demo_passwords = {
        "admin@eduai.com": "admin",
        "teacher@eduai.com": "teacher",
        "sarah@eduai.com": "teacher",
        "emily@eduai.com": "teacher",
        "robert@eduai.com": "teacher",
    }
    return schemas.UserAdminOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        teacherId=user.teacher_id,
        status=user.status,
        demoPassword=demo_passwords.get(user.email) if include_demo_password else None,
    )


def department_out(row: models.Department) -> schemas.DepartmentOut:
    return schemas.DepartmentOut(id=row.id, name=row.name, code=row.code, headTeacherId=row.head_teacher_id)


def subject_out(row: models.Subject) -> schemas.SubjectOut:
    return schemas.SubjectOut(id=row.id, name=row.name, code=row.code, departmentId=row.department_id)


def teacher_out(row: models.Teacher) -> schemas.TeacherOut:
    return schemas.TeacherOut(
        id=row.id,
        userId=row.user_id or "",
        name=row.name,
        email=row.email,
        employeeId=row.employee_id,
        departmentId=row.department_id,
        subjects=row.subjects or [],
        assignedClasses=row.assigned_classes or [],
        phone=row.phone or "",
        qualification=row.qualification or "",
        joinDate=row.join_date,
        status=row.status,
        designation=row.designation or "",
    )


def class_out(row: models.ClassRoom) -> schemas.ClassRoomOut:
    return schemas.ClassRoomOut(
        id=row.id,
        name=row.name,
        grade=row.grade,
        section=row.section,
        classTeacherId=row.class_teacher_id,
        departmentId=row.department_id,
        subjectTeachers=row.subject_teachers or [],
        studentIds=row.student_ids or [],
        academicYear=row.academic_year,
    )


def student_out(row: models.Student) -> schemas.StudentOut:
    return schemas.StudentOut(
        id=row.id,
        name=row.name,
        roll=row.roll,
        classId=row.class_id,
        email=row.email,
        phone=row.phone or "",
        parentName=row.parent_name or "",
        parentPhone=row.parent_phone or "",
        address=row.address or "",
        dob=row.dob,
        gender=row.gender or "",
        admissionDate=row.admission_date,
        bloodGroup=row.blood_group or "",
        status=row.status,
    )


def assignment_out(row: models.Assignment) -> schemas.AssignmentOut:
    return schemas.AssignmentOut(
        id=row.id,
        title=row.title,
        description=row.description,
        classId=row.class_id,
        subjectId=row.subject_id,
        teacherId=row.teacher_id,
        dueDate=row.due_date,
        createdDate=row.created_date,
        totalMarks=row.total_marks,
        status=row.status,
        instructions=row.instructions or "",
    )


def submission_out(row: models.Submission) -> schemas.SubmissionOut:
    return schemas.SubmissionOut(
        id=row.id,
        assignmentId=row.assignment_id,
        studentId=row.student_id,
        submittedDate=row.submitted_date,
        content=row.content,
        marks=row.marks,
        feedback=row.feedback or "",
        status=row.status,
    )


def attendance_out(row: models.AttendanceRecord) -> schemas.AttendanceOut:
    return schemas.AttendanceOut(
        id=row.id,
        studentId=row.student_id,
        classId=row.class_id,
        date=row.date,
        status=row.status,
        markedBy=row.marked_by,
    )


def marks_out(row: models.MarksRecord) -> schemas.MarksOut:
    return schemas.MarksOut(
        id=row.id,
        studentId=row.student_id,
        classId=row.class_id,
        subjectId=row.subject_id,
        examType=row.exam_type,
        marks=row.marks,
        totalMarks=row.total_marks,
        date=row.date,
        teacherId=row.teacher_id,
    )


def not_found(name: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found")


def accessible_students_for_user(db: Session, current_user: models.User) -> list[models.Student]:
    if current_user.role == "admin":
        return db.query(models.Student).order_by(models.Student.roll).all()
    if not current_user.teacher_id:
        return []
    classes = db.query(models.ClassRoom).all()
    class_ids = [
        cls.id for cls in classes
        if cls.class_teacher_id == current_user.teacher_id
        or any(item.get("teacherId") == current_user.teacher_id for item in list(cls.subject_teachers or []))
    ]
    if not class_ids:
        return []
    return db.query(models.Student).filter(models.Student.class_id.in_(class_ids)).order_by(models.Student.roll).all()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.TokenResponse:
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.id, {"role": user.role})
    return schemas.TokenResponse(access_token=token, user=user_out(user))


@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)) -> schemas.UserOut:
    return user_out(current_user)


@app.get("/api/bootstrap", response_model=schemas.BootstrapOut)
def bootstrap(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.BootstrapOut:
    include_users = current_user.role == "admin"
    return schemas.BootstrapOut(
        users=[user_out(u, include_demo_password=True) for u in db.query(models.User).order_by(models.User.name).all()] if include_users else [],
        departments=[department_out(x) for x in db.query(models.Department).order_by(models.Department.name).all()],
        subjects=[subject_out(x) for x in db.query(models.Subject).order_by(models.Subject.name).all()],
        teachers=[teacher_out(x) for x in db.query(models.Teacher).order_by(models.Teacher.name).all()],
        classes=[class_out(x) for x in db.query(models.ClassRoom).order_by(models.ClassRoom.grade, models.ClassRoom.section).all()],
        students=[student_out(x) for x in db.query(models.Student).order_by(models.Student.roll).all()],
        assignments=[assignment_out(x) for x in db.query(models.Assignment).order_by(models.Assignment.due_date).all()],
        submissions=[submission_out(x) for x in db.query(models.Submission).order_by(models.Submission.submitted_date).all()],
        attendanceRecords=[attendance_out(x) for x in db.query(models.AttendanceRecord).order_by(models.AttendanceRecord.date).all()],
        marksRecords=[marks_out(x) for x in db.query(models.MarksRecord).order_by(models.MarksRecord.date).all()],
    )


@app.get("/api/users", response_model=list[schemas.UserAdminOut])
def list_users(_: models.User = Depends(require_admin), db: Session = Depends(get_db)) -> list[schemas.UserAdminOut]:
    return [user_out(u, include_demo_password=True) for u in db.query(models.User).order_by(models.User.name).all()]


@app.post("/api/users", response_model=schemas.UserAdminOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: schemas.UserCreate, _: models.User = Depends(require_admin), db: Session = Depends(get_db)) -> schemas.UserAdminOut:
    user = models.User(
        id=uid(),
        name=payload.name,
        email=str(payload.email),
        role=payload.role,
        teacher_id=payload.teacherId,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_out(user)


@app.post("/api/departments", response_model=schemas.DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(payload: schemas.DepartmentIn, _: models.User = Depends(require_admin), db: Session = Depends(get_db)) -> schemas.DepartmentOut:
    row = models.Department(id=uid(), name=payload.name, code=payload.code, head_teacher_id=payload.headTeacherId)
    db.add(row)
    db.commit()
    db.refresh(row)
    return department_out(row)


@app.patch("/api/departments/{id}", response_model=schemas.DepartmentOut)
def update_department(id: str, payload: schemas.DepartmentIn, _: models.User = Depends(require_admin), db: Session = Depends(get_db)) -> schemas.DepartmentOut:
    row = db.get(models.Department, id)
    if not row:
        raise not_found("Department")
    row.name = payload.name
    row.code = payload.code
    row.head_teacher_id = payload.headTeacherId
    db.commit()
    db.refresh(row)
    return department_out(row)


@app.delete("/api/departments/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(id: str, _: models.User = Depends(require_admin), db: Session = Depends(get_db)) -> Response:
    row = db.get(models.Department, id)
    if not row:
        raise not_found("Department")
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/teachers", response_model=schemas.TeacherOut, status_code=status.HTTP_201_CREATED)
def create_teacher(payload: schemas.TeacherIn, _: models.User = Depends(require_admin), db: Session = Depends(get_db)) -> schemas.TeacherOut:
    row = models.Teacher(
        id=uid(), user_id=payload.userId, name=payload.name, email=str(payload.email),
        employee_id=payload.employeeId, department_id=payload.departmentId,
        subjects=payload.subjects, assigned_classes=payload.assignedClasses,
        phone=payload.phone, qualification=payload.qualification, join_date=payload.joinDate,
        status=payload.status, designation=payload.designation,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return teacher_out(row)


@app.patch("/api/teachers/{id}", response_model=schemas.TeacherOut)
def update_teacher(id: str, payload: schemas.TeacherPatch, _: models.User = Depends(require_admin), db: Session = Depends(get_db)) -> schemas.TeacherOut:
    row = db.get(models.Teacher, id)
    if not row:
        raise not_found("Teacher")
    data = payload.model_dump(exclude_unset=True)
    mapping = {"userId": "user_id", "employeeId": "employee_id", "departmentId": "department_id", "assignedClasses": "assigned_classes", "joinDate": "join_date"}
    for key, value in data.items():
        setattr(row, mapping.get(key, key), value)
    db.commit()
    db.refresh(row)
    return teacher_out(row)


@app.delete("/api/teachers/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(id: str, _: models.User = Depends(require_admin), db: Session = Depends(get_db)) -> Response:
    row = db.get(models.Teacher, id)
    if not row:
        raise not_found("Teacher")
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/classes", response_model=schemas.ClassRoomOut, status_code=status.HTTP_201_CREATED)
def create_class(payload: schemas.ClassRoomIn, _: models.User = Depends(require_admin), db: Session = Depends(get_db)) -> schemas.ClassRoomOut:
    row = models.ClassRoom(
        id=uid(), name=payload.name, grade=payload.grade, section=payload.section,
        class_teacher_id=payload.classTeacherId, department_id=payload.departmentId,
        subject_teachers=[x.model_dump() for x in payload.subjectTeachers],
        student_ids=payload.studentIds, academic_year=payload.academicYear,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return class_out(row)


@app.patch("/api/classes/{id}", response_model=schemas.ClassRoomOut)
def update_class(id: str, payload: schemas.ClassRoomPatch, _: models.User = Depends(require_admin), db: Session = Depends(get_db)) -> schemas.ClassRoomOut:
    row = db.get(models.ClassRoom, id)
    if not row:
        raise not_found("Class")
    data = payload.model_dump(exclude_unset=True)
    mapping = {"classTeacherId": "class_teacher_id", "departmentId": "department_id", "subjectTeachers": "subject_teachers", "studentIds": "student_ids", "academicYear": "academic_year"}
    for key, value in data.items():
        if key == "subjectTeachers" and value is not None:
            value = [dict(x) for x in value]
        setattr(row, mapping.get(key, key), value)
    db.commit()
    db.refresh(row)
    return class_out(row)


@app.delete("/api/classes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(id: str, _: models.User = Depends(require_admin), db: Session = Depends(get_db)) -> Response:
    row = db.get(models.ClassRoom, id)
    if not row:
        raise not_found("Class")
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/students", response_model=schemas.StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(payload: schemas.StudentIn, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> schemas.StudentOut:
    row = models.Student(
        id=uid(), name=payload.name, roll=payload.roll, class_id=payload.classId, email=str(payload.email),
        phone=payload.phone, parent_name=payload.parentName, parent_phone=payload.parentPhone,
        address=payload.address, dob=payload.dob, gender=payload.gender,
        admission_date=payload.admissionDate, blood_group=payload.bloodGroup, status=payload.status,
    )
    db.add(row)
    cls = db.get(models.ClassRoom, payload.classId)
    if cls:
        cls.student_ids = [*list(cls.student_ids or []), row.id]
    db.commit()
    db.refresh(row)
    return student_out(row)


@app.patch("/api/students/{id}", response_model=schemas.StudentOut)
def update_student(id: str, payload: schemas.StudentPatch, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> schemas.StudentOut:
    row = db.get(models.Student, id)
    if not row:
        raise not_found("Student")
    old_class_id = row.class_id
    data = payload.model_dump(exclude_unset=True)
    mapping = {"classId": "class_id", "parentName": "parent_name", "parentPhone": "parent_phone", "admissionDate": "admission_date", "bloodGroup": "blood_group"}
    for key, value in data.items():
        setattr(row, mapping.get(key, key), value)
    if row.class_id != old_class_id:
        old_cls = db.get(models.ClassRoom, old_class_id)
        new_cls = db.get(models.ClassRoom, row.class_id)
        if old_cls:
            old_cls.student_ids = [sid for sid in list(old_cls.student_ids or []) if sid != row.id]
        if new_cls and row.id not in list(new_cls.student_ids or []):
            new_cls.student_ids = [*list(new_cls.student_ids or []), row.id]
    db.commit()
    db.refresh(row)
    return student_out(row)


@app.delete("/api/students/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    row = db.get(models.Student, id)
    if not row:
        raise not_found("Student")
    cls = db.get(models.ClassRoom, row.class_id)
    if cls:
        cls.student_ids = [sid for sid in list(cls.student_ids or []) if sid != row.id]
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/assignments", response_model=schemas.AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_assignment(payload: schemas.AssignmentIn, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> schemas.AssignmentOut:
    row = models.Assignment(
        id=uid(), title=payload.title, description=payload.description, class_id=payload.classId,
        subject_id=payload.subjectId, teacher_id=payload.teacherId, due_date=payload.dueDate,
        created_date=date.today(), total_marks=payload.totalMarks, status=payload.status,
        instructions=payload.instructions,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return assignment_out(row)


@app.patch("/api/assignments/{id}", response_model=schemas.AssignmentOut)
def update_assignment(id: str, payload: schemas.AssignmentPatch, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> schemas.AssignmentOut:
    row = db.get(models.Assignment, id)
    if not row:
        raise not_found("Assignment")
    data = payload.model_dump(exclude_unset=True)
    mapping = {"classId": "class_id", "subjectId": "subject_id", "teacherId": "teacher_id", "dueDate": "due_date", "createdDate": "created_date", "totalMarks": "total_marks"}
    for key, value in data.items():
        setattr(row, mapping.get(key, key), value)
    db.commit()
    db.refresh(row)
    return assignment_out(row)


@app.delete("/api/assignments/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    row = db.get(models.Assignment, id)
    if not row:
        raise not_found("Assignment")
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/submissions", response_model=schemas.SubmissionOut, status_code=status.HTTP_201_CREATED)
def create_submission(payload: schemas.SubmissionIn, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> schemas.SubmissionOut:
    row = models.Submission(
        id=uid(), assignment_id=payload.assignmentId, student_id=payload.studentId,
        submitted_date=payload.submittedDate, content=payload.content, marks=payload.marks,
        feedback=payload.feedback, status=payload.status,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return submission_out(row)


@app.patch("/api/submissions/{id}/grade", response_model=schemas.SubmissionOut)
def grade_submission(id: str, payload: schemas.GradeSubmissionRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> schemas.SubmissionOut:
    row = db.get(models.Submission, id)
    if not row:
        raise not_found("Submission")
    row.marks = payload.marks
    row.feedback = payload.feedback
    row.status = "graded"
    db.commit()
    db.refresh(row)
    return submission_out(row)


@app.put("/api/attendance/bulk", response_model=list[schemas.AttendanceOut])
def save_attendance(records: list[schemas.AttendanceIn], current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[schemas.AttendanceOut]:
    if not records:
        return []
    class_id = records[0].classId
    att_date = records[0].date
    db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.class_id == class_id,
        models.AttendanceRecord.date == att_date,
    ).delete(synchronize_session=False)
    rows = [
        models.AttendanceRecord(
            id=uid(), student_id=r.studentId, class_id=r.classId, date=r.date,
            status=r.status, marked_by=r.markedBy,
        )
        for r in records
    ]
    db.add_all(rows)
    db.commit()
    return [attendance_out(r) for r in rows]


@app.put("/api/marks/bulk", response_model=list[schemas.MarksOut])
def save_marks(records: list[schemas.MarksIn], current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[schemas.MarksOut]:
    if not records:
        return []
    first = records[0]
    db.query(models.MarksRecord).filter(
        models.MarksRecord.class_id == first.classId,
        models.MarksRecord.subject_id == first.subjectId,
        models.MarksRecord.exam_type == first.examType,
    ).delete(synchronize_session=False)
    rows = [
        models.MarksRecord(
            id=uid(), student_id=r.studentId, class_id=r.classId, subject_id=r.subjectId,
            exam_type=r.examType, marks=r.marks, total_marks=r.totalMarks,
            date=r.date, teacher_id=r.teacherId,
        )
        for r in records
    ]
    db.add_all(rows)
    db.commit()
    return [marks_out(r) for r in rows]


@app.get("/api/ai/predictions", response_model=schemas.PredictionSummaryOut)
def ai_predictions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.PredictionSummaryOut:
    return ml_service.get_predictions(db, accessible_students_for_user(db, current_user))


# @app.get("/api/ai/predictions/{student_id}", response_model=schemas.StudentPredictionOut)
# def ai_prediction_detail(
#     student_id: str,
#     current_user: models.User = Depends(get_current_user),
#     db: Session = Depends(get_db),
# ) -> schemas.StudentPredictionOut:
#     students = accessible_students_for_user(db, current_user)
#     student = next((row for row in students if row.id == student_id), None)
#     if not student:
#         raise not_found("Student")
#     return ml_service.get_predictions(db, [student]).predictions[0]


# @app.post("/api/ai/reports", response_model=schemas.AIReportOut)
# def ai_report(
#     payload: schemas.AIReportRequest,
#     current_user: models.User = Depends(get_current_user),
#     db: Session = Depends(get_db),
# ) -> schemas.AIReportOut:
#     try:
#         return ml_service.generate_report(db, payload, accessible_students_for_user(db, current_user))
#     except ValueError as exc:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
@app.get("/api/ai/predictions/{student_id}", response_model=schemas.StudentPredictionOut)
def ai_prediction_detail(
    student_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.StudentPredictionOut:
    students = accessible_students_for_user(db, current_user)
    student = next((row for row in students if row.id == student_id), None)
    if not student:
        raise not_found("Student")
        
    # Kept completely in ml_service for the predictions page
    return ml_service.get_predictions(db, [student]).predictions[0]


@app.post("/api/ai/reports", response_model=schemas.AIReportOut)
def ai_report(
    payload: schemas.AIReportRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.AIReportOut:
    try:
        # Switched from ml_service to genai_service for the reports page
        return genai_service.generate_report(db, payload, accessible_students_for_user(db, current_user))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc