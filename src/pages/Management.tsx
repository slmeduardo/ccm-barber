import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees, useFirestore, useServices } from "@/hooks/useFirestore";
import { db } from "@/lib/firebase";
import { User } from "@/types/user";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type ServiceType = {
  description: string;
  preco: number;
  service_duration: number;
  service_id: string;
  name: string;
};

const Management = () => {
  const { toast } = useToast();
  const { updateDocument, deleteDocument, listUsers, updateUserRole } =
    useFirestore();
  const { employees, loading: employeesLoading } = useEmployees();
  const { services, loading: servicesLoading } = useServices();
  const [initialLoading, setInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [team, setTeam] = useState<Employee[]>([]);
  const [editingService, setEditingService] = useState<ServiceType | null>(
    null
  );
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { role } = useAuth();
  const itemsPerPage = 20;

  const weekDays = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  // Extrair funcionários do primeiro grupo (assumindo que queremos todos os funcionários)
  const allEmployees = employees.length > 0 ? employees[0].employees : [];

  // Função para carregar o estado inicial dos checkboxes do Firestore
  const loadInitialCheckboxStates = async () => {
    try {
      const initialStates: { [key: string]: boolean } = {};

      // Pega o primeiro funcionário como referência
      if (employees[0]?.employees[0]) {
        const employeeName = employees[0].employees[0].employee_name;
        const employeeDoc = await getDoc(doc(db, "calendar", employeeName));

        if (employeeDoc.exists()) {
          const calendarData = employeeDoc.data();

          calendarData.calendar.forEach((dayObj: any) => {
            const date = new Date(dayObj.day);
            const dayOfWeek = date.getDay();
            const weekDay = weekDays[dayOfWeek];

            dayObj.day_time.forEach((timeSlot: any) => {
              const baseHour = timeSlot.hour.split(":")[0].padStart(2, "0");
              const key = `${weekDay}-${baseHour}:00`;

              // Define como true se não estiver marcado como "not_in_schedule"
              initialStates[key] =
                timeSlot.appointment_id !== "not_in_schedule";
            });
          });
        }
      }

      setCheckboxStates(initialStates);
      setInitialLoading(false);
    } catch (error) {
      console.error("Erro ao carregar estados iniciais:", error);
      setInitialLoading(false);
    }
  };

  // Carrega os estados iniciais quando o componente montar e employees estiver disponível
  useEffect(() => {
    if (employees.length > 0 && !employeesLoading) {
      loadInitialCheckboxStates();
    }
  }, [employees, employeesLoading]);

  const handleCheckboxChange = async (day: string, time: string) => {
    try {
      const key = `${day}-${time}`;
      const baseHour = time.split(":")[0].padStart(2, "0");

      // Atualiza o estado local
      setCheckboxStates((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));

      // Atualiza todos os funcionários
      for (const employeeGroup of employees) {
        for (const employee of employeeGroup.employees) {
          const employeeName = employee.employee_name;
          const employeeDoc = await getDoc(doc(db, "calendar", employeeName));

          if (!employeeDoc.exists()) continue;

          const existingData = employeeDoc.data();
          const updatedCalendar = existingData.calendar.map((dayObj: any) => {
            const date = new Date(dayObj.day);
            const dayOfWeek = date.getDay();
            const weekDay = weekDays[dayOfWeek];

            if (weekDay !== day) return dayObj;

            return {
              ...dayObj,
              day_time: dayObj.day_time.map((timeSlot: any) => {
                if (
                  timeSlot.appointment_id !== "" &&
                  timeSlot.appointment_id !== "not_in_schedule"
                ) {
                  return timeSlot;
                }

                const slotBaseHour = timeSlot.hour
                  .split(":")[0]
                  .padStart(2, "0");
                if (slotBaseHour === baseHour) {
                  return !checkboxStates[key]
                    ? {
                        appointment_id: "not_in_schedule",
                        client_id: "not_in_schedule",
                        hour: timeSlot.hour,
                        service: "not_in_schedule",
                      }
                    : {
                        appointment_id: "",
                        client_id: "none",
                        hour: timeSlot.hour,
                        service: "none",
                      };
                }

                return timeSlot;
              }),
            };
          });

          await updateDocument("calendar", employeeName, {
            ...existingData,
            calendar: updatedCalendar,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar horários:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar horário. Tente novamente.",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsUpdating(true);
      for (const employeeGroup of employees) {
        for (const employee of employeeGroup.employees) {
          const employeeName = employee.employee_name;

          const employeeDoc = await getDoc(doc(db, "calendar", employeeName));
          if (!employeeDoc.exists()) continue;

          const existingData = employeeDoc.data();
          const updatedCalendar = existingData.calendar.map(
            (dayObj: {
              day: string;
              day_time: Array<{
                appointment_id: string;
                client_id: string;
                hour: string;
                service: string;
              }>;
            }) => {
              const date = new Date(dayObj.day);
              const dayOfWeek = date.getDay();
              const weekDay = weekDays[dayOfWeek];

              return {
                ...dayObj,
                day_time: dayObj.day_time.map((timeSlot) => {
                  if (
                    timeSlot.appointment_id !== "" &&
                    timeSlot.appointment_id !== "not_in_schedule"
                  ) {
                    return timeSlot;
                  }

                  // Corrige o formato da hora base para garantir dois dígitos
                  const baseHour = timeSlot.hour.split(":")[0].padStart(2, "0");
                  const checkboxKey = `${weekDay}-${baseHour}:00`;
                  const isChecked =
                    checkboxStates[checkboxKey] ?? weekDay !== "Domingo";

                  return isChecked
                    ? {
                        appointment_id: "",
                        client_id: "none",
                        hour: timeSlot.hour,
                        service: "none",
                      }
                    : {
                        appointment_id: "not_in_schedule",
                        client_id: "not_in_schedule",
                        hour: timeSlot.hour,
                        service: "not_in_schedule",
                      };
                }),
              };
            }
          );

          await updateDocument("calendar", employeeName, {
            ...existingData,
            calendar: updatedCalendar,
          });
        }
      }
      toast({
        title: "Sucesso!",
        description: "Horários atualizados com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar horários:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar horários. Tente novamente.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Funções para gerenciar serviços
  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteDocument("services", serviceId);
      toast({
        title: "Sucesso!",
        description: "Serviço excluído com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir serviço.",
      });
    }
  };

  // Funções para gerenciar equipe
  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await deleteDocument("employees", employeeId);
      toast({
        title: "Sucesso!",
        description: "Funcionário excluído com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir funcionário.",
      });
    }
  };

  // Funções para gerenciar serviços
  const handleServiceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const serviceData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      service_duration: Number(formData.get("duration")),
      preco: Number(formData.get("preco")),
    };

    try {
      if (editingService) {
        await updateDocument(
          "services",
          editingService.service_id,
          serviceData
        );
        toast({
          title: "Sucesso!",
          description: "Serviço atualizado com sucesso.",
        });
      } else {
        // Para novo serviço, use o nome como ID
        await updateDocument("services", serviceData.name, serviceData);
        toast({
          title: "Sucesso!",
          description: "Serviço criado com sucesso.",
        });
      }
      setIsDialogOpen(false);
      setEditingService(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar serviço.",
      });
    }
  };

  // Funções para gerenciar equipe
  const handleEmployeeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const employeeData = {
      employee_name: formData.get("employee_name") as string,
      services: (formData.get("services") as string)
        .split(",")
        .map((s) => s.trim()),
    };

    try {
      if (editingEmployee) {
        // Atualizar funcionário existente no grupo
        const updatedEmployees = allEmployees.map((emp) =>
          emp.employee_id === editingEmployee.employee_id
            ? { ...emp, ...employeeData }
            : emp
        );

        await updateDocument("employees", employees[0].employee_id, {
          employees: updatedEmployees,
        });

        toast({
          title: "Sucesso!",
          description: "Funcionário atualizado com sucesso.",
        });
      } else {
        // Adicionar novo funcionário ao grupo
        const newEmployee = {
          ...employeeData,
          employee_id: Date.now().toString(), // ID único
        };

        await updateDocument("employees", employees[0].employee_id, {
          employees: [...allEmployees, newEmployee],
        });

        toast({
          title: "Sucesso!",
          description: "Funcionário adicionado com sucesso.",
        });
      }
      setIsEmployeeDialogOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar funcionário.",
      });
    }
  };

  // Função para carregar usuários
  const loadUsers = async () => {
    try {
      setIsSearching(true);
      const { users: fetchedUsers, total } = await listUsers(
        currentPage,
        itemsPerPage,
        searchTerm
      );
      setUsers(fetchedUsers);
      setTotalUsers(total);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar usuários.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Carregar usuários quando a página ou termo de busca mudar
  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  // Função para atualizar role do usuário
  const handleRoleUpdate = async (uid: string, newRole: "admin" | "user") => {
    try {
      await updateUserRole(uid, newRole);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.uid === uid ? { ...user, role: newRole } : user
        )
      );
      toast({
        title: "Sucesso",
        description: `Usuário atualizado para ${newRole}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar papel do usuário.",
      });
    }
  };

  if (employeesLoading || servicesLoading || initialLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-gray-200 mb-4">
            Gerenciamento
          </h1>
        </div>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="flex justify-center w-full h-16 bg-transparent mb-8">
            <TabsTrigger value="schedule">Horários</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    {weekDays.map((day) => (
                      <TableHead className="text-center" key={day}>
                        {day}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSlots.map((time) => (
                    <TableRow key={time}>
                      <TableCell className="font-medium">{time}</TableCell>
                      {weekDays.map((day) => (
                        <TableCell
                          key={`${day}-${time}`}
                          className="text-center"
                        >
                          <input
                            checked={
                              checkboxStates[`${day}-${time}`] ??
                              day !== "Domingo"
                            }
                            onChange={() => handleCheckboxChange(day, time)}
                            type="checkbox"
                            className="h-6 w-6 rounded border-border"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isUpdating}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Atualizando...
                  </span>
                ) : (
                  "Salvar Alterações"
                )}
              </button>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  setEditingService(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? "Editar Serviço" : "Novo Serviço"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleServiceSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingService?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      name="description"
                      defaultValue={editingService?.description}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">
                      Duração (em intervalos de 15min)
                    </Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      defaultValue={editingService?.service_duration}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preco">Preço</Label>
                    <Input
                      id="preco"
                      name="preco"
                      type="number"
                      step="0.01"
                      defaultValue={editingService?.preco}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingService ? "Atualizar" : "Criar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.service_id}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{service.description}</TableCell>
                      <TableCell>{service.service_duration * 15}min</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(service.preco)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingService(service);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirmar exclusão
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este serviço?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteService(service.service_id)
                                  }
                                >
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  setEditingEmployee(null);
                  setIsEmployeeDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Funcionário
              </Button>
            </div>

            <Dialog
              open={isEmployeeDialogOpen}
              onOpenChange={setIsEmployeeDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingEmployee
                      ? "Editar Funcionário"
                      : "Novo Funcionário"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_name">Nome</Label>
                    <Input
                      id="employee_name"
                      name="employee_name"
                      defaultValue={editingEmployee?.employee_name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="services">
                      Serviços (separados por vírgula)
                    </Label>
                    <Input
                      id="services"
                      name="services"
                      defaultValue={editingEmployee?.services.join(", ")}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingEmployee ? "Atualizar" : "Criar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEmployees.map((employee) => (
                    <TableRow key={employee.employee_id}>
                      <TableCell>{employee.employee_name}</TableCell>
                      <TableCell>{employee.services.join(", ")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingEmployee(employee);
                              setIsEmployeeDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirmar exclusão
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este
                                  funcionário?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteEmployee(employee.employee_id)
                                  }
                                >
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.displayName || "-"}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {role === "admin" && (
                            <Button
                              variant={
                                user.role === "admin"
                                  ? "destructive"
                                  : "default"
                              }
                              onClick={() =>
                                handleRoleUpdate(
                                  user.uid,
                                  user.role === "admin" ? "user" : "admin"
                                )
                              }
                              size="sm"
                            >
                              {user.role === "admin"
                                ? "Remover Admin"
                                : "Tornar Admin"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  {/* Adicione mais PaginationItems conforme necessário */}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) =>
                          p * itemsPerPage < totalUsers ? p + 1 : p
                        )
                      }
                      disabled={currentPage * itemsPerPage >= totalUsers}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </>
  );
};

export default Management;
