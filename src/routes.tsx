import { Navigate, createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./contexts/AuthContext";
import Appointments from "./pages/Appointments";
import { AuthPage } from "./pages/AuthPage";
import Book from "./pages/Book";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Management from "./pages/Management";
import Schedules from "./pages/Schedules";
import Services from "./pages/Services";
import Team from "./pages/Team";

// Componente para proteger rotas que precisam de autenticação
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

// Componente para proteger rotas que precisam de permissão de admin
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Index />,
      },
      {
        path: "/auth",
        element: <AuthPage />,
      },
      {
        path: "/services",
        element: (
          <PrivateRoute>
            <Services />
          </PrivateRoute>
        ),
      },
      {
        path: "/team",
        element: (
          <PrivateRoute>
            <Team />
          </PrivateRoute>
        ),
      },
      {
        path: "/book",
        element: (
          <PrivateRoute>
            <Book />
          </PrivateRoute>
        ),
      },
      {
        path: "/appointments",
        element: (
          <PrivateRoute>
            <Appointments />
          </PrivateRoute>
        ),
      },
      {
        path: "/schedules",
        element: (
          <AdminRoute>
            <Navigate to="/dashboard/schedules" replace />
          </AdminRoute>
        ),
      },
      {
        path: "/management",
        element: (
          <AdminRoute>
            <Navigate to="/dashboard/management" replace />
          </AdminRoute>
        ),
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <AdminRoute>
        <Dashboard />
      </AdminRoute>
    ),
    children: [
      {
        path: "management",
        element: <Management />,
      },
      {
        path: "schedules",
        element: <Schedules />,
      },
    ],
  },
]);
