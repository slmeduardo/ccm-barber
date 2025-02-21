import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/config/firebaseConfig";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface Appointment {
  day: string;
  hour: string;
  service: string;
  employee: string;
  appointment_id: string;
}

export function Appointments() {
  const [phone, setPhone] = useState<string>("");
  const [isValidPhone, setIsValidPhone] = useState<boolean>(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [countryCode, setCountryCode] = useState<string>("+55");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.replace(/\D/g, "");

    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
      value = value.replace(/(\d)(\d{4})$/, "$1-$2");
      setPhone(value);
      setIsValidPhone(true);
    }
  };

  const handlePhoneBlur = () => {
    const numbers = phone.replace(/\D/g, "");
    const isValid = numbers.length === 10 || numbers.length === 11;
    setIsValidPhone(isValid);
  };

  const formatPhoneForDatabase = (phone: string, countryCode: string) => {
    const cleanNumber = countryCode.replace("+", "") + phone.replace(/\D/g, "");
    return `${cleanNumber}@s.whatsapp.net`;
  };

  const handleSearch = async () => {
    setLoading(true);
    const formattedPhone = formatPhoneForDatabase(phone, countryCode);
    const foundAppointments: Appointment[] = [];
    const seenAppointmentIds = new Set();

    try {
      const calendarRef = collection(db, "calendar");
      const calendarSnapshot = await getDocs(calendarRef);

      calendarSnapshot.forEach((employeeDoc) => {
        const employeeData = employeeDoc.data();
        const employeeName = employeeDoc.id;

        employeeData.calendar.forEach((day: any) => {
          day.day_time.forEach((timeSlot: any) => {
            if (
              timeSlot.client_id ===
                `${formattedPhone.split("@")[0]}@s.whatsapp.net` &&
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
        const employeeData = employeeDoc.data();
        employeeData.calendar.forEach((day: any) => {
          day.day_time.forEach((timeSlot: any) => {
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
        <h1 className="font-display text-4xl font-bold text-gray-200 mb-4">
          Meus Agendamentos
        </h1>
        <p className="text-xl text-gray-400">
          Consulte seus horários agendados
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex gap-2 flex-1">
          <Select value={countryCode} onValueChange={setCountryCode}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+55">🇧🇷 +55</SelectItem>
              <SelectItem value="+1">🇺🇸 +1</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            maxLength={15}
            className="flex-1"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={!isValidPhone || loading}
          className="w-32"
        >
          {loading ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      <div className="space-y-6">
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

        {appointments.length === 0 && phone && isValidPhone && !loading && (
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
