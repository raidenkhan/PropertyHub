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
import { paymentService } from "@/lib/api/paymentService";
import { messagesService } from "@/lib/api/messageService";
import { toast } from "@/hooks/use-toast";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types
interface Property {
  id: number;
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

      // Step 2: Initialize Paystack payment
      const paystackResponse = await paymentService.initializePayment(transactionId);

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

        {/* Property Map Section */}
        {property.coordinates && (
          <Card className="mt-8">
            <CardContent className="p-0">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-foreground">Location</h3>
                <p className="text-sm text-muted-foreground mt-1">{property.location}</p>
              </div>
              <div ref={mapContainer} className="h-96 w-full" />
            </CardContent>
          </Card>
        )}

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
                      className="bg-foreground text-background hover:bg-foreground/90"
                      onClick={() => setIsChatOpen(true)} // 👈 Open chat modal
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Owner
                    </Button>
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
                        min={Math.floor(property.price * 0.8)}
                        max={Math.ceil(property.price * 1.2)}
                      />
                    </div>
                  </>
                ) : (
                  <Button variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Tour
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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