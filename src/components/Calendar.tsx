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
import { db } from "@/config/firebaseConfig";
import { cn } from "@/lib/utils";
import { Service } from "@/pages/Services";
import { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid"; // Week & Day View
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
    hour: string;
    service: string;
  };
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

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const calendarCollection = collection(db, "calendar");
        const calendarSnapshot = await getDocs(calendarCollection);

        const calendarData = calendarSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EmployeeData[];

        setEmployeesData(calendarData);
        if (calendarData.length > 0) {
          setSelectedEmployee(calendarData[0].id);
        }
      } catch (error) {
        console.error("Erro ao buscar calendário:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesCollection = collection(db, "services");
        const servicesSnapshot = await getDocs(servicesCollection);

        const servicesList = servicesSnapshot.docs.map((doc) => ({
          service_id: doc.id,
          ...doc.data(),
        })) as Service[];

        setServices(servicesList);
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    if (!selectedEmployee || !employeesData.length || !services.length) return;

    const employeeData = employeesData.find(
      (emp) => emp.id === selectedEmployee
    );
    if (!employeeData) return;

    const calendarEvents = employeeData.calendar.flatMap((day) => {
      // Verifica se é um dia de folga
      const isDayOff = day.day_time[0]?.appointment_id === "day_off";

      if (isDayOff) {
        return [
          {
            id: crypto.randomUUID(),
            title: "Dia de Folga",
            date: day.day.replace(/\//g, "-"),
            start: `${day.day.replace(/\//g, "-")}T00:00:00`,
            end: `${day.day.replace(/\//g, "-")}T23:59:59`,
            allDay: true,
            extendedProps: {
              service: "day_off",
            },
          },
        ];
      }

      // Agrupa os horários out_of_office por hora
      const outOfOfficeByHour = new Map<string, DayTime>();
      day.day_time.forEach((appointment) => {
        if (appointment.appointment_id === "out_of_office") {
          const baseHour = appointment.hour.split(":")[0];
          if (!outOfOfficeByHour.has(baseHour)) {
            outOfOfficeByHour.set(baseHour, appointment);
          }
        }
      });

      // Processa os horários normais e out_of_office agrupados
      return [
        // Adiciona eventos out_of_office agrupados
        ...Array.from(outOfOfficeByHour.values()).map((appointment) => ({
          id: crypto.randomUUID(),
          title: "Horário Indisponível",
          date: day.day.replace(/\//g, "-"),
          start: `${day.day.replace(/\//g, "-")}T${appointment.hour}`,
          end: `${day.day.replace(/\//g, "-")}T${
            appointment.hour.split(":")[0]
          }:59`,
          extendedProps: {
            service: "out_of_office",
            startHour: appointment.hour,
            endHour: `${appointment.hour.split(":")[0]}:59`,
          },
        })),
        // Adiciona eventos normais
        ...day.day_time
          .filter(
            (appointment) =>
              appointment.service !== "none" &&
              appointment.appointment_id !== "day_off" &&
              appointment.appointment_id !== "out_of_office"
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
      ];
    });

    // Correção do problema de tipo no reduce
    const uniqueEvents = calendarEvents.reduce<typeof calendarEvents>(
      (acc, current) => {
        const x = acc.find((item) => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      },
      []
    );

    setEvents(uniqueEvents);
  }, [selectedEmployee, employeesData, services]);

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
          <strong>{isMonthView ? "Horário Indisponível" : ""}</strong>
        ) : (
          <>
            {eventInfo.event.extendedProps.hour && (
              <p>{eventInfo.event.extendedProps.hour}</p>
            )}
            {isMonthView && false && (
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
            <TooltipContent>
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
                      {eventInfo.event.extendedProps.client_id}
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
    dayData?.day_time.forEach((timeSlot) => {
      const baseHour = timeSlot.hour.split(":")[0] + ":00";
      initialTimeSlots[baseHour] =
        timeSlot.appointment_id !== "out_of_office" &&
        timeSlot.appointment_id !== "day_off" &&
        timeSlot.appointment_id !== "not_in_schedule";
    });
    setDayTimeSlots(initialTimeSlots);

    setIsDialogOpen(true);
  };

  const handleTimeSlotChange = async (time: string) => {
    if (!selectedEmployee || !selectedDate || isUpdating) return;

    try {
      setIsUpdating(true);
      setUpdatingTime(time);
      const selectedEmployeeData = employeesData.find(
        (emp) => emp.id === selectedEmployee
      );

      if (!selectedEmployeeData) return;

      const baseHour = time.split(":")[0];

      const updatedCalendar = selectedEmployeeData.calendar.map((day) => {
        if (day.day === selectedDate.replace(/-/g, "/")) {
          return {
            ...day,
            day_time: day.day_time.map((timeSlot) => {
              if (timeSlot.hour.split(":")[0] === baseHour) {
                const isAvailable = !dayTimeSlots[time];
                return {
                  ...timeSlot,
                  // Usando out_of_office ao invés de not_in_schedule
                  appointment_id: isAvailable ? "" : "out_of_office",
                  client_id: isAvailable ? "none" : "out_of_office",
                  service: isAvailable ? "none" : "out_of_office",
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
        [time]: !prev[time],
      }));
    } catch (error) {
      console.error("Erro ao atualizar horário:", error);
      alert("Erro ao atualizar o horário. Tente novamente.");
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
                  <Checkbox
                    id="dayOff"
                    checked={isDayOff}
                    disabled={isUpdating}
                    onCheckedChange={() => {
                      setIsDayOff(!isDayOff);
                      handleDayOffChange();
                    }}
                  />
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
                        {timeSlots.map((time) => (
                          <TableRow key={time}>
                            <TableCell className="text-center font-medium">
                              {time}
                            </TableCell>
                            <TableCell className="text-center">
                              {updatingTime === time ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={dayTimeSlots[time] ?? true}
                                  onChange={() => handleTimeSlotChange(time)}
                                  disabled={isUpdating}
                                  className="h-4 w-4 rounded border-border"
                                />
                              )}
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
                                {event.client_id || "Não informado"}
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
      />
    </div>
  );
};

export default Calendar;
