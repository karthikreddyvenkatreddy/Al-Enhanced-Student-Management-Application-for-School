# from __future__ import annotations

# from datetime import UTC, datetime
# from pathlib import Path
# from statistics import mean
# from typing import Iterable

# import joblib
# from sqlalchemy.orm import Session

# from . import models, schemas


# PROJECT_ROOT = Path(__file__).resolve().parents[2]
# MODEL_PATH = PROJECT_ROOT / "ml" / "artifacts" / "student_performance_model.joblib"


# def _load_artifact() -> dict:
#     if not MODEL_PATH.exists():
#         return {
#             "model": None,
#             "features": ["attendance_percentage", "average_marks", "assignment_score", "marks_count"],
#             "accuracy": 0.0,
#             "feature_importances": {"attendance_percentage": 0.4, "average_marks": 0.45, "assignment_score": 0.1, "marks_count": 0.05},
#             "model_name": "Rule fallback - train ml/train_model.py",
#         }
#     return joblib.load(MODEL_PATH)


# def _round(value: float) -> float:
#     return round(float(value), 2)


# def _student_average(db: Session, student_id: str) -> tuple[float, int]:
#     rows = db.query(models.MarksRecord).filter(models.MarksRecord.student_id == student_id).all()
#     percentages = [(row.marks / row.total_marks) * 100 for row in rows if row.total_marks]
#     return (_round(mean(percentages)) if percentages else 0.0, len(percentages))


# def _attendance_rate(db: Session, student_id: str) -> float:
#     rows = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id == student_id).all()
#     if not rows:
#         return 0.0
#     score = sum(1 for row in rows if row.status == "present") + sum(0.5 for row in rows if row.status == "late")
#     return _round((score / len(rows)) * 100)


# def _assignment_score(db: Session, student_id: str) -> float:
#     submissions = db.query(models.Submission).filter(models.Submission.student_id == student_id).all()
#     scores: list[float] = []
#     for submission in submissions:
#         if submission.marks is None:
#             continue
#         assignment = db.get(models.Assignment, submission.assignment_id)
#         if assignment and assignment.total_marks:
#             scores.append((submission.marks / assignment.total_marks) * 100)
#     return _round(mean(scores)) if scores else 0.0


# def _fallback_prediction(attendance: float, average: float, assignment_score: float) -> tuple[str, float]:
#     score = average * 0.55 + attendance * 0.35 + assignment_score * 0.10
#     if score >= 75 and attendance >= 80:
#         return "High Performer", min(94.0, 70 + abs(score - 75) * 1.2)
#     if score >= 55 and attendance >= 65:
#         return "Average Performer", min(88.0, 60 + abs(score - 55) * 0.9)
#     return "At Risk", min(92.0, 62 + abs(55 - score) * 1.1)


# def _insights(prediction: str, attendance: float, average: float, assignment_score: float, marks_count: int) -> tuple[list[str], list[str]]:
#     factors: list[str] = []
#     recommendations: list[str] = []

#     if average >= 80:
#         factors.append(f"Strong academic average of {average:.0f}%.")
#         recommendations.append("Provide enrichment work and leadership opportunities.")
#     elif average >= 55:
#         factors.append(f"Moderate academic average of {average:.0f}%.")
#         recommendations.append("Use targeted practice for weaker subjects and review progress weekly.")
#     else:
#         factors.append(f"Academic average is low at {average:.0f}%.")
#         recommendations.append("Start a focused revision plan and schedule remedial support.")

#     if attendance >= 85:
#         factors.append(f"Healthy attendance rate of {attendance:.0f}%.")
#     elif attendance >= 70:
#         factors.append(f"Attendance is borderline at {attendance:.0f}%.")
#         recommendations.append("Monitor attendance and contact parents if absences continue.")
#     else:
#         factors.append(f"Attendance is a major risk at {attendance:.0f}%.")
#         recommendations.append("Arrange a parent-teacher meeting to address attendance barriers.")

#     if assignment_score:
#         factors.append(f"Assignment performance is {assignment_score:.0f}%.")
#     else:
#         factors.append("No graded assignment score is available yet.")
#         recommendations.append("Add graded assignment submissions to improve prediction quality.")

#     if marks_count < 2:
#         factors.append("Prediction is based on limited marks data.")

#     if prediction == "At Risk":
#         recommendations.append("Create a 30-day intervention plan with measurable goals.")

#     return factors, list(dict.fromkeys(recommendations))


# def _prediction_for_student(db: Session, student: models.Student, artifact: dict) -> schemas.StudentPredictionOut:
#     average, marks_count = _student_average(db, student.id)
#     attendance = _attendance_rate(db, student.id)
#     assignment_score = _assignment_score(db, student.id)
#     features = [[attendance, average, assignment_score, marks_count]]
#     model = artifact.get("model")

#     if model is not None:
#         prediction = str(model.predict(features)[0])
#         confidence = 75.0
#         if hasattr(model, "predict_proba"):
#             confidence = _round(max(model.predict_proba(features)[0]) * 100)
#     else:
#         prediction, confidence = _fallback_prediction(attendance, average, assignment_score)
#         confidence = _round(confidence)

#     risk_level = "Low" if prediction == "High Performer" else "High" if prediction == "At Risk" else "Medium"
#     factors, recommendations = _insights(prediction, attendance, average, assignment_score, marks_count)
#     cls = db.get(models.ClassRoom, student.class_id)

#     return schemas.StudentPredictionOut(
#         studentId=student.id,
#         studentName=student.name,
#         roll=student.roll,
#         classId=student.class_id,
#         className=cls.name if cls else None,
#         attendancePercentage=attendance,
#         averageMarks=average,
#         assignmentScore=assignment_score,
#         marksCount=marks_count,
#         prediction=prediction,
#         confidence=confidence,
#         riskLevel=risk_level,
#         factors=factors,
#         recommendations=recommendations,
#     )


# def get_predictions(db: Session, students: Iterable[models.Student]) -> schemas.PredictionSummaryOut:
#     artifact = _load_artifact()
#     predictions = [_prediction_for_student(db, student, artifact) for student in students]
#     return schemas.PredictionSummaryOut(
#         studentsAnalysed=len(predictions),
#         highPerformers=sum(1 for row in predictions if row.prediction == "High Performer"),
#         averagePerformers=sum(1 for row in predictions if row.prediction == "Average Performer"),
#         atRisk=sum(1 for row in predictions if row.prediction == "At Risk"),
#         modelAccuracy=_round(float(artifact.get("accuracy") or 0) * 100),
#         modelName=str(artifact.get("model_name") or "Decision Tree Student Performance Classifier"),
#         featureImportances={key: _round(value * 100) for key, value in dict(artifact.get("feature_importances") or {}).items()},
#         predictions=predictions,
#     )


# def generate_report(db: Session, payload: schemas.AIReportRequest, allowed_students: list[models.Student]) -> schemas.AIReportOut:
#     if payload.studentId:
#         student = next((row for row in allowed_students if row.id == payload.studentId), None)
#         if not student:
#             raise ValueError("Student is not available in this scope")
#         prediction = get_predictions(db, [student]).predictions[0]
#         title = f"Student Performance Report - {prediction.studentName}"
#         scope = f"{prediction.studentName} ({prediction.roll})"
#         summary = (
#             f"{prediction.studentName} is currently classified as {prediction.prediction} with "
#             f"{prediction.confidence:.0f}% confidence. The model considered attendance "
#             f"({prediction.attendancePercentage:.0f}%), average marks ({prediction.averageMarks:.0f}%), "
#             f"assignment score ({prediction.assignmentScore:.0f}%), and available marks records."
#         )
#         strengths = [item for item in prediction.factors if "Strong" in item or "Healthy" in item]
#         improvements = [item for item in prediction.factors if item not in strengths]
#         academic_insights = prediction.factors
#         recommendations = prediction.recommendations
#         parent_suggestions = [
#             "Maintain regular communication with class teachers.",
#             "Review attendance and homework completion every week.",
#             "Encourage a fixed study schedule with short revision blocks.",
#         ]
#     else:
#         scoped = allowed_students
#         if payload.classId:
#             scoped = [row for row in allowed_students if row.class_id == payload.classId]
#         summary_data = get_predictions(db, scoped)
#         title = {
#             "attendance": "Attendance Analysis Report",
#             "risk": "At-Risk Student Report",
#             "performance": "Academic Performance Report",
#             "student": "Academic Performance Report",
#         }[payload.reportType]
#         scope = "Selected class" if payload.classId else "All accessible classes"
#         prediction = None
#         avg_marks = mean([row.averageMarks for row in summary_data.predictions]) if summary_data.predictions else 0
#         avg_attendance = mean([row.attendancePercentage for row in summary_data.predictions]) if summary_data.predictions else 0
#         summary = (
#             f"{summary_data.studentsAnalysed} students were analysed. Average marks are {avg_marks:.0f}% "
#             f"and average attendance is {avg_attendance:.0f}%. The model flagged "
#             f"{summary_data.atRisk} at-risk students, {summary_data.averagePerformers} average performers, "
#             f"and {summary_data.highPerformers} high performers."
#         )
#         strengths = [
#             f"{summary_data.highPerformers} students are ready for enrichment work.",
#             f"Average attendance is {avg_attendance:.0f}%.",
#         ]
#         improvements = [
#             f"{summary_data.atRisk} students require intervention.",
#             "Review students with low attendance and low average marks first.",
#         ]
#         academic_insights = [
#             f"Model used: {summary_data.modelName}.",
#             f"Reported model accuracy: {summary_data.modelAccuracy:.0f}%.",
#             "Prediction features: attendance, marks, assignment performance, and number of marks records.",
#         ]
#         recommendations = [
#             "Schedule weekly reviews for at-risk students.",
#             "Provide additional practice to average performers near the risk boundary.",
#             "Offer advanced assignments to high performers.",
#         ]
#         parent_suggestions = [
#             "Share attendance and marks summaries with parents.",
#             "Use parent meetings for students with repeated absences.",
#             "Create short, measurable home-study goals.",
#         ]

#     generated_at = datetime.now(UTC).isoformat()
#     report_text = _format_report(title, scope, generated_at, summary, strengths, improvements, academic_insights, recommendations, parent_suggestions)
#     return schemas.AIReportOut(
#         title=title,
#         scope=scope,
#         generatedAt=generated_at,
#         summary=summary,
#         strengths=strengths or ["Consistent data is available for analysis."],
#         areasForImprovement=improvements or ["Continue monitoring performance trends."],
#         academicInsights=academic_insights,
#         recommendations=recommendations,
#         parentSuggestions=parent_suggestions,
#         prediction=prediction,
#         reportText=report_text,
#     )


# def _format_report(
#     title: str,
#     scope: str,
#     generated_at: str,
#     summary: str,
#     strengths: list[str],
#     improvements: list[str],
#     insights: list[str],
#     recommendations: list[str],
#     parent_suggestions: list[str],
# ) -> str:
#     def section(name: str, rows: list[str]) -> str:
#         return f"\n{name}\n" + "\n".join(f"- {row}" for row in rows)

#     return (
#         f"{title}\n"
#         f"Scope: {scope}\n"
#         f"Generated: {generated_at}\n\n"
#         f"Performance Summary\n{summary}\n"
#         + section("Strengths", strengths or ["No major strength identified yet."])
#         + section("Areas for Improvement", improvements or ["Continue monitoring."])
#         + section("Academic Insights", insights)
#         + section("Recommendations", recommendations)
#         + section("Suggestions for Parents", parent_suggestions)
#     )
from __future__ import annotations

import warnings
from datetime import UTC, datetime
from pathlib import Path
from statistics import mean
from typing import Iterable

import joblib
from sqlalchemy.orm import Session

# Suppress sklearn logs due to local environment updates
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

from . import models, schemas

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "ml" / "artifacts" / "student_performance_model.joblib"


def _load_artifact() -> dict:
    if not MODEL_PATH.exists():
        return {
            "model": None,
            "features": ["attendance_percentage", "average_marks", "assignment_score", "marks_count"],
            "accuracy": 0.0,
            "feature_importances": {"attendance_percentage": 0.4, "average_marks": 0.45, "assignment_score": 0.1, "marks_count": 0.05},
            "model_name": "Rule fallback - train ml/train_model.py",
        }
    return joblib.load(MODEL_PATH)


def _round(value: float) -> float:
    return round(float(value), 2)


def _student_average(db: Session, student_id: str) -> tuple[float, int]:
    rows = db.query(models.MarksRecord).filter(models.MarksRecord.student_id == student_id).all()
    percentages = [(row.marks / row.total_marks) * 100 for row in rows if row.total_marks]
    return (_round(mean(percentages)) if percentages else 0.0, len(percentages))


def _attendance_rate(db: Session, student_id: str) -> float:
    rows = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id == student_id).all()
    if not rows:
        return 0.0
    score = sum(1 for row in rows if row.status == "present") + sum(0.5 for row in rows if row.status == "late")
    return _round((score / len(rows)) * 100)


def _assignment_score(db: Session, student_id: str) -> float:
    submissions = db.query(models.Submission).filter(models.Submission.student_id == student_id).all()
    scores: list[float] = []
    for submission in submissions:
        if submission.marks is None:
            continue
        assignment = db.get(models.Assignment, submission.assignment_id)
        if assignment and assignment.total_marks:
            scores.append((submission.marks / assignment.total_marks) * 100)
    return _round(mean(scores)) if scores else 0.0


def _fallback_prediction(attendance: float, average: float, assignment_score: float) -> tuple[str, float]:
    score = average * 0.55 + attendance * 0.35 + assignment_score * 0.10
    if score >= 75 and attendance >= 80:
        return "High Performer", min(94.0, 70 + abs(score - 75) * 1.2)
    if score >= 55 and attendance >= 65:
        return "Average Performer", min(88.0, 60 + abs(score - 55) * 0.9)
    return "At Risk", min(92.0, 62 + abs(55 - score) * 1.1)


def _insights(prediction: str, attendance: float, average: float, assignment_score: float, marks_count: int) -> tuple[list[str], list[str]]:
    factors: list[str] = []
    recommendations: list[str] = []

    if average >= 80:
        factors.append(f"Strong academic average of {average:.0f}%.")
        recommendations.append("Provide enrichment work and leadership opportunities.")
    elif average >= 55:
        factors.append(f"Moderate academic average of {average:.0f}%.")
        recommendations.append("Use targeted practice for weaker subjects and review progress weekly.")
    else:
        factors.append(f"Academic average is low at {average:.0f}%.")
        recommendations.append("Start a focused revision plan and schedule remedial support.")

    if attendance >= 85:
        factors.append(f"Healthy attendance rate of {attendance:.0f}%.")
    elif attendance >= 70:
        factors.append(f"Attendance is borderline at {attendance:.0f}%.")
        recommendations.append("Monitor attendance and contact parents if absences continue.")
    else:
        factors.append(f"Attendance is a major risk at {attendance:.0f}%.")
        recommendations.append("Arrange a parent-teacher meeting to address attendance barriers.")

    if assignment_score:
        factors.append(f"Assignment performance is {assignment_score:.0f}%.")
    else:
        factors.append("No graded assignment score is available yet.")
        recommendations.append("Add graded assignment submissions to improve prediction quality.")

    if marks_count < 2:
        factors.append("Prediction is based on limited marks data.")

    if prediction == "At Risk":
        recommendations.append("Create a 30-day intervention plan with measurable goals.")

    return factors, list(dict.fromkeys(recommendations))


def _prediction_for_student(db: Session, student: models.Student, artifact: dict) -> schemas.StudentPredictionOut:
    average, marks_count = _student_average(db, student.id)
    attendance = _attendance_rate(db, student.id)
    assignment_score = _assignment_score(db, student.id)
    features = [[attendance, average, assignment_score, marks_count]]
    model = artifact.get("model")

    if model is not None:
        prediction = str(model.predict(features)[0])
        confidence = 75.0
        if hasattr(model, "predict_proba"):
            confidence = _round(max(model.predict_proba(features)[0]) * 100)
    else:
        prediction, confidence = _fallback_prediction(attendance, average, assignment_score)
        confidence = _round(confidence)

    risk_level = "Low" if prediction == "High Performer" else "High" if prediction == "At Risk" else "Medium"
    factors, recommendations = _insights(prediction, attendance, average, assignment_score, marks_count)
    cls = db.get(models.ClassRoom, student.class_id)

    return schemas.StudentPredictionOut(
        studentId=student.id,
        studentName=student.name,
        roll=student.roll,
        classId=student.class_id,
        className=cls.name if cls else None,
        attendancePercentage=attendance,
        averageMarks=average,
        assignmentScore=assignment_score,
        marksCount=marks_count,
        prediction=prediction,
        confidence=confidence,
        riskLevel=risk_level,
        factors=factors,
        recommendations=recommendations,
    )


def get_predictions(db: Session, students: Iterable[models.Student]) -> schemas.PredictionSummaryOut:
    artifact = _load_artifact()
    predictions = [_prediction_for_student(db, student, artifact) for student in students]
    return schemas.PredictionSummaryOut(
        studentsAnalysed=len(predictions),
        highPerformers=sum(1 for row in predictions if row.prediction == "High Performer"),
        averagePerformers=sum(1 for row in predictions if row.prediction == "Average Performer"),
        atRisk=sum(1 for row in predictions if row.prediction == "At Risk"),
        modelAccuracy=_round(float(artifact.get("accuracy") or 0) * 100),
        modelName=str(artifact.get("model_name") or "Decision Tree Student Performance Classifier"),
        featureImportances={key: _round(value * 100) for key, value in dict(artifact.get("feature_importances") or {}).items()},
        predictions=predictions,
    )