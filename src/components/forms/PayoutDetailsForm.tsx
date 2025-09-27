 "use client";
 
 import { useState, useEffect, FormEvent } from "react";
 import { getPayoutProviders, savePayoutDetails, PayoutProvider, PayoutDetailsPayload } from "@/lib/api/payoutService";
 import { useAuth } from "@/lib/auth/authContext";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Combobox } from "@/components/ui/combobox";
 import {
   RadioGroup,
   RadioGroupItem,
 } from "@/components/ui/radio-group";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

 type PayoutType = "nuban" | "mobile_money";
 
 interface PayoutDetailsFormProps {
   onSuccess?: () => void;
 }
 
 export function PayoutDetailsForm({ onSuccess }: PayoutDetailsFormProps) {
   const { token } = useAuth();
   const [payoutType, setPayoutType] = useState<PayoutType>("nuban");
   const [filteredProviders, setFilteredProviders] = useState<PayoutProvider[]>([]);
   const [bankCode, setBankCode] = useState("");
   const [accountNumber, setAccountNumber] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [isFetchingProviders, setIsFetchingProviders] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState<string | null>(null);
 
   // Store all providers fetched from the API
   const [allProviders, setAllProviders] = useState<PayoutProvider[]>([]);
 
   useEffect(() => {
     const fetchProviders = async () => {
       if (!token) return;
       setIsFetchingProviders(true);
       try {
        
         const providersArray = await getPayoutProviders(token);
         
         setAllProviders(providersArray);
       } catch (err) {
         setError(err instanceof Error ? err.message : "An unknown error occurred.");
       } finally {
         setIsFetchingProviders(false);
       }
     };
 
     fetchProviders();
   }, [token]);
 
   useEffect(() => {
     // This effect now correctly re-filters when payoutType or allProviders change.
     const filtered = allProviders.filter(
       (provider) => provider.type === payoutType
     );
     setFilteredProviders(filtered);
     console.log(filtered)
 
     // Reset dependent form fields when the payout type changes
     setBankCode("");
     setAccountNumber("");
   }, [payoutType, allProviders]);
 
   const handleSubmit = async (e: FormEvent) => {
     e.preventDefault();
     setError(null);
     setSuccess(null);
 
     if (!bankCode || !accountNumber) {
       setError("Please fill in all fields.");
       return;
     }
 
     setIsLoading(true);
 
     try {
       const payload: PayoutDetailsPayload = {
         type: payoutType,
         bankCode,
         accountNumber: accountNumber
       };
 
       // Use the refactored service function
       console.log(payload)
       const result = await savePayoutDetails(payload, token as string);
 
       setSuccess(result.message || "Payout details saved successfully.");
       if (onSuccess) {
         onSuccess();
       }
     } catch (err) {
       setError(err instanceof Error ? err.message : "An unknown error occurred.");
     } finally {
       setIsLoading(false);
     }
   };
 
   const numberLabel = payoutType === "nuban" ? "Account Number" : "Phone Number";
   const providerLabel = payoutType === "nuban" ? "Bank" : "mobile_money";
 
   return (
     <Card className="w-full max-w-lg">
       <CardHeader>
         <CardTitle>Setup Payout Account</CardTitle>
         <CardDescription>
           Add your bank or mobile money details to receive payments.
         </CardDescription>
       </CardHeader>
       <CardContent>
         <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2">
             <Label>Payout Method</Label>
             <RadioGroup
               defaultValue={payoutType}
               onValueChange={(value: PayoutType) => setPayoutType(value)}
               className="flex space-x-4"
             >
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="nuban" id="nuban" />
                 <Label htmlFor="nuban">Bank Account</Label>
               </div>
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="mobile_money" id="mobile_money" />
                 <Label htmlFor="mobile_money">Mobile Money</Label>
               </div>
             </RadioGroup>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="provider">{providerLabel}</Label>
             <Combobox
                options={filteredProviders.map(p => ({ key: p.id, value: p.code, label: p.name }))}
                value={bankCode}
                onChange={setBankCode}
                placeholder={isFetchingProviders ? "Loading providers..." : `Select a ${providerLabel.toLowerCase()}`}
                searchPlaceholder="Search provider..."
                emptyMessage="No provider found."
                disabled={isFetchingProviders || filteredProviders.length === 0}
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="accountNumber">{numberLabel}</Label>
             <Input
               id="accountNumber"
               type="text"
               value={accountNumber}
               onChange={(e) => setAccountNumber(e.target.value)}
               placeholder={`Enter your ${numberLabel.toLowerCase()}`}
               required
             />
           </div>
 
           {error && (
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
           )}
 
           {success && (
             <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
               <CheckCircle className="h-4 w-4 text-green-600" />
               <AlertTitle>Success</AlertTitle>
               <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
             </Alert>
           )}
 
           <Button type="submit" disabled={isLoading || isFetchingProviders} className="w-full">
             {isLoading ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Saving...
               </>
             ) : (
               "Save Payout Details"
             )}
           </Button>
         </form>
       </CardContent>
     </Card>
   );
 }
