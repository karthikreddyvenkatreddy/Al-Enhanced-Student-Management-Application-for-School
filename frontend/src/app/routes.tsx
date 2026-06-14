import { createBrowserRouter, Navigate } from "react-router";
import { MainLayout } from "./layout/MainLayout";
import { AuthLayout } from "./layout/AuthLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RoleGuard } from "./components/RoleGuard";
import { Dashboard } from "./pages/Dashboard";
import { StudentList } from "./pages/students/StudentList";
import { AddStudent } from "./pages/students/AddStudent";
import { EditStudent } from "./pages/students/EditStudent";
import { StudentProfile } from "./pages/students/StudentProfile";
import { AttendanceDashboard } from "./pages/attendance/AttendanceDashboard";
import { MarkAttendance } from "./pages/attendance/MarkAttendance";
import { MarksEntry } from "./pages/marks/MarksEntry";
import { MarksTable } from "./pages/marks/MarksTable";
import { Performance } from "./pages/Performance";
import { AIPrediction } from "./pages/AIPrediction";
import { PredictionResult } from "./pages/ai-prediction/PredictionResult";
import { AIReports } from "./pages/AIReports";
import { AIReportGenerator } from "./pages/ai-reports/AIReportGenerator";
import { Teachers } from "./pages/Teachers";
import { Classes } from "./pages/Classes";
import { Departments } from "./pages/Departments";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/auth/Login";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { AssignmentList } from "./pages/assignments/AssignmentList";
import { CreateAssignment } from "./pages/assignments/CreateAssignment";
import { AssignmentDetail } from "./pages/assignments/AssignmentDetail";
import { UserManagement } from "./pages/users/UserManagement";

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: AuthLayout,
    children: [
      { index: true, Component: Login },
      { path: "login", Component: Login },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password", Component: ResetPassword },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "students", Component: StudentList },
      { path: "students/add", Component: AddStudent },
      { path: "students/edit/:id", Component: EditStudent },
      { path: "students/:id", Component: StudentProfile },
      { path: "attendance", Component: AttendanceDashboard },
      { path: "attendance/mark", Component: MarkAttendance },
      { path: "marks", Component: MarksTable },
      { path: "marks/entry", Component: MarksEntry },
      { path: "performance", Component: Performance },
      { path: "assignments", Component: AssignmentList },
      { path: "assignments/create", Component: CreateAssignment },
      { path: "assignments/:id", Component: AssignmentDetail },
      { path: "ai-prediction", Component: AIPrediction },
      { path: "ai-prediction/result", Component: PredictionResult },
      { path: "ai-reports", Component: AIReports },
      { path: "ai-reports/generate", Component: AIReportGenerator },
      { path: "teachers", element: <RoleGuard allowedRoles={["admin"]}><Teachers /></RoleGuard> },
      { path: "classes", element: <RoleGuard allowedRoles={["admin"]}><Classes /></RoleGuard> },
      { path: "departments", element: <RoleGuard allowedRoles={["admin"]}><Departments /></RoleGuard> },
      { path: "users", element: <RoleGuard allowedRoles={["admin"]}><UserManagement /></RoleGuard> },
      { path: "settings", Component: Settings },
    ],
  },
]);
