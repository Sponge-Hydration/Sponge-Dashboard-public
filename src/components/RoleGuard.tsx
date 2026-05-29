import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthUser } from "@/services/firebaseService";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AuthUser['role'][];
  fallback?: string;
}

const RoleGuard = ({ children, allowedRoles, fallback = "/dashboard/me" }: RoleGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
