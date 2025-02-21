import { useToast } from "@/components/ui/use-toast";
import { api } from "@/services/api";
import { useEffect, useState } from "react";

export function MakeAdmin() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    const makeSpecificUserAdmin = async () => {
      try {
        setStatus("loading");

        // Fazer o usuário específico admin
        await api.updateUserRole("EQukeavZ5tMqUYT3dR9chFVR9H32", "admin");

        setStatus("success");
        toast({
          title: "Sucesso",
          description: "Usuário definido como admin com sucesso!",
        });
      } catch (error) {
        setStatus("error");
        console.error("Erro ao definir usuário como admin:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description:
            error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    };

    makeSpecificUserAdmin();
  }, [toast]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Configuração de Admin</h1>
      {status === "loading" && (
        <p className="text-blue-500">Fazendo usuário admin...</p>
      )}
      {status === "success" && (
        <p className="text-green-500">
          Usuário definido como admin com sucesso!
        </p>
      )}
      {status === "error" && (
        <p className="text-red-500">Erro ao definir usuário como admin.</p>
      )}
    </div>
  );
}
