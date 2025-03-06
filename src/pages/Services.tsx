import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useServices } from "@/hooks/useFirestore";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export type Service = {
  service_id: string;
  description: string;
  preco: number;
  name: string;
  service_duration: number;
};

const Services = () => {
  const { services, loading } = useServices();

  // Função para formatar a duração do serviço
  const formatDuration = (duration: number) => {
    const minutes = duration * 15;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h${
        remainingMinutes > 0 ? ` ${remainingMinutes}min` : ""
      }`;
    }
    return `${minutes}min`;
  };

  // Função para formatar o preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-200 mb-4">
          Nossos serviços
        </h1>
        <p className="text-xl text-gray-400">
          Escolha o serviço que melhor atende às suas necess
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card
            key={service.description}
            className="flex flex-col justify-between border-2 hover:border-primary transition-colors duration-200"
          >
            <CardHeader>
              <CardTitle className="text-2xl">{service.name}</CardTitle>
              <CardDescription className="text-lg">
                {service.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">
                  {formatDuration(service.service_duration)}
                </span>
                <span className="text-2xl font-semibold text-primary">
                  {formatPrice(service.preco)}
                </span>
              </div>
              <Button
                size="sm"
                asChild
                className="w-full bg-primary hover:bg-primary-hover"
              >
                <Link to="/book">
                  Agendar Horário
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
