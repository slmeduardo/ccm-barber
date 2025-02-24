import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Appointments from "@/pages/Appointments";
import { AuthPage } from "@/pages/AuthPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navigation from "./components/Navigation";
import { LanguageProvider } from "./contexts/LanguageContext";
import Book from "./pages/Book";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Management from "./pages/Management";
import NotFound from "./pages/NotFound";
import Schedules from "./pages/Schedules";
import Services from "./pages/Services";
import SignUp from "./pages/SignUp";
import Team from "./pages/Team";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground">
              <Navigation />
              <div className="pt-16">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/book" element={<Book />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/schedules" element={<Schedules />} />
                  <Route path="/management" element={<Management />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
