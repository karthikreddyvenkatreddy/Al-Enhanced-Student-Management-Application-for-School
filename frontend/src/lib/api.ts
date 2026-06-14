const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

export function getToken() {
  return localStorage.getItem("eduai_token");
}

export function setToken(token: string) {
  localStorage.setItem("eduai_token", token);
}

export function clearToken() {
  localStorage.removeItem("eduai_token");
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined;

  if (hasBody && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = typeof payload === "object" && payload && "detail" in payload ? String(payload.detail) : "Request failed";
    throw new Error(detail);
  }

  return payload as T;
}

export interface StudentPrediction {
  studentId: string;
  studentName: string;
  roll: string;
  classId: string;
  className?: string;
  attendancePercentage: number;
  averageMarks: number;
  assignmentScore: number;
  marksCount: number;
  prediction: "High Performer" | "Average Performer" | "At Risk";
  confidence: number;
  riskLevel: "Low" | "Medium" | "High";
  factors: string[];
  recommendations: string[];
}

export interface PredictionSummary {
  studentsAnalysed: number;
  highPerformers: number;
  averagePerformers: number;
  atRisk: number;
  modelAccuracy: number;
  modelName: string;
  featureImportances: Record<string, number>;
  predictions: StudentPrediction[];
}

export interface AIReport {
  title: string;
  scope: string;
  generatedAt: string;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  academicInsights: string[];
  recommendations: string[];
  parentSuggestions: string[];
  prediction?: StudentPrediction;
  reportText: string;
}
