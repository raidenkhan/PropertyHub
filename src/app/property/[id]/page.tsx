// src/app/properties/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
  Send,
  Check,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/authContext";
import { propertyService } from "@/lib/api/propertyService";
import { paymentService } from "@/lib/api/paymentService"
import { offerService } from "@/lib/api/offerService"
import { messagesService } from "@/lib/api/messageService";
import { toast } from "@/hooks/use-toast";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types
interface Property {
  id: number;
  propertyId:string;
  title: string;
  description: string;
  price: number;
  type: "SELL" | "RENT" | "LEASE" | "STAY";
  status: "DRAFT" | "PENDING_VERIFICATION" | "VERIFIED" | "LISTED" | "SOLD" | "REJECTED" | "SUSPENDED";
  location: string;
  coordinates?: { lat: number; lng: number };
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

interface Message {
  id: number;
  content: string;
  sender: { id: number; name: string };
  receiver: { id: number; name: string };
  isRead: boolean;
  isReported: boolean;
  createdAt: string;
  status: 'sent' | 'delivered' | 'seen';
}

// Import Socket.io
import io, { Socket } from 'socket.io-client';
import { chatService, SocketType } from "@/lib/api/chatService";


const useSound = (src: string) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    setAudio(audio);
  }, [src]);

  return () => {
    audio?.play();
  };
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [isPaying, setIsPaying] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const socketRef = useRef<SocketType | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const playSentSound = useSound('/sent-message.mp3');

  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollableNode = chatContainerRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableNode) {
        scrollableNode.scrollTop = scrollableNode.scrollHeight;
      }
    }
  }, [chatMessages]);

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        

          const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;
           
    if (!propertyId) {
      throw new Error("Property ID is missing");
    }
        const response = await propertyService.getPropertyById(propertyId);

        setProperty(response.data);
        setOfferAmount(response.data.price);
      } catch (error: unknown) {
        if(error instanceof Error)
        toast({
          title: "❌ Error",
          description: "Failed to load property",
        });
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProperty();
    }
  }, [params.id]);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !property?.coordinates) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [property.coordinates.lng, property.coordinates.lat],
      zoom: 14,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const el = document.createElement('div');
    el.className = 'marker';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3b82f6';
    el.style.border = '3px solid white';
    el.style.cursor = 'pointer';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

    new mapboxgl.Marker(el)
      .setLngLat([property.coordinates.lng, property.coordinates.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setDOMContent(
          (() => {
            const container = document.createElement('div');
            container.className = 'p-3';

            const titleEl = document.createElement('h3');
            titleEl.className = 'font-semibold mb-1';
            titleEl.textContent = property.title;

            const locationEl = document.createElement('p');
            locationEl.className = 'text-sm text-gray-600 mb-2';
            locationEl.textContent = property.location;

            const priceEl = document.createElement('div');
            priceEl.className = 'text-lg font-bold';
            priceEl.textContent = `₦${property.price.toLocaleString()}`;

            container.append(titleEl, locationEl, priceEl);
            return container;
          })()
        )
      )
      .addTo(map.current!);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [property?.coordinates]);

  // Chat logic
  const handleReportMessage = async (messageId: number) => {
    try {
      await messagesService.reportMessage(messageId);
      toast({
        title: "✅ Message Reported",
        description: "Our moderation team will review this message.",
      });
      
      setChatMessages(prev =>
        prev?.map(msg =>
          msg.id === messageId ? { ...msg, isReported: true } : msg
        )
      );
    } catch (error) {
      toast({
        title: "❌ Report Failed",
        description: "Could not report message. Please try again.",
      });
    }
  };

useEffect(() => {
  if (!isChatOpen || !property || !user) return;

  const initializeChat = async () => {
    try {
      setIsLoadingChat(true);
      
      // Fetch chat history
      const messages = await messagesService.getMessagesWithUser(property.currentOwner.id);
      setChatMessages(messages || []);

      // ✅ CONNECT USING SINGLETON
      const socket = chatService.connect();
      if (!socket) {
        console.error('❌ Failed to connect to chat service');
        return;
      }
      socketRef.current = socket;

      // Listen for new messages
      const handleMessage = (message: Message) => {
        console.log('📨 Received new message:', message);
        setChatMessages(prev => [...(prev || []), message]);
      };
      socket.on('newMessage', handleMessage);

      // Cleanup
      return () => {
        socket.off('newMessage', handleMessage);
      };
    } catch (error) {
      console.error('❌ Failed to initialize chat:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  initializeChat();
}, [isChatOpen, property?.currentOwner.id, user?.id]);

// Enhanced handleSendMessage with debugging
const handleSendMessage = async () => {
  if (!newMessage.trim() || !socketRef.current || !property || !user) {
    console.error('❌ Missing required data:', {
      hasMessage: !!newMessage.trim(),
      hasSocket: !!socketRef.current,
      socketConnected: socketRef.current?.connected,
      hasProperty: !!property,
      hasUser: !!user,
    });
    return;
  }
  chatService.sendMessage(property.currentOwner.id, newMessage.trim());

  const messageData = {
    receiverId: property.currentOwner.id,
    content: newMessage.trim(),
  };



  // Optimistic UI update
  const tempMessage: Message = {
    id: Date.now(),
    content: newMessage,
    sender: { id: user.id, name: user.name || 'You' },
    receiver: { id: property.currentOwner.id, name: property.currentOwner.name },
    isRead: false,
    isReported: false,
    createdAt: new Date().toISOString(),
    status: 'sent',
  };

  setChatMessages(prev => (prev?[...prev,tempMessage]:[tempMessage]));
  setNewMessage("");
  playSentSound();

};


// Add this button to your JSX for testing (temporary)
// 

  // Handle Make Offer (replaces direct payment)
  const handleMakeOffer = async () => {
    if (!property) return;

    if (!user) {
      toast({
        title: "🔐 Authentication Required",
        description: "Please log in to purchase this property",
      });
      router.push('/auth');
      return;
    }

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
      
      // Create offer using the offer service
      const result = await offerService.createOffer({
        propertyId: property.propertyId,
        amount: offerAmount,
        message: `I'm interested in purchasing this property for ₦${offerAmount.toLocaleString()}.`
      });
      
      toast({
        title: "🎉 Offer Submitted!",
        description: "Your offer has been sent to the property owner. They will review and respond soon.",
      });
      
      // Redirect to offer tracking page
      router.push(`/offers/${result.data.offerId}`);
      
    } catch (error: any) {
      toast({
        title: "❌ Offer Failed",
        description: error.message || 'Failed to submit offer',
        variant: "destructive"
      });
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-primary/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Loading Property Details</h3>
            <p className="text-sm text-muted-foreground">Please wait while we fetch the latest information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏠</span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Property Not Found</h2>
            <p className="text-muted-foreground">The property you're looking for doesn't exist or may have been removed.</p>
          </div>
          <Button 
            onClick={() => router.push("/")} 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-xl"
          >
            Browse Available Properties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Enhanced Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.back()} 
              className="flex items-center gap-2 hover:bg-primary/10 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Properties
            </Button>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-primary/20">
                <MapPin className="w-3 h-3 mr-1" />
                {property.type}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200"
              >
                <Heart className="w-5 h-5 text-gray-500 hover:text-red-500 transition-colors" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Enhanced Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image Gallery */}
            <div className="relative">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl group">
                <img
                  src={property.images[0] || "/placeholder.svg"}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                {/* Image overlay info */}
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-white/20 text-white backdrop-blur-sm border-white/30">
                      {property.images.length} Photos
                    </Badge>
                    <Badge className="bg-primary/20 text-white backdrop-blur-sm border-primary/30">
                      Virtual Tour Available
                    </Badge>
                  </div>
                </div>
                
                {/* View all photos button */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-6 right-6 bg-white/20 text-white backdrop-blur-md hover:bg-white/30 border-white/30"
                >
                  View All Photos
                </Button>
              </div>
              
              {/* Thumbnail Gallery */}
              {property.images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {property.images.slice(1, 5).map((image, index) => (
                    <div key={index} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all duration-200">
                      <img
                        src={image}
                        alt={`Property image ${index + 2}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                  {property.images.length > 5 && (
                    <div className="relative flex-shrink-0 w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        +{property.images.length - 5}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Property Analytics Card */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/10">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">223</div>
                  <div className="text-sm text-muted-foreground">Views this week</div>
                </div>
                <div className="text-center border-l border-r border-gray-200 dark:border-gray-700">
                  <div className="text-3xl font-bold text-green-600 mb-1">12</div>
                  <div className="text-sm text-muted-foreground">Inquiries</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">4.8</div>
                  <div className="text-sm text-muted-foreground">Owner Rating</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Sticky Pricing Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Price and Quick Actions Card */}
              <Card className="p-6 bg-white dark:bg-gray-900 shadow-xl border-0 ring-1 ring-gray-200 dark:ring-gray-700">
                <div className="space-y-6">
                  {/* Price Section */}
                  <div className="text-center pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="text-4xl font-black text-foreground mb-2">
                      ₦{property.price.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{property.location}</span>
                    </div>
                    {property.area && (
                      <div className="mt-2 inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        <div className="w-4 h-4 border border-primary rounded flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        </div>
                        {property.area}m² • {property.bedrooms || 'N/A'} beds • {property.bathrooms || 'N/A'} baths
                      </div>
                    )}
                  </div>

                  {/* Status and Verification */}
                  <div className="flex items-center justify-center gap-3">
                    <Badge className={
                      property.status === 'LISTED' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                      property.status === 'VERIFIED' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                      property.status === 'PENDING_VERIFICATION' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
                    }>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {property.status.replace('_', ' ')}
                    </Badge>
                    {property.isVerified && (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {property.status === 'LISTED' && property.currentOwner.id !== user?.id ? (
                    <div className="space-y-4">
                      {/* Offer Amount Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Your Offer</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                          <Input
                            type="number"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(Number(e.target.value))}
                            className="pl-8 text-lg font-semibold h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-primary"
                            min={Math.floor(property.price * 0.8)}
                            max={Math.ceil(property.price * 1.2)}
                            placeholder={property.price.toString()}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Range: ₦{Math.floor(property.price * 0.8).toLocaleString()} - ₦{Math.ceil(property.price * 1.2).toLocaleString()}
                        </div>
                      </div>

                      {/* Main Action Buttons */}
                      <div className="space-y-3">
                        <Button 
                          size="lg"
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={handleMakeOffer}
                          disabled={isPaying}
                        >
                          {isPaying ? (
                            <div className="flex items-center">
                              <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                              Submitting Offer...
                            </div>
                          ) : (
                            <>
                              <DollarSign className="w-5 h-5 mr-2" />
                              Make Offer
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline"
                          size="lg"
                          className="w-full border-2 border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/5 font-semibold py-6 rounded-xl transition-all duration-200"
                          onClick={() => {
                            if (!user) {
                              toast({
                                title: "🔐 Authentication Required",
                                description: "Please log in to contact the property owner",
                              });
                              router.push('/auth');
                              return;
                            }
                            setIsChatOpen(true);
                          }}
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Contact Owner
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="w-full py-6 rounded-xl font-semibold"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Schedule Property Tour
                    </Button>
                  )}
                </div>
              </Card>

              {/* Owner Contact Card */}
              <Card className="p-6 bg-white dark:bg-gray-900 shadow-xl border-0 ring-1 ring-gray-200 dark:ring-gray-700">
                <h3 className="text-lg font-semibold text-foreground mb-4">Property Owner</h3>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                    <AvatarImage src={property.currentOwner.avatar || "/placeholder.svg"} alt={property.currentOwner.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {property.currentOwner.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{property.currentOwner.name}</h4>
                      {property.currentOwner.isVerified && (
                        <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">4.8 (24 reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {property.currentOwner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{property.currentOwner.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{property.currentOwner.email}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Property Details Section */}
        <div className="mt-12 space-y-8">
          {/* Title and Basic Info */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-black text-foreground mb-4 leading-tight">
              {property.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5" />
                <span className="text-lg">{property.location}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Listed {new Date(property.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>

          {/* Description and Features Cards */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Description Card */}
            <Card className="p-8 bg-white dark:bg-gray-900 shadow-lg border-0 ring-1 ring-gray-200 dark:ring-gray-700">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                  </div>
                  Property Description
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {property.description}
                </p>
                
                {/* Key Property Stats */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                  {property.bedrooms && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{property.bedrooms}</div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="text-center border-l border-r border-gray-100 dark:border-gray-800">
                      <div className="text-2xl font-bold text-foreground">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                  )}
                  {property.area && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{property.area}</div>
                      <div className="text-sm text-muted-foreground">Sqm</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Features and Amenities Card */}
            {property.amenities && property.amenities.length > 0 && (
              <Card className="p-8 bg-white dark:bg-gray-900 shadow-lg border-0 ring-1 ring-gray-200 dark:ring-gray-700">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Features & Amenities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                        <span className="text-foreground font-medium">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Enhanced Property Map Section */}
        {property.coordinates && (
          <Card className="mt-12 overflow-hidden bg-white dark:bg-gray-900 shadow-xl border-0 ring-1 ring-gray-200 dark:ring-gray-700">
            <CardContent className="p-0">
              <div className="p-8 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Property Location</h3>
                    <p className="text-lg text-muted-foreground">{property.location}</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Explore the neighborhood and nearby amenities. This property is situated in a prime location 
                  with easy access to transportation, shopping, and entertainment.
                </p>
              </div>
              <div ref={mapContainer} className="h-96 w-full" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat Modal */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chat with {property.currentOwner.name}</DialogTitle>
            <div className="text-sm text-muted-foreground">
              About: {property.title}
            </div>
          </DialogHeader>
          <div className="border-t pt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/messages?hostId=${property.currentOwner.id}`)}
              className="w-full"
            >
              View Full Conversation
            </Button>
    </div>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4" ref={chatContainerRef}>
              <div className="space-y-4 p-4">
                {isLoadingChat ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  chatMessages?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg ${
                          message.sender.id === user?.id
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700"
                        } ${message.isReported ? 'border-2 border-red-500' : ''}`}
                      >
                        <p>{message.content}</p>
                        <div className="flex items-center justify-end text-xs mt-1 opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString()}
                          {message.sender.id === user?.id && (
                            <span className="ml-2">
                              {message.status === 'sent' && <Check className="w-4 h-4" />}
                              {message.status === 'delivered' && <CheckCheck className="w-4 h-4" />}
                              {message.status === 'seen' && <CheckCheck className="w-4 h-4 text-blue-500" />}
                            </span>
                          )}
                          {message.isReported && (
                            <span className="ml-2 text-red-500">⚠️ Reported</span>
                          )}
                        </div>
                        {message.sender.id !== user?.id && !message.isReported && (
                          <button
                            onClick={() => handleReportMessage(message.id)}
                            className="text-xs text-red-500 hover:underline mt-1"
                          >
                            Report
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} size="icon" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}