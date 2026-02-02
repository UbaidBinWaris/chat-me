import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api-response';
import { verifyToken, extractToken } from '@/lib/auth';
import { getUserById } from '@/services/auth.service';
import { UnauthorizedError } from '@/lib/errors';

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Protected route - requires JWT token
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Get user from database
    const user = await getUserById(payload.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return successResponse(user, 'User retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
