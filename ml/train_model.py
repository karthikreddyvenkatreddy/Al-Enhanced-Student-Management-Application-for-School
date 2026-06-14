from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier


ROOT = Path(__file__).resolve().parent
DATASET_PATH = ROOT / "student_performance_dataset.csv"
ARTIFACT_DIR = ROOT / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "student_performance_model.joblib"
METRICS_PATH = ARTIFACT_DIR / "metrics.txt"

FEATURE_COLUMNS = [
    "attendance_percentage",
    "average_marks",
    "assignment_score",
    "marks_count",
]
TARGET_COLUMN = "performance_category"


def train() -> None:
    df = pd.read_csv(DATASET_PATH)
    x = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y,
    )

    model = DecisionTreeClassifier(max_depth=4, min_samples_leaf=2, random_state=42)
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    accuracy = accuracy_score(y_test, predictions)
    importances = {
        feature: round(float(score), 4)
        for feature, score in zip(FEATURE_COLUMNS, model.feature_importances_)
    }

    ARTIFACT_DIR.mkdir(exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "features": FEATURE_COLUMNS,
            "labels": sorted(df[TARGET_COLUMN].unique().tolist()),
            "accuracy": round(float(accuracy), 4),
            "feature_importances": importances,
            "model_name": "Decision Tree Student Performance Classifier",
        },
        MODEL_PATH,
    )
    METRICS_PATH.write_text(
        "Decision Tree Student Performance Classifier\n"
        f"Accuracy: {accuracy:.4f}\n\n"
        "Feature importances:\n"
        + "\n".join(f"- {key}: {value}" for key, value in importances.items())
        + "\n\nClassification report:\n"
        + classification_report(y_test, predictions, zero_division=0),
        encoding="utf-8",
    )
    print(f"Saved model to {MODEL_PATH}")
    print(f"Accuracy: {accuracy:.4f}")


if __name__ == "__main__":
    train()
