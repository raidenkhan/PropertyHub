import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { User } from './lib/auth/types';

// 1. Define the routes you want to protect.
const baseProtectedRoutes = [
  '/messages',
  '/dashboard',
  '/host/properties/new'
];

// Define routes that require specific roles
const managerRoutes = [
  '/manager/dashboard', // Example manager-only route
];

const adminRoutes = [
  '/admin/dashboard', // Example admin-only route
];

const MANAGER_ROLES = ['PROPERTY_VERIFIER', 'ESCROW_MANAGER', 'DISPUTE_RESOLVER', 'ADMIN', 'SUPER_ADMIN'];
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

export function middleware(request: NextRequest) {
  // 2. Get the authentication token from the user's cookies.
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  let user: User | null = null;
  if (token) {
    try {
      user = jwtDecode<User>(token);
    } catch (e) {
      // Invalid token, treat as unauthenticated
      console.log("Error: ",e)
    }
  }

  // 3. Check if the requested path is a protected route.
  // Use exact match for base routes, and startsWith for role-based routes.
  const isProtectedRoute = baseProtectedRoutes.includes(pathname);

  const isManagerRoute = managerRoutes.some(r => pathname.startsWith(r));
  const isAdminRoute = adminRoutes.some(r => pathname.startsWith(r));


  // 4. If it's a protected route and the user is not authenticated, redirect to the login page.
  if (isProtectedRoute && !user) {
   
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname); // Optional: redirect back after login
    return NextResponse.redirect(loginUrl);
  }

  // 5. Handle role-based authorization
  if (isManagerRoute && !user?.roles.some(role => MANAGER_ROLES.includes(role))) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (isAdminRoute && !user?.roles.some(role => ADMIN_ROLES.includes(role))) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // 5. If the user is authenticated and tries to access the auth page, redirect them away.
  if (user && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}
