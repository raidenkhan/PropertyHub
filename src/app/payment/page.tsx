import { Suspense } from 'react';
import PaymentPage from './paymentContent';

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentPage />
    </Suspense>
  );
}