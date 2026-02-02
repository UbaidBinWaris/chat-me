import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api-response';

/**
 * Example protected route
 * This route is protected by middleware and requires a valid JWT token
 */
export async function GET(request: NextRequest) {
  try {
    // Get user info from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    return successResponse({
      message: 'This is a protected route',
      user: {
        id: userId,
        email: userEmail,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
