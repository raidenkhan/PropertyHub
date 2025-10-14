// File: lib/constants/api.ts (updated)
export const BACKEND_BASE_URL = 'https://propertyhub-production.up.railway.app';
//export const BACKEND_BASE_URL = 'http://localhost:3000';
export const GOOGLE_AUTH_URL = `${BACKEND_BASE_URL}/auth/google`;

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${BACKEND_BASE_URL}/auth/login`,
  SIGNUP: `${BACKEND_BASE_URL}/auth/signup`,
  REFRESH: `${BACKEND_BASE_URL}/auth/refresh`,
  GOOGLE_AUTH: `${BACKEND_BASE_URL}/auth/google`,
  
  // Users
  USERS: `${BACKEND_BASE_URL}/users`,
  
  // Messages
  MESSAGES: `${BACKEND_BASE_URL}/messages`,
} as const;