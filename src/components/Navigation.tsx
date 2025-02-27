import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Calendar, CalendarSearch, Scissors, Users } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { ProfileMenu } from "./auth/ProfileMenu";
import { ThemeToggle } from "./theme-toggle";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navigation: NavigationItem[] = [
  { name: "Serviços", href: "/services", icon: Scissors },
  { name: "Equipe", href: "/team", icon: Users },
  { name: "Agendamentos", href: "/book", icon: Calendar },
  { name: "Meus Agendamentos", href: "/appointments", icon: CalendarSearch },
];

export function Navigation() {
  const { user, logout } = useAuth();

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
            {user && (
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

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <ProfileMenu userName={user.name} isAdmin={user.isAdmin} />
            ) : (
              <NavLink
                to="/auth"
                className={({ isActive }) =>
                  `py-2 px-4 bg-primary rounded hover:bg-primary-hover transition-colors ${
                    isActive ? "bg-accent" : ""
                  }`
                }
              >
                Entrar
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
