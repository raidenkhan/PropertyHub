// hooks/usePaymentCleanup.ts
import { useEffect } from 'react';
import { paymentService } from '@/lib/api/paymentService';
import { toast } from './use-toast';

interface PendingTransaction {
  transactionId: number;
  propertyId: number;
  timestamp: number;
}

export const usePaymentCleanup = () => {
  useEffect(() => {
    // Check for abandoned payments on component mount
    const checkAbandonedPayments = async () => {
      try {
        const pendingTransactionStr = localStorage.getItem('pendingTransaction');
        if (!pendingTransactionStr) return;

        const pendingTransaction: PendingTransaction = JSON.parse(pendingTransactionStr);
        const now = Date.now();
        const timeElapsed = now - pendingTransaction.timestamp;
        const TIMEOUT_DURATION = 20 * 60 * 1000; // 20 minutes

        if (timeElapsed > TIMEOUT_DURATION) {
          console.log('Found abandoned payment, cleaning up:', pendingTransaction);
          
          // Try to cancel the payment and release reservation
          try {
            await paymentService.cancelPayment(
              pendingTransaction.transactionId, 
              'Payment timeout - automatically cancelled'
            );
            console.log('Successfully cleaned up abandoned payment');
          } catch (error) {
            // If cancel fails, try to release reservation directly
            console.warn('Cancel payment failed, trying to release reservation:', error);
            try {
              await paymentService.releaseReservation(
                pendingTransaction.propertyId, 
                pendingTransaction.transactionId
              );
              console.log('Successfully released property reservation');
            } catch (releaseError) {
              console.error('Failed to release reservation:', releaseError);
            }
          }
          
          // Clear from localStorage
          localStorage.removeItem('pendingTransaction');
        } else {
          // Payment is still within timeout window, set cleanup timer
          const remainingTime = TIMEOUT_DURATION - timeElapsed;
          setTimeout(() => {
            checkAbandonedPayments();
          }, remainingTime + 1000); // Add 1 second buffer
        }
      } catch (error) {
        console.error('Error checking abandoned payments:', error);
        // Clear invalid data from localStorage
        localStorage.removeItem('pendingTransaction');
      }
    };

    // Run cleanup check
    checkAbandonedPayments();

    // Cleanup on page visibility change (when user comes back to the tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAbandonedPayments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Manual cleanup function for immediate use
  const cleanupPendingTransaction = async () => {
    try {
      const pendingTransactionStr = localStorage.getItem('pendingTransaction');
      if (!pendingTransactionStr) return false;

      const pendingTransaction: PendingTransaction = JSON.parse(pendingTransactionStr);
      
      await paymentService.cancelPayment(
        pendingTransaction.transactionId,
        'User manually cancelled'
      );
      
      localStorage.removeItem('pendingTransaction');
      
      toast({
        title: "🔄 Payment Cancelled",
        description: "Your payment has been cancelled and the property is available again.",
      });
      
      return true;
    } catch (error) {
      console.error('Failed to cleanup pending transaction:', error);
      return false;
    }
  };

  // Check if there's a pending transaction
  const hasPendingTransaction = () => {
    const pendingTransactionStr = localStorage.getItem('pendingTransaction');
    if (!pendingTransactionStr) return false;
    
    try {
      const pendingTransaction: PendingTransaction = JSON.parse(pendingTransactionStr);
      const now = Date.now();
      const timeElapsed = now - pendingTransaction.timestamp;
      const TIMEOUT_DURATION = 20 * 60 * 1000; // 20 minutes
      
      return timeElapsed <= TIMEOUT_DURATION;
    } catch {
      return false;
    }
  };

  return {
    cleanupPendingTransaction,
    hasPendingTransaction,
  };
};