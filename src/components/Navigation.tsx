import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import {
  Calendar,
  CalendarSearch,
  Clock,
  Scissors,
  Settings,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const navigation = [
  { name: "Services", href: "/services", icon: Scissors },
  { name: "Team", href: "/team", icon: Users },
  { name: "Book", href: "/book", icon: Calendar },
  { name: "Schedules", href: "/schedules", icon: Clock },
  { name: "Management", href: "/management", icon: Settings },
  { name: "Appointments", href: "/appointments", icon: CalendarSearch },
];

const isActive = (path: string) => location.pathname === path;

export function Navigation() {
  const { t } = useLanguage();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const navigate = useNavigate();
  const { user: authUser, role } = useAuth();

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
              </>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {/* <LanguageToggle />
            <ThemeToggle /> */}
            {authUser ? (
              <>
                {/* Links para usuários autenticados */}
                <NavLink
                  to="/appointments"
                  className={({ isActive }) =>
                    cn(
                      "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "text-primary border-b-2 py-2 border-primary"
                        : "text-muted-foreground hover:text-foreground py-2"
                    )
                  }
                >
                  {/* <User className="w-4 h-4 mr-2" />
                  Agendamentos */}
                </NavLink>

                {/* Links apenas para admin */}
                {role === "admin" && (
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
                    Gerenciamento
                  </NavLink>
                )}

                <button onClick={() => auth.signOut()}>Sair</button>
              </>
            ) : (
              <NavLink
                to="/auth"
                className={({ isActive }) =>
                  `p-2 rounded-full hover:bg-accent transition-colors ${
                    isActive ? "bg-accent" : ""
                  }`
                }
              >
                <User className="w-4 h-4" />
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
