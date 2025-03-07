import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { scheduleCalendarUpdate } from "@/utils/scheduledTasks";
import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

export default function App() {
  useEffect(() => {
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
