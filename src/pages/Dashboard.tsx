import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useServiceStats, useWebUsers } from "@/hooks/useFirestore";
import { Clock, Home, LayoutDashboard, Settings, Users } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const { webUsers } = useWebUsers();
  const { serviceStats, loading: statsLoading } = useServiceStats();
  const webUser = webUsers.find((user) => user.user_id === authUser?.uid);
  const location = useLocation();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("todos");

  console.log(serviceStats, "serviceStats");

  const chartConfig = {
    services: {
      label: "Serviços",
      color: "#2563eb",
    },
  } satisfies ChartConfig;

  // Dados para o gráfico geral de serviços por mês
  const servicesChartData = serviceStats.byMonth.map((item) => ({
    month: item.month,
    services: item.count,
  }));

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
            <span>Página Inicial</span>
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
          <div className="space-y-8">
            {/* Gráficos de Serviços */}
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Serviços Realizados nos Últimos 6 Meses
              </h2>

              <Tabs defaultValue="todos" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger
                    value="todos"
                    onClick={() => setSelectedEmployee("todos")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Todos os Funcionários
                  </TabsTrigger>

                  {serviceStats.totalByEmployee.map((employee) => (
                    <TabsTrigger
                      key={employee.employeeId}
                      value={employee.employeeId}
                      onClick={() => setSelectedEmployee(employee.employeeId)}
                    >
                      {employee.employeeName}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="todos" className="mt-0">
                  <div className="h-[400px]">
                    {statsLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <p>Carregando dados...</p>
                      </div>
                    ) : (
                      <ChartContainer
                        config={chartConfig}
                        className="h-full w-full"
                      >
                        <BarChart
                          data={servicesChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="services"
                            fill="var(--color-services)"
                            name="Serviços Realizados"
                            radius={4}
                          />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </div>
                </TabsContent>

                {serviceStats.totalByEmployee.map((employee) => (
                  <TabsContent
                    key={employee.employeeId}
                    value={employee.employeeId}
                    className="mt-0"
                  >
                    <div className="h-[400px]">
                      {statsLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <p>Carregando dados...</p>
                        </div>
                      ) : (
                        <ChartContainer
                          config={chartConfig}
                          className="h-full w-full"
                        >
                          <BarChart
                            data={serviceStats.byEmployee[
                              employee.employeeId
                            ]?.map((item) => ({
                              month: item.month,
                              services: item.count,
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="month"
                              tickLine={false}
                              tickMargin={10}
                              axisLine={false}
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="services"
                              fill="var(--color-services)"
                              name={`Serviços - ${employee.employeeName}`}
                              radius={4}
                            />
                          </BarChart>
                        </ChartContainer>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Resumo de Serviços por Funcionário */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  Serviços por Funcionário
                </h2>
                {statsLoading ? (
                  <p className="text-muted-foreground">Carregando dados...</p>
                ) : (
                  <div className="space-y-4">
                    {serviceStats.totalByEmployee.map((employee) => (
                      <div
                        key={employee.employeeId}
                        className="flex justify-between items-center"
                      >
                        <span className="font-medium">
                          {employee.employeeName}
                        </span>
                        <span className="text-primary font-bold">
                          {employee.count} serviços
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  Total de Serviços
                </h2>
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-primary">
                      {statsLoading
                        ? "..."
                        : serviceStats.byMonth.reduce(
                            (total, month) => total + month.count,
                            0
                          )}
                    </span>
                    <p className="text-muted-foreground mt-2">
                      nos últimos 6 meses
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Média Mensal</h2>
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-primary">
                      {statsLoading
                        ? "..."
                        : Math.round(
                            serviceStats.byMonth.reduce(
                              (total, month) => total + month.count,
                              0
                            ) / 6
                          )}
                    </span>
                    <p className="text-muted-foreground mt-2">
                      serviços por mês
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
}
