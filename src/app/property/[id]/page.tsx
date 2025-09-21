// src/app/properties/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  Shield,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/authContext";
import { propertyService } from "@/lib/api/propertyService";
import { paymentService } from "@/lib/api/paymentService";
import { toast } from "@/hooks/use-toast";
import { init } from "next/dist/compiled/webpack/webpack";

// Real Property Interface (matches backend)
interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  type: "SELL" | "RENT" | "LEASE" | "STAY";
  status: "DRAFT" | "PENDING_VERIFICATION" | "VERIFIED" | "LISTED" | "SOLD" | "REJECTED" | "SUSPENDED";
  location: string;
  images: string[];
  amenities: string[];
  specifications?: Record<string, any>;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  currentOwner: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    isVerified: boolean;
  };
  createdAt: string;
  isVerified: boolean;
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [isPaying, setIsPaying] = useState(false);

  // Fetch real property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        const response = await propertyService.getPropertyById(Number(params.id));
        setProperty(response.data);
        setOfferAmount(response.data.price); // Default to listed price
      } catch (error: any) {
        toast({
          title: "❌ Error",
          description: "Failed to load property",
        });
        router.push("/properties");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProperty();
    }
  }, [params.id]);

  // Handle Pay Now
  const handlePayNow = async () => {
    if (!property || !user) return;

    if (property.currentOwner.id === user.id) {
      toast({
        title: "❌ Invalid Action",
        description: "You cannot buy your own property",
      });
      return;
    }

    if (offerAmount <= 0) {
      toast({
        title: "❌ Invalid Amount",
        description: "Please enter a valid offer amount",
      });
      return;
    }

    if (property.status !== 'LISTED') {
      toast({
        title: "❌ Property Not Available",
        description: "This property is not available for purchase",
      });
      return;
    }

    try {
      setIsPaying(true);
   
      // Step 1: Initiate transaction
      const initResponse = await paymentService.initiateTransaction(property.id, offerAmount);
      const transactionId = initResponse.data?.id;

      console.log("Transaction ID:", transactionId);
      // Step 2: Initialize Paystack payment
      const paystackResponse = await paymentService.initializePayment(transactionId);
      console.log("Paystack response:", paystackResponse);
      // Step 3: Redirect to Paystack
      window.location.href = paystackResponse.data?.authorization_url || "/";

    } catch (error: any) {
      toast({
        title: "❌ Payment Failed",
        description: error.message,
      });
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Property not found</h2>
        <Button onClick={() => router.push("/")} className="mt-4">
          Browse Properties
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Properties
            </Button>
            <Badge className="bg-background text-foreground border">
              <MapPin className="w-3 h-3 mr-1" />
              {property.type}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src={property.images[0] || "/placeholder.svg"}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 w-10 h-10 bg-card/80 backdrop-blur-sm hover:bg-card rounded-full"
              >
                <Heart className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>

            {/* Chart/Analytics Placeholder */}
            <Card className="p-4">
              <div className="h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">223</div>
                  <div className="text-sm text-muted-foreground">Views this week</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{property.title}</h1>
              
              {/* Status Badge */}
              <Badge className={
                property.status === 'LISTED' ? 'bg-green-100 text-green-800' :
                property.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800' :
                property.status === 'PENDING_VERIFICATION' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }>
                {property.status.replace('_', ' ')}
              </Badge>

              <div className="flex items-center gap-2 text-muted-foreground mb-4 mt-2">
                <MapPin className="w-4 h-4" />
                <span>{property.location}</span>
              </div>

              <div className="flex items-center gap-6 mb-4">
                <div className="text-3xl font-bold text-foreground">₦{property.price.toLocaleString()}</div>
                {property.area && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-muted-foreground rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-muted-foreground"></div>
                    </div>
                    <span>{property.area}m²</span>
                  </div>
                )}

                 {property.status === 'LISTED' && user && property.currentOwner.id !== user.id && (
                          <Button 
                            size="lg"
                            className="bg-green-600 hover:bg-green-700 text-white ml-auto"
                            onClick={handlePayNow}
                            disabled={isPaying}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Buy Now
                          </Button>
                        )}
</div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{property.description}</p>
            </div>

            {/* Features (Amenities) */}
            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-foreground">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Property Owner Section */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Property Owner</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={property.currentOwner.avatar || "/placeholder.svg"} alt={property.currentOwner.name} />
                  <AvatarFallback>
                    {property.currentOwner.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{property.currentOwner.name}</h4>
                    {property.currentOwner.isVerified && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {property.currentOwner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        <span>{property.currentOwner.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      <span>{property.currentOwner.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {property.status === 'LISTED' && user && property.currentOwner.id !== user.id ? (
                  <>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handlePayNow}
                      disabled={isPaying}
                    >
                      {isPaying ? (
                        <div className="flex items-center">
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                          Processing...
                        </div>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Pay Now
                        </>
                      )}
                    </Button>
                    <div className="text-sm text-muted-foreground mt-2">
                      <strong>Offer Amount:</strong> ₦
                      <Input
                        type="number"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(Number(e.target.value))}
                        className="w-32 p-1 border rounded ml-2"
                        min={Math.floor(property.price * 0.8)} // Allow 20% negotiation
                        max={Math.ceil(property.price * 1.2)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Button className="bg-foreground text-background hover:bg-foreground/90">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Owner
                    </Button>
                    <Button variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Tour
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
}