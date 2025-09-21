// lib/googleAuth.ts
import { GOOGLE_AUTH_URL } from './constants/api'; // Make sure to define this constant

export const handleGoogleAuth = () => {
  // Redirect the user to your backend's Google authentication endpoint.
  // The backend will then handle the OAuth flow and redirect back to your frontend.
  window.location.href = GOOGLE_AUTH_URL;
};