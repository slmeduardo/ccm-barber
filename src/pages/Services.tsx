
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    name: "Classic Haircut",
    description: "Traditional cut with modern styling",
    duration: "45 min",
    price: "$35",
  },
  {
    name: "Beard Trim",
    description: "Shape and style your facial hair",
    duration: "30 min",
    price: "$25",
  },
  {
    name: "Hot Towel Shave",
    description: "Traditional straight razor shave",
    duration: "45 min",
    price: "$40",
  },
  {
    name: "Complete Package",
    description: "Haircut, beard trim, and hot towel shave",
    duration: "90 min",
    price: "$90",
  },
];

const Services = () => {
  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
        <p className="text-xl text-gray-600">Professional grooming services for the modern gentleman</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {services.map((service) => (
          <Card key={service.name} className="border-2 hover:border-primary transition-colors duration-200">
            <CardHeader>
              <CardTitle className="text-2xl">{service.name}</CardTitle>
              <CardDescription className="text-lg">{service.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">{service.duration}</span>
                <span className="text-2xl font-semibold text-primary">{service.price}</span>
              </div>
              <Button asChild className="w-full bg-primary hover:bg-primary-hover">
                <Link to="/book">
                  Book Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Services;
