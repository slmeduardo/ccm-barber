// Comentado: imports removidos pois não são mais necessários
// import { type ChartConfig } from "@/components/ui/chart";
// import { useAuth } from "@/contexts/AuthContext";
// import { useServiceStats, useWebUsers } from "@/hooks/useFirestore";
// import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function Dashboard() {
  // Comentado: obrigação de login removida
  // const { user: authUser } = useAuth();
  // const { webUsers } = useWebUsers();
  // const { serviceStats, loading: statsLoading } = useServiceStats();
  // const webUser = webUsers.find((user) => user.user_id === authUser?.user_id);
  const location = useLocation();
  // Comentado: variáveis removidas pois não são mais necessárias
  // const [selectedEmployee, setSelectedEmployee] = useState<string>("todos");
  // const chartConfig = {
  //   services: {
  //     label: "Serviços",
  //     color: "#2563eb",
  //   },
  // } satisfies ChartConfig;
  // const servicesChartData = serviceStats.byMonth.map((item) => ({
  //   month: item.month,
  //   services: item.count,
  // }));

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
      <header className="bg-card shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <Link
                to="/"
                className="flex items-center text-primary hover:text-primary/80 transition-colors"
              >
                <img
                  src="/uploads/3938081c-f339-4921-b90f-f5ff2a42361d.png"
                  alt="Logo"
                  className="w-16 h-16"
                />
              </Link>
            </div>

            <nav className="flex space-x-4">
              <Link
                to="/dashboard/management"
                className={`flex text-sm items-center px-4 py-2 rounded-md transition-colors ${
                  getActiveTab() === "management"
                    ? "text-primary-foreground"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <span>Manutenção</span>
              </Link>
              <Link
                to="/dashboard/schedules"
                className={`flex text-sm items-center px-4 py-2 rounded-md transition-colors ${
                  getActiveTab() === "schedules"
                    ? "text-primary-foreground"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <span>Calendário</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">user</div>
        </div>
      </header>

      <div className="container mx-auto px-4">
        <Outlet />
      </div>
    </div>
  );
}
