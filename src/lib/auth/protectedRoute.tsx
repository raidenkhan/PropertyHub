// 'use client';
// import { useAuth } from './authContext';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   requiredRoles?: string[];
//   redirectTo?: string;
// }

// export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
//   children,
//   requiredRoles = [],
//   redirectTo = '/auth'
// }) => {
//   const { user, isAuthenticated, isLoading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!isLoading) {
//       // Redirect if not authenticated
//       if (!isAuthenticated) {
//         router.push(redirectTo);
//         return;
//       }

//       // Redirect if roles required but user doesn't have any of them
//       if (requiredRoles.length > 0 && user) {
//         const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
//         if (!hasRequiredRole) {
//           router.push('/unauthorized');
//           return;
//         }
//       }
//     }
//   }, [isAuthenticated, isLoading, user, requiredRoles, router, redirectTo]);

//   // Show loader while checking auth
//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   // If not authenticated, don't render children (redirect handled in useEffect)
//   if (!isAuthenticated) {
//     return null;
//   }

//   // If roles required and user doesn't have any, don't render (redirect handled)
//   if (requiredRoles.length > 0 && user && !requiredRoles.some(role => user.roles.includes(role))) {
//     return null;
//   }

//   // ✅ All checks passed — render protected content
//   return <>{children}</>;
// };