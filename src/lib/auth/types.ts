// lib/auth/types.ts
import { z } from 'zod';

// Define the User schema with Zod
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  roles: z.array(z.string()),
  redirectPath: z.string(),
  primaryRole: z.string().optional(),
  avatar: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  createdAt: z.string().optional(), // ISO string from backend
  updatedAt: z.string().optional(),
  paystackRecipientCode: z.string().nullable().optional()
});

// Infer TypeScript type from Zod schema
export type User = z.infer<typeof UserSchema>;

// Optional: Helper function to validate user data at runtime
export function validateUser(data: any): User {
  return UserSchema.parse(data);
}