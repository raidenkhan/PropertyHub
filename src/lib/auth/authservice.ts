// lib/auth/authservice.ts
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

  // ✅ Refresh token
  async refreshAccessToken(): Promise<string | null> {
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

      const data: AuthResponse = await response.json();
      const validatedUser = validateUser(data.user);

      this.setTokens(data.accessToken, data.refreshToken);
      this.setUser(validatedUser);

      return data.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      throw error;
    }
  }

  // ✅ Authenticated fetch with auto-refresh
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.accessToken;

    if (!token) {
      throw new Error('No access token available');
    }

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

 
  hasRole(role: string): boolean {
    return this.user?.roles?.includes(role) || false;
  }

  // ✅ Check if user has any of the given roles
  hasAnyRole(roles: string[]): boolean {
    return this.user?.roles?.some(r => roles.includes(r)) || false;
  }
  
}

export const authService = new AuthService();