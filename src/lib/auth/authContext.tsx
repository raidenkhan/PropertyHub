 "use client";
 
 import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
 import { authService } from './authservice';
 import { User } from './types';
import { useRouter } from 'next/navigation';
 
 interface AuthContextType {
   user: User | null;
   token: string | null;
   isAuthenticated: boolean;
   isLoading: boolean;
   login: (email: string, password: string) => Promise<void>;
   signup: (email: string, password: string, name: string,phone:string) => Promise<void>;
   logout: () => Promise<void>;
   checkUser: () => void;
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
 
   const checkUser = () => {
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
   };
 
   useEffect(() => {
     checkUser();
   }, []);
 
   const login = async (email: string, password: string) => {
     setIsLoading(true);
     try {
       await authService.login({ email, password });
       checkUser();
     } catch (error) {
       console.error('Login failed:', error);
       throw error;
     } finally {
       setIsLoading(false);
     }
   };
 
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
 
   const value = {
     user,
     token,
     isAuthenticated: !!user && !!token,
     isLoading,
     login,
     signup,
     logout,
     checkUser,
   };
 
   return (
     <AuthContext.Provider value={value}>
       {children}
     </AuthContext.Provider>
   );
 };
