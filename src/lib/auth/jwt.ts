// src/lib/auth/jwt.ts (New File)
import { jwtDecode } from 'jwt-decode';
import { User } from './types';

export function decodeUserFromToken(token: string): User | null {
  try {
    // This assumes your JWT payload directly matches the User structure.
    // Adjust if the payload has a different shape.
    const decoded = jwtDecode<User>(token);
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}
