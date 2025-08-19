/**
 * API Utilities
 * Helper functions for consistent API responses and request handling
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: Partial<ApiResponse['meta']>
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return Response.json(response, { status: 200 });
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return Response.json(response, { status });
}

/**
 * Parse and validate JSON request body
 */
export async function parseRequestBody<T = any>(
  request: NextRequest,
  validator?: (data: any) => data is T
): Promise<T> {
  try {
    const body = await request.json();

    if (validator && !validator(body)) {
      throw new Error('Invalid request body format');
    }

    return body;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Get query parameters from request
 */
export function getQueryParams(request: NextRequest): Record<string, string> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * Get pagination parameters from query string
 */
export function getPaginationParams(
  request: NextRequest,
  defaultLimit: number = 20,
  maxLimit: number = 100
): { page: number; limit: number; offset: number } {
  const params = getQueryParams(request);

  let page = parseInt(params.page) || 1;
  let limit = parseInt(params.limit) || defaultLimit;

  // Ensure valid values
  page = Math.max(1, page);
  limit = Math.min(Math.max(1, limit), maxLimit);

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): ApiResponse['meta']['pagination'] {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw createErrorResponse(
      'UNAUTHORIZED',
      'Authentication required',
      null,
      401
    );
  }

  return user;
}

/**
 * Handle API method validation
 */
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[]
): void {
  if (!allowedMethods.includes(request.method)) {
    throw createErrorResponse(
      'METHOD_NOT_ALLOWED',
      `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      { allowedMethods },
      405
    );
  }
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

/**
 * Create API handler wrapper with common functionality
 */
export function createApiHandler(
  handler: (
    request: NextRequest,
    context: { params?: any; user?: any }
  ) => Promise<Response>,
  options: {
    requireAuth?: boolean;
    allowedMethods?: string[];
    rateLimiter?: (request: NextRequest) => Promise<Response | null>;
  } = {}
) {
  return async (
    request: NextRequest,
    context: { params?: any } = {}
  ): Promise<Response> => {
    const requestId = generateRequestId();

    try {
      // Method validation
      if (options.allowedMethods) {
        validateMethod(request, options.allowedMethods);
      }

      // Rate limiting
      if (options.rateLimiter) {
        const rateLimitResponse = await options.rateLimiter(request);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      }

      // Authentication
      let user = null;
      if (options.requireAuth) {
        user = await requireAuth(request);
      } else {
        user = await getAuthenticatedUser(request);
      }

      // Call the actual handler
      return await handler(request, { ...context, user });

    } catch (error) {
      console.error(`API Error [${requestId}]:`, error);

      if (error instanceof Response) {
        return error;
      }

      if (error instanceof Error) {
        return createErrorResponse(
          'INTERNAL_SERVER_ERROR',
          error.message,
          { requestId },
          500
        );
      }

      return createErrorResponse(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred',
        { requestId },
        500
      );
    }
  };
}

/**
 * Common validation schemas
 */
export const validators = {
  chatMessage: (data: any): data is { message: string; chatId?: string } => {
    return (
      typeof data === 'object' &&
      typeof data.message === 'string' &&
      data.message.trim().length > 0 &&
      data.message.length <= 4000 &&
      (data.chatId === undefined || typeof data.chatId === 'string')
    );
  },

  createChat: (data: any): data is { title: string } => {
    return (
      typeof data === 'object' &&
      typeof data.title === 'string' &&
      data.title.trim().length > 0 &&
      data.title.length <= 100
    );
  },

  updateChat: (data: any): data is { title?: string } => {
    return (
      typeof data === 'object' &&
      (data.title === undefined ||
        (typeof data.title === 'string' &&
         data.title.trim().length > 0 &&
         data.title.length <= 100))
    );
  },
};

/**
 * Content type helpers
 */
export const contentTypes = {
  json: 'application/json',
  text: 'text/plain',
  html: 'text/html',
  stream: 'text/plain; charset=utf-8',
};

/**
 * CORS headers for API responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : process.env.NEXTAUTH_URL || '',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle preflight OPTIONS requests
 */
export function handleOptions(): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
