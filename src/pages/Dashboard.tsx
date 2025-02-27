import { useAuth } from "@/hooks/useAuth";
import { useWebUsers } from "@/hooks/useFirestore";
import { Clock, Home, LayoutDashboard, Settings } from "lucide-react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const { webUsers } = useWebUsers();
  const webUser = webUsers.find((user) => user.user_id === authUser?.uid);
  const location = useLocation();

  if (webUser?.isAdmin === false) {
    return <Navigate to="/" />;
  }

  // Determinar qual aba está ativa com base na URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/dashboard/management")) return "management";
    if (path.includes("/dashboard/schedules")) return "schedules";
    return "dashboard";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho do Dashboard */}
      <header className="bg-card shadow-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Painel de Administração</h1>
          <Link
            to="/"
            className="flex items-center text-primary hover:text-primary/80 transition-colors"
          >
            <Home className="mr-2 h-5 w-5" />
            <span>Voltar ao site</span>
          </Link>
        </div>
      </header>

      {/* Navegação do Dashboard */}
      <div className="container mx-auto px-4 py-6">
        <nav className="flex space-x-4 mb-8 border-b pb-2">
          <Link
            to="/dashboard"
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              getActiveTab() === "dashboard"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <LayoutDashboard className="mr-2 h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/dashboard/management"
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              getActiveTab() === "management"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Settings className="mr-2 h-5 w-5" />
            <span>Manutenção</span>
          </Link>
          <Link
            to="/dashboard/schedules"
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              getActiveTab() === "schedules"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Clock className="mr-2 h-5 w-5" />
            <span>Horários</span>
          </Link>
        </nav>

        {/* Conteúdo do Dashboard */}
        {location.pathname === "/dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Resumo</h2>
              <p className="text-muted-foreground">
                Painel em desenvolvimento. Aqui serão exibidas estatísticas e
                informações relevantes.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Agendamentos Recentes
              </h2>
              <p className="text-muted-foreground">
                Painel em desenvolvimento. Aqui serão exibidos os agendamentos
                mais recentes.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Usuários Ativos</h2>
              <p className="text-muted-foreground">
                Painel em desenvolvimento. Aqui serão exibidas informações sobre
                usuários ativos.
              </p>
            </div>
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
}
