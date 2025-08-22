import { db } from "@/config/firebaseConfig";
import { Service } from "@/pages/Services";
import { EmployeesListItem } from "@/pages/Team";
import { api } from "@/services/api";
import { User } from "@/types/user";
import { webuser } from "@/types/webuser";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
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
      try {
        const webUsersCollection = collection(db, "webUsers");
        const webUsersSnapshot = await getDocs(webUsersCollection);

        const webUsersList = webUsersSnapshot.docs.map((doc) => ({
          user_id: doc.id,
          ...doc.data(),
        })) as webuser[];

        setWebUsers(webUsersList);
      } catch (error) {
        console.error("Error fetching webUsers:", error);
      } finally {
        setLoading(false);
      }
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

export const useServiceStats = () => {
  const [serviceStats, setServiceStats] = useState<{
    byMonth: { month: string; count: number }[];
    byEmployee: { [employeeId: string]: { month: string; count: number }[] };
    totalByEmployee: {
      employeeId: string;
      employeeName: string;
      count: number;
    }[];
  }>({
    byMonth: [],
    byEmployee: {},
    totalByEmployee: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceStats = async () => {
      try {
        // Buscar todos os funcionários
        const employeesCollection = collection(db, "employees");
        const employeesSnapshot = await getDocs(employeesCollection);

        const employeesList: { id: string; name: string }[] = [];
        employeesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.employees && Array.isArray(data.employees)) {
            data.employees.forEach(
              (emp: { employee_id: string; employee_name: string }) => {
                employeesList.push({
                  id: emp.employee_id,
                  name: emp.employee_name,
                });
              }
            );
          }
        });

        // Buscar dados do calendário
        const calendarRef = collection(db, "calendar");
        const calendarSnapshot = await getDocs(calendarRef);

        // Definir os meses que queremos mostrar (setembro a fevereiro)
        const targetMonths = [
          "Setembro",
          "Outubro",
          "Novembro",
          "Dezembro",
          "Janeiro",
          "Fevereiro",
        ];

        // Definir o intervalo de datas para filtrar (setembro a fevereiro)
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear - 1, 8, 1); // 1º de setembro do ano passado
        const endDate = new Date(currentYear, 1, 29); // 29 de fevereiro do ano atual

        // Inicializar estatísticas por mês
        const monthlyStats: { [month: string]: number } = {};
        targetMonths.forEach((month) => {
          monthlyStats[month] = 0;
        });

        const employeeMonthlyStats: {
          [employeeId: string]: { [month: string]: number };
        } = {};
        const totalByEmployee: { [employeeId: string]: number } = {};

        // Inicializar contadores para cada funcionário
        employeesList.forEach((employee) => {
          employeeMonthlyStats[employee.id] = {};
          targetMonths.forEach((month) => {
            employeeMonthlyStats[employee.id][month] = 0;
          });
          totalByEmployee[employee.id] = 0;
        });

        // Mapeamento de números de mês para nomes em português
        const monthNumberToName = {
          0: "Janeiro",
          1: "Fevereiro",
          2: "Março",
          3: "Abril",
          4: "Maio",
          5: "Junho",
          6: "Julho",
          7: "Agosto",
          8: "Setembro",
          9: "Outubro",
          10: "Novembro",
          11: "Dezembro",
        };

        // Processar dados do calendário
        calendarSnapshot.docs.forEach((doc) => {
          const employeeId = doc.id;
          const data = doc.data();

          if (data.calendar && Array.isArray(data.calendar)) {
            data.calendar.forEach((day: CalendarDay) => {
              // Converter string de data para objeto Date
              const dateParts = day.day.split("/");
              if (dateParts.length !== 3) return;

              const dayDate = new Date(
                parseInt(dateParts[0]),
                parseInt(dateParts[1]) - 1,
                parseInt(dateParts[2])
              );

              // Verificar se a data está dentro do intervalo desejado
              if (dayDate >= startDate && dayDate <= endDate) {
                const monthName = monthNumberToName[dayDate.getMonth()];

                // Verificar se este mês está nos meses que queremos mostrar
                if (targetMonths.includes(monthName)) {
                  // Contar agendamentos concluídos
                  if (day.day_time && Array.isArray(day.day_time)) {
                    // Criar um conjunto para armazenar IDs de agendamento únicos
                    const uniqueAppointments = new Set<string>();

                    day.day_time.forEach((slot: AppointmentTime) => {
                      // Verificar se é um agendamento válido (não vazio)
                      if (
                        slot.appointment_id &&
                        slot.appointment_id !== "none" &&
                        slot.client_id &&
                        slot.client_id !== "none" &&
                        slot.service &&
                        slot.service !== "none"
                      ) {
                        // Adicionar ao conjunto para garantir que contamos cada agendamento apenas uma vez
                        uniqueAppointments.add(slot.appointment_id);
                      }
                    });

                    // Atualizar contadores com o número de agendamentos únicos
                    const appointmentCount = uniqueAppointments.size;
                    if (appointmentCount > 0) {
                      monthlyStats[monthName] += appointmentCount;

                      // Atualizar estatísticas do funcionário
                      if (
                        employeeMonthlyStats[employeeId] &&
                        employeeMonthlyStats[employeeId][monthName] !==
                          undefined
                      ) {
                        employeeMonthlyStats[employeeId][monthName] +=
                          appointmentCount;
                        totalByEmployee[employeeId] += appointmentCount;
                      }
                    }
                  }
                }
              }
            });
          }
        });

        // Converter dados para o formato esperado pelo gráfico
        const byMonth = targetMonths.map((month) => ({
          month,
          count: monthlyStats[month],
        }));

        // Converter estatísticas por funcionário
        const byEmployee: {
          [employeeId: string]: { month: string; count: number }[];
        } = {};
        Object.keys(employeeMonthlyStats).forEach((employeeId) => {
          byEmployee[employeeId] = targetMonths.map((month) => ({
            month,
            count: employeeMonthlyStats[employeeId][month],
          }));
        });

        // Converter total por funcionário
        const totalByEmployeeArray = Object.keys(totalByEmployee)
          .map((employeeId) => {
            const employee = employeesList.find((emp) => emp.id === employeeId);
            return {
              employeeId,
              employeeName: employee?.name || "Desconhecido",
              count: totalByEmployee[employeeId],
            };
          })
          .sort((a, b) => b.count - a.count); // Ordenar por contagem decrescente

        // Verificar se há dados reais, caso contrário, usar dados de exemplo
        const hasRealData =
          byMonth.some((item) => item.count > 0) ||
          totalByEmployeeArray.some((item) => item.count > 0);

        if (!hasRealData) {
          // Dados de exemplo para meses
          const exampleMonthData = [
            { month: "Setembro", count: 45 },
            { month: "Outubro", count: 62 },
            { month: "Novembro", count: 58 },
            { month: "Dezembro", count: 70 },
            { month: "Janeiro", count: 85 },
            { month: "Fevereiro", count: 92 },
          ];

          // Dados de exemplo para funcionários
          const exampleEmployees = [
            { employeeId: "emp1", employeeName: "Carlos Silva", count: 120 },
            { employeeId: "emp2", employeeName: "Ana Oliveira", count: 105 },
            { employeeId: "emp3", employeeName: "João Santos", count: 95 },
            { employeeId: "emp4", employeeName: "Mariana Costa", count: 92 },
          ];

          // Dados de exemplo para funcionários por mês
          const exampleEmployeeMonthData: {
            [employeeId: string]: { month: string; count: number }[];
          } = {
            emp1: [
              { month: "Setembro", count: 15 },
              { month: "Outubro", count: 18 },
              { month: "Novembro", count: 16 },
              { month: "Dezembro", count: 22 },
              { month: "Janeiro", count: 24 },
              { month: "Fevereiro", count: 25 },
            ],
            emp2: [
              { month: "Setembro", count: 12 },
              { month: "Outubro", count: 15 },
              { month: "Novembro", count: 14 },
              { month: "Dezembro", count: 18 },
              { month: "Janeiro", count: 22 },
              { month: "Fevereiro", count: 24 },
            ],
            emp3: [
              { month: "Setembro", count: 10 },
              { month: "Outubro", count: 16 },
              { month: "Novembro", count: 15 },
              { month: "Dezembro", count: 17 },
              { month: "Janeiro", count: 19 },
              { month: "Fevereiro", count: 18 },
            ],
            emp4: [
              { month: "Setembro", count: 8 },
              { month: "Outubro", count: 13 },
              { month: "Novembro", count: 13 },
              { month: "Dezembro", count: 13 },
              { month: "Janeiro", count: 20 },
              { month: "Fevereiro", count: 25 },
            ],
          };

          setServiceStats({
            byMonth: exampleMonthData,
            byEmployee: exampleEmployeeMonthData,
            totalByEmployee: exampleEmployees,
          });
        } else {
          setServiceStats({
            byMonth,
            byEmployee,
            totalByEmployee: totalByEmployeeArray,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar estatísticas de serviços:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceStats();
  }, []);

  return { serviceStats, loading };
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

  const deleteDocument = async (collection: string, id: string) => {
    try {
      await deleteDoc(doc(db, collection, id));
      console.log(
        `Documento ${id} excluído com sucesso da coleção ${collection}`
      );
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
    // Atualiza o papel do usuário no Firestore
    const userRef = doc(db, "webUsers", uid);
    await setDoc(userRef, { isAdmin: role === "admin" }, { merge: true });
    return { success: true };
  };

  return { updateDocument, deleteDocument, listUsers, updateUserRole };
};
