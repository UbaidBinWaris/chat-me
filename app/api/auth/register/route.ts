import { NextRequest } from 'next/server';
import { registerUser } from '@/services/auth.service';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { registerSchema } from '@/lib/validation';
import { ZodError } from 'zod';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Register user
    const result = await registerUser(validatedData);

    return successResponse(result, 'User registered successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
