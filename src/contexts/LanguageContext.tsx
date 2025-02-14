
import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "pt-BR" | "es";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const translations = {
  "en": {
    "services": "Services",
    "team": "Team",
    "book": "Book",
    "schedules": "Schedules",
    "management": "Management",
    "login": "Log in",
    "signup": "Sign up",
    "darkMode": "Dark Mode",
    "lightMode": "Light Mode",
  },
  "pt-BR": {
    "services": "Serviços",
    "team": "Equipe",
    "book": "Agendar",
    "schedules": "Horários",
    "management": "Gerenciamento",
    "login": "Entrar",
    "signup": "Cadastrar",
    "darkMode": "Modo Escuro",
    "lightMode": "Modo Claro",
  },
  "es": {
    "services": "Servicios",
    "team": "Equipo",
    "book": "Reservar",
    "schedules": "Horarios",
    "management": "Gestión",
    "login": "Iniciar Sesión",
    "signup": "Registrarse",
    "darkMode": "Modo Oscuro",
    "lightMode": "Modo Claro",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations["en"]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
