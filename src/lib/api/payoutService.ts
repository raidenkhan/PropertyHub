import { BACKEND_BASE_URL } from "@/lib/constants/api";
import { authService } from "../auth/authservice";

// Type for a single bank or mobile money provider, matching the API response
export type PayoutProvider = {
  id: number;
  name: string;
  slug: string;
  code: string;
  type: "nuban" | "mobile_money";
  country: string;
};

// Type for the payload when saving new payout details
export type PayoutDetailsPayload = {
  type: "nuban" | "mobile_money";
  bankCode: string;
  accountNumber: string;
};

/**
 * Fetches the list of available payout providers (banks and mobile money).
 * @param token - The user's authentication JWT.
 * @returns A promise that resolves to an array of PayoutProvider objects.
 */
export const getPayoutProviders = async (token: string): Promise<PayoutProvider[]> => {
  const response = await authService.authenticatedFetch(`${BACKEND_BASE_URL}/users/payout-providers`, {
    
  });

  if (!response.ok) {
    throw new Error("Failed to fetch payout providers.");
  }

  const result = await response.json();
  
  // The API returns { data: [...] }, so we extract the array.
  return result.data || [];
};

/**
 * Saves the user's payout details to the backend.
 * @param details - The payout details payload.
 * @param token - The user's authentication JWT.
 * @returns A promise that resolves to the success response from the API.
 */
export const savePayoutDetails = async (details: PayoutDetailsPayload, token: string): Promise<{ message: string }> => {
  const response = await fetch(`${BACKEND_BASE_URL}/users/bank-details`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(details),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to save payout details.");
  }

  return result;
};