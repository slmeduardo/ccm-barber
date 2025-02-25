import { BarbershopProfile } from "@/components/barbershop/BarbershopProfile";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Scissors } from "lucide-react";

const Index = () => {
  const tabs = [
    {
      id: "services",
      name: "Services",
      icon: Scissors,
      content: (
        <div className="py-8">
          <h2 className="text-2xl font-semibold mb-6">Serviços</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Haircut</h3>
              <p className="text-muted-foreground mb-4">
                Classic or modern cuts tailored to your style
              </p>
              <p className="font-semibold">$30</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Beard Trim</h3>
              <p className="text-muted-foreground mb-4">
                Professional beard grooming and styling
              </p>
              <p className="font-semibold">$20</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "book",
      name: "Book Now",
      icon: Clock,
      content: (
        <div className="py-8">
          <h2 className="text-2xl font-semibold mb-6">
            Book an Appointmeneqwdast
          </h2>
          <p className="text-muted-foreground mb-6">
            Choose your preferred service and time slot to book your
            appointment.
          </p>
          <Button>Schedule Now</Button>
        </div>
      ),
    },
    {
      id: "location",
      name: "Find Us",
      icon: MapPin,
      content: (
        <div className="py-8">
          <h2 className="text-2xl font-semibold mb-6">Our Location</h2>
          <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
            Map will be displayed here
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Barbershop Profile */}
      <BarbershopProfile />

      {/* Features Section */}
      <section className="bg-background py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Estilistas Experientes
              </h3>
              <p className="text-muted-foreground">
                Nossos barbeiros mestres trazem anos de experiência e expertise
                para cada corte.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Horários Flexíveis</h3>
              <p className="text-muted-foreground">
                Abertos cedo e tarde para acomodar seu horário agitado.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Localização Conveniente
              </h3>
              <p className="text-muted-foreground">
                Localizado no coração de Uberlândia.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
