"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function GoogleAuthError() {
  const router = useRouter();

  useEffect(() => {
    // Auto redirect after 10 seconds
    const timer = setTimeout(() => {
      router.push('/auth');
    }, 10000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-xl">Authentication Failed</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            We encountered an issue while trying to authenticate with Google. 
            This could be due to:
          </p>
          
          <ul className="text-sm text-left space-y-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <li>• Network connectivity issues</li>
            <li>• Cancelled authentication</li>
            <li>• Account access restrictions</li>
            <li>• Temporary server issues</li>
          </ul>
          
          <div className="pt-4 space-y-2">
            <Button 
              onClick={() => router.push('/auth')}
              className="w-full"
            >
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go Home
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            You will be automatically redirected in 10 seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}