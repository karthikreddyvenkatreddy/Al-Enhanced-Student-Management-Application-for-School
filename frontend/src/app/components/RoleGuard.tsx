import { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { Role } from "../../contexts/DataContext";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: string;
}

export function RoleGuard({ allowedRoles, children, fallback = "/" }: RoleGuardProps) {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role as Role)) {
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}
