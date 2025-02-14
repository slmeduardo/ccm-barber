
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "./contexts/LanguageContext";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Team from "./pages/Team";
import Book from "./pages/Book";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Schedules from "./pages/Schedules";
import Management from "./pages/Management";
import NotFound from "./pages/NotFound";

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
                  <Route path="/services" element={<Services />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/book" element={<Book />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/schedules" element={<Schedules />} />
                  <Route path="/management" element={<Management />} />
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
