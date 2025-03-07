import { db } from "@/config/firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

// Tipos exportados para uso em outros arquivos
export type DayTimeSlot = {
  appointment_id: string;
  client_id: string;
  hour: string;
  service: string;
};

export type CalendarDay = {
  day: string;
  day_time: DayTimeSlot[];
};

/**
 * Gera os slots de horário para um dia em formato das 8:00 às 20:00 com intervalos de 15 minutos
 * @returns Array de slots de horário no formato HH:MM
 */
export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];

  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = String(hour).padStart(2, "0");
      const formattedMinute = String(minute).padStart(2, "0");
      slots.push(`${formattedHour}:${formattedMinute}`);
    }
  }

  return slots;
};

/**
 * Gera apenas os slots das horas inteiras (8:00, 9:00, etc.)
 * @returns Array de slots de horário de hora em hora
 */
export const generateHourlySlots = (): string[] => {
  const slots: string[] = [];

  for (let hour = 8; hour < 20; hour++) {
    const formattedHour = String(hour).padStart(2, "0");
    slots.push(`${formattedHour}:00`);
  }

  return slots;
};

/**
 * Obtém todos os slots de 15 minutos para uma hora específica
 * @param hour Hora no formato HH (ex: "09")
 * @returns Array de slots de 15 minutos para a hora específica
 */
export const getQuarterSlotsForHour = (hour: string): string[] => {
  return [`${hour}:00`, `${hour}:15`, `${hour}:30`, `${hour}:45`];
};

/**
 * Extrai a hora de um slot de tempo (HH:MM -> HH)
 * @param timeSlot Slot de tempo no formato HH:MM
 * @returns Apenas a hora (HH)
 */
export const getHourFromTimeSlot = (timeSlot: string): string => {
  return timeSlot.split(":")[0];
};

/**
 * Formata uma data no formato YYYY/MM/DD
 * @param date Data a ser formatada
 * @returns String formatada como YYYY/MM/DD
 */
export const formatDateForCalendar = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

/**
 * Gera um calendário de 15 dias a partir da data atual
 * @returns Array de objetos CalendarDay
 */
export const generateCalendarFor15Days = (): CalendarDay[] => {
  const calendar: CalendarDay[] = [];
  const today = new Date();
  const timeSlots = generateTimeSlots();

  // Gera 15 dias a partir de hoje
  for (let i = 0; i < 15; i++) {
    const currentDate = new Date();
    currentDate.setDate(today.getDate() + i);

    const formattedDate = formatDateForCalendar(currentDate);

    // Gera slots de tempo vazios para cada horário
    const dayTimeSlots = timeSlots.map((time) => ({
      appointment_id: "",
      client_id: "none",
      hour: time,
      service: "none",
    }));

    calendar.push({
      day: formattedDate,
      day_time: dayTimeSlots,
    });
  }

  return calendar;
};

/**
 * Obtém o padrão atual de horários bloqueados dos funcionários existentes
 * @returns Mapa de dias da semana e horários marcados como not_in_schedule
 */
export const getExistingSchedulePattern = async (): Promise<{
  [key: string]: boolean;
}> => {
  try {
    // Busca todos os documentos de calendário
    const calendarCollection = collection(db, "calendar");
    const calendarSnapshot = await getDocs(calendarCollection);

    if (calendarSnapshot.empty) {
      console.log(
        "Não existem calendários para usar como referência. Criando padrão padrão."
      );
      return {}; // Não há funcionários/calendários para usar como base
    }

    // Usa o primeiro funcionário como referência para o padrão de horários
    const firstEmployeeDoc = calendarSnapshot.docs[0];
    const employeeData = firstEmployeeDoc.data();

    if (!employeeData.calendar || !Array.isArray(employeeData.calendar)) {
      console.log("Formato de calendário inválido. Criando padrão padrão.");
      return {};
    }

    // Mapeia os dias da semana para inglês (usado nas datas)
    const weekDayMap = {
      Domingo: 0,
      Segunda: 1,
      Terça: 2,
      Quarta: 3,
      Quinta: 4,
      Sexta: 5,
      Sábado: 6,
    };

    // Cria um mapa de horários bloqueados por dia da semana
    const schedulePattern: { [key: string]: boolean } = {};

    // Para cada dia no calendário
    employeeData.calendar.forEach((day: CalendarDay) => {
      // Descobre o dia da semana para esta data
      const dateParts = day.day.split("/");
      if (dateParts.length !== 3) return;

      const date = new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2])
      );
      const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, etc.

      // Mapeia slots de 15 minutos para slots de hora em hora
      const hourlySlots: { [hour: string]: number } = {};

      // Verifica cada horário
      day.day_time.forEach((timeSlot: DayTimeSlot) => {
        const hour = getHourFromTimeSlot(timeSlot.hour);
        const isBlocked = timeSlot.appointment_id === "not_in_schedule";

        // Inicializa o contador para esta hora se necessário
        if (hourlySlots[hour] === undefined) {
          hourlySlots[hour] = 0;
        }

        // Incrementa o contador de slots bloqueados para esta hora
        if (isBlocked) {
          hourlySlots[hour]++;
        }
      });

      // Para cada hora, verifica se todos os 4 slots de 15 minutos estão bloqueados
      Object.keys(hourlySlots).forEach((hour) => {
        // Se todos os 4 slots de 15 minutos estão bloqueados, marca a hora como bloqueada
        const isHourBlocked = hourlySlots[hour] === 4;

        // Encontra o nome do dia da semana a partir do número
        const weekDayName = Object.keys(weekDayMap).find(
          (key) => weekDayMap[key as keyof typeof weekDayMap] === dayOfWeek
        );

        if (weekDayName) {
          // Cria a chave no formato "DiaDaSemana-HH:00"
          const key = `${weekDayName}-${hour}:00`;
          schedulePattern[key] = isHourBlocked;
        }
      });
    });

    console.log(
      "Padrão de horários obtido com sucesso:",
      Object.keys(schedulePattern).length,
      "configurações"
    );
    return schedulePattern;
  } catch (error) {
    console.error("Erro ao obter padrão de horários:", error);
    return {};
  }
};

/**
 * Aplica o padrão de horários bloqueados a um calendário
 * @param calendar Calendário a ser atualizado
 * @param schedulePattern Padrão de horários bloqueados
 * @returns Calendário atualizado
 */
export const applySchedulePattern = (
  calendar: CalendarDay[],
  schedulePattern: { [key: string]: boolean }
): CalendarDay[] => {
  // Se não há padrão, retorna o calendário original
  if (Object.keys(schedulePattern).length === 0) {
    return calendar;
  }

  // Mapeia dias da semana
  const weekDays = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  // Atualiza cada dia do calendário
  return calendar.map((day) => {
    // Descobre o dia da semana para esta data
    const dateParts = day.day.split("/");
    if (dateParts.length !== 3) return day;

    const date = new Date(
      Number(dateParts[0]),
      Number(dateParts[1]) - 1,
      Number(dateParts[2])
    );
    const dayOfWeek = date.getDay();
    const weekDay = weekDays[dayOfWeek];

    // Atualiza os slots de tempo para este dia
    const updatedDayTime = day.day_time.map((timeSlot) => {
      // Agendamentos existentes não são modificados
      if (
        timeSlot.appointment_id !== "" &&
        timeSlot.appointment_id !== "not_in_schedule"
      ) {
        return timeSlot;
      }

      // Encontra a hora base para este slot
      const hour = getHourFromTimeSlot(timeSlot.hour);
      const key = `${weekDay}-${hour}:00`;

      // Verifica se esta hora deve ser bloqueada de acordo com o padrão
      const shouldBlock = schedulePattern[key] === true;

      // Se a hora deve ser bloqueada, marca como not_in_schedule
      if (shouldBlock) {
        return {
          ...timeSlot,
          appointment_id: "not_in_schedule",
          client_id: "not_in_schedule",
          service: "not_in_schedule",
        };
      }

      return timeSlot;
    });

    return {
      ...day,
      day_time: updatedDayTime,
    };
  });
};

/**
 * Cria ou atualiza o calendário para um funcionário
 * @param employeeName Nome do funcionário
 */
export const createOrUpdateEmployeeCalendar = async (
  employeeName: string
): Promise<void> => {
  try {
    console.log(
      `Iniciando criação/atualização do calendário para: ${employeeName}`
    );

    // Verifica se o nome do funcionário é válido
    if (!employeeName || employeeName.trim() === "") {
      console.error("Nome de funcionário inválido.");
      return;
    }

    // Cria um calendário padrão de 15 dias
    const newCalendar = generateCalendarFor15Days();
    console.log(
      `Calendário padrão de 15 dias gerado com ${newCalendar.length} dias.`
    );

    try {
      // Tenta obter o padrão de horários existente
      const schedulePattern = await getExistingSchedulePattern();

      // Aplica o padrão de horários ao novo calendário (se existir algum padrão)
      const calendarioComPadrao =
        Object.keys(schedulePattern).length > 0
          ? applySchedulePattern(newCalendar, schedulePattern)
          : newCalendar;

      // Referência para o documento do funcionário
      const calendarRef = doc(db, "calendar", employeeName);

      // Busca o documento atual, se existir
      const calendarDoc = await getDoc(calendarRef);

      if (!calendarDoc.exists()) {
        // Se o calendário não existe, cria um novo com o padrão aplicado
        console.log(`Criando novo calendário para: ${employeeName}`);
        await setDoc(calendarRef, {
          calendar: calendarioComPadrao,
        });
      } else {
        // Se já existe, verifica se precisa atualizar
        const calendarData = calendarDoc.data();
        if (!calendarData.calendar || calendarData.calendar.length < 15) {
          // Se o calendário estiver vazio ou tiver menos de 15 dias, atualiza com o novo
          console.log(`Atualizando calendário existente para: ${employeeName}`);
          await setDoc(calendarRef, {
            calendar: calendarioComPadrao,
          });
        } else {
          console.log(
            `Calendário para ${employeeName} já existe e está completo.`
          );
        }
      }

      console.log(
        `Operação de criação/atualização do calendário concluída para: ${employeeName}`
      );
    } catch (errorPattern) {
      // Se houver erro ao obter o padrão, cria um calendário padrão sem aplicar padrão
      console.error(
        "Erro ao obter/aplicar padrão de horários. Criando calendário padrão:",
        errorPattern
      );

      const calendarRef = doc(db, "calendar", employeeName);
      await setDoc(calendarRef, {
        calendar: newCalendar,
      });
    }
  } catch (error) {
    console.error("Erro ao criar/atualizar calendário:", error);
    throw error;
  }
};

/**
 * Remove o calendário de um funcionário
 * @param employeeName Nome do funcionário
 */
export const deleteEmployeeCalendar = async (
  employeeName: string
): Promise<void> => {
  try {
    // Verifica se o nome do funcionário é válido
    if (!employeeName || employeeName.trim() === "") {
      console.error("Nome de funcionário inválido para exclusão.");
      return;
    }

    console.log(`Tentando excluir o calendário para: ${employeeName}`);

    // Verifica se o documento existe antes de tentar excluí-lo
    const calendarRef = doc(db, "calendar", employeeName);
    const calendarDoc = await getDoc(calendarRef);

    if (!calendarDoc.exists()) {
      console.log(
        `Calendário para ${employeeName} não existe. Nada a excluir.`
      );
      return;
    }

    // Excluir apenas o documento específico, não a coleção inteira
    await deleteDoc(calendarRef);
    console.log(`Calendário para ${employeeName} excluído com sucesso.`);
  } catch (error) {
    console.error(`Erro ao excluir calendário para ${employeeName}:`, error);
    throw error;
  }
};

/**
 * Atualiza todos os calendários: remove o dia anterior e adiciona um novo dia ao final
 */
export const updateAllCalendars = async (): Promise<void> => {
  try {
    const calendarCollection = collection(db, "calendar");
    const calendarSnapshot = await getDocs(calendarCollection);

    // Data para o novo dia (15 dias a partir de hoje)
    const today = new Date();
    const newDate = new Date();
    newDate.setDate(today.getDate() + 14); // +14 porque já temos 0-13 = 14 dias, e queremos o 15º

    const formattedNewDate = formatDateForCalendar(newDate);
    const timeSlots = generateTimeSlots();

    // Cria um novo dia vazio
    const newDay: CalendarDay = {
      day: formattedNewDate,
      day_time: timeSlots.map((time) => ({
        appointment_id: "",
        client_id: "none",
        hour: time,
        service: "none",
      })),
    };

    // Atualiza cada calendário
    for (const doc of calendarSnapshot.docs) {
      const employeeName = doc.id;
      const calendarData = doc.data();

      if (calendarData.calendar && Array.isArray(calendarData.calendar)) {
        // Remove o primeiro dia (mais antigo) e adiciona o novo dia ao final
        const updatedCalendar = [...calendarData.calendar.slice(1), newDay];

        await setDoc(doc.ref, {
          calendar: updatedCalendar,
        });
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar calendários:", error);
    throw error;
  }
};

/**
 * Garante que a coleção de calendário exista com pelo menos um documento,
 * para que outros funcionários possam herdar o padrão de horários.
 * Deve ser chamada na inicialização da aplicação.
 */
export const ensureCalendarCollectionExists = async (): Promise<void> => {
  try {
    console.log("Verificando se a coleção de calendário existe...");

    // Verifica se há documentos na coleção de calendário
    const calendarCollection = collection(db, "calendar");
    const calendarSnapshot = await getDocs(calendarCollection);

    if (calendarSnapshot.empty) {
      console.log("Coleção de calendário vazia. Verificando funcionários...");

      // Se não existir nenhum calendário, busca os funcionários para criar pelo menos um
      const employeesDoc = await getDoc(doc(db, "employees", "colaborador"));

      if (employeesDoc.exists()) {
        const employeesData = employeesDoc.data();

        if (employeesData.employees && employeesData.employees.length > 0) {
          // Usa o primeiro funcionário para criar um calendário padrão
          const firstEmployee = employeesData.employees[0];

          console.log(
            `Criando calendário padrão para ${firstEmployee.employee_name}`
          );

          // Cria um calendário padrão para o primeiro funcionário
          const newCalendar = generateCalendarFor15Days();
          await setDoc(doc(db, "calendar", firstEmployee.employee_name), {
            calendar: newCalendar,
          });

          console.log(
            `Calendário padrão criado com sucesso para ${firstEmployee.employee_name}`
          );
        } else {
          console.log(
            "Nenhum funcionário encontrado para criar calendário padrão."
          );
        }
      } else {
        console.log("Documento de funcionários não encontrado.");
      }
    } else {
      console.log(
        "Coleção de calendário já existe com",
        calendarSnapshot.size,
        "documentos."
      );
    }
  } catch (error) {
    console.error("Erro ao verificar/criar coleção de calendário:", error);
  }
};
