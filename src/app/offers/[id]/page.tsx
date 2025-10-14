"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  FileText,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { offerService, Offer, OfferMessage, CounterOffer } from '@/lib/api/offerService';
import { paymentService } from '@/lib/api/paymentService';
import { useAuth } from '@/lib/auth/authContext';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

const MessageBubble = ({ message, isOwn }: { message: OfferMessage; isOwn: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
  >
    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
      isOwn 
        ? 'bg-primary text-primary-foreground' 
        : message.messageType === 'SYSTEM'
        ? 'bg-muted text-muted-foreground text-center italic'
        : 'bg-muted text-foreground'
    }`}>
      {message.messageType !== 'SYSTEM' && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{message.fromUser.name}</span>
        </div>
      )}
      <p className={message.messageType === 'SYSTEM' ? 'text-sm' : ''}>{message.content}</p>
      <div className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
        {new Date(message.createdAt).toLocaleTimeString()}
      </div>
    </div>
  </motion.div>
);

const CounterOfferCard = ({ 
  counterOffer, 
  canRespond, 
  onRespond 
}: { 
  counterOffer: CounterOffer; 
  canRespond: boolean; 
  onRespond: (action: 'ACCEPT' | 'REJECT') => void;
}) => (
  <Card className="border-l-4 border-l-blue-500">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Counter Offer</span>
        </div>
        <Badge 
          variant={counterOffer.status === 'PENDING' ? 'default' : 'secondary'}
          className={counterOffer.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : ''}
        >
          {counterOffer.status}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount:</span>
          <span className="font-semibold text-lg">₦{counterOffer.amount.toLocaleString()}</span>
        </div>
        
        {counterOffer.message && (
          <div>
            <span className="text-sm text-muted-foreground">Message:</span>
            <p className="text-sm mt-1 p-2 bg-muted rounded">{counterOffer.message}</p>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>From: {counterOffer.fromUser.name}</span>
          <span>{new Date(counterOffer.createdAt).toLocaleDateString()}</span>
        </div>

        {canRespond && counterOffer.status === 'PENDING' && (
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              onClick={() => onRespond('ACCEPT')}
              className="bg-green-600 hover:bg-green-700"
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              Accept
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onRespond('REJECT')}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <ThumbsDown className="w-3 h-3 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function OfferDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [messages, setMessages] = useState<OfferMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [counterOfferAmount, setCounterOfferAmount] = useState<number>(0);
  const [counterOfferMessage, setCounterOfferMessage] = useState('');
  const [showCounterDialog, setShowCounterDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const offerId = params.id as string;

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    if (offerId) {
      fetchOfferDetails();
    }
  }, [user, router, offerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      const [offerResponse, messagesResponse] = await Promise.all([
        offerService.getOffer(offerId),
        offerService.getOfferMessages(offerId)
      ]);
      
      setOffer(offerResponse.data);
      setMessages(messagesResponse.data);
      setCounterOfferAmount(offerResponse.data.amount);
      
      // Mark messages as read
      await offerService.markMessagesAsRead(offerId);
    } catch (error) {
      console.error('Failed to fetch offer details:', error);
      toast({
        title: "❌ Error",
        description: "Failed to load offer details. Please try again.",
        variant: "destructive"
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      const response = await offerService.sendOfferMessage(offerId, newMessage.trim());
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "❌ Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleOfferResponse = async (action: 'ACCEPT' | 'REJECT') => {
    if (!offer || processingAction) return;

    try {
      setProcessingAction(true);
      const response = await offerService.respondToOffer(offerId, action);
      
      setOffer(response.data);
      
      toast({
        title: action === 'ACCEPT' ? "✅ Offer Accepted" : "❌ Offer Rejected",
        description: action === 'ACCEPT' 
          ? "The buyer can now proceed to payment."
          : "The offer has been rejected.",
      });
      
      // Refresh messages to show system message
      fetchOfferDetails();
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} offer:`, error);
      toast({
        title: "❌ Error",
        description: `Failed to ${action.toLowerCase()} offer. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCounterOffer = async () => {
    if (!offer || !counterOfferAmount || processingAction) return;

    try {
      setProcessingAction(true);
      await offerService.createCounterOffer(offerId, counterOfferAmount, counterOfferMessage);
      
      setShowCounterDialog(false);
      setCounterOfferMessage('');
      
      toast({
        title: "🔄 Counter Offer Sent",
        description: "Your counter offer has been sent for review.",
      });
      
      fetchOfferDetails();
    } catch (error) {
      console.error('Failed to create counter offer:', error);
      toast({
        title: "❌ Error",
        description: "Failed to create counter offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCounterResponse = async (counterId: number, action: 'ACCEPT' | 'REJECT') => {
    if (!offer || processingAction) return;

    try {
      setProcessingAction(true);
      const response = await offerService.respondToCounterOffer(offerId, counterId, action);
      
      setOffer(response.data);
      
      toast({
        title: action === 'ACCEPT' ? "✅ Counter Offer Accepted" : "❌ Counter Offer Rejected",
        description: action === 'ACCEPT' 
          ? "The offer amount has been updated. You can now proceed to payment."
          : "The counter offer has been rejected.",
      });
      
      fetchOfferDetails();
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} counter offer:`, error);
      toast({
        title: "❌ Error",
        description: `Failed to ${action.toLowerCase()} counter offer. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleWithdrawOffer = async () => {
    if (!offer || processingAction) return;

    try {
      setProcessingAction(true);
      await offerService.withdrawOffer(offerId);
      
      toast({
        title: "🚫 Offer Withdrawn",
        description: "Your offer has been withdrawn.",
      });
      
      router.push('/offers');
    } catch (error) {
      console.error('Failed to withdraw offer:', error);
      toast({
        title: "❌ Error",
        description: "Failed to withdraw offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const proceedToPayment = async () => {
    if (!offer) return;

    try {
      setProcessingAction(true);
      
      // Initialize payment from accepted offer
      const response = await paymentService.initiateTransactionFromOffer(offerId);
      const transactionId = response.data?.id;

      if (!transactionId) {
        throw new Error('Failed to create payment transaction');
      }

      // Initialize Paystack payment
      const paystackResponse = await paymentService.initializePayment(transactionId);
      
      if (!paystackResponse.data?.authorization_url) {
        throw new Error('Failed to initialize payment');
      }

      // Redirect to Paystack
      window.location.href = paystackResponse.data.authorization_url;
    } catch (error) {
      console.error('Failed to proceed to payment:', error);
      toast({
        title: "❌ Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p>Loading offer details...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Offer Not Found</h2>
          <p className="text-muted-foreground mb-4">The offer you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/offers')}>Back to Offers</Button>
        </div>
      </div>
    );
  }

  const isOwner = offer.sellerId === user.id;
  const isBuyer = offer.buyerId === user.id;
  const canRespond = isOwner && offer.status === 'PENDING';
  const canCounter = (isOwner || isBuyer) && ['PENDING', 'COUNTERED'].includes(offer.status);
  const canWithdraw = isBuyer && ['PENDING', 'COUNTERED'].includes(offer.status);
  const canPay = isBuyer && offer.status === 'ACCEPTED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Offer Details</h1>
            <p className="text-muted-foreground">
              {isOwner ? 'Offer received for your property' : 'Your offer on this property'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Offer Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={offer.property.images[0] || '/placeholder.svg'}
                      alt={offer.property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {offer.property.title}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      {offer.property.location}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Listed Price:</span>
                      <span className="font-semibold">₦{offer.property.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Offer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Offer Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="text-lg font-medium">Offer Amount:</span>
                    <span className="text-2xl font-bold text-primary">₦{offer.amount.toLocaleString()}</span>
                  </div>
                  
                  {offer.message && (
                    <div>
                      <h4 className="font-medium mb-2">Message:</h4>
                      <p className="text-muted-foreground bg-muted p-3 rounded-lg">{offer.message}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {new Date(offer.createdAt).toLocaleDateString()}</span>
                    </div>
                    {offer.respondedAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Responded: {new Date(offer.respondedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Counter Offers */}
            {offer.counterOffers && offer.counterOffers.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Counter Offers</h3>
                {offer.counterOffers.map((counterOffer) => (
                  <CounterOfferCard
                    key={counterOffer.id}
                    counterOffer={counterOffer}
                    canRespond={counterOffer.fromUserId !== user.id && counterOffer.status === 'PENDING'}
                    onRespond={(action) => handleCounterResponse(counterOffer.id, action)}
                  />
                ))}
              </div>
            )}

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.fromUserId === user.id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Status */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Offer Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <Badge className={`text-lg px-4 py-2 bg-${offerService.getOfferStatusColor(offer.status)}-50 text-${offerService.getOfferStatusColor(offer.status)}-700`}>
                    {offerService.getOfferStatusText(offer.status)}
                  </Badge>
                  
                  {offer.status === 'PENDING' && (
                    <p className="text-sm text-muted-foreground">
                      {isOwner ? 'Waiting for your response' : 'Waiting for seller response'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{offer.buyer.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{offer.buyer.name}</p>
                    <p className="text-sm text-muted-foreground">Buyer</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{offer.seller.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{offer.seller.name}</p>
                    <p className="text-sm text-muted-foreground">Seller</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canPay && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    size="lg"
                    onClick={proceedToPayment}
                    disabled={processingAction}
                  >
                    {processingAction ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                )}

                {canRespond && (
                  <>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleOfferResponse('ACCEPT')}
                      disabled={processingAction}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Offer
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleOfferResponse('REJECT')}
                      disabled={processingAction}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Offer
                    </Button>
                  </>
                )}

                {canCounter && (
                  <Dialog open={showCounterDialog} onOpenChange={setShowCounterDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Make Counter Offer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Make Counter Offer</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Counter Offer Amount (₦)</label>
                          <Input
                            type="number"
                            value={counterOfferAmount}
                            onChange={(e) => setCounterOfferAmount(Number(e.target.value))}
                            placeholder="Enter amount"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Message (Optional)</label>
                          <Textarea
                            value={counterOfferMessage}
                            onChange={(e) => setCounterOfferMessage(e.target.value)}
                            placeholder="Add a message to your counter offer..."
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleCounterOffer}
                            disabled={processingAction || !counterOfferAmount}
                            className="flex-1"
                          >
                            Send Counter Offer
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowCounterDialog(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {canWithdraw && (
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                    onClick={handleWithdrawOffer}
                    disabled={processingAction}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Withdraw Offer
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}