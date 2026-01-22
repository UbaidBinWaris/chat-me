import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { JWTPayload, UserRole } from '@/types/user';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to verify JWT token from request
 */
export function authenticate(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  return verifyAccessToken(token);
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Require authentication middleware
 */
export function requireAuth(
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = authenticate(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(req, user);
  };
}

/**
 * Require specific role(s) middleware
 */
export function requireRole(
  allowedRoles: UserRole[],
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = authenticate(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!hasRole(user.role, allowedRoles)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(req, user);
  };
}
