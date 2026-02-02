import { NextRequest } from 'next/server';
import { loginUser } from '@/services/auth.service';
import { successResponse, handleApiError } from '@/lib/api-response';
import { loginSchema } from '@/lib/validation';

/**
 * POST /api/auth/login
 * Login an existing user
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Login user
    const result = await loginUser(validatedData);

    return successResponse(result, 'Login successful', 200);
  } catch (error) {
    return handleApiError(error);
  }
}
