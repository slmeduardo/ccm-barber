import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function AuthPage() {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard/management");
    }
  }, [user, loading, navigate]);

  // Aguardar o carregamento do contexto de autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (user) {
    return null; // Usuário será redirecionado pelo useEffect
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Imagem e Informações */}
      <div className=" bg-primary w-1/2 p-12 text-white flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-4">Barbearia CCM</h1>
          <p className="text-xl mb-8">
            O melhor em cuidados masculinos e estilo para você.
          </p>
        </div>
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              ✂️
            </div>
            <div>
              <h3 className="font-semibold">Profissionais Experientes</h3>
              <p className="text-white/80">
                Nossa equipe é formada por barbeiros altamente qualificados
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              🕒
            </div>
            <div>
              <h3 className="font-semibold">Horários Flexíveis</h3>
              <p className="text-white/80">
                Agende seu horário de acordo com sua disponibilidade
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              ⭐
            </div>
            <div>
              <h3 className="font-semibold">Serviço Premium</h3>
              <p className="text-white/80">
                Experiência única em cuidados masculinos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 p-8 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              {isLoginForm ? "Bem-vindo de volta!" : "Crie sua conta"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isLoginForm
                ? "Entre com suas credenciais para acessar sua conta"
                : "Preencha seus dados para criar uma nova conta"}
            </p>
          </div>

          {isLoginForm ? (
            <>
              <LoginForm />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Ainda não tem uma conta?{" "}
                  <button
                    onClick={() => setIsLoginForm(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    Criar conta
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <SignUpForm onSuccess={() => setIsLoginForm(true)} />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <button
                    onClick={() => setIsLoginForm(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Fazer login
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
