import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './errors';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Create a success API response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status }
  );
}

/**
 * Handle errors and return appropriate API response
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return errorResponse(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }))
    );
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.code);
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };
    
    if (prismaError.code === 'P2002') {
      return errorResponse(
        'A record with this value already exists',
        409,
        'DUPLICATE_ERROR'
      );
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    console.error('API Error:', error);
    return errorResponse(
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  // Unknown error
  console.error('Unknown error:', error);
  return errorResponse('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
}
