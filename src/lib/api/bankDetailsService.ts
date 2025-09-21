// src/lib/api/bankDetailsService.ts
import { BACKEND_BASE_URL } from '../constants/api';
import { getAuthHeader } from '../auth/authservice';

const API_URL = BACKEND_BASE_URL

export const bankDetailsService = {
  saveBankDetails: async (dto: { bankAccountNumber: string; bankCode: string }) => {
    const response = await fetch(`${API_URL}/users/bank-details`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save bank details');
    }

    return response.json();
  },
};