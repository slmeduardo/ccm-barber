
import { Instagram, Facebook, Phone, Mail, Clock, MapPin, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function BarbershopProfile() {
  const images = [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
  ];

  return (
    <div className="container mx-auto px-4 py-8">
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
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Classic Cuts Barbershop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <h3 className="font-semibold">Address</h3>
                <p className="text-muted-foreground">
                  123 Main Street
                  <br />
                  New York, NY 10001
                </p>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <h3 className="font-semibold">Opening Hours</h3>
                <p className="text-muted-foreground">
                  Monday - Friday: 9:00 AM - 8:00 PM
                  <br />
                  Saturday: 10:00 AM - 6:00 PM
                  <br />
                  Sunday: Closed
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <h3 className="font-semibold">Payment Methods</h3>
                <p className="text-muted-foreground">
                  Credit Card, Debit Card, Cash
                </p>
              </div>
            </div>

            {/* Contact & Social Media */}
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <h3 className="font-semibold">Contact</h3>
                <div className="space-y-2">
                  <p className="text-muted-foreground">+1 (555) 123-4567</p>
                  <div className="flex gap-4">
                    <a href="#" className="text-muted-foreground hover:text-primary">
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-primary">
                      <Facebook className="w-5 h-5" />
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-primary">
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
