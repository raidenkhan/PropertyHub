"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  MapPin,
  DollarSign,
  Clock,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { offerService, Offer } from '@/lib/api/offerService';
import { paymentService } from '@/lib/api/paymentService';
import { useAuth } from '@/lib/auth/authContext';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offerId = searchParams.get('offerId');

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    if (!offerId) {
      setError('No offer ID provided');
      setLoading(false);
      return;
    }

    fetchOfferDetails();
  }, [user, router, offerId]);

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await offerService.getOffer(offerId as string);
      const offerData = response.data;

      // Validate that this offer can be paid for
      if (offerData.status !== 'ACCEPTED') {
        setError('This offer has not been accepted yet');
        return;
      }

      if (offerData.buyerId !== user?.id) {
        setError('You are not authorized to pay for this offer');
        return;
      }

      setOffer(offerData);
    } catch (error) {
      console.error('Failed to fetch offer details:', error);
      setError('Failed to load offer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!offer) return;

    try {
      setProcessing(true);
      
      // Initialize payment from accepted offer
      const response = await paymentService.initiateTransactionFromOffer(offer.offerId);
      const transactionId = response.data?.id;

      if (!transactionId) {
        throw new Error('Failed to create payment transaction');
      }

      // Initialize Paystack payment
      const paystackResponse = await paymentService.initializePayment(transactionId);
      
      if (!paystackResponse.data?.authorization_url) {
        throw new Error('Failed to initialize payment');
      }

      // Store transaction info for tracking
      localStorage.setItem('pendingPayment', JSON.stringify({
        transactionId,
        offerId: offer.offerId,
        propertyId: offer.property.id,
        timestamp: Date.now(),
      }));

      // Redirect to Paystack
      window.location.href = paystackResponse.data.authorization_url;
    } catch (error) {
      console.error('Failed to proceed to payment:', error);
      toast({
        title: "❌ Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Error</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
                <Button onClick={() => router.push('/offers')}>
                  View Offers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  const paymentFee = Math.round(offer.amount * 0.015); // 1.5% payment processing fee
  const totalAmount = offer.amount + paymentFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
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
            <h1 className="text-3xl font-bold text-foreground">Complete Payment</h1>
            <p className="text-muted-foreground">Secure payment for your accepted offer</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Offer Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Property Details
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Agreed Price:</span>
                      <span className="font-semibold text-green-600">₦{offer.amount.toLocaleString()}</span>
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
                  Offer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">Offer Accepted</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Ready for Payment
                    </Badge>
                  </div>
                  
                  {offer.message && (
                    <div>
                      <h4 className="font-medium mb-2">Original Message:</h4>
                      <p className="text-muted-foreground bg-muted p-3 rounded-lg text-sm">{offer.message}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Seller: {offer.seller.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Accepted: {new Date(offer.respondedAt!).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Information */}
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription className="ml-2">
                Your payment is secured by 256-bit SSL encryption and processed through Paystack, 
                Nigeria's leading payment processor. Your transaction is protected by buyer protection policies.
              </AlertDescription>
            </Alert>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Property Price:</span>
                  <span className="font-semibold">₦{offer.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Processing Fee:</span>
                  <span className="text-sm">₦{paymentFee.toLocaleString()}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-primary">₦{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <p>• Funds will be held in escrow until transaction completion</p>
                  <p>• Full refund available if property inspection fails</p>
                  <p>• 24/7 customer support available</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Button */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Purchase</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white" 
                  size="lg"
                  onClick={handleProceedToPayment}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Pay ₦{totalAmount.toLocaleString()}
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-3">
                  By proceeding, you agree to our Terms of Service and Privacy Policy.
                  You will be redirected to Paystack for secure payment processing.
                </p>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Accepted Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">V</span>
                    </div>
                    <span>Visa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-red-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">M</span>
                    </div>
                    <span>Mastercard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-purple-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">V</span>
                    </div>
                    <span>Verve</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 bg-green-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">$</span>
                    </div>
                    <span>Bank Transfer</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}