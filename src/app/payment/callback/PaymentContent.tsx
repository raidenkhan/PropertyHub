// src/app/payment/callback/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { paymentService } from "@/lib/api/paymentService";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference') || searchParams.get('trxref');
      
      if (!reference) {
        setStatus('failed');
        setMessage('No payment reference found');
        return;
      }

      try {
        const result = await paymentService.verifyPayment(reference);
        
        if (result.data.payment_successful) {
          setStatus('success');
          setMessage('Payment successful! Redirecting to your transactions...');
          setTimeout(() => {
            router.push(`/transactions/${result.data.transaction.id}`);
          }, 3000);
        } else {
          setStatus('failed');
          setMessage('Payment verification failed');
        }
      } catch (error: any) {
        setStatus('failed');
        setMessage(error.message || 'Payment verification failed');
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
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-green-600">{message}</p>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="space-y-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <p className="text-red-600">{message}</p>
              <button
                onClick={() => router.push('/properties')}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              >
                Browse Properties
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}