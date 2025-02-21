import { LoginForm } from "@/components/auth/LoginForm";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Login</h1>
      <p className="text-muted-foreground mb-6">
        Entre com suas credenciais para acessar sua conta
      </p>
      <LoginForm onSuccess={() => navigate("/")} />
    </div>
  );
};

export default Login;
