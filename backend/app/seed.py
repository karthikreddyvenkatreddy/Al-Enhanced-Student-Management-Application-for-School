# from __future__ import annotations

# from datetime import date

# from sqlalchemy.orm import Session

# from . import models
# from .security import hash_password


# def seed_demo_data(db: Session) -> None:
#     if db.query(models.User).first():
#         return

#     departments = [
#         models.Department(id="d1", name="Science & Technology", code="SCI", head_teacher_id="t1"),
#         models.Department(id="d2", name="Humanities & Arts", code="HUM", head_teacher_id="t3"),
#         models.Department(id="d3", name="Commerce & Management", code="COM", head_teacher_id="t4"),
#     ]
#     subjects = [
#         models.Subject(id="s1", name="Mathematics", code="MATH", department_id="d1"),
#         models.Subject(id="s2", name="Physics", code="PHY", department_id="d1"),
#         models.Subject(id="s3", name="Chemistry", code="CHEM", department_id="d1"),
#         models.Subject(id="s4", name="English", code="ENG", department_id="d2"),
#         models.Subject(id="s5", name="History", code="HIST", department_id="d2"),
#         models.Subject(id="s6", name="Economics", code="ECON", department_id="d3"),
#         models.Subject(id="s7", name="Computer Science", code="CS", department_id="d1"),
#     ]
#     teachers = [
#         models.Teacher(id="t1", user_id="u2", name="John Smith", email="teacher@eduai.com", employee_id="EMP001", department_id="d1", subjects=["s1", "s7"], assigned_classes=["c1", "c2"], phone="555-0101", qualification="M.Sc Mathematics", join_date=date(2019, 6, 1), status="active", designation="Senior Teacher & HOD Science"),
#         models.Teacher(id="t2", user_id="u3", name="Sarah Johnson", email="sarah@eduai.com", employee_id="EMP002", department_id="d1", subjects=["s2", "s3"], assigned_classes=["c1", "c3"], phone="555-0102", qualification="M.Sc Physics", join_date=date(2020, 7, 15), status="active", designation="Teacher"),
#         models.Teacher(id="t3", user_id="u4", name="Emily Davis", email="emily@eduai.com", employee_id="EMP003", department_id="d2", subjects=["s4", "s5"], assigned_classes=["c2", "c3"], phone="555-0103", qualification="M.A English Literature", join_date=date(2018, 4, 10), status="active", designation="Senior Teacher & HOD Humanities"),
#         models.Teacher(id="t4", user_id="u5", name="Robert Chen", email="robert@eduai.com", employee_id="EMP004", department_id="d3", subjects=["s6"], assigned_classes=["c4"], phone="555-0104", qualification="MBA", join_date=date(2021, 1, 20), status="active", designation="Teacher & HOD Commerce"),
#     ]
#     classes = [
#         models.ClassRoom(id="c1", name="Grade 10 - A", grade="10", section="A", class_teacher_id="t1", department_id="d1", subject_teachers=[{"subjectId": "s1", "teacherId": "t1"}, {"subjectId": "s2", "teacherId": "t2"}, {"subjectId": "s4", "teacherId": "t3"}], student_ids=["st1", "st2", "st3", "st4", "st5"], academic_year="2025-2026"),
#         models.ClassRoom(id="c2", name="Grade 10 - B", grade="10", section="B", class_teacher_id="t3", department_id="d2", subject_teachers=[{"subjectId": "s1", "teacherId": "t1"}, {"subjectId": "s4", "teacherId": "t3"}, {"subjectId": "s5", "teacherId": "t3"}], student_ids=["st6", "st7", "st8", "st9", "st10"], academic_year="2025-2026"),
#         models.ClassRoom(id="c3", name="Grade 11 - A", grade="11", section="A", class_teacher_id="t2", department_id="d1", subject_teachers=[{"subjectId": "s2", "teacherId": "t2"}, {"subjectId": "s7", "teacherId": "t1"}, {"subjectId": "s4", "teacherId": "t3"}], student_ids=["st11", "st12", "st13", "st14"], academic_year="2025-2026"),
#         models.ClassRoom(id="c4", name="Grade 11 - B", grade="11", section="B", class_teacher_id="t4", department_id="d3", subject_teachers=[{"subjectId": "s6", "teacherId": "t4"}, {"subjectId": "s4", "teacherId": "t3"}, {"subjectId": "s1", "teacherId": "t1"}], student_ids=["st15", "st16", "st17", "st18"], academic_year="2025-2026"),
#     ]
#     students = [
#         ("st1", "Alice Brown", "10A001", "c1", "alice@student.edu", "female"),
#         ("st2", "Bob Wilson", "10A002", "c1", "bob@student.edu", "male"),
#         ("st3", "Carol Martinez", "10A003", "c1", "carol@student.edu", "female"),
#         ("st4", "David Lee", "10A004", "c1", "david@student.edu", "male"),
#         ("st5", "Emma Taylor", "10A005", "c1", "emma@student.edu", "female"),
#         ("st6", "Frank Anderson", "10B001", "c2", "frank@student.edu", "male"),
#         ("st7", "Grace Thomas", "10B002", "c2", "grace@student.edu", "female"),
#         ("st8", "Henry Jackson", "10B003", "c2", "henry@student.edu", "male"),
#         ("st9", "Isabella White", "10B004", "c2", "isabella@student.edu", "female"),
#         ("st10", "Jack Harris", "10B005", "c2", "jack@student.edu", "male"),
#         ("st11", "Kate Martin", "11A001", "c3", "kate@student.edu", "female"),
#         ("st12", "Liam Garcia", "11A002", "c3", "liam@student.edu", "male"),
#         ("st13", "Mia Robinson", "11A003", "c3", "mia@student.edu", "female"),
#         ("st14", "Noah Clark", "11A004", "c3", "noah@student.edu", "male"),
#         ("st15", "Olivia Lewis", "11B001", "c4", "olivia@student.edu", "female"),
#         ("st16", "Peter Walker", "11B002", "c4", "peter@student.edu", "male"),
#         ("st17", "Quinn Hall", "11B003", "c4", "quinn@student.edu", "female"),
#         ("st18", "Ryan Allen", "11B004", "c4", "ryan@student.edu", "male"),
#     ]

#     users = [
#         models.User(id="u1", name="Dr. Admin Principal", email="admin@eduai.com", role="admin", password_hash=hash_password("admin"), teacher_id=None, status="active"),
#         models.User(id="u2", name="John Smith", email="teacher@eduai.com", role="teacher", password_hash=hash_password("teacher"), teacher_id="t1", status="active"),
#         models.User(id="u3", name="Sarah Johnson", email="sarah@eduai.com", role="teacher", password_hash=hash_password("teacher"), teacher_id="t2", status="active"),
#         models.User(id="u4", name="Emily Davis", email="emily@eduai.com", role="teacher", password_hash=hash_password("teacher"), teacher_id="t3", status="active"),
#         models.User(id="u5", name="Robert Chen", email="robert@eduai.com", role="teacher", password_hash=hash_password("teacher"), teacher_id="t4", status="active"),
#     ]

#     db.add_all(departments)
#     db.add_all(subjects)
#     db.add_all(teachers)
#     db.add_all(classes)
#     db.add_all([
#         models.Student(id=sid, name=name, roll=roll, class_id=class_id, email=email, phone="555-1000", parent_name="Parent", parent_phone="555-2000", address="Demo address", dob=date(2008, 1, 1), gender=gender, admission_date=date(2023, 6, 1), blood_group="O+", status="active")
#         for sid, name, roll, class_id, email, gender in students
#     ])
#     db.add_all(users)
#     db.add_all([
#         models.Assignment(id="a1", title="Quadratic Equations Practice", description="Solve 20 problems on quadratic equations.", class_id="c1", subject_id="s1", teacher_id="t1", due_date=date(2026, 6, 20), created_date=date(2026, 6, 10), total_marks=20, status="active", instructions="Show all working."),
#         models.Assignment(id="a2", title="Newton's Laws Essay", description="Write a 500-word essay on Newton's laws.", class_id="c1", subject_id="s2", teacher_id="t2", due_date=date(2026, 6, 18), created_date=date(2026, 6, 8), total_marks=25, status="active", instructions="Include real examples."),
#         models.Assignment(id="a3", title="Shakespeare Analysis", description="Analyze ambition and power in Macbeth.", class_id="c2", subject_id="s4", teacher_id="t3", due_date=date(2026, 6, 22), created_date=date(2026, 6, 9), total_marks=30, status="active", instructions="Reference specific scenes."),
#     ])
#     db.add_all([
#         models.Submission(id="sub1", assignment_id="a1", student_id="st1", submitted_date=date(2026, 6, 12), content="Completed all problems.", marks=18, feedback="Excellent work!", status="graded"),
#         models.Submission(id="sub2", assignment_id="a1", student_id="st2", submitted_date=date(2026, 6, 13), content="Submitted assignment.", marks=None, feedback="", status="submitted"),
#         models.Submission(id="sub3", assignment_id="a2", student_id="st1", submitted_date=date(2026, 6, 11), content="Essay submitted.", marks=22, feedback="Good examples.", status="graded"),
#     ])

#     attendance_statuses = {
#         "st1": ["present", "present", "present"],
#         "st2": ["present", "present", "late"],
#         "st3": ["present", "absent", "present"],
#         "st4": ["present", "present", "absent"],
#         "st5": ["late", "present", "present"],
#         "st6": ["present", "present", "present"],
#         "st7": ["present", "present", "late"],
#         "st8": ["present", "late", "absent"],
#         "st9": ["present", "present", "present"],
#         "st10": ["absent", "present", "late"],
#     }
#     for sid in [s[0] for s in students]:
#         attendance_statuses.setdefault(sid, ["present", "present", "present"])
#     for day_index, att_date in enumerate([date(2026, 6, 8), date(2026, 6, 9), date(2026, 6, 10)]):
#         for sid, _, _, class_id, _, _ in students:
#             db.add(models.AttendanceRecord(id=f"att{day_index}_{sid}", student_id=sid, class_id=class_id, date=att_date, status=attendance_statuses[sid][day_index], marked_by="system"))

#     marks = [
#         ("st1", "c1", "s1", 22, 25), ("st1", "c1", "s2", 43, 50), ("st1", "c1", "s4", 21, 25),
#         ("st2", "c1", "s1", 18, 25), ("st2", "c1", "s2", 36, 50), ("st2", "c1", "s4", 19, 25),
#         ("st3", "c1", "s1", 20, 25), ("st3", "c1", "s2", 40, 50), ("st3", "c1", "s4", 22, 25),
#         ("st4", "c1", "s1", 15, 25), ("st4", "c1", "s2", 28, 50), ("st4", "c1", "s4", 17, 25),
#         ("st5", "c1", "s1", 24, 25), ("st5", "c1", "s2", 48, 50), ("st5", "c1", "s4", 24, 25),
#         ("st6", "c2", "s1", 17, 25), ("st6", "c2", "s4", 18, 25), ("st7", "c2", "s1", 22, 25),
#         ("st7", "c2", "s4", 21, 25), ("st8", "c2", "s1", 14, 25), ("st8", "c2", "s4", 16, 25),
#         ("st9", "c2", "s1", 20, 25), ("st9", "c2", "s4", 22, 25), ("st10", "c2", "s1", 23, 25),
#         ("st10", "c2", "s4", 19, 25), ("st11", "c3", "s2", 21, 25), ("st11", "c3", "s7", 24, 25),
#         ("st12", "c3", "s2", 19, 25), ("st12", "c3", "s7", 22, 25), ("st13", "c3", "s2", 23, 25),
#         ("st13", "c3", "s7", 20, 25), ("st14", "c3", "s2", 16, 25), ("st14", "c3", "s7", 18, 25),
#         ("st15", "c4", "s6", 22, 25), ("st15", "c4", "s1", 20, 25), ("st16", "c4", "s6", 20, 25),
#         ("st16", "c4", "s1", 17, 25), ("st17", "c4", "s6", 19, 25), ("st17", "c4", "s1", 21, 25),
#         ("st18", "c4", "s6", 23, 25), ("st18", "c4", "s1", 24, 25),
#     ]
#     for index, (sid, class_id, subject_id, mark, total) in enumerate(marks, start=1):
#         db.add(models.MarksRecord(id=f"m{index}", student_id=sid, class_id=class_id, subject_id=subject_id, exam_type="unit", marks=mark, total_marks=total, date=date(2026, 5, 10 + (index % 5)), teacher_id="system"))

#     db.commit()
from __future__ import annotations

from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

from . import models
from .security import hash_password


def seed_demo_data(db: Session) -> None:
    if db.query(models.User).first():
        return

    # --- TURN OFF FOREIGN KEY CHECKS FOR SEEDING ---
    db.execute(text("PRAGMA foreign_keys = OFF;"))

    try:
        departments = [
            models.Department(id="d1", name="Science & Technology", code="SCI", head_teacher_id="t1"),
            models.Department(id="d2", name="Humanities & Arts", code="HUM", head_teacher_id="t3"),
            models.Department(id="d3", name="Commerce & Management", code="COM", head_teacher_id="t4"),
        ]
        subjects = [
            models.Subject(id="s1", name="Mathematics", code="MATH", department_id="d1"),
            models.Subject(id="s2", name="Physics", code="PHY", department_id="d1"),
            models.Subject(id="s3", name="Chemistry", code="CHEM", department_id="d1"),
            models.Subject(id="s4", name="English", code="ENG", department_id="d2"),
            models.Subject(id="s5", name="History", code="HIST", department_id="d2"),
            models.Subject(id="s6", name="Economics", code="ECON", department_id="d3"),
            models.Subject(id="s7", name="Computer Science", code="CS", department_id="d1"),
        ]
        teachers = [
            models.Teacher(id="t1", user_id="u2", name="John Smith", email="teacher@eduai.com", employee_id="EMP001", department_id="d1", subjects=["s1", "s7"], assigned_classes=["c1", "c2"], phone="555-0101", qualification="M.Sc Mathematics", join_date=date(2019, 6, 1), status="active", designation="Senior Teacher & HOD Science"),
            models.Teacher(id="t2", user_id="u3", name="Sarah Johnson", email="sarah@eduai.com", employee_id="EMP002", department_id="d1", subjects=["s2", "s3"], assigned_classes=["c1", "c3"], phone="555-0102", qualification="M.Sc Physics", join_date=date(2020, 7, 15), status="active", designation="Teacher"),
            models.Teacher(id="t3", user_id="u4", name="Emily Davis", email="emily@eduai.com", employee_id="EMP003", department_id="d2", subjects=["s4", "s5"], assigned_classes=["c2", "c3"], phone="555-0103", qualification="M.A English Literature", join_date=date(2018, 4, 10), status="active", designation="Senior Teacher & HOD Humanities"),
            models.Teacher(id="t4", user_id="u5", name="Robert Chen", email="robert@eduai.com", employee_id="EMP004", department_id="d3", subjects=["s6"], assigned_classes=["c4"], phone="555-0104", qualification="MBA", join_date=date(2021, 1, 20), status="active", designation="Teacher & HOD Commerce"),
        ]
        classes = [
            models.ClassRoom(id="c1", name="Grade 10 - A", grade="10", section="A", class_teacher_id="t1", department_id="d1", subject_teachers=[{"subjectId": "s1", "teacherId": "t1"}, {"subjectId": "s2", "teacherId": "t2"}, {"subjectId": "s4", "teacherId": "t3"}], student_ids=["st1", "st2", "st3", "st4", "st5"], academic_year="2025-2026"),
            models.ClassRoom(id="c2", name="Grade 10 - B", grade="10", section="B", class_teacher_id="t3", department_id="d2", subject_teachers=[{"subjectId": "s1", "teacherId": "t1"}, {"subjectId": "s4", "teacherId": "t3"}, {"subjectId": "s5", "teacherId": "t3"}], student_ids=["st6", "st7", "st8", "st9", "st10"], academic_year="2025-2026"),
            models.ClassRoom(id="c3", name="Grade 11 - A", grade="11", section="A", class_teacher_id="t2", department_id="d1", subject_teachers=[{"subjectId": "s2", "teacherId": "t2"}, {"subjectId": "s7", "teacherId": "t1"}, {"subjectId": "s4", "teacherId": "t3"}], student_ids=["st11", "st12", "st13", "st14"], academic_year="2025-2026"),
            models.ClassRoom(id="c4", name="Grade 11 - B", grade="11", section="B", class_teacher_id="t4", department_id="d3", subject_teachers=[{"subjectId": "s6", "teacherId": "t4"}, {"subjectId": "s4", "teacherId": "t3"}, {"subjectId": "s1", "teacherId": "t1"}], student_ids=["st15", "st16", "st17", "st18"], academic_year="2025-2026"),
        ]

        db.add_all(departments)
        db.add_all(subjects)
        db.add_all(teachers)
        db.add_all(classes)

        students = [
            ("st1", "Alice Brown", "10A001", "c1", "alice@student.edu", "female"),
            ("st2", "Bob Wilson", "10A002", "c1", "bob@student.edu", "male"),
            ("st3", "Carol Martinez", "10A003", "c1", "carol@student.edu", "female"),
            ("st4", "David Lee", "10A004", "c1", "david@student.edu", "male"),
            ("st5", "Emma Taylor", "10A005", "c1", "emma@student.edu", "female"),
            ("st6", "Frank Anderson", "10B001", "c2", "frank@student.edu", "male"),
            ("st7", "Grace Thomas", "10B002", "c2", "grace@student.edu", "female"),
            ("st8", "Henry Jackson", "10B003", "c2", "henry@student.edu", "male"),
            ("st9", "Isabella White", "10B004", "c2", "isabella@student.edu", "female"),
            ("st10", "Jack Harris", "10B005", "c2", "jack@student.edu", "male"),
            ("st11", "Kate Martin", "11A001", "c3", "kate@student.edu", "female"),
            ("st12", "Liam Garcia", "11A002", "c3", "liam@student.edu", "male"),
            ("st13", "Mia Robinson", "11A003", "c3", "mia@student.edu", "female"),
            ("st14", "Noah Clark", "11A004", "c3", "noah@student.edu", "male"),
            ("st15", "Olivia Lewis", "11B001", "c4", "olivia@student.edu", "female"),
            ("st16", "Peter Walker", "11B002", "c4", "peter@student.edu", "male"),
            ("st17", "Quinn Hall", "11B003", "c4", "quinn@student.edu", "female"),
            ("st18", "Ryan Allen", "11B004", "c4", "ryan@student.edu", "male"),
        ]

        users = [
            models.User(id="u1", name="Dr. Admin Principal", email="admin@eduai.com", role="admin", password_hash=hash_password("admin"), teacher_id=None, status="active"),
            models.User(id="u2", name="John Smith", email="teacher@eduai.com", role="teacher", password_hash=hash_password("teacher"), teacher_id="t1", status="active"),
            models.User(id="u3", name="Sarah Johnson", email="sarah@eduai.com", role="teacher", password_hash=hash_password("teacher"), teacher_id="t2", status="active"),
            models.User(id="u4", name="Emily Davis", email="emily@eduai.com", role="teacher", password_hash=hash_password("teacher"), teacher_id="t3", status="active"),
            models.User(id="u5", name="Robert Chen", email="robert@eduai.com", role="teacher", password_hash=hash_password("teacher"), teacher_id="t4", status="active"),
        ]

        db.add_all([
            models.Student(id=sid, name=name, roll=roll, class_id=class_id, email=email, phone="555-1000", parent_name="Parent", parent_phone="555-2000", address="Demo address", dob=date(2008, 1, 1), gender=gender, admission_date=date(2023, 6, 1), blood_group="O+", status="active")
            for sid, name, roll, class_id, email, gender in students
        ])
        db.add_all(users)

        db.add_all([
            models.Assignment(id="a1", title="Quadratic Equations Practice", description="Solve 20 problems on quadratic equations.", class_id="c1", subject_id="s1", teacher_id="t1", due_date=date(2026, 6, 20), created_date=date(2026, 6, 10), total_marks=20, status="active", instructions="Show all working."),
            models.Assignment(id="a2", title="Newton's Laws Essay", description="Write a 500-word essay on Newton's laws.", class_id="c1", subject_id="s2", teacher_id="t2", due_date=date(2026, 6, 18), created_date=date(2026, 6, 8), total_marks=25, status="active", instructions="Include real examples."),
            models.Assignment(id="a3", title="Shakespeare Analysis", description="Analyze ambition and power in Macbeth.", class_id="c2", subject_id="s4", teacher_id="t3", due_date=date(2026, 6, 22), created_date=date(2026, 6, 9), total_marks=30, status="active", instructions="Reference specific scenes."),
        ])
        db.add_all([
            models.Submission(id="sub1", assignment_id="a1", student_id="st1", submitted_date=date(2026, 6, 12), content="Completed all problems.", marks=18, feedback="Excellent work!", status="graded"),
            models.Submission(id="sub2", assignment_id="a1", student_id="st2", submitted_date=date(2026, 6, 13), content="Submitted assignment.", marks=None, feedback="", status="submitted"),
            models.Submission(id="sub3", assignment_id="a2", student_id="st1", submitted_date=date(2026, 6, 11), content="Essay submitted.", marks=22, feedback="Good examples.", status="graded"),
        ])

        attendance_statuses = {
            "st1": ["present", "present", "present"],
            "st2": ["present", "present", "late"],
            "st3": ["present", "absent", "present"],
            "st4": ["present", "present", "absent"],
            "st5": ["late", "present", "present"],
            "st6": ["present", "present", "present"],
            "st7": ["present", "present", "late"],
            "st8": ["present", "late", "absent"],
            "st9": ["present", "present", "present"],
            "st10": ["absent", "present", "late"],
        }
        for sid in [s[0] for s in students]:
            attendance_statuses.setdefault(sid, ["present", "present", "present"])
        for day_index, att_date in enumerate([date(2026, 6, 8), date(2026, 6, 9), date(2026, 6, 10)]):
            for sid, _, _, class_id, _, _ in students:
                db.add(models.AttendanceRecord(id=f"att{day_index}_{sid}", student_id=sid, class_id=class_id, date=att_date, status=attendance_statuses[sid][day_index], marked_by="system"))

        marks = [
            ("st1", "c1", "s1", 22, 25), ("st1", "c1", "s2", 43, 50), ("st1", "c1", "s4", 21, 25),
            ("st2", "c1", "s1", 18, 25), ("st2", "c1", "s2", 36, 50), ("st2", "c1", "s4", 19, 25),
            ("st3", "c1", "s1", 20, 25), ("st3", "c1", "s2", 40, 50), ("st3", "c1", "s4", 22, 25),
            ("st4", "c1", "s1", 15, 25), ("st4", "c1", "s2", 28, 50), ("st4", "c1", "s4", 17, 25),
            ("st5", "c1", "s1", 24, 25), ("st5", "c1", "s2", 48, 50), ("st5", "c1", "s4", 24, 25),
            ("st6", "c2", "s1", 17, 25), ("st6", "c2", "s4", 18, 25), ("st7", "c2", "s1", 22, 25),
            ("st7", "c2", "s4", 21, 25), ("st8", "c2", "s1", 14, 25), ("st8", "c2", "s4", 16, 25),
            ("st9", "c2", "s1", 20, 25), ("st9", "c2", "s4", 22, 25), ("st10", "c2", "s1", 23, 25),
            ("st10", "c2", "s4", 19, 25), ("st11", "c3", "s2", 21, 25), ("st11", "c3", "s7", 24, 25),
            ("st12", "c3", "s2", 19, 25), ("st12", "c3", "s7", 22, 25), ("st13", "c3", "s2", 23, 25),
            ("st13", "c3", "s7", 20, 25), ("st14", "c3", "s2", 16, 25), ("st14", "c3", "s7", 18, 25),
            ("st15", "c4", "s6", 22, 25), ("st15", "c4", "s1", 20, 25), ("st16", "c4", "s6", 20, 25),
            ("st16", "c4", "s1", 17, 25), ("st17", "c4", "s6", 19, 25), ("st17", "c4", "s1", 21, 25),
            ("st18", "c4", "s6", 23, 25), ("st18", "c4", "s1", 24, 25),
        ]
        for index, (sid, class_id, subject_id, mark, total) in enumerate(marks, start=1):
            db.add(models.MarksRecord(id=f"m{index}", student_id=sid, class_id=class_id, subject_id=subject_id, exam_type="unit", marks=mark, total_marks=total, date=date(2026, 5, 10 + (index % 5)), teacher_id="system"))

        # Save all data
        db.commit()

    finally:
        # --- ALWAYS TURN FOREIGN KEY CHECKS BACK ON ---
        db.execute(text("PRAGMA foreign_keys = ON;"))