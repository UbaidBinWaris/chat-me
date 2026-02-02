import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Define protected routes that require authentication
const protectedRoutes = ['/api/protected', '/api/user', '/dashboard'];
const authRoutes = ['/api/auth/login', '/api/auth/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow auth routes without token
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // If not a protected route, continue
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get token from Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized - No token provided' } },
      { status: 401 }
    );
  }

  // Verify the token
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized - Invalid token' } },
      { status: 401 }
    );
  }

  // Add user info to headers for downstream handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/api/protected/:path*',
    '/api/user/:path*',
    '/dashboard/:path*',
    '/api/auth/:path*',
  ],
};
