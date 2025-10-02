// lib/api/adminService.ts
import { getAuthHeader } from '../auth/authservice';
import { BACKEND_BASE_URL } from '../constants/api';

interface CreateManagerDto {
  email: string;
  name: string;
  password: string;
  role: 'PROPERTY_VERIFIER' | 'ESCROW_MANAGER' | 'DISPUTE_RESOLVER';
}

class AdminService {
  private baseUrl = BACKEND_BASE_URL || 'http://localhost:3000';

  async createManager(dto: CreateManagerDto): Promise<any> {
    const response = await fetch(`${this.baseUrl}/admin/create-manager`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create manager');
    }

    return response.json();
  }
}

export const adminService = new AdminService();