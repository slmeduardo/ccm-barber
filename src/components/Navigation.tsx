import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useWebUsers } from "@/hooks/useFirestore";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import {
  Calendar,
  CalendarSearch,
  CircleUser,
  Clock,
  LogOut,
  Scissors,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navigation = [
  { name: "Serviços", href: "/services", icon: Scissors },
  { name: "Equipe", href: "/team", icon: Users },
  { name: "Agendamentos", href: "/book", icon: Calendar },
  { name: "Agendamentos", href: "/schedules", icon: Clock },
  // { name: "Management", href: "/management", icon: Settings },
  { name: "Agendamentos", href: "/appointments", icon: CalendarSearch },
];

const isActive = (path: string) => location.pathname === path;

export function Navigation() {
  const { t } = useLanguage();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { webUsers } = useWebUsers();
  const webUser = webUsers.find((user) => user.user_id === authUser?.uid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src="/uploads/3938081c-f339-4921-b90f-f5ff2a42361d.png"
              alt="CGM Logo"
              className="h-20 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {authUser && (
              <>
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "text-primary border-b-2 py-2 border-primary"
                          : "text-muted-foreground hover:text-foreground py-2"
                      )
                    }
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </NavLink>
                ))}
                {webUser?.isAdmin === true ? (
                  <NavLink
                    to="/management"
                    className={({ isActive }) =>
                      cn(
                        "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "text-primary border-b-2 py-2 border-primary"
                          : "text-muted-foreground hover:text-foreground py-2"
                      )
                    }
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manutenção
                  </NavLink>
                ) : null}
              </>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {/* <LanguageToggle />
            <ThemeToggle /> */}
            {authUser ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <CircleUser className="h-8 w-8" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {authUser.displayName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {authUser.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/appointments">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Agendamentos</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => auth.signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <NavLink
                to="/auth"
                className={({ isActive }) =>
                  `py-2 px-4 bg-primary rounded hover:bg-primary-hover transition-colors ${
                    isActive ? "bg-accent" : ""
                  }`
                }
              >
                Log in
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
