
# from __future__ import annotations

# import os
# import json
# from datetime import UTC, datetime
# from statistics import mean
# from sqlalchemy.orm import Session
# from groq import Groq

# from . import models, schemas
# from .ml_service import get_predictions


# def _call_groq_structured_api(prompt: str) -> dict:
#     """Calls Groq and forces the model to return a structured JSON matching our report layout."""
#     if not os.environ.get("GROQ_API_KEY"):
#         return {
#             "summary": "API Key Missing", 
#             "strengths": ["Configuration needed."], 
#             "improvements": ["Verify .env file."], 
#             "insights": ["System offline."], 
#             "recommendations": ["Check host keys."], 
#             "parent_suggestions": ["Contact admin."]
#         }
        
#     try:
#         client = Groq()
        
#         # We enforce a JSON payload response format structure
#         completion = client.chat.completions.create(
#             model="llama-3.3-70b-versatile",
#             messages=[
#                 {
#                     "role": "system",
#                     "content": (
#                         "You are an academic analyzer. You must output raw JSON only matching this exact schema shape:\n"
#                         "{\n"
#                         "  \"summary\": \"string analysis summary\",\n"
#                         "  \"strengths\": [\"strength 1\", \"strength 2\"],\n"
#                         "  \"improvements\": [\"area 1\", \"area 2\"],\n"
#                         "  \"insights\": [\"insight 1\", \"insight 2\"],\n"
#                         "  \"recommendations\": [\"rec 1\", \"rec 2\"],\n"
#                         "  \"parent_suggestions\": [\"suggestion 1\", \"suggestion 2\"]\n"
#                         "}"
#                     )
#                 },
#                 {"role": "user", "content": prompt}
#             ],
#             response_format={"type": "json_object"},
#             temperature=0.2,
#         )
        
#         return json.loads(completion.choices[0].message.content)
#     except Exception as e:
#         # Emergency programmatic fallback if API fails
#         return {
#             "summary": f"System execution failed to complete: {str(e)}",
#             "strengths": ["Metrics calculations logged."],
#             "improvements": ["Upstream retry suggested."],
#             "insights": ["Pipeline evaluation skipped."],
#             "recommendations": ["Re-run report generation request."],
#             "parent_suggestions": ["Monitor metric adjustments via dashboard."]
#         }


# def generate_report(db: Session, payload: schemas.AIReportRequest, allowed_students: list[models.Student]) -> schemas.AIReportOut:
#     generated_at = datetime.now(UTC).isoformat()
    
#     if payload.studentId:
#         student = next((row for row in allowed_students if row.id == payload.studentId), None)
#         if not student:
#             raise ValueError("Student is not available in this scope")
            
#         prediction = get_predictions(db, [student]).predictions[0]
#         title = f"Student Performance Report - {prediction.studentName}"
#         scope = f"{prediction.studentName} ({prediction.roll})"
        
#         prompt = f"""
#         Perform an analytical profile evaluation for:
#         Student: {scope}
#         ML Prediction: Status is '{prediction.prediction}' with {prediction.confidence:.1f}% confidence.
#         Metrics Table:
#         - Attendance: {prediction.attendancePercentage:.1f}%
#         - Grades Average: {prediction.averageMarks:.1f}%
#         - Assignments Performance: {prediction.assignmentScore:.1f}%
#         - Total Records Loaded: {prediction.marksCount}
#         """
        
#         ai_data = _call_groq_structured_api(prompt)
        
#         # Pull values out dynamically from the LLM payload response
#         summary = ai_data.get("summary", f"Profile calculated for {prediction.studentName}.")
#         strengths = ai_data.get("strengths", [])
#         improvements = ai_data.get("improvements", [])
#         academic_insights = ai_data.get("insights", [])
#         recommendations = ai_data.get("recommendations", [])
#         parent_suggestions = ai_data.get("parent_suggestions", [])
        
#         # Build clean plain-text file schema for the text downloader backup tool
#         report_text = (
#             f"{title}\nScope: {scope}\nGenerated: {generated_at}\n\n"
#             f"PERFORMANCE SUMMARY\n{summary}\n\n"
#             f"STRENGTHS\n" + "\n".join(f"- {s}" for s in strengths) + "\n\n"
#             f"AREAS FOR IMPROVEMENT\n" + "\n".join(f"- {i}" for i in improvements) + "\n\n"
#             f"RECOMMENDATIONS\n" + "\n".join(f"- {r}" for r in recommendations) + "\n\n"
#             f"PARENT SUGGESTIONS\n" + "\n".join(f"- {p}" for p in parent_suggestions)
#         )
#         prediction_val = prediction

#     else:
#         scoped = allowed_students
#         if payload.classId:
#             scoped = [row for row in allowed_students if row.class_id == payload.classId]
            
#         summary_data = get_predictions(db, scoped)
#         title = {
#             "attendance": "Classroom Attendance Metrics Breakdown",
#             "risk": "At-Risk Population Evaluation Report",
#             "performance": "Classroom Academic Performance Ledger",
#             "student": "Classroom Academic Performance Ledger",
#         }.get(payload.reportType, "Academic Performance Matrix Summary")
        
#         scope = "Selected class" if payload.classId else "All accessible classes"
#         prediction_val = None
#         avg_marks = mean([row.averageMarks for row in summary_data.predictions]) if summary_data.predictions else 0
#         avg_attendance = mean([row.attendancePercentage for row in summary_data.predictions]) if summary_data.predictions else 0
        
#         prompt = f"""
#         Perform a strategic class cohort overview analysis:
#         Scope: {scope}
#         Total Population: {summary_data.studentsAnalysed} students tracked.
#         Averages: Marks are {avg_marks:.1f}%, Attendance is {avg_attendance:.1f}%.
#         Classifications Matrix: {summary_data.atRisk} At-Risk, {summary_data.averagePerformers} Average, {summary_data.highPerformers} High Performers.
#         """
        
#         ai_data = _call_groq_structured_api(prompt)
        
#         summary = ai_data.get("summary", f"Analysed performance parameters for {summary_data.studentsAnalysed} cohort accounts.")
#         strengths = ai_data.get("strengths", [])
#         improvements = ai_data.get("improvements", [])
#         academic_insights = ai_data.get("insights", [])
#         recommendations = ai_data.get("recommendations", [])
#         parent_suggestions = ai_data.get("parent_suggestions", [])
        
#         report_text = (
#             f"{title}\nScope: {scope}\nGenerated: {generated_at}\n\n"
#             f"COHORT SUMMARY\n{summary}\n\n"
#             f"STRENGTHS\n" + "\n".join(f"- {s}" for s in strengths) + "\n\n"
#             f"AREAS FOR IMPROVEMENT\n" + "\n".join(f"- {i}" for i in improvements) + "\n\n"
#             f"RECOMMENDATIONS\n" + "\n".join(f"- {r}" for r in recommendations) + "\n\n"
#             f"GROUP PARENT COORDINATION\n" + "\n".join(f"- {p}" for p in parent_suggestions)
#         )

#     return schemas.AIReportOut(
#         title=title,
#         scope=scope,
#         generatedAt=generated_at,
#         summary=summary,
#         strengths=strengths or ["Data matrices loaded into runtime."],
#         areasForImprovement=improvements or ["Monitor performance parameters."],
#         academicInsights=academic_insights or ["Consistent telemetry recorded."],
#         recommendations=recommendations or ["Review records via plain text download."],
#         parentSuggestions=parent_suggestions or ["No collective alert guidelines required."],
#         prediction=prediction_val,
#         reportText=report_text,
#     )
from __future__ import annotations

import os
import json
from datetime import UTC, datetime
from statistics import mean
from sqlalchemy.orm import Session
from groq import Groq

from . import models, schemas
from .ml_service import get_predictions


def _call_groq_structured_api(prompt: str) -> dict:
    """Calls Groq and forces the model to return a structured JSON matching our report layout."""
    if not os.environ.get("GROQ_API_KEY"):
        return {
            "summary": "AI Generation Error: GROQ_API_KEY environment variable is missing.", 
            "strengths": ["API configuration verified required."], 
            "improvements": ["Check backend .env credentials."], 
            "insights": ["Upstream connectivity check needed."], 
            "recommendations": ["Re-verify deployment keys."], 
            "parent_suggestions": ["Contact data infrastructure lead."]
        }
        
    try:
        client = Groq()
        
        # Enforce strict json schema syntax response shape mapping
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an elite academic metrics evaluator. You must analyze the data parameters and return a clean, detailed evaluation. "
                        "Your response must be raw JSON only matching this exact schema layout structure:\n"
                        "{\n"
                        "  \"summary\": \"A comprehensive multi-sentence performance summary text narrative.\",\n"
                        "  \"strengths\": [\"Bullet point strength 1\", \"Bullet point strength 2\"],\n"
                        "  \"improvements\": [\"Bullet point area for improvement 1\", \"Bullet point area for improvement 2\"],\n"
                        "  \"insights\": [\"Bullet point academic insight 1\", \"Bullet point academic insight 2\"],\n"
                        "  \"recommendations\": [\"Bullet point educator recommendation 1\", \"Bullet point educator recommendation 2\"],\n"
                        "  \"parent_suggestions\": [\"Bullet point parental structure suggestion 1\", \"Bullet point parental structure suggestion 2\"]\n"
                        "}"
                    )
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        return {
            "summary": f"System engine failed parsing live records safely: {str(e)}",
            "strengths": ["Review analytical system configurations."],
            "improvements": ["Upstream payload check required."],
            "insights": ["Local execution fallback activated."],
            "recommendations": ["Re-run the report generation pipeline query."],
            "parent_suggestions": ["Monitor student tracking metrics dashboards."]
        }


def generate_report(db: Session, payload: schemas.AIReportRequest, allowed_students: list[models.Student]) -> schemas.AIReportOut:
    generated_at = datetime.now(UTC).isoformat()
    
    if payload.studentId:
        student = next((row for row in allowed_students if row.id == payload.studentId), None)
        if not student:
            raise ValueError("Student is not available in this scope")
            
        prediction = get_predictions(db, [student]).predictions[0]
        title = f"Student Performance Report - {prediction.studentName}"
        scope = f"{prediction.studentName} ({prediction.roll})"
        
        prompt = f"""
        Perform a comprehensive, customized analytical profile evaluation for this student profile:
        Student Scope Profile: {scope}
        Machine Learning Prediction Status: Categorized as '{prediction.prediction}' with a model accuracy calculation confidence of {prediction.confidence:.1f}%.
        Live Quantitative Metrics Matrix:
        - Term Attendance Rate: {prediction.attendancePercentage:.1f}%
        - Academic Exam Grades Average: {prediction.averageMarks:.1f}%
        - Practical Assignments/Homework Baseline Score: {prediction.assignmentScore:.1f}%
        - Data Volume: Computed across {prediction.marksCount} total individual grade log records.
        
        Generate unique, highly accurate behavioral bullet points for all sections.
        """
        
        ai_data = _call_groq_structured_api(prompt)
        
        summary = ai_data.get("summary") or f"Profile metrics calculated for {prediction.studentName}."
        strengths = ai_data.get("strengths") or [f"Maintains a calculated marks baseline average of {prediction.averageMarks:.1f}%."]
        improvements = ai_data.get("improvements") or ["Review individual unit marks logs for edge risks."]
        academic_insights = ai_data.get("insights") or [f"Prediction profile evaluated using model baseline markers."]
        recommendations = ai_data.get("recommendations") or ["Track weekly assignment submittal loops."]
        parent_suggestions = ai_data.get("parent_suggestions") or ["Encourage continuous study review schedules at home structures."]
        
        # Build raw text backup string file download schema
        report_text = (
            f"{title}\nScope: {scope}\nGenerated: {generated_at}\n\n"
            f"PERFORMANCE SUMMARY\n{summary}\n\n"
            f"STRENGTHS\n" + "\n".join(f"- {s}" for s in strengths) + "\n\n"
            f"AREAS FOR IMPROVEMENT\n" + "\n".join(f"- {i}" for i in improvements) + "\n\n"
            f"ACADEMIC INSIGHTS\n" + "\n".join(f"- {n}" for n in academic_insights) + "\n\n"
            f"RECOMMENDATIONS\n" + "\n".join(f"- {r}" for r in recommendations) + "\n\n"
            f"PARENT SUGGESTIONS\n" + "\n".join(f"- {p}" for p in parent_suggestions)
        )
        prediction_val = prediction

    else:
        scoped = allowed_students
        if payload.classId:
            scoped = [row for row in allowed_students if row.class_id == payload.classId]
            
        summary_data = get_predictions(db, scoped)
        title = {
            "attendance": "Classroom Attendance Metrics Breakdown",
            "risk": "At-Risk Population Evaluation Report",
            "performance": "Classroom Academic Performance Ledger",
            "student": "Classroom Academic Performance Ledger",
        }.get(payload.reportType, "Academic Performance Matrix Summary")
        
        scope = "Selected class" if payload.classId else "All accessible classes"
        prediction_val = None
        avg_marks = mean([row.averageMarks for row in summary_data.predictions]) if summary_data.predictions else 0
        avg_attendance = mean([row.attendancePercentage for row in summary_data.predictions]) if summary_data.predictions else 0
        
        prompt = f"""
        Perform a deep cohort analysis for this group layout cluster:
        Target Scope: {scope}
        Total Enrollment Population: {summary_data.studentsAnalysed} students currently tracked.
        Cohort Level Statistical Averages:
        - Class Grade Marks Average: {avg_marks:.1f}%
        - Class Attendance Rate Average: {avg_attendance:.1f}%
        Local Model Classifier Distribution Matrix:
        - High Performers Cohort Group: {summary_data.highPerformers} students flagged.
        - Average Performers Cohort Group: {summary_data.averagePerformers} students flagged.
        - At-Risk Academic Population Group: {summary_data.atRisk} students flagged.
        
        Generate strategic programmatic summary lines and custom recommendations for this classroom group block.
        """
        
        ai_data = _call_groq_structured_api(prompt)
        
        summary = ai_data.get("summary") or f"Analysed classroom parameters across {summary_data.studentsAnalysed} cohort metrics."
        strengths = ai_data.get("strengths") or [f"Class structural attendance tracking averages hold at {avg_attendance:.1f}%."]
        improvements = ai_data.get("improvements") or [f"Intervention profiles requested to address {summary_data.atRisk} at-risk cases."]
        academic_insights = ai_data.get("insights") or [f"Cohort tracked via predictive engine: {summary_data.modelName}"]
        recommendations = ai_data.get("recommendations") or ["Allocate additional remedial tracking files to border cases."]
        parent_suggestions = ai_data.get("parent_suggestions") or ["Distribute unified quarterly metrics reviews to families."]
        
        report_text = (
            f"{title}\nScope: {scope}\nGenerated: {generated_at}\n\n"
            f"COHORT SUMMARY\n{summary}\n\n"
            f"STRENGTHS\n" + "\n".join(f"- {s}" for s in strengths) + "\n\n"
            f"AREAS FOR IMPROVEMENT\n" + "\n".join(f"- {i}" for i in improvements) + "\n\n"
            f"ACADEMIC INSIGHTS\n" + "\n".join(f"- {n}" for n in academic_insights) + "\n\n"
            f"RECOMMENDATIONS\n" + "\n".join(f"- {r}" for r in recommendations) + "\n\n"
            f"PARENT COORDINATION\n" + "\n".join(f"- {p}" for p in parent_suggestions)
        )

    # Cleaned return statement completely stripping out all static string array placeholders
    return schemas.AIReportOut(
        title=title,
        scope=scope,
        generatedAt=generated_at,
        summary=summary,
        strengths=strengths,
        areasForImprovement=improvements,
        academicInsights=academic_insights,
        recommendations=recommendations,
        parentSuggestions=parent_suggestions,
        prediction=prediction_val,
        reportText=report_text,
    )