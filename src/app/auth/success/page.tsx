"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function GoogleAuthSuccessComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const processTokens = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh');

        if (!token || !refreshToken) {
          throw new Error('Missing authentication tokens');
        }

        // Store tokens and get user data
        await login(token, refreshToken, true); // isGoogleAuth = true
        
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        
        // Wait a moment then redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('Google auth processing error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        
        // Redirect to auth page after error
        setTimeout(() => {
          router.push('/auth?error=google_auth_failed');
        }, 3000);
      }
    };

    processTokens();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-[350px]">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="flex items-center space-x-2 mb-4">
            {status === 'processing' && (
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            )}
            {status === 'success' && (
              <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          <h2 className="text-lg font-semibold text-center mb-2">
            {status === 'processing' && 'Authenticating...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {message}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleAuthSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <GoogleAuthSuccessComponent />
    </Suspense>
  );
}