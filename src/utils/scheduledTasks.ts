import { updateAllCalendars } from "@/utils/calendarUtils";

/**
 * Calcula o tempo em milissegundos até a próxima execução (00:00 do dia seguinte)
 * @returns Número de milissegundos até a próxima execução
 */
const calculateTimeUntilNextExecution = (): number => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return tomorrow.getTime() - now.getTime();
};

/**
 * Agenda a atualização diária do calendário para 00:00
 */
export const scheduleCalendarUpdate = (): void => {
  let timeoutId: number;

  const scheduleNextUpdate = () => {
    const timeUntilNextExecution = calculateTimeUntilNextExecution();

    // Limpa qualquer timeout existente
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Agenda a próxima execução
    timeoutId = window.setTimeout(async () => {
      try {
        console.log("Executando atualização diária do calendário...");
        await updateAllCalendars();
        console.log("Atualização do calendário concluída com sucesso");
      } catch (error) {
        console.error("Erro na atualização diária do calendário:", error);
      } finally {
        // Agenda a próxima execução
        scheduleNextUpdate();
      }
    }, timeUntilNextExecution);

    console.log(
      `Próxima atualização do calendário agendada para ${new Date(
        Date.now() + timeUntilNextExecution
      ).toLocaleString()}`
    );
  };

  // Inicia o agendamento
  scheduleNextUpdate();
};
