// src/app/host/bank-details/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/authContext";
import { bankDetailsService } from "@/lib/api/bankDetailsService";
import { toast } from "@/hooks/use-toast";

export default function BankDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountNumber || !bankCode) {
      toast({
        title: "❌ Invalid Input",
        description: "Please fill in all fields",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await bankDetailsService.saveBankDetails({
        bankAccountNumber,
        bankCode,
      });
      toast({
        title: "✅ Bank Details Saved",
        description: "You can now receive payments!",
      });
      router.push("/host/dashboard");
    } catch (error: unknown) {
      if(error instanceof Error)
      toast({
        title: "❌ Failed to Save",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
              <Input
                id="bankAccountNumber"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="0123456789"
                required
              />
            </div>
            <div>
              <Label htmlFor="bankCode">Bank Code</Label>
              <Input
                id="bankCode"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                placeholder="e.g., 044 for Access Bank"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Common codes: 044 (Access), 057 (Zenith), 033 (UBA), 063 (GTB)
              </p>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : "Save Bank Details"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}