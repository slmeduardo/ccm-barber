import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/config/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Appointment {
  day: string;
  hour: string;
  service: string;
  employee: string;
  appointment_id: string;
}

interface DayTime {
  hour: string;
  client_id: string;
  appointment_id: string;
  service: string;
}

interface CalendarDay {
  day: string;
  day_time: DayTime[];
}

interface EmployeeData {
  calendar: CalendarDay[];
}

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [countryCode] = useState<string>("+55");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user?.phone) {
      handleSearch();
    }
  }, [user]);

  const formatPhoneForDatabase = (phone: string) => {
    return phone;
  };

  const handleSearch = async () => {
    if (!user?.phone) {
      return;
    }

    setLoading(true);
    const formattedPhone = formatPhoneForDatabase(user.phone);
    const foundAppointments: Appointment[] = [];
    const seenAppointmentIds = new Set();

    try {
      const calendarRef = collection(db, "calendar");
      const calendarSnapshot = await getDocs(calendarRef);

      calendarSnapshot.forEach((employeeDoc) => {
        const employeeData = employeeDoc.data() as EmployeeData;
        const employeeName = employeeDoc.id;

        employeeData.calendar.forEach((day: CalendarDay) => {
          day.day_time.forEach((timeSlot: DayTime) => {
            if (
              timeSlot.client_id === formattedPhone &&
              !seenAppointmentIds.has(timeSlot.appointment_id)
            ) {
              seenAppointmentIds.add(timeSlot.appointment_id);
              foundAppointments.push({
                day: day.day,
                hour: timeSlot.hour,
                service: timeSlot.service,
                employee: employeeName,
                appointment_id: timeSlot.appointment_id,
              });
            }
          });
        });
      });

      setAppointments(foundAppointments);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      alert("Erro ao buscar agendamentos. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("/");
    return format(
      new Date(Number(year), Number(month) - 1, Number(day)),
      "PPP",
      {
        locale: ptBR,
      }
    );
  };

  const handleDelete = async (appointmentId: string) => {
    try {
      const calendarRef = collection(db, "calendar");
      const calendarSnapshot = await getDocs(calendarRef);

      const batch = writeBatch(db);

      calendarSnapshot.forEach((employeeDoc) => {
        const employeeData = employeeDoc.data() as EmployeeData;
        employeeData.calendar.forEach((day: CalendarDay) => {
          day.day_time.forEach((timeSlot: DayTime) => {
            if (timeSlot.appointment_id === appointmentId) {
              timeSlot.appointment_id = "";
              timeSlot.client_id = "none";
              timeSlot.service = "none";
              batch.set(employeeDoc.ref, employeeData);
            }
          });
        });
      });

      await batch.commit();
      setAppointments((prev) =>
        prev.filter((app) => app.appointment_id !== appointmentId)
      );
    } catch (error) {
      console.error("Erro ao deletar agendamento:", error);
      alert("Erro ao deletar agendamento. Por favor, tente novamente.");
    }
  };

  const openDeleteDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsOpen(false);
    setSelectedAppointment(null);
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-200 mb-4">
          Meus Agendamentos
        </h1>
        <p className="text-xl text-gray-400">
          Consulte seus horários agendados
        </p>
      </div>

      <div className="space-y-6">
        {loading && (
          <p className="text-center text-gray-400">
            Carregando agendamentos...
          </p>
        )}

        {appointments.map((appointment, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border border-gray-700 bg-gray-800 relative group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-200">
                  {appointment.service}
                </h3>
                <p className="text-gray-400">Com: {appointment.employee}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-200">{formatDate(appointment.day)}</p>
                <p className="text-gray-400">{appointment.hour}</p>
                <p className="hidden">{appointment.appointment_id}</p>
              </div>
            </div>
            <button
              onClick={() => openDeleteDialog(appointment)}
              className="absolute -top-4 -right-4 bg-red-500 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {/* <button

              className="absolute -top-4 right-6 bg-primary rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="w-4 h-4" />
            </button> */}
          </div>
        ))}

        {appointments.length === 0 && !loading && (
          <p className="text-center text-gray-400">
            Nenhum agendamento encontrado para este número.
          </p>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              {selectedAppointment && (
                <div>
                  <p>
                    Você tem certeza que deseja excluir o agendamento para{" "}
                    <strong>{selectedAppointment.service}</strong>?
                  </p>
                  <p>Data: {formatDate(selectedAppointment.day)}</p>
                  <p>Hora: {selectedAppointment.hour}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedAppointment) {
                  handleDelete(selectedAppointment.appointment_id);
                }
                closeDeleteDialog();
              }}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Appointments;
