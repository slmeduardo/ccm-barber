import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { db } from "@/config/firebaseConfig";
import { cn } from "@/lib/utils";
import { Service } from "@/pages/Services";
import {
  generateHourlySlots,
  generateTimeSlots,
  getHourFromTimeSlot,
  getQuarterSlotsForHour,
} from "@/utils/calendarUtils";
import { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid"; // Week & Day View
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Label } from "./ui/label";
import { Skeleton } from "./ui/skeleton";

interface DayTime {
  appointment_id?: string;
  client_id?: string;
  hour: string;
  service: string;
}

interface CalendarDay {
  day: string;
  day_time: DayTime[];
}

interface EmployeeData {
  id: string;
  calendar: CalendarDay[];
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  extendedProps: {
    client_id?: string;
    hour?: string;
    service: string;
    startHour?: string;
    endHour?: string;
    appointment_id?: string;
  };
  allDay?: boolean;
  display?: string;
  backgroundColor?: string;
}

interface EventDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    title: string;
    extendedProps: {
      service: string;
      hour?: string;
      client_id?: string;
      startHour?: string;
      endHour?: string;
    };
  } | null;
}

interface DayEvent {
  hour: string;
  service: string;
  client_id?: string;
}

const EventDetailsDialog = ({
  isOpen,
  onOpenChange,
  event,
}: EventDetailsDialogProps) => {
  if (!event) return null;

  const isDayOff = event.extendedProps.service === "day_off";
  const isOutOfOffice = event.extendedProps.service === "out_of_office";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle
            className={cn(
              "text-lg font-semibold pb-2",
              isDayOff && "text-gray-500",
              isOutOfOffice && "text-orange-500",
              !isDayOff && !isOutOfOffice && "text-primary"
            )}
          >
            {isDayOff
              ? "Dia de Folga"
              : isOutOfOffice
              ? "Horário Indisponível"
              : "Agendamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isDayOff ? (
            <p className="text-gray-500">Este dia está marcado como folga.</p>
          ) : isOutOfOffice ? (
            <div className="flex flex-col gap-2">
              <p className="text-orange-500">Este horário está indisponível.</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">Período:</span>
                <span>
                  {event.extendedProps.startHour} às{" "}
                  {event.extendedProps.endHour}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Serviço:</span>
                <span>{event.extendedProps.service}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Horário:</span>
                <span>{event.extendedProps.hour}</span>
              </div>
              {event.extendedProps.client_id && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Cliente:</span>
                  <span>{event.extendedProps.client_id}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Calendar = () => {
  const [employeesData, setEmployeesData] = useState<EmployeeData[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isDayOff, setIsDayOff] = useState(false);
  const [dayTimeSlots, setDayTimeSlots] = useState<{
    [key: string]: boolean;
  }>({});
  const [updatingTime, setUpdatingTime] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<
    EventClickArg["event"] | null
  >(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [occupiedTimeSlots, setOccupiedTimeSlots] = useState<{
    [key: string]: boolean;
  }>({});
  const [hasAppointmentsInDay, setHasAppointmentsInDay] = useState(false);
  const [deletingTimeSlot, setDeletingTimeSlot] = useState<string | null>(null);

  // Referência para o componente FullCalendar
  const calendarRef = useRef<FullCalendar | null>(null);

  // Usar os slots de tempo das 8:00 às 20:00
  const timeSlots = generateTimeSlots();
  // Usar apenas as horas inteiras para os checkboxes na interface
  const hourlySlots = generateHourlySlots();

  useEffect(() => {
    // Substituir a busca única por um listener em tempo real
    const calendarCollection = collection(db, "calendar");
    setLoading(true);

    // Configurar o listener em tempo real
    const unsubscribe = onSnapshot(
      calendarCollection,
      (snapshot) => {
        const calendarData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EmployeeData[];

        setEmployeesData(calendarData);
        if (calendarData.length > 0 && !selectedEmployee) {
          setSelectedEmployee(calendarData[0].id);
        }
        setLoading(false);

        // Força a atualização do calendário quando dados são alterados
        if (calendarRef.current) {
          calendarRef.current.getApi().refetchEvents();
          console.log("Calendário atualizado em tempo real");
        }
      },
      (error) => {
        console.error("Erro ao observar mudanças no calendário:", error);
        setLoading(false);
      }
    );

    // Limpar o listener quando o componente for desmontado
    return () => unsubscribe();
  }, [selectedEmployee]);

  useEffect(() => {
    // Substituir a busca única por um listener em tempo real
    const servicesCollection = collection(db, "services");
    setLoadingServices(true);

    // Configurar o listener em tempo real
    const unsubscribe = onSnapshot(
      servicesCollection,
      (snapshot) => {
        const servicesList = snapshot.docs.map((doc) => ({
          service_id: doc.id,
          ...doc.data(),
        })) as Service[];

        setServices(servicesList);
        setLoadingServices(false);

        // Força a atualização do calendário quando serviços são alterados
        if (calendarRef.current && !loading) {
          calendarRef.current.getApi().refetchEvents();
          console.log("Calendário atualizado após mudança nos serviços");
        }
      },
      (error) => {
        console.error("Erro ao observar mudanças nos serviços:", error);
        setLoadingServices(false);
      }
    );

    // Limpar o listener quando o componente for desmontado
    return () => unsubscribe();
  }, [loading]);

  useEffect(() => {
    if (!selectedEmployee || loadingServices || loading) return;

    const selectedEmployeeData = employeesData.find(
      (employee) => employee.id === selectedEmployee
    );

    if (!selectedEmployeeData) return;

    // Extrair eventos do calendário do funcionário selecionado
    let calendarEvents = selectedEmployeeData.calendar.flatMap((day) => [
      // Eventos de dia de folga
      ...day.day_time
        .filter(
          (appointment) =>
            appointment.appointment_id === "day_off" ||
            appointment.service === "day_off"
        )
        .map((appointment) => ({
          id: crypto.randomUUID(),
          title: "Dia de Folga",
          date: day.day.replace(/\//g, "-"),
          start: `${day.day.replace(/\//g, "-")}T00:00`,
          end: `${day.day.replace(/\//g, "-")}T23:59`,
          extendedProps: {
            service: "day_off",
          },
          allDay: true,
          display: "background",
          backgroundColor: "#eef2ff",
        })),
      // Eventos de horário indisponível
      ...day.day_time
        .filter(
          (appointment) =>
            (appointment.appointment_id === "out_of_office" ||
              appointment.service === "out_of_office") &&
            // Mostrar apenas eventos com minutos "00" (horas exatas)
            appointment.hour.split(":")[1] === "00"
        )
        .map((appointment) => ({
          id: `out_of_office_${day.day}_${appointment.hour}`, // ID composto para garantir unicidade por hora
          title: `Indisponível - ${appointment.hour}`,
          date: day.day.replace(/\//g, "-"),
          start: `${day.day.replace(/\//g, "-")}T${appointment.hour}`,
          end: `${day.day.replace(/\//g, "-")}T${
            appointment.hour.split(":")[0]
          }:59`,
          extendedProps: {
            service: "out_of_office",
            startHour: appointment.hour,
            endHour: `${appointment.hour.split(":")[0]}:59`,
            hour: appointment.hour,
          },
        })),
      // Adiciona eventos normais
      ...day.day_time
        .filter(
          (appointment) =>
            appointment.service !== "none" &&
            appointment.appointment_id !== "day_off" &&
            appointment.appointment_id !== "out_of_office" &&
            appointment.appointment_id !== "not_in_schedule" &&
            appointment.service !== "not_in_schedule" &&
            // Mostrar apenas eventos com minutos "00" (horas exatas)
            appointment.hour.split(":")[1] === "00"
        )
        .map((appointment) => {
          const service = services.find(
            (s) => s.description === appointment.service
          );
          const durationInMinutes = (service?.service_duration || 1) * 15;

          const startDate = new Date(
            `${day.day.replace(/\//g, "-")}T${appointment.hour}`
          );
          const endDate = new Date(
            startDate.getTime() + durationInMinutes * 60000
          );

          return {
            id: appointment.appointment_id || crypto.randomUUID(),
            title: `${appointment.service} - ${appointment.hour}`,
            date: day.day.replace(/\//g, "-"),
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            extendedProps: {
              client_id: appointment.client_id,
              hour: appointment.hour,
              service: appointment.service,
            },
          };
        }),
    ]);

    // Filtrar eventos duplicados - manter apenas um evento por ID
    const uniqueIdsMap = new Map();
    const uniqueOutOfOfficeMap = new Map(); // Para rastrear eventos out_of_office por hora

    calendarEvents = calendarEvents.filter((event) => {
      // Se o evento for out_of_office, verificar se já temos um para esta hora e dia
      if (event.extendedProps.service === "out_of_office") {
        // Verificar se temos o horário no title (formato: "Indisponível - HH:MM")
        const titleHour = event.title.includes("Indisponível - ")
          ? event.title.split("Indisponível - ")[1]
          : "";

        const key = `${event.date}_${titleHour || "unknown"}`;
        const isDuplicate = uniqueOutOfOfficeMap.has(key);

        if (!isDuplicate) {
          uniqueOutOfOfficeMap.set(key, true);
          return true;
        }

        // Se for duplicado, não adiciona
        console.log(
          `Evento de horário indisponível duplicado removido: ${event.title}`
        );
        return false;
      }

      // Para outros eventos, manter a lógica existente
      if (!event.id || event.extendedProps.service === "day_off") {
        return true;
      }

      // Verifica se já existe um evento com este ID
      const isDuplicate = uniqueIdsMap.has(event.id);
      if (!isDuplicate) {
        uniqueIdsMap.set(event.id, true);
        return true;
      }

      // Se for duplicado, não adiciona
      console.log(
        `Evento duplicado removido: ${event.title} (ID: ${event.id})`
      );
      return false;
    });

    setEvents(calendarEvents);
  }, [employeesData, selectedEmployee, services, loading, loadingServices]);

  // Efeito para atualizar o calendário quando os eventos mudarem
  useEffect(() => {
    if (calendarRef.current && events.length > 0) {
      const calendarApi = calendarRef.current.getApi();

      // Remover todos os eventos existentes
      calendarApi.removeAllEvents();

      // Adicionar os novos eventos
      calendarApi.addEventSource({ events });

      // Força a rerenderização do calendário
      calendarApi.refetchEvents();

      console.log(
        "Calendário atualizado em tempo real com",
        events.length,
        "eventos"
      );
    }
  }, [events]);

  const handleEventClick = (info: EventClickArg) => {
    setSelectedEvent(info.event);
    setIsEventDialogOpen(true);
  };

  if (loading || loadingServices) {
    return (
      <>
        <div className="my-15">
          <Skeleton className="w-52 h-10" />
        </div>
        <Skeleton className="w-full h-screen" />
      </>
    );
  }
  const renderEventContent = (eventInfo) => {
    const isDayOff = eventInfo.event.extendedProps.service === "day_off";
    const isOutOfOffice =
      eventInfo.event.extendedProps.service === "out_of_office";
    const isListView = ["timeGridWeek", "timeGridDay"].includes(
      eventInfo.view.type
    );
    const isMonthView = eventInfo.view.type === "dayGridMonth";

    const eventContent = (
      <div
        className={`cursor-pointer w-full h-full p-2 rounded ${
          isDayOff
            ? "bg-gray-500 text-white"
            : isOutOfOffice
            ? "bg-orange-500 text-white"
            : "bg-primary text-white"
        }`}
      >
        {isDayOff ? (
          <strong>{isMonthView ? "Dia de Folga" : ""}</strong>
        ) : isOutOfOffice ? (
          <div className="flex flex-col">
            <strong>Horário Indisponível</strong>
            {eventInfo.event.extendedProps.hour && (
              <span className="text-sm font-medium">
                {eventInfo.event.extendedProps.hour}
              </span>
            )}
          </div>
        ) : (
          <>
            {eventInfo.event.extendedProps.hour && (
              <p>{eventInfo.event.extendedProps.hour}</p>
            )}
            {isMonthView && (
              <strong>{eventInfo.event.extendedProps.service}</strong>
            )}
          </>
        )}
      </div>
    );

    // Aplicar o tooltip apenas nas visualizações de semana e dia
    if (isListView) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{eventContent}</TooltipTrigger>
            <TooltipContent
              className="text-sm max-w-[300px]"
              side="right"
              sideOffset={5}
              avoidCollisions={true}
            >
              {isDayOff ? (
                <p>Dia de Folga</p>
              ) : isOutOfOffice ? (
                <p>
                  Horário Indisponível:{" "}
                  {eventInfo.event.extendedProps.startHour} às{" "}
                  {eventInfo.event.extendedProps.endHour}
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  <p>
                    <strong>Serviço:</strong>{" "}
                    {eventInfo.event.extendedProps.service}
                  </p>
                  {eventInfo.event.extendedProps.hour && (
                    <p>
                      <strong>Horário:</strong>{" "}
                      {eventInfo.event.extendedProps.hour}
                    </p>
                  )}
                  {eventInfo.event.extendedProps.client_id && (
                    <p>
                      <strong>Cliente:</strong>{" "}
                      {eventInfo.event.extendedProps.client_id.includes(
                        "@s.whatsapp.net"
                      )
                        ? `(${eventInfo.event.extendedProps.client_id
                            .split("@")[0]
                            .slice(
                              2,
                              4
                            )}) ${eventInfo.event.extendedProps.client_id
                            .split("@")[0]
                            .slice(4)}`
                        : eventInfo.event.extendedProps.client_id}
                    </p>
                  )}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return eventContent;
  };

  const handleDateClick = async (info) => {
    const selectedEmployeeData = employeesData.find(
      (emp) => emp.id === selectedEmployee
    );

    if (!selectedEmployeeData) return;

    const adjustedDate = info.dateStr;
    setSelectedDate(adjustedDate);

    const dayData = selectedEmployeeData.calendar.find(
      (day) => day.day === adjustedDate.replace(/-/g, "/")
    );

    // Verifica se é dia de folga
    const isDayOffDate = dayData?.day_time[0]?.appointment_id === "day_off";
    setIsDayOff(isDayOffDate);

    // Inicializa os checkboxes baseado no estado atual
    const initialTimeSlots: { [key: string]: boolean } = {};
    const occupiedSlots: { [key: string]: boolean } = {};

    // Verifica se há agendamentos no dia
    let dayHasAppointments = false;

    // Agrupar slots de 15 minutos por hora
    const hourGroups: { [hourKey: string]: DayTime[] } = {};

    dayData?.day_time.forEach((timeSlot) => {
      const hourOnly = getHourFromTimeSlot(timeSlot.hour);
      const hourKey = `${hourOnly}:00`;

      if (!hourGroups[hourKey]) {
        hourGroups[hourKey] = [];
      }

      hourGroups[hourKey].push(timeSlot);

      // Verifica se o horário tem agendamento
      const hasAppointmentInSlot =
        timeSlot.appointment_id !== "" &&
        timeSlot.appointment_id !== "day_off" &&
        timeSlot.appointment_id !== "out_of_office" &&
        timeSlot.appointment_id !== "not_in_schedule" &&
        timeSlot.service !== "none" &&
        timeSlot.service !== "day_off" &&
        timeSlot.service !== "out_of_office" &&
        timeSlot.service !== "not_in_schedule";

      if (hasAppointmentInSlot) {
        dayHasAppointments = true;
        occupiedSlots[hourKey] = true;
      }
    });

    // Para cada hora, verifica se todos os slots de 15 minutos estão disponíveis
    Object.keys(hourGroups).forEach((hourKey) => {
      const allSlotsAvailable = hourGroups[hourKey].every(
        (slot) =>
          slot.appointment_id !== "out_of_office" &&
          slot.appointment_id !== "day_off" &&
          slot.appointment_id !== "not_in_schedule"
      );

      initialTimeSlots[hourKey] = allSlotsAvailable;
    });

    setHasAppointmentsInDay(dayHasAppointments);
    setOccupiedTimeSlots(occupiedSlots);
    setDayTimeSlots(initialTimeSlots);

    setIsDialogOpen(true);
  };

  const handleTimeSlotChange = async (hourSlot: string) => {
    if (!selectedEmployee || !selectedDate || isUpdating) return;

    try {
      setIsUpdating(true);
      setUpdatingTime(hourSlot);
      const selectedEmployeeData = employeesData.find(
        (emp) => emp.id === selectedEmployee
      );

      if (!selectedEmployeeData) return;

      const hour = getHourFromTimeSlot(hourSlot);
      const quarterSlots = getQuarterSlotsForHour(hour);

      // Novo status que será aplicado a todos os slots de 15 minutos
      const willBeAvailable = !dayTimeSlots[hourSlot];

      const updatedCalendar = selectedEmployeeData.calendar.map((day) => {
        if (day.day === selectedDate.replace(/-/g, "/")) {
          return {
            ...day,
            day_time: day.day_time.map((timeSlot) => {
              // Se o slot de tempo atual pertence à hora que estamos alterando
              if (quarterSlots.includes(timeSlot.hour)) {
                // Verificar se o slot já tem um agendamento
                const hasAppointment =
                  timeSlot.appointment_id !== "" &&
                  timeSlot.appointment_id !== "out_of_office" &&
                  timeSlot.appointment_id !== "day_off" &&
                  timeSlot.appointment_id !== "not_in_schedule";

                // Se já tem agendamento, não altera
                if (hasAppointment) {
                  return timeSlot;
                }

                // Caso contrário, atualiza conforme o novo status
                return {
                  ...timeSlot,
                  appointment_id: willBeAvailable ? "" : "out_of_office",
                  client_id: willBeAvailable ? "none" : "out_of_office",
                  service: willBeAvailable ? "none" : "out_of_office",
                };
              }
              return timeSlot;
            }),
          };
        }
        return day;
      });

      const employeeRef = doc(db, "calendar", selectedEmployee);
      await updateDoc(employeeRef, {
        calendar: updatedCalendar,
      });

      setEmployeesData((prev) =>
        prev.map((emp) =>
          emp.id === selectedEmployee
            ? { ...emp, calendar: updatedCalendar }
            : emp
        )
      );

      setDayTimeSlots((prev) => ({
        ...prev,
        [hourSlot]: willBeAvailable,
      }));

      toast({
        title: willBeAvailable
          ? "Horário disponibilizado"
          : "Horário bloqueado",
        description: `Horário ${hourSlot} ${
          willBeAvailable ? "disponível" : "indisponível"
        }.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar horário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar o horário. Tente novamente.",
      });
    } finally {
      setIsUpdating(false);
      setUpdatingTime(null);
    }
  };

  const handleDayOffChange = async () => {
    if (!selectedEmployee || !selectedDate || isUpdating) return;

    try {
      setIsUpdating(true);
      const selectedEmployeeData = employeesData.find(
        (emp) => emp.id === selectedEmployee
      );

      if (!selectedEmployeeData) return;

      const updatedCalendar = selectedEmployeeData.calendar.map((day) => {
        if (day.day === selectedDate.replace(/-/g, "/")) {
          return {
            ...day,
            day_time: day.day_time.map((timeSlot) => ({
              ...timeSlot,
              // Se estiver marcando como dia de folga
              appointment_id: !isDayOff ? "day_off" : "",
              client_id: !isDayOff ? "day_off" : "none",
              service: !isDayOff ? "day_off" : "none",
            })),
          };
        }
        return day;
      });

      const employeeRef = doc(db, "calendar", selectedEmployee);
      await updateDoc(employeeRef, {
        calendar: updatedCalendar,
      });

      setEmployeesData((prev) =>
        prev.map((emp) =>
          emp.id === selectedEmployee
            ? { ...emp, calendar: updatedCalendar }
            : emp
        )
      );

      // Atualiza os checkboxes quando desativa o dia de folga
      if (isDayOff) {
        const newTimeSlots: { [key: string]: boolean } = {};
        timeSlots.forEach((time) => {
          newTimeSlots[time] = true;
        });
        setDayTimeSlots(newTimeSlots);
      }
    } catch (error) {
      console.error("Erro ao atualizar dia:", error);
      alert("Erro ao atualizar o dia. Tente novamente.");
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedDatePlusOne = new Date(selectedDate);
  selectedDatePlusOne.setDate(selectedDatePlusOne.getDate() + 1);

  // Função para excluir um agendamento
  const handleDeleteAppointment = async (time: string) => {
    if (!selectedEmployee || !selectedDate) return;

    try {
      setDeletingTimeSlot(time);

      const selectedEmployeeData = employeesData.find(
        (emp) => emp.id === selectedEmployee
      );

      if (!selectedEmployeeData) return;

      const hour = getHourFromTimeSlot(time);
      const quarterSlots = getQuarterSlotsForHour(hour);

      // Encontrar o appointment_id nos slots de 15 minutos para esta hora
      let appointmentId: string | undefined;

      const updatedEmployeeData = { ...selectedEmployeeData };
      const dayIndex = updatedEmployeeData.calendar.findIndex(
        (day) => day.day === selectedDate.replace(/-/g, "/")
      );

      if (dayIndex === -1) return;

      // Encontrar o appointment_id primeiro
      updatedEmployeeData.calendar[dayIndex].day_time.forEach((timeSlot) => {
        if (
          quarterSlots.includes(timeSlot.hour) &&
          timeSlot.appointment_id &&
          timeSlot.appointment_id !== "" &&
          timeSlot.appointment_id !== "out_of_office" &&
          timeSlot.appointment_id !== "day_off" &&
          timeSlot.appointment_id !== "not_in_schedule"
        ) {
          appointmentId = timeSlot.appointment_id;
        }
      });

      if (!appointmentId) {
        toast({
          title: "Erro",
          description: "Nenhum agendamento encontrado neste horário.",
          variant: "destructive",
        });
        setDeletingTimeSlot(null);
        return;
      }

      // Usar writeBatch para garantir operação atômica
      const batch = writeBatch(db);

      // Atualizar todos os slots que tenham este appointment_id
      const calendarRef = collection(db, "calendar");
      const calendarSnapshot = await getDocs(calendarRef);

      calendarSnapshot.forEach((employeeDoc) => {
        const empData = employeeDoc.data() as EmployeeData;
        let updated = false;

        empData.calendar.forEach((day) => {
          day.day_time.forEach((timeSlot) => {
            if (timeSlot.appointment_id === appointmentId) {
              timeSlot.appointment_id = "";
              timeSlot.client_id = "none";
              timeSlot.service = "none";
              updated = true;
            }
          });
        });

        if (updated) {
          batch.set(employeeDoc.ref, empData);
        }
      });

      await batch.commit();

      // Atualizar o estado local
      const updatedOccupiedTimeSlots = { ...occupiedTimeSlots };
      delete updatedOccupiedTimeSlots[time];
      setOccupiedTimeSlots(updatedOccupiedTimeSlots);

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso.",
      });

      // Recarregar os dados atualizados
      try {
        const calendarCollection = collection(db, "calendar");
        const calendarSnapshot = await getDocs(calendarCollection);

        const calendarData = calendarSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EmployeeData[];

        setEmployeesData(calendarData);
      } catch (error) {
        console.error("Erro ao recarregar dados do calendário:", error);
      }
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingTimeSlot(null);
    }
  };

  return (
    <div>
      <div className="w-[240px] mb-10 flex flex-col gap-3">
        <Label>Profissional:</Label>
        <Select
          value={selectedEmployee}
          onValueChange={(value) => setSelectedEmployee(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um profissional" />
          </SelectTrigger>
          <SelectContent>
            {employeesData.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex flex-col gap-4 max-w-3xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configurar Dia{" "}
              {selectedDate &&
                new Date(selectedDatePlusOne).toLocaleDateString("pt-BR")}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config">Configuração</TabsTrigger>
              <TabsTrigger value="events">Eventos do Dia</TabsTrigger>
            </TabsList>

            <TabsContent value="config">
              <div className="flex flex-col gap-6">
                <div className="flex items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Checkbox
                            id="dayOff"
                            checked={isDayOff}
                            disabled={isUpdating || hasAppointmentsInDay}
                            onCheckedChange={() => {
                              setIsDayOff(!isDayOff);
                              handleDayOffChange();
                            }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        className="text-sm max-w-[300px]"
                        side="right"
                        sideOffset={5}
                        avoidCollisions={true}
                      >
                        Existem agendamentos neste dia. O cliente precisa
                        reagendar para você poder marcar como dia de folga.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <label
                    htmlFor="dayOff"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Marcar como dia de folga
                  </label>
                </div>

                {!isDayOff && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">Horário</TableHead>
                          <TableHead className="text-center">
                            Disponível
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hourlySlots.map((time) => (
                          <TableRow key={time}>
                            <TableCell className="text-center font-medium">
                              {time}
                            </TableCell>
                            <TableCell className="text-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      {updatingTime === time ? (
                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                      ) : (
                                        <input
                                          type="checkbox"
                                          checked={dayTimeSlots[time] ?? true}
                                          onChange={() =>
                                            handleTimeSlotChange(time)
                                          }
                                          disabled={
                                            isUpdating ||
                                            occupiedTimeSlots[time]
                                          }
                                          className="h-4 w-4 rounded border-border"
                                        />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  {occupiedTimeSlots[time] && (
                                    <TooltipContent className="text-sm max-w-[300px]">
                                      <p>
                                        Existe um agendamento neste horário. O
                                        cliente precisa reagendar para você
                                        poder marcar como indisponível.
                                      </p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="events">
              <div className="flex flex-col gap-4">
                {(() => {
                  const selectedEmployeeData = employeesData.find(
                    (emp) => emp.id === selectedEmployee
                  );

                  const dayData = selectedEmployeeData?.calendar.find(
                    (day) => day.day === selectedDate?.replace(/-/g, "/")
                  );

                  // Filtering valid events
                  const validEvents = dayData?.day_time.filter(
                    (event) =>
                      event.service !== "none" &&
                      event.appointment_id !== "day_off" &&
                      event.appointment_id !== "out_of_office" &&
                      event.appointment_id !== "not_in_schedule"
                  );

                  // Remove duplicate events based on appointment_id
                  const uniqueEvents = validEvents
                    ? validEvents.reduce((acc, event) => {
                        if (
                          !acc.some(
                            (e) => e.appointment_id === event.appointment_id
                          )
                        ) {
                          acc.push(event);
                        }
                        return acc;
                      }, [])
                    : [];

                  if (!uniqueEvents.length) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum evento agendado para este dia
                      </div>
                    );
                  }

                  return (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Horário</TableHead>
                            <TableHead>Serviço</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uniqueEvents.map((event, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {event.hour}
                              </TableCell>
                              <TableCell>{event.service}</TableCell>
                              <TableCell>
                                {event.client_id
                                  ? event.client_id.includes("@s.whatsapp.net")
                                    ? `(${event.client_id
                                        .split("@")[0]
                                        .slice(2, 4)}) ${event.client_id
                                        .split("@")[0]
                                        .slice(4)}`
                                    : event.client_id
                                  : "Não informado"}
                              </TableCell>
                              <TableCell className="text-center">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() =>
                                          handleDeleteAppointment(event.hour)
                                        }
                                        disabled={
                                          deletingTimeSlot === event.hour
                                        }
                                        className="p-1.5 rounded-full hover:bg-gray-100/20 focus:outline-none focus:ring-2 focus:ring-destructive/30 transition-colors"
                                      >
                                        {deletingTimeSlot === event.hour ? (
                                          <Loader2 className="h-4 w-4 animate-spin " />
                                        ) : (
                                          <Trash2 className="h-4 w-4 " />
                                        )}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-sm max-w-[300px]">
                                      <p>Excluir agendamento</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <EventDetailsDialog
        isOpen={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        event={
          selectedEvent
            ? {
                title: selectedEvent.title,
                extendedProps: {
                  service: selectedEvent.extendedProps.service || "",
                  hour: selectedEvent.extendedProps.hour,
                  client_id: selectedEvent.extendedProps.client_id,
                  startHour: selectedEvent.extendedProps.startHour,
                  endHour: selectedEvent.extendedProps.endHour,
                },
              }
            : null
        }
      />

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} // Add Plugins
        nowIndicator={true}
        initialView="dayGridMonth" // Default View (Month)
        events={events} // Event Data
        eventClick={handleEventClick}
        editable={false} // Allow Editing Events
        selectable={true} // Allow Selection
        eventContent={renderEventContent}
        dateClick={handleDateClick} // Handle day clicks
        dayCellClassNames={() => "cursor-pointer"}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay", // View Switcher
        }}
        ref={calendarRef}
      />
    </div>
  );
};

export default Calendar;
