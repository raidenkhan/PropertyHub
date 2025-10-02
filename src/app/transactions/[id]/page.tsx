// src/app/transactions/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DollarSign, 
  Home, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import { transactionService } from "@/lib/api/transactionService";
import { toast } from "@/hooks/use-toast";
import { Transaction } from "@/lib/api/transactionService";

// Types
// // Add this interface at the top of your transactions/[id]/page.tsx
// interface Transaction {
//   id: number;
//   transactionId: string;
//   amount: number;
//   status: 'PENDING' | 'ESCROW' | 'PAYMENT_CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
//   buyerId: number;
//   sellerId: number;
//   propertyId: number;
//   escrowAmount: number;
//   escrowReleased: boolean;
//   escrowReleasedById: number | null;
//   escrowReleasedAt: string | null; // ISO date string
//   paymentMethod: string | null;
//   paymentReference: string | null;
//   createdAt: string; // ISO date string
//   updatedAt: string; // ISO date string
//   completedAt: string | null; // ISO date string
  
//   // Relations
//   buyer: {
//     id: number;
//     name: string;
//     email: string;
//   };
  
//   seller: {
//     id: number;
//     name: string;
//     email: string;
//   };
  
//   property: {
//     id: number;
//     title: string;
//     location: string;
//     images: string[];
//   };
// }

interface StatusInfo {
  color: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function TransactionStatusPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setIsLoading(true);
        const response = await transactionService.getTransaction(Number(id));
        setTransaction(response.transaction);
      } catch (error: unknown) {
        if(error instanceof Error)
        toast({
          title: "❌ Error",
          description: "Failed to load transaction details",
        });
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTransaction();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Transaction not found</h2>
        <Button onClick={() => router.push("/")} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // Status configuration
  const statusConfig: Record<string, StatusInfo> = {
    PENDING: {
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      icon: <Clock className="h-5 w-5" />,
      title: "Payment Processing",
      description: "Your payment is being processed. Please check back in a few minutes."
    },
    ESCROW: {
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      icon: <DollarSign className="h-5 w-5" />,
      title: "Funds in Escrow",
      description: "Your payment is securely held in escrow. The manager will verify the property before releasing funds to the seller."
    },
    PAYMENT_CONFIRMED: {
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Payment Confirmed",
      description: "Your payment has been confirmed. The escrow manager is reviewing the transaction."
    },
    COMPLETED: {
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Transaction Completed",
      description: "Congratulations! The transaction is complete. The seller has received payment and the property is now yours."
    },
    CANCELLED: {
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      icon: <AlertTriangle className="h-5 w-5" />,
      title: "Transaction Cancelled",
      description: "This transaction has been cancelled. If you believe this is an error, please contact support."
    },
    DISPUTED: {
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      icon: <AlertTriangle className="h-5 w-5" />,
      title: "Transaction Disputed",
      description: "A dispute has been opened for this transaction. Our dispute resolution team will contact you shortly."
    }
  };

  const currentStatus = statusConfig[transaction.status] || statusConfig.PENDING;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 mb-4"
          >
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Transaction Status</h1>
          <p className="text-muted-foreground">Track your payment and property transfer</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Status Card */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader className="border-b pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Transaction #{transaction.transactionId.slice(0,7)} ...</h2>
                    <p className="text-muted-foreground">Initiated on {new Date(transaction.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge className={currentStatus.color}>
                    {currentStatus.icon}
                    <span className="ml-2">{transaction.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Property Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Property Details</h3>
                    <div className="flex gap-4">
                      <img 
                        src={transaction.property.images[0] || "/placeholder-property.jpg"} 
                        alt={transaction.property.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-semibold">{transaction.property.title}</h4>
                        <p className="text-muted-foreground">{transaction.property.location}</p>
                        <p className="text-2xl font-bold text-primary mt-2">
                          ₦{transaction.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parties */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Transaction Parties</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{transaction.buyer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Buyer</p>
                          <p className="text-sm text-muted-foreground">{transaction.buyer.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{transaction.seller.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Seller</p>
                          <p className="text-sm text-muted-foreground">{transaction.seller.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Info */}
                  <div className="bg-primary/5 p-6 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        {currentStatus.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{currentStatus.title}</h3>
                        <p className="text-muted-foreground mt-1">{currentStatus.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    {transaction.status === 'ESCROW' && (
                      <Button 
                        variant="outline" 
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onClick={() => router.push(`/property/${transaction.property.id}`)}
                      >
                        <Home className="h-4 w-4 mr-2" /> View Property
                      </Button>
                    )}
                    {transaction.status === 'COMPLETED' && (
                      <>
                        <Button 
                          variant="outline" 
                          className="bg-green-50 text-green-700 hover:bg-green-100"
                          onClick={() => router.push(`/properties/${transaction.property.id}`)}
                        >
                          <Home className="h-4 w-4 mr-2" /> View Property
                        </Button>
                        <Button 
                          variant="outline" 
                          className="bg-primary/10 text-primary hover:bg-primary/20"
                          onClick={() => router.push("/messages")}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" /> Contact Seller
                        </Button>
                      </>
                    )}
                    {(transaction.status === 'PENDING' || transaction.status === 'ESCROW') && (
                      <Button 
                        variant="outline" 
                        className="bg-muted hover:bg-muted/80"
                        onClick={() => router.push("/support")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" /> Contact Support
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Timeline */}
          <div>
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Transaction Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Payment Initiated */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <div className="w-px h-full bg-border flex-1"></div>
                    </div>
                    <div>
                      <p className="font-medium">Payment Initiated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Payment Confirmed */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.status !== 'PENDING' ? 'bg-primary' : 'bg-muted'
                      }`}></div>
                      <div className="w-px h-full bg-border flex-1"></div>
                    </div>
                    <div>
                      <p className="font-medium">Payment Confirmed</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.status !== 'PENDING' ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Escrow Held */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        ['ESCROW', 'PAYMENT_CONFIRMED', 'COMPLETED'].includes(transaction.status) ? 'bg-primary' : 'bg-muted'
                      }`}></div>
                      <div className="w-px h-full bg-border flex-1"></div>
                    </div>
                    <div>
                      <p className="font-medium">Funds in Escrow</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.status === 'ESCROW' ? 'Currently held' : 
                         ['PAYMENT_CONFIRMED', 'COMPLETED'].includes(transaction.status) ? 'Released' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Transaction Completed */}
                  <div className="flex gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      transaction.status === 'COMPLETED' ? 'bg-primary' : 'bg-muted'
                    }`}></div>
                    <div>
                      <p className="font-medium">Transaction Completed</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.status === 'COMPLETED' ? 
                         new Date(transaction.completedAt || transaction.updatedAt).toLocaleString() : 
                         'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm mt-6">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push("/support")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" /> Contact Support
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push("/disputes/new")}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" /> Open Dispute
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push("/dashboard")}
                  >
                    <Home className="h-4 w-4 mr-2" /> Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}