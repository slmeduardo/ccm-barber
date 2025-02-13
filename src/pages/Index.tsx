
import { Button } from "@/components/ui/button";
import { ArrowRight, Scissors, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Premium Grooming
              <br />
              <span className="text-primary">in the Heart of NYC</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Experience the perfect blend of traditional barbering and modern style in our premium New York City location.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-white">
                <Link to="/book">
                  Book Appointment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/services">
                  View Services
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Stylists</h3>
              <p className="text-gray-600">
                Our master barbers bring years of experience and expertise to every cut.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Hours</h3>
              <p className="text-gray-600">
                Open early and late to accommodate your busy schedule.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Prime Location</h3>
              <p className="text-gray-600">
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
