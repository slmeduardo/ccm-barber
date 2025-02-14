
import { Button } from "@/components/ui/button";
import { ArrowRight, Scissors, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { BarbershopProfile } from "@/components/barbershop/BarbershopProfile";

const Index = () => {
  const navigation = [
    { name: "Services", href: "/services", icon: Scissors },
    { name: "Book Now", href: "/book", icon: Clock },
    { name: "Find Us", href: "#location", icon: MapPin },
  ];

  return (
    <div className="animate-fade-in">
      {/* Barbershop Profile */}
      <BarbershopProfile />

      {/* Secondary Navigation */}
      <div className="border-t border-border mt-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-8 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-background py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Stylists</h3>
              <p className="text-muted-foreground">
                Our master barbers bring years of experience and expertise to every cut.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Hours</h3>
              <p className="text-muted-foreground">
                Open early and late to accommodate your busy schedule.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Prime Location</h3>
              <p className="text-muted-foreground">
                Conveniently located in the heart of New York City.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
