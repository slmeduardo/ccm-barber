import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Accessibility,
  Baby,
  Car,
  Clock,
  CreditCard,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Star,
  Wifi,
} from "lucide-react";
import { Link } from "react-router-dom";

export function BarbershopProfile() {
  const images = ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"];

  const comfortFeatures = [
    { icon: Wifi, label: "Wi-Fi Grátis" },
    { icon: Car, label: "Estacionamento Disponível" },
    { icon: Accessibility, label: "Acessível" },
    { icon: Baby, label: "Cabelo de Crianças" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">CCM Barbershop</h1>
          <div className="flex items-center gap-1 text-primary mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 fill-current" />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              (128 reviews)
            </span>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Bem-vindo à CCM Barbershop, onde tradição e modernidade se encontram
            para oferecer a melhor experiência em cuidados masculinos. Nossa
            barbearia combina técnicas clássicas de barbear com tendências
            contemporâneas, proporcionando um ambiente acolhedor e profissional.
          </p>
        </div>
        <Link
          to={"/book"}
          className="bg-primary text-white px-6 py-3 rounded-md font-semibold"
        >
          Agendar Horário
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Carousel Section */}
        <div className="w-full">
          <Carousel className="w-full">
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-video w-full overflow-hidden rounded-lg">
                    <img
                      src={image}
                      alt={`Barbershop image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>

          {/* Comfort Features */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
            {comfortFeatures.map((feature) => (
              <div
                key={feature.label}
                className="flex flex-col text-center justify-center items-center gap-3 p-4 border rounded-lg"
              >
                <feature.icon className="w-7 h-7 text-primary" />
                <span className="font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <h3 className="font-semibold">Endereço</h3>
                <p className="text-muted-foreground">
                  Rua das Flores, 123
                  <br />
                  Uberlândia, MG 38400-000
                </p>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <h3 className="font-semibold">Horários de Funcionamento</h3>
                <p className="text-muted-foreground">
                  Segunda - Sexta: 9:00 - 18:00
                  <br />
                  Sábado: 9:00 - 13:00
                  <br />
                  Domingo: Fechado
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <h3 className="font-semibold">Métodos de Pagamento</h3>
                <p className="text-muted-foreground">
                  Cartão de Crédito, Cartão de Débito, Dinheiro
                </p>
              </div>
            </div>

            {/* Contact & Social Media */}
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <h3 className="font-semibold">Contato</h3>
                <div className="space-y-2">
                  <p className="text-muted-foreground">+55 (34) 99999-9999</p>
                  <div className="flex gap-4">
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
