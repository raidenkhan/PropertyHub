"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { Loader2 } from 'lucide-react';
import { BACKEND_BASE_URL } from '@/lib/constants/api';

interface GoogleAuthButtonProps {
  mode?: 'signin' | 'signup';
  disabled?: boolean;
  className?: string;
}

export function GoogleAuthButton({ 
  mode = 'signin', 
  disabled = false,
  className = "" 
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      // Get the backend URL from environment
      const backendUrl = BACKEND_BASE_URL || 'http://localhost:3001';
      
      // Redirect to the Google OAuth endpoint on your backend
      window.location.href = `${backendUrl}/auth/google`;
    } catch (error) {
      console.error('Google auth error:', error);
      setIsLoading(false);
    }
  };

  const buttonText = mode === 'signin' 
    ? 'Sign in with Google' 
    : 'Sign up with Google';

  return (
    <Button
      variant="outline"
      type="button"
      disabled={disabled || isLoading}
      onClick={handleGoogleAuth}
      className={`w-full ${className}`}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icons.google className="mr-2 h-4 w-4" />
      )}
      {buttonText}
    </Button>
  );
}