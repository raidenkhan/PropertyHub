 "use client";
 
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
 import { authService } from './authservice';
 import { User } from './types';
import { useRouter } from 'next/navigation';
 
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email?: string, password?: string, isGoogleAuth?: boolean, accessToken?: string, refreshToken?: string) => Promise<void>;
  signup: (email: string, password: string, name: string,phone:string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<User>;
  checkUser: () => void;
  loginWithGoogle: () => Promise<void>;
}
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 export const useAuth = () => {
   const context = useContext(AuthContext);
   if (context === undefined) {
     throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };
  
  export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const router=  useRouter();
    const [user, setUser] = useState<User | null>(null);
   const [token, setToken] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(true);
 
  const checkUser = useCallback(() => {
    const currentUser = authService.getCurrentUser();
    const currentToken = authService.getAccessToken();
    if (currentUser && currentToken && authService.isAuthenticated()) {
      setUser(currentUser);
      setToken(currentToken);
    } else {
      setUser(null);
      setToken(null);
    }
    setIsLoading(false);
  }, []);
 
   useEffect(() => {
     checkUser();
   }, []);
 
  const login = useCallback(async (
    email?: string, 
    password?: string, 
    isGoogleAuth = false,
    accessToken?: string,
    refreshToken?: string
  ) => {
    setIsLoading(true);
    try {
      if (isGoogleAuth && accessToken && refreshToken) {
        // Handle Google OAuth callback
        console.log('Processing Google auth in context...');
        await authService.processGoogleAuth(accessToken, refreshToken);
      } else if (email && password) {
        // Handle regular email/password login
        await authService.login({ email, password });
      } else {
        throw new Error('Invalid login parameters');
      }
      checkUser();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since authService is stable

  const loginWithGoogle = useCallback(async () => {
    try {
      await authService.loginWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }, []);
 
   const signup = async (email: string, password: string, name: string) => {
     setIsLoading(true);
     try {
       await authService.signup({ email, password, name });
       checkUser();
     } catch (error) {
       console.error('Signup failed:', error);
       throw error;
     } finally {
       setIsLoading(false);
     }
   };
 
   const logout = async () => {
     setIsLoading(true);
     try {
       await authService.logout();
       setUser(null);
       setToken(null);
      router.replace('/')
     } catch (error) {
       console.error('Logout failed:', error);
     } finally {
       setIsLoading(false);
     }
   };

   const updateUser = async (userData: Partial<User>) => {
     try {
       const updatedUser = await authService.updateUser(userData);
       setUser(updatedUser);
       return updatedUser;
     } catch (error) {
       console.error('Update user failed:', error);
       throw error;
     }
   };
 
  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
    checkUser,
    loginWithGoogle,
  };
 
   return (
     <AuthContext.Provider value={value}>
       {children}
     </AuthContext.Provider>
   );
 };
