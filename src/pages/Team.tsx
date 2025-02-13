
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const team = [
  {
    name: "James Wilson",
    role: "Master Barber",
    description: "Specializing in classic cuts and hot towel shaves",
    experience: "15 years experience",
  },
  {
    name: "Michael Chen",
    role: "Style Specialist",
    description: "Expert in modern styles and texture management",
    experience: "8 years experience",
  },
  {
    name: "David Rodriguez",
    role: "Senior Barber",
    description: "Precision fade specialist and beard styling expert",
    experience: "12 years experience",
  },
  {
    name: "Sarah Thompson",
    role: "Color Specialist",
    description: "Advanced training in hair coloring and styling",
    experience: "10 years experience",
  },
];

const Team = () => {
  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h1>
        <p className="text-xl text-gray-600">Expert barbers ready to perfect your style</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {team.map((member) => (
          <Card key={member.name} className="border-2 hover:border-primary transition-colors duration-200">
            <CardHeader>
              <CardTitle className="text-2xl">{member.name}</CardTitle>
              <CardDescription className="text-lg text-primary font-medium">
                {member.role}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{member.description}</p>
              <p className="text-sm text-gray-500 mb-4">{member.experience}</p>
              <Button asChild className="w-full bg-primary hover:bg-primary-hover">
                <Link to="/book">
                  Book with {member.name.split(" ")[0]}
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

export default Team;
