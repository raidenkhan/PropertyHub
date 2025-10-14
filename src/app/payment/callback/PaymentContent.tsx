// src/app/payment/callback/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { paymentService } from "@/lib/api/paymentService";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled'>('loading');
  const [message, setMessage] = useState('');
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference') || searchParams.get('trxref');
      const cancelled = searchParams.get('cancelled');
      const statusParam = searchParams.get('status');
      
      // Handle explicit cancellation
      if (cancelled === 'true' || statusParam === 'cancelled') {
        setStatus('cancelled');
        setMessage('Payment was cancelled. The property reservation will be released shortly.');
        await handlePaymentCancellation();
        return;
      }
      
      if (!reference) {
        setStatus('failed');
        setMessage('No payment reference found. If you cancelled the payment, the property reservation will be released automatically.');
        await handlePaymentCancellation();
        return;
      }

      try {
        const result = await paymentService.verifyPayment(reference);
        
        if (result.data.payment_successful) {
          setStatus('success');
          setMessage('Payment successful! Redirecting to your transactions...');
          setTransactionId(result.data.transaction.id);
          
          // Clear any pending transaction from localStorage
          localStorage.removeItem('pendingTransaction');
          
          setTimeout(() => {
            router.push(`/transactions/${result.data.transaction.id}`);
          }, 3000);
        } else {
          setStatus('failed');
          setMessage('Payment verification failed or was declined.');
          await handlePaymentCancellation();
        }
      } catch (error: any) {
        setStatus('failed');
        setMessage(error.message || 'Payment verification failed');
        await handlePaymentCancellation();
      }
    };

    const handlePaymentCancellation = async () => {
      try {
        setIsCleaningUp(true);
        const pendingTransactionStr = localStorage.getItem('pendingTransaction');
        
        if (pendingTransactionStr) {
          const pendingTransaction = JSON.parse(pendingTransactionStr);
          
          // Try to cancel the payment and release reservation
          try {
            await paymentService.cancelPayment(
              pendingTransaction.transactionId, 
              'User cancelled payment or payment failed'
            );
            console.log('✅ Payment cancelled and reservation released');
          } catch (cancelError) {
            // If cancel fails, try to release reservation directly
            console.warn('❌ Cancel payment failed, trying to release reservation:', cancelError);
            try {
              await paymentService.releaseReservation(
                pendingTransaction.propertyId, 
                pendingTransaction.transactionId
              );
              console.log('✅ Reservation released directly');
            } catch (releaseError) {
              console.error('❌ Failed to release reservation:', releaseError);
            }
          }
          
          // Clear from localStorage
          localStorage.removeItem('pendingTransaction');
        }
      } catch (error) {
        console.error('Error during payment cleanup:', error);
      } finally {
        setIsCleaningUp(false);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Verifying Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
            {status === 'cancelled' && 'Payment Cancelled'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
              {isCleaningUp && (
                <p className="text-sm text-muted-foreground">Cleaning up reservation...</p>
              )}
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-green-600">{message}</p>
              {transactionId && (
                <Button 
                  onClick={() => router.push(`/transactions/${transactionId}`)}
                  className="mt-4"
                >
                  View Transaction Details
                </Button>
              )}
            </div>
          )}
          
          {status === 'cancelled' && (
            <div className="space-y-4">
              <Clock className="h-16 w-16 text-orange-500 mx-auto" />
              <p className="text-orange-600">{message}</p>
              {isCleaningUp && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
                  <span>Releasing property reservation...</span>
                </div>
              )}
              <div className="flex gap-3 justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Go Back
                </Button>
                <Button
                  onClick={() => router.push('/')}
                >
                  Browse Properties
                </Button>
              </div>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="space-y-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <p className="text-red-600">{message}</p>
              {isCleaningUp && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
                  <span>Releasing property reservation...</span>
                </div>
              )}
              <div className="flex gap-3 justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push('/')}
                >
                  Browse Properties
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}