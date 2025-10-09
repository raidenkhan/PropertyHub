// lib/auth/authservice.ts
import { NextRouter } from 'next/router';
import { BACKEND_BASE_URL } from '../constants/api';
import { validateUser, User } from './types';
import Cookies from 'js-cookie';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
  phone?:string
  provider?: string;
  avatar?: string;
}
export const getAuthHeader = ():Record<string,string> => {
  if (typeof window !== 'undefined') {
    const token = Cookies.get('accessToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
  return {};
};

export interface AuthResponse extends AuthTokens {
  user: User; //  Make it required — backend always sends it
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;

  private router: NextRouter | null = null;

  setRouter(router: NextRouter) {
    this.router = router;
  }
  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = Cookies.get('accessToken') || null;
      this.refreshToken = Cookies.get('refreshToken') || null;
      const storedUser = Cookies.get('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          // ✅ Validate on read — protects against localStorage corruption
          this.user = validateUser(parsed);
        } catch (error) {
          console.error('Failed to parse or validate stored user:', error);
          this.clearAuth();
        }
      }
    }
  }

  // ✅ Login — returns full AuthResponse
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();

      // ✅ Validate user shape
      const validatedUser = validateUser(data.user);

      // ✅ Save to localStorage and instance
      this.setTokens(data.accessToken, data.refreshToken);
      this.setUser(validatedUser);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // ✅ Signup — enforce defaults, no role selection
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    try {
      // ✅ Enforce defaults — public signup is always USER role (assigned by backend)
      const payload = {
        ...userData,
        provider: userData.provider || 'LOCAL',
        avatar: userData.avatar || 'https://i.pravatar.cc/150?img=3',
        
      };

      const response = await fetch(`${BACKEND_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Signup failed');
      }

      const data: AuthResponse = await response.json();
      console.log(data)
      // ✅ Validate and save
      const validatedUser = validateUser(data.user);
      this.setTokens(data.accessToken, data.refreshToken);
      this.setUser(validatedUser);

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // ✅ Set tokens + user
  private setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== 'undefined') {
      Cookies.set('accessToken', accessToken, { secure: true, sameSite: 'strict' });
      Cookies.set('refreshToken', refreshToken, { secure: true, sameSite: 'strict' });
    }
  }

  // ✅ Set user
  private setUser(user: User): void {
    this.user = user;
    if (typeof window !== 'undefined') {
      Cookies.set('user', JSON.stringify(user), { secure: true, sameSite: 'strict' });
    }
  }

  private redirectToAuth(): void {
    if (typeof window !== 'undefined') {
      if (this.router) {
        this.router.push('/auth');
      } else {
        window.location.href = '/auth';
      }
    }
  }

  // ✅ Refresh token
  async refreshAccessToken(): Promise<string | null> {
    // Ensure we have the latest refresh token (fallback to cookie if memory missing)
    if (!this.refreshToken && typeof window !== 'undefined') {
      this.refreshToken = Cookies.get('refreshToken') || null;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearAuth();
        throw new Error('Failed to refresh token');
      }

      // Be flexible with backend response shapes: {accessToken, refreshToken, user?}
      // or snake_case keys, and/or nested under { data: ... }
      const raw = await response.json().catch(() => ({} as any));
      const payload = (raw && (raw.data ?? raw)) as any;

      const newAccess = payload?.accessToken ?? payload?.access_token;
      const newRefresh = payload?.refreshToken ?? payload?.refresh_token ?? this.refreshToken;
      const maybeUser = payload?.user;

      if (!newAccess) {
        // If backend didn’t provide an access token, treat as failure
        this.clearAuth();
        throw new Error('Invalid refresh response: missing access token');
      }

      // Persist tokens (refresh token may or may not rotate)
      this.setTokens(newAccess, newRefresh);

      // If backend returned a user, try to validate+persist it; otherwise keep existing user
      if (maybeUser) {
        try {
          const validatedUser = validateUser(maybeUser);
          this.setUser(validatedUser);
        } catch (e) {
          // Don’t log the user out just because refresh user payload is partial
          console.warn('Refresh returned user but validation failed — keeping existing user');
        }
      }

      return newAccess;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      throw error;
    }
  }

  // ✅ Authenticated fetch with auto-refresh
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.accessToken;

    // Fallback to cookie if in-memory token is missing (e.g., after reload)
    if (!token && typeof window !== 'undefined') {
      token = Cookies.get('accessToken') || null;
      if (token) {
        this.accessToken = token;
      }
    }

    if (!token) {
      throw new Error('No access token available');
    }

    // Make the actual fetch request with authorization header
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });

    // Auto-refresh on 401
    if (response.status === 401 && this.refreshToken) {
      try {
        token = await this.refreshAccessToken();
        if (token) {
          response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${token}`,
            },
          });
        }
      } catch (refreshError) {
        this.clearAuth();
        throw new Error('Authentication expired. Please login again.');
      }
    }

    return response;
  }

  // ✅ Clear all auth data
  clearAuth(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;

    if (typeof window !== 'undefined') {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('user');
    }
  }

  // ✅ Logout
  async logout(): Promise<void> {
    this.clearAuth();
    // Optional: call backend /auth/logout if implemented
  }

  // ✅ Check auth state
  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  // ✅ Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // ✅ Get token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // ✅ Update user profile
  async updateUser(userData: Partial<User>): Promise<User> {
    if (!this.user) {
      throw new Error('No user is currently logged in');
    }

    try {
      const response = await this.authenticatedFetch(`${BACKEND_BASE_URL}/users/${this.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update user profile');
      }

      const updatedUserData = await response.json();
      const validatedUser = validateUser(updatedUserData);
      this.setUser(validatedUser);

      return validatedUser;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

 
  hasRole(role: string): boolean {
    return this.user?.roles?.includes(role) || false;
  }

  // ✅ Check if user has any of the given roles
  hasAnyRole(roles: string[]): boolean {
    return this.user?.roles?.some(r => roles.includes(r)) || false;
  }

  // ✅ Google OAuth methods
  async loginWithGoogle(): Promise<void> {
    const backendUrl = BACKEND_BASE_URL || 'http://localhost:3001';
    window.location.href = `${backendUrl}/auth/google`;
  }

  // ✅ Process Google auth callback with tokens
  async processGoogleAuth(accessToken: string, refreshToken: string): Promise<AuthResponse> {
    try {
      // Set tokens first
      this.setTokens(accessToken, refreshToken);

      // Get user data using the access token
      const response = await this.authenticatedFetch(`${BACKEND_BASE_URL}/auth/me`);
      
      if (!response.ok) {
        throw new Error('Failed to get user data after Google auth');
      }

      const userData = await response.json();
      const validatedUser = validateUser(userData);
      this.setUser(validatedUser);

      return {
        accessToken,
        refreshToken,
        user: validatedUser
      };
    } catch (error) {
      console.error('Google auth processing error:', error);
      this.clearAuth();
      throw error;
    }
  }

  // ✅ Alternative method if backend provides user data directly in callback
  async processGoogleAuthWithUser(accessToken: string, refreshToken: string, userData: any): Promise<AuthResponse> {
    try {
      const validatedUser = validateUser(userData);
      this.setTokens(accessToken, refreshToken);
      this.setUser(validatedUser);

      return {
        accessToken,
        refreshToken,
        user: validatedUser
      };
    } catch (error) {
      console.error('Google auth with user processing error:', error);
      this.clearAuth();
      throw error;
    }
  }
  
}

export const authService = new AuthService();