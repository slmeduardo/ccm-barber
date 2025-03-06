import { SignUpForm } from "@/components/auth/SignUpForm";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Criar uma conta</h1>
      <p className="text-muted-foreground mb-6">
        Digite suas informações para criar uma nova conta
      </p>
      <SignUpForm onSuccess={() => navigate("/")} />
    </div>
  );
};

export default SignUp;
