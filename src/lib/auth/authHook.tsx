import { useState } from 'react';
import { authService } from './authservice';

export const AuthenticatedFetch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.authenticatedFetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { authenticatedFetch, loading, error };
};