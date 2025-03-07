import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ensureCalendarCollectionExists } from "@/utils/calendarUtils";
import { scheduleCalendarUpdate } from "@/utils/scheduledTasks";
import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

export default function App() {
  useEffect(() => {
    // Garante que a coleção de calendário exista
    ensureCalendarCollectionExists().then(() => {
      console.log("Verificação de coleção de calendário concluída.");
    });

    // Inicia o agendamento da atualização diária do calendário
    scheduleCalendarUpdate();

    // Registra mensagem no console para confirmar a inicialização
    console.log("Agendamento da atualização do calendário iniciado");
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
