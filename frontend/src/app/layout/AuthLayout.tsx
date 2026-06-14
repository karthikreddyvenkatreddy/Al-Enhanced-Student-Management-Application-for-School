import { Outlet } from "react-router";
import { GraduationCap } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">EduERP</h1>
          <p className="text-muted-foreground mt-2">Institution Management System</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
