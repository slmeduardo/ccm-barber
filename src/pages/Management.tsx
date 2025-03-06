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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  useEmployees,
  useFirestore,
  useServices,
  useWebUsers,
} from "@/hooks/useFirestore";
import { db } from "@/lib/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import * as z from "zod";

type ServiceType = {
  description: string;
  preco: number;
  service_duration: number;
  service_id: string;
  name: string;
};

type Employee = {
  employee_id: string;
  employee_name: string;
  services: string[];
};

// Definindo tipos para os objetos de calendário
type DayTimeSlot = {
  appointment_id: string;
  client_id: string;
  hour: string;
  service: string;
};

type CalendarDay = {
  day: string;
  day_time: DayTimeSlot[];
};

const serviceFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(2, "Descrição deve ter pelo menos 2 caracteres"),
  preco: z.coerce.number().min(0, "Preço deve ser maior que 0"),
  service_duration: z.coerce.number().min(1, "Duração deve ser maior que 0"),
});

const employeeFormSchema = z.object({
  employee_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  services: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
});

const Management = () => {
  const { toast } = useToast();
  const { updateDocument, deleteDocument } = useFirestore();
  const { employees, loading } = useEmployees();
  const [initialLoading, setInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState<{
    [key: string]: boolean;
  }>({});
  const { services, loading: loadingServices } = useServices();
  const [team, setTeam] = useState<Employee[]>([]);
  const { user: authUser } = useAuth();
  const { webUsers } = useWebUsers();
  const webUser = webUsers.find((user) => user.user_id === authUser?.uid);

  // Estados para os diálogos
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(
    null
  );
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Adicione esta variável de estado local para gerenciar serviços
  const [localServices, setLocalServices] = useState<ServiceType[]>([]);

  console.log("webUser", webUsers);

  // Formulários
  const serviceForm = useForm<z.infer<typeof serviceFormSchema>>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      preco: 0,
      service_duration: 1,
    },
  });

  const employeeForm = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employee_name: "",
      services: [],
    },
  });

  if (webUser?.isAdmin === false) {
    return <Navigate to="/" />;
  }

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
    "19:00",
  ];

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

          calendarData.calendar.forEach((dayObj: CalendarDay) => {
            const date = new Date(dayObj.day);
            const dayOfWeek = date.getDay();
            const weekDay = weekDays[dayOfWeek];

            dayObj.day_time.forEach((timeSlot: DayTimeSlot) => {
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

  // Corrigindo o useEffect para carregar estados de checkbox
  useEffect(() => {
    if (employees.length > 0 && !loading) {
      loadInitialCheckboxStates();
    }
  }, [employees, loading]);

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
          const updatedCalendar = existingData.calendar.map(
            (dayObj: CalendarDay) => {
              const date = new Date(dayObj.day);
              const dayOfWeek = date.getDay();
              const weekDay = weekDays[dayOfWeek];

              if (weekDay !== day) return dayObj;

              return {
                ...dayObj,
                day_time: dayObj.day_time.map((timeSlot: DayTimeSlot) => {
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
            }
          );

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

  // Adicione este useEffect para sincronizar os serviços do Firestore com o estado local
  useEffect(() => {
    if (!loadingServices && services.length > 0) {
      setLocalServices(services);
    }
  }, [services, loadingServices]);

  // Modifique a função handleDeleteService para atualizar o estado local
  const handleDeleteService = async (serviceName: string) => {
    try {
      await deleteDocument("services", serviceName);

      // Atualiza o estado local removendo o serviço excluído
      setLocalServices((prevServices) =>
        prevServices.filter((service) => service.name !== serviceName)
      );

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
      // Obter o documento colaborador
      const employeeDoc = await getDoc(doc(db, "employees", "colaborador"));

      if (employeeDoc.exists()) {
        const existingData = employeeDoc.data();
        const existingEmployees = existingData.employees || [];

        // Remover o funcionário do array
        const updatedEmployees = existingEmployees.filter(
          (emp: Employee) => emp.employee_id !== employeeId
        );

        await updateDocument("employees", "colaborador", {
          employees: updatedEmployees,
        });

        // Atualizar a tabela de equipe localmente para refletir a mudança imediatamente
        setTeam(updatedEmployees);

        toast({
          title: "Sucesso!",
          description: "Funcionário excluído com sucesso.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir funcionário.",
      });
    }
  };

  // Modifique a função handleCreateService para atualizar o estado local
  const handleCreateService = async (
    data: z.infer<typeof serviceFormSchema>
  ) => {
    try {
      const newService = {
        ...data,
        service_id: data.name,
      };

      await updateDocument("services", data.name, newService);

      // Atualiza o estado local adicionando o novo serviço
      setLocalServices((prevServices) => [...prevServices, newService]);

      toast({
        title: "Sucesso!",
        description: "Serviço criado com sucesso.",
      });
      handleServiceDialogChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar serviço.",
      });
    }
  };

  // Modifique a função handleEditService para atualizar o estado local
  const handleEditService = async (data: z.infer<typeof serviceFormSchema>) => {
    if (!editingService) return;
    try {
      const updatedService = {
        ...data,
        service_id: editingService.service_id,
      };

      await updateDocument(
        "services",
        editingService.service_id,
        updatedService
      );

      // Atualiza o estado local substituindo o serviço editado
      setLocalServices((prevServices) =>
        prevServices.map((service) =>
          service.service_id === editingService.service_id
            ? updatedService
            : service
        )
      );

      toast({
        title: "Sucesso!",
        description: "Serviço atualizado com sucesso.",
      });
      handleServiceDialogChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar serviço.",
      });
    }
  };

  // Funções para gerenciar funcionários
  const handleCreateEmployee = async (
    data: z.infer<typeof employeeFormSchema>
  ) => {
    try {
      // Garantindo que todos os campos obrigatórios estejam presentes
      const newEmployee: Employee = {
        employee_id: data.employee_name,
        employee_name: data.employee_name,
        services: data.services,
      };

      // Verificar se já existe o documento colaborador
      const employeeDoc = await getDoc(doc(db, "employees", "colaborador"));

      if (employeeDoc.exists()) {
        // Se existir, adiciona o novo funcionário ao array existente
        const existingData = employeeDoc.data();
        const existingEmployees = existingData.employees || [];
        const updatedEmployees = [...existingEmployees, newEmployee];

        await updateDocument("employees", "colaborador", {
          employees: updatedEmployees,
        });

        // Atualizar a tabela de equipe localmente para refletir a mudança imediatamente
        setTeam(updatedEmployees);
      } else {
        // Se não existir, cria o documento com o novo funcionário
        await updateDocument("employees", "colaborador", {
          employees: [newEmployee],
        });

        // Atualizar a tabela de equipe localmente para refletir a mudança imediatamente
        setTeam([newEmployee]);
      }

      toast({
        title: "Sucesso!",
        description: "Funcionário criado com sucesso.",
      });
      handleEmployeeDialogChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar funcionário.",
      });
    }
  };

  const handleEditEmployee = async (
    data: z.infer<typeof employeeFormSchema>
  ) => {
    if (!editingEmployee) return;
    try {
      const updatedEmployee = {
        employee_id: editingEmployee.employee_id,
        ...data,
      };

      // Obter o documento colaborador
      const employeeDoc = await getDoc(doc(db, "employees", "colaborador"));

      if (employeeDoc.exists()) {
        const existingData = employeeDoc.data();
        const existingEmployees = existingData.employees || [];

        // Atualizar o funcionário específico no array
        const updatedEmployees = existingEmployees.map((emp: Employee) =>
          emp.employee_id === updatedEmployee.employee_id
            ? updatedEmployee
            : emp
        );

        await updateDocument("employees", "colaborador", {
          employees: updatedEmployees,
        });

        // Atualizar a tabela de equipe localmente para refletir a mudança imediatamente
        setTeam(updatedEmployees);

        toast({
          title: "Sucesso!",
          description: "Funcionário atualizado com sucesso.",
        });
        handleEmployeeDialogChange(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar funcionário.",
      });
    }
  };

  // Corrigindo os useEffect condicionais
  useEffect(() => {
    if (employees.length > 0) {
      setTeam(employees[0]?.employees || []);
    }
  }, [employees]);

  useEffect(() => {
    if (editingService) {
      serviceForm.reset({
        name: editingService.name,
        description: editingService.description,
        preco: editingService.preco,
        service_duration: editingService.service_duration,
      });
    }
  }, [editingService, serviceForm]);

  useEffect(() => {
    if (editingEmployee) {
      employeeForm.reset({
        employee_name: editingEmployee.employee_name,
        services: editingEmployee.services,
      });
    }
  }, [editingEmployee, employeeForm]);

  // Funções para gerenciar os diálogos
  const handleServiceDialogChange = (open: boolean) => {
    setIsServiceDialogOpen(open);
    if (!open) {
      setEditingService(null);
      serviceForm.reset({
        name: "",
        description: "",
        preco: 0,
        service_duration: 1,
      });
    }
  };

  const handleEmployeeDialogChange = (open: boolean) => {
    setIsEmployeeDialogOpen(open);
    if (!open) {
      setEditingEmployee(null);
      employeeForm.reset({
        employee_name: "",
        services: [],
      });
    }
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.split("@")[0].slice(2);
  };

  if (loading || loadingServices || initialLoading) {
    return (
      <>
        <div className="flex justify-center items-center my-20 gap-4">
          <Skeleton className="w-16 h-5" />
          <Skeleton className="w-16 h-5" />
          <Skeleton className="w-16 h-5" />
          <Skeleton className="w-16 h-5" />
        </div>
        <Skeleton className="w-full h-screen" />
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
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
                            className="w-4 h-4 rounded border-border"
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
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Serviços</h2>
              <Dialog
                open={isServiceDialogOpen}
                onOpenChange={handleServiceDialogChange}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Serviço
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingService ? "Editar Serviço" : "Novo Serviço"}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os campos abaixo para{" "}
                      {editingService ? "editar o" : "criar um novo"} serviço.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...serviceForm}>
                    <form
                      onSubmit={serviceForm.handleSubmit(
                        editingService ? handleEditService : handleCreateService
                      )}
                      className="space-y-4"
                    >
                      <FormField
                        control={serviceForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={serviceForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={serviceForm.control}
                        name="preco"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={serviceForm.control}
                        name="service_duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Duração (em slots de 15 minutos)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit">
                          {editingService ? "Salvar" : "Criar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
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
                  {localServices.map((service) => (
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
                              setIsServiceDialogOpen(true);
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
                                    handleDeleteService(service.name)
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Equipe</h2>
              <Dialog
                open={isEmployeeDialogOpen}
                onOpenChange={handleEmployeeDialogChange}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Funcionário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingEmployee
                        ? "Editar Funcionário"
                        : "Novo Funcionário"}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os campos abaixo para{" "}
                      {editingEmployee ? "editar o" : "criar um novo"}{" "}
                      funcionário.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...employeeForm}>
                    <form
                      onSubmit={employeeForm.handleSubmit(
                        editingEmployee
                          ? handleEditEmployee
                          : handleCreateEmployee
                      )}
                      className="space-y-4"
                    >
                      <FormField
                        control={employeeForm.control}
                        name="employee_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employeeForm.control}
                        name="services"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Serviços</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2">
                                {services.map((service) => (
                                  <Button
                                    key={service.service_id}
                                    type="button"
                                    variant={
                                      field.value.includes(service.name)
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() => {
                                      const newValue = field.value.includes(
                                        service.name
                                      )
                                        ? field.value.filter(
                                            (s) => s !== service.name
                                          )
                                        : [...field.value, service.name];
                                      field.onChange(newValue);
                                    }}
                                  >
                                    {service.name}
                                  </Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit">
                          {editingEmployee ? "Salvar" : "Criar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
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
                  {team.map((employee) => (
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Usuários</h2>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatPhoneNumber(user.phone)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {user.isAdmin ? (
                            <span className="text-green-500">Sim</span>
                          ) : (
                            <span className="text-red-500">Não</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </>
  );
};

export default Management;
