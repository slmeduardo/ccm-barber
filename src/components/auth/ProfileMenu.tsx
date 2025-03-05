import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Calendar, Home, LayoutDashboard, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface ProfileMenuProps {
  userName: string;
  isAdmin?: boolean;
}

export function ProfileMenu({ userName, isAdmin = false }: ProfileMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isDashboard = location.pathname.includes("/dashboard");

  const handleLogout = async () => {
    try {
      // Fazer logout no Firebase
      await signOut(auth);
      // Fazer logout no contexto de autenticação
      logout();
      // Redirecionar para a página de autenticação
      navigate("/auth");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{userName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isDashboard && (
          <DropdownMenuItem asChild>
            <Link to="/" className="flex items-center">
              <Home className="h-4 w-4 mr-2" />
              <span>Voltar ao site</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/appointments" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Meus Agendamentos</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>Perfil</DropdownMenuItem>
        <DropdownMenuItem>Configurações</DropdownMenuItem>
        {isAdmin && !isDashboard && (
          <DropdownMenuItem asChild>
            <Link to="/dashboard" className="flex items-center">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
