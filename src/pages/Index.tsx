
import { Button } from "@/components/ui/button";
import { ArrowRight, Scissors, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { BarbershopProfile } from "@/components/barbershop/BarbershopProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const tabs = [
    { 
      id: "services",
      name: "Services", 
      icon: Scissors,
      content: (
        <div className="py-8">
          <h2 className="text-2xl font-semibold mb-6">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Haircut</h3>
              <p className="text-muted-foreground mb-4">Classic or modern cuts tailored to your style</p>
              <p className="font-semibold">$30</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Beard Trim</h3>
              <p className="text-muted-foreground mb-4">Professional beard grooming and styling</p>
              <p className="font-semibold">$20</p>
            </div>
          </div>
        </div>
      )
    },
    { 
      id: "book",
      name: "Book Now", 
      icon: Clock,
      content: (
        <div className="py-8">
          <h2 className="text-2xl font-semibold mb-6">Book an Appointment</h2>
          <p className="text-muted-foreground mb-6">
            Choose your preferred service and time slot to book your appointment.
          </p>
          <Button>Schedule Now</Button>
        </div>
      )
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
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Barbershop Profile */}
      <BarbershopProfile />

      {/* Tabbed Navigation */}
      <div className="border-t border-border mt-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="flex justify-center w-full h-16 bg-transparent">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center space-x-2 px-6"
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
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
