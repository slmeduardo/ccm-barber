
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Scissors, Users, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Services", href: "/services", icon: Scissors },
    { name: "Team", href: "/team", icon: Users },
    { name: "Book", href: "/book", icon: Calendar },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="font-display text-xl font-semibold">NYC Premium Barber</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200",
                  isActive(item.href)
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn("md:hidden", isOpen ? "block" : "hidden")}>
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center pl-3 pr-4 py-2 text-base font-medium transition-colors duration-200",
                isActive(item.href)
                  ? "text-primary border-l-4 border-primary bg-primary/5"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
