
import { Instagram, Facebook, Phone, Mail, Clock, MapPin, CreditCard, Wifi, Car, Accessibility, Baby, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const comfortFeatures = [
    { icon: Wifi, label: "Free Wi-Fi" },
    { icon: Car, label: "Parking Available" },
    { icon: Accessibility, label: "Accessible" },
    { icon: Baby, label: "Kids Haircuts" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Classic Cuts Barbershop</h1>
          <div className="flex items-center gap-1 text-primary mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 fill-current" />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">(128 reviews)</span>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Classic Cuts is your premier destination for traditional and modern grooming services. 
            Our skilled barbers combine time-honored techniques with contemporary styles to deliver 
            the perfect cut every time.
          </p>
        </div>
        <Button size="lg" className="font-semibold">
          Book Appointment
        </Button>
      </div>

      {/* Comfort Features */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {comfortFeatures.map((feature) => (
          <div key={feature.label} className="flex items-center gap-3 p-4 border rounded-lg">
            <feature.icon className="w-5 h-5 text-primary" />
            <span className="font-medium">{feature.label}</span>
          </div>
        ))}
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
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
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
