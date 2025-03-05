import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/config/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmployeeCalendar,
  useEmployees,
  useServices,
} from "@/hooks/useFirestore";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";

const Book = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const { user: authUser } = useAuth();

  const { services, loading: loadingServices } = useServices();
  const { employees, loading: loadingEmployees } = useEmployees();

  const { availableTimes, loading: loadingCalendar } = useEmployeeCalendar(
    selectedEmployee,
    date,
    selectedService,
    services
  );

  const generateUniqueId = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  const formatPhoneForDatabase = (phone: string) => {
    if (phone.includes("@s.whatsapp.net")) {
      return phone;
    }
    return `${phone.replace("+", "")}@s.whatsapp.net`;
  };

  function formatPhoneNumber(whatsappNumber: string) {
    // Extract the numeric part before '@s.whatsapp.net'
    const number = whatsappNumber.split("@")[0];

    // Remove the country code (first 2 digits, assuming '55' for Brazil)
    const withoutCountryCode = number.slice(2);

    // Extract area code (next 2 digits)
    const areaCode = withoutCountryCode.slice(0, 2);

    // Extract the first part of the number (next 4 digits)
    const firstPart = withoutCountryCode.slice(2, 6);

    // Extract the second part of the number (last 4 digits)
    const secondPart = withoutCountryCode.slice(6);

    // Return the formatted number
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  }

  useEffect(() => {
    setSelectedEmployee("");
  }, [selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneNumber = authUser?.phone || "";
    const formattedPhone = formatPhoneForDatabase(phoneNumber);

    try {
      const calendarRef = collection(db, "calendar");
      const calendarSnapshot = await getDocs(calendarRef);

      const employeeDoc = calendarSnapshot.docs.find(
        (doc) => doc.id === selectedEmployee
      );

      if (!employeeDoc) {
        throw new Error("Funcionário não encontrado");
      }

      const employeeData = employeeDoc.data();
      const formattedDate = date.toISOString().split("T")[0].replace(/-/g, "/");

      const dayIndex = employeeData.calendar.findIndex(
        (day: { day: string }) => day.day === formattedDate
      );

      if (dayIndex === -1) {
        throw new Error("Data não encontrada");
      }

      const selectedServiceData = services.find(
        (service) => service.name === selectedService
      );
      const serviceDuration = selectedServiceData?.service_duration || 1;

      const startTimeIndex = employeeData.calendar[dayIndex].day_time.findIndex(
        (time: { hour: string }) => time.hour.trim() === selectedTime
      );

      if (startTimeIndex === -1) {
        throw new Error("Horário não encontrado");
      }

      const updatedCalendar = [...employeeData.calendar];
      const appointmentId = generateUniqueId();

      for (let i = 0; i < serviceDuration; i++) {
        const currentTime =
          updatedCalendar[dayIndex].day_time[startTimeIndex + i];
        if (currentTime) {
          currentTime.appointment_id = appointmentId;
          currentTime.client_id = formattedPhone;
          currentTime.service = selectedService;
        }
      }

      await updateDoc(doc(db, "calendar", employeeDoc.id), {
        calendar: updatedCalendar,
      });

      alert("Agendamento realizado com sucesso!");

      setDate(new Date());
      setSelectedTime("");
      setSelectedService("");
      setSelectedEmployee("");
    } catch (error) {
      console.error("Erro ao realizar agendamento:", error);
      alert("Erro ao realizar agendamento. Por favor, tente novamente.");
    }
  };

  const timeSlots = [];
  const startHour = 9;
  const endHour = 19;
  const interval = 15;

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += interval) {
      const time = `${hour.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
      timeSlots.push({
        time,
        date: new Date(new Date().setHours(hour, minutes, 0, 0)),
      });
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-200 mb-4">Agendamento</h1>
        <p className="text-xl text-gray-400">Agende seu horário conosco</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 grid-cols-2">
          <div className="flex gap-2">
            <div className="flex flex-col space-y-2 w-full">
              <label className="text-sm font-medium">
                Data do Agendamento:
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                    }}
                    initialFocus
                    fromDate={new Date()}
                    disabled={(date) => date.getDay() === 0}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col space-y-2 w-full">
            <label className="text-sm font-medium">
              Seu número de telefone:
            </label>
            <div className="p-2 bg-gray-700 rounded border border-gray-600">
              {formatPhoneNumber(authUser?.phone || "")}
            </div>
          </div>

          <div className="flex justify-between gap-2 col-span-2">
            <div className="flex flex-col space-y-2 w-1/2">
              <label className="text-sm font-medium">Serviço:</label>
              <Select
                onValueChange={setSelectedService}
                value={selectedService}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.service_id} value={service.name}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2 w-1/2">
              <label className="text-sm font-medium">Profissional:</label>
              <Select
                onValueChange={setSelectedEmployee}
                value={selectedEmployee}
                disabled={!selectedService}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um profissional" />
                </SelectTrigger>
                <SelectContent>
                  {employees.flatMap((employee) =>
                    employee.employees
                      .filter((emp) => emp.services.includes(selectedService))
                      .map((emp) => (
                        <SelectItem
                          key={emp.employee_id}
                          value={emp.employee_name}
                        >
                          {emp.employee_name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col space-y-2 col-span-2">
            <label className="text-sm font-medium">Horário:</label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {timeSlots.map(({ time, date: timeDate }) => {
                const isToday =
                  format(date, "yyyy-MM-dd") ===
                  format(new Date(), "yyyy-MM-dd");
                const currentTime = new Date();
                const isPastTime = isToday && timeDate < currentTime;
                const isUnavailable = !availableTimes[time];

                return (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      isUnavailable &&
                        "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                    onClick={() => setSelectedTime(time)}
                    disabled={isPastTime || isUnavailable}
                  >
                    {time}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            !date ||
            !selectedTime ||
            !selectedService ||
            !selectedEmployee ||
            !authUser?.phone
          }
        >
          Confirmar Agendamento
        </Button>
      </form>
    </div>
  );
};

export default Book;
