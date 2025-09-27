 "use client";
 
 import { useState, useEffect } from "react";
 import { useAuth } from "@/lib/auth/authContext";
 import { PayoutDetailsForm } from "@/components/forms/PayoutDetailsForm";
 import { Header } from "@/components/Header";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 import { CheckCircle, Loader2 } from "lucide-react";
 
 export default function SettingsPage() {
   const { user, token, checkUser } = useAuth();
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     // The useAuth hook manages the user state, including paystackRecipientCode
     if (user !== undefined) {
       setIsLoading(false);
     }
   }, [user]);
 
   const handleSuccess = () => {
     // Re-check user to get the updated profile with paystackRecipientCode
     checkUser();
   };
 
   if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <>
       <Header />
       <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
         <div className="space-y-8">
           <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
           
           <Card>
             <CardHeader>
               <CardTitle>Payout Information</CardTitle>
             </CardHeader>
             <CardContent>
               {user?.paystackRecipientCode ? (
                 <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                   <CheckCircle className="h-4 w-4 text-green-600" />
                   <AlertTitle>All Set!</AlertTitle>
                   <AlertDescription className="text-green-700 dark:text-green-300">
                     Your payout details are configured. To change them, please contact support.
                   </AlertDescription>
                 </Alert>
               ) : (
                 <PayoutDetailsForm onSuccess={handleSuccess} />
               )}
             </CardContent>
           </Card>
 
           {/* Other settings can be added here in other cards */}
         </div>
       </main>
     </>
   );
 }

