
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthDialogs } from "./auth/AuthDialogs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { Input } from "./ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

const Navigation = () => {
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src="/lovable-uploads/3938081c-f339-4921-b90f-f5ff2a42361d.png" alt="CGM Logo" className="h-8 w-auto" />
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search barbershops..."
                className="w-full pl-10"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/appointments" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                My Appointments
              </Link>
            </Button>
            <LanguageToggle />
            <ThemeToggle />
            <AuthDialogs />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
