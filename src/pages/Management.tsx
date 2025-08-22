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
import {
  createOrUpdateEmployeeCalendar,
  deleteEmployeeCalendar,
  generateHourlySlots,
  generateTimeSlots,
  getHourFromTimeSlot,
  getQuarterSlotsForHour,
} from "@/utils/calendarUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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

  const weekDays = useMemo(
    () => [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ],
    []
  );

  // Usar os slots de tempo completos para o calendário
  const timeSlots = generateTimeSlots();
  // Usar apenas as horas inteiras para os checkboxes
  const hourlySlots = generateHourlySlots();

  // Função para carregar o estado inicial dos checkboxes do Firestore
  const loadInitialCheckboxStates = useCallback(async () => {
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

            // Agrupar os slots de 15 minutos por hora
            const hoursAvailability: { [hour: string]: boolean[] } = {};

            dayObj.day_time.forEach((timeSlot: DayTimeSlot) => {
              const hour = getHourFromTimeSlot(timeSlot.hour);

              if (!hoursAvailability[hour]) {
                hoursAvailability[hour] = [];
              }

              // Adiciona true se o slot estiver disponível (não marcado como "not_in_schedule")
              const isAvailable = timeSlot.appointment_id !== "not_in_schedule";
              hoursAvailability[hour].push(isAvailable);
            });

            // Para cada hora, verifica se todos os slots de 15 minutos estão disponíveis
            Object.keys(hoursAvailability).forEach((hour) => {
              const isHourFullyAvailable = hoursAvailability[hour].every(
                (status) => status === true
              );
              const key = `${weekDay}-${hour}:00`;
              initialStates[key] = isHourFullyAvailable;
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
  }, [employees, weekDays]);

  // Efeito para sincronizar os serviços do hook com o estado local
  useEffect(() => {
    if (services && services.length > 0) {
      setLocalServices(services as ServiceType[]);
    }
  }, [services]);

  // Efeito para sincronizar os employees do hook com o estado local
  useEffect(() => {
    if (employees && employees.length > 0 && employees[0]?.employees) {
      setTeam(employees[0].employees);
    }
  }, [employees]);

  // Efeito para carregar o estado inicial dos checkboxes
  useEffect(() => {
    if (employees && employees.length > 0 && !initialLoading) {
      loadInitialCheckboxStates();
    }
  }, [employees, initialLoading, loadInitialCheckboxStates]);

  const handleCheckboxChange = async (day: string, hourSlot: string) => {
    try {
      const key = `${day}-${hourSlot}`;
      const hour = getHourFromTimeSlot(hourSlot);
      const quarterSlots = getQuarterSlotsForHour(hour);

      // Atualiza o estado local
      setCheckboxStates((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));

      // Valor para "not_in_schedule" ou limpo baseado no novo estado do checkbox
      const isNowAvailable = !checkboxStates[key];

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
                  // Ignora slots que já têm agendamentos
                  if (
                    timeSlot.appointment_id !== "" &&
                    timeSlot.appointment_id !== "not_in_schedule"
                  ) {
                    return timeSlot;
                  }

                  // Verifica se este slot está nos slots de 15 minutos da hora selecionada
                  if (quarterSlots.includes(timeSlot.hour)) {
                    return isNowAvailable
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

      // Obter todos os funcionários do Firestore
      const calendarCollection = collection(db, "calendar");
      const calendarSnapshot = await getDocs(calendarCollection);

      // Para cada funcionário, atualizar o calendário
      for (const employeeDoc of calendarSnapshot.docs) {
        const employeeName = employeeDoc.id;
        const employeeData = employeeDoc.data();

        if (!employeeData.calendar || !Array.isArray(employeeData.calendar)) {
          console.warn(`Calendário inválido para ${employeeName}`);
          continue;
        }

        const updatedCalendar = employeeData.calendar.map(
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
                // Se o slot já tem um agendamento ou não é "not_in_schedule", não altera
                if (
                  timeSlot.appointment_id !== "" &&
                  timeSlot.appointment_id !== "not_in_schedule"
                ) {
                  return timeSlot;
                }

                // Obtém a hora base e verifica se o checkbox para esta hora está marcado
                const hour = getHourFromTimeSlot(timeSlot.hour);
                const checkboxKey = `${weekDay}-${hour}:00`;
                const isChecked =
                  checkboxStates[checkboxKey] ?? weekDay !== "Domingo";

                // Atualiza o slot com base no estado do checkbox
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

        // Atualiza o documento do funcionário usando updateDocument
        await updateDocument("calendar", employeeName, {
          calendar: updatedCalendar,
        });
      }

      toast({
        title: "Sucesso!",
        description: "Horários atualizados para todos os funcionários.",
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

        // Encontrar o funcionário para obter o nome antes de remover
        const employeeToDelete = existingEmployees.find(
          (emp: Employee) => emp.employee_id === employeeId
        );

        // Remover o funcionário do array
        const updatedEmployees = existingEmployees.filter(
          (emp: Employee) => emp.employee_id !== employeeId
        );

        await updateDocument("employees", "colaborador", {
          employees: updatedEmployees,
        });

        // Atualizar a tabela de equipe localmente para refletir a mudança imediatamente
        setTeam(updatedEmployees);

        // Remove o calendário do funcionário se ele existir
        if (employeeToDelete) {
          await deleteEmployeeCalendar(employeeToDelete.employee_name);
        }

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

  // Função de utilidade já existente para IDs - pode ser usada para ambos, serviços e funcionários
  const generateUniqueId = (prefix = "id") => {
    // Combina prefixo, timestamp e string aleatória para garantir unicidade
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Modifique a função handleCreateService para usar o nome como ID do documento
  const handleCreateService = async (
    data: z.infer<typeof serviceFormSchema>
  ) => {
    try {
      // Gere um ID único para o serviço
      const uniqueId = generateUniqueId();

      const newService = {
        ...data,
        service_id: uniqueId,
      };

      // Use o nome como ID do documento, mas armazene o ID único como um campo
      await updateDocument("services", data.name, newService);

      // Atualiza o estado local adicionando o novo serviço
      setLocalServices((prevServices) => [
        ...prevServices,
        {
          service_id: uniqueId,
          name: data.name,
          description: data.description,
          preco: data.preco,
          service_duration: data.service_duration,
        },
      ]);

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
            ? {
                service_id: updatedService.service_id,
                name: data.name,
                description: data.description,
                preco: data.preco,
                service_duration: data.service_duration,
              }
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

  // Modifique a função handleCreateEmployee para usar IDs únicos
  const handleCreateEmployee = async (
    data: z.infer<typeof employeeFormSchema>
  ) => {
    try {
      // Gere um ID único para o funcionário
      const uniqueId = generateUniqueId("emp");

      // Garantindo que todos os campos obrigatórios estejam presentes
      const newEmployee: Employee = {
        employee_id: uniqueId, // Use o ID único gerado
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

      // Após atualizar os funcionários, cria ou atualiza o calendário para o novo funcionário
      try {
        console.log(
          `Iniciando criação do calendário para novo funcionário: ${data.employee_name}`
        );
        await createOrUpdateEmployeeCalendar(data.employee_name);
        console.log(`Calendário para ${data.employee_name} criado com sucesso`);
      } catch (calendarError) {
        console.error(
          "Erro ao criar calendário para o novo funcionário:",
          calendarError
        );
        // Continua o fluxo mesmo se falhar a criação do calendário
        // Não queremos perder o funcionário criado por causa de um erro no calendário
      }

      toast({
        title: "Sucesso!",
        description: "Funcionário criado com sucesso.",
      });
      handleEmployeeDialogChange(false);
    } catch (error) {
      console.error("Erro ao criar funcionário:", error);
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

  if (loading) {
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
                  {hourlySlots.map((time) => (
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
                                {localServices.map((service) => (
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
