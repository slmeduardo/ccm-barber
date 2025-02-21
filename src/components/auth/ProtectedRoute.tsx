import { useAuth, UserRole } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({
  children,
  allowedRoles = ["user", "admin"],
}: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Original role check code:
  if (!allowedRoles.includes(role as UserRole)) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
};
