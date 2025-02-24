import { db } from "@/config/firebaseConfig";
import { Service } from "@/pages/Services";
import { EmployeesListItem } from "@/pages/Team";
import { api } from "@/services/api";
import { User } from "@/types/user";
import { webuser } from "@/types/webuser";
import { addDoc, collection, doc, getDocs, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesCollection = collection(db, "services");
        const servicesSnapshot = await getDocs(servicesCollection);

        const servicesList = servicesSnapshot.docs.map((doc) => ({
          service_id: doc.id,
          name: doc.id,
          ...doc.data(),
        })) as Service[];

        setServices(servicesList);
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading };
};

export const useWebUsers = () => {
  const [webUsers, setWebUsers] = useState<webuser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebUsers = async () => {
      const webUsersCollection = collection(db, "webUsers");
      const webUsersSnapshot = await getDocs(webUsersCollection);

      const webUsersList = webUsersSnapshot.docs.map((doc) => ({
        user_id: doc.id,
        ...doc.data(),
      })) as webuser[];

      setWebUsers(webUsersList);
    };

    fetchWebUsers();
  }, []);

  return { webUsers, loading };
};

export const createWebUser = async (webUser: webuser) => {
  const webUsersCollection = collection(db, "webUsers");
  await addDoc(webUsersCollection, webUser);
  return webUser;
};

export const useEmployees = () => {
  const [employees, setEmployees] = useState<EmployeesListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesCollection = collection(db, "employees");
        const employeesSnapshot = await getDocs(employeesCollection);

        const employeesList: EmployeesListItem[] = employeesSnapshot.docs.map(
          (doc) => {
            const data = doc.data();
            return {
              employee_id: doc.id,
              employees: data.employees,
            };
          }
        );

        setEmployees(employeesList);
      } catch (error) {
        console.error("Error fetching employees: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return { employees, loading };
};

type AppointmentTime = {
  appointment_id: string;
  client_id: string;
  hour: string;
  service: string;
};

type CalendarDay = {
  day: string;
  day_time: AppointmentTime[];
};

export const useEmployeeCalendar = (
  employeeId: string,
  selectedDate: Date | undefined,
  selectedService: string,
  services: Service[]
) => {
  const [availableTimes, setAvailableTimes] = useState<{
    [key: string]: boolean;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendar = async () => {
      if (!employeeId || !selectedDate) {
        setAvailableTimes({});
        setLoading(false);
        return;
      }

      try {
        const calendarRef = collection(db, "calendar");
        const calendarSnapshot = await getDocs(calendarRef);

        const employeeDoc = calendarSnapshot.docs.find(
          (doc) => doc.id === employeeId
        );

        if (!employeeDoc) {
          setAvailableTimes({});
          setLoading(false);
          return;
        }

        const employeeData = employeeDoc.data();
        const dateObj =
          selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
        const formattedDate = dateObj
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "/");

        const daySchedule = employeeData.calendar.find(
          (day: CalendarDay) => day.day === formattedDate
        );

        if (!daySchedule) {
          setAvailableTimes({});
          setLoading(false);
          return;
        }

        // Encontra a duração do serviço selecionado
        const selectedServiceData = services.find(
          (service) => service.name === selectedService
        );
        const serviceDuration = selectedServiceData?.service_duration || 1; // Duração em intervalos de 15 minutos

        // Função para verificar se um horário está disponível considerando a duração do serviço
        const isTimeSlotAvailable = (
          timeSlots: AppointmentTime[],
          currentIndex: number
        ) => {
          // Número de slots necessários baseado na duração do serviço
          const slotsNeeded = serviceDuration;

          // Verifica se há slots suficientes disponíveis
          for (let i = 0; i < slotsNeeded; i++) {
            const slot = timeSlots[currentIndex + i];
            if (!slot) return false; // Não há slots suficientes

            // Verifica se o slot está ocupado
            if (
              slot.client_id !== "none" &&
              slot.client_id &&
              slot.service !== "none" &&
              slot.service &&
              slot.appointment_id !== "none" &&
              slot.appointment_id
            ) {
              return false; // Slot está ocupado
            }
          }

          return true; // Todos os slots necessários estão disponíveis
        };

        // Cria um objeto com a disponibilidade de cada horário
        const timesAvailability = daySchedule.day_time.reduce(
          (
            acc: { [key: string]: boolean },
            timeSlot: AppointmentTime,
            index
          ) => {
            acc[timeSlot.hour] = isTimeSlotAvailable(
              daySchedule.day_time,
              index
            );
            return acc;
          },
          {}
        );

        setAvailableTimes(timesAvailability);
      } catch (error) {
        console.error("Erro ao buscar calendário:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [employeeId, selectedDate, selectedService, services]);

  return { availableTimes, loading };
};

export const useFirestore = () => {
  const updateDocument = async (
    collection: string,
    documentId: string,
    data: unknown
  ) => {
    try {
      const docRef = doc(db, collection, documentId);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error("Erro ao atualizar documento:", error);
      throw error;
    }
  };

  const deleteDocument = async (collection: string, documentId: string) => {
    try {
      const docRef = doc(db, collection, documentId);
      await setDoc(docRef, null, { merge: true });
    } catch (error) {
      console.error("Erro ao deletar documento:", error);
      throw error;
    }
  };

  const listUsers = async (
    page: number,
    limit: number,
    search?: string
  ): Promise<{ users: User[]; total: number }> => {
    return api.listUsers(page, limit, search);
  };

  const updateUserRole = async (uid: string, role: "admin" | "user") => {
    return api.updateUserRole(uid, role);
  };

  return { updateDocument, deleteDocument, listUsers, updateUserRole };
};
