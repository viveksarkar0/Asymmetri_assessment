/**
 * Error Handling Utility
 * Provides centralized error handling and logging for the application
 */

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // External API errors
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  API_UNAVAILABLE = 'API_UNAVAILABLE',

  // AI/Tool errors
  AI_ERROR = 'AI_ERROR',
  TOOL_EXECUTION_ERROR = 'TOOL_EXECUTION_ERROR',

  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  requestId?: string;
}

export class ApplicationError extends Error {
  public code: ErrorCode;
  public details?: any;
  public timestamp: Date;
  public userId?: string;
  public requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.userId = userId;
    this.requestId = requestId;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      userId: this.userId,
      requestId: this.requestId,
    };
  }
}

/**
 * Error handler for API routes
 */
export function handleApiError(error: unknown, userId?: string, requestId?: string): Response {
  console.error('API Error:', error);

  if (error instanceof ApplicationError) {
    const statusCode = getStatusCodeFromErrorCode(error.code);
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: error.timestamp,
        },
      },
      { status: statusCode }
    );
  }

  // Handle database errors
  if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
    return Response.json(
      {
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: 'Database table does not exist. Please run migrations.',
          timestamp: new Date(),
        },
      },
      { status: 500 }
    );
  }

  // Handle network/timeout errors
  if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNREFUSED'))) {
    return Response.json(
      {
        error: {
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network connection failed. Please try again.',
          timestamp: new Date(),
        },
      },
      { status: 503 }
    );
  }

  // Generic error handling
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return Response.json(
    {
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: message,
        timestamp: new Date(),
      },
    },
    { status: 500 }
  );
}

/**
 * Get HTTP status code from error code
 */
function getStatusCodeFromErrorCode(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.SESSION_EXPIRED:
      return 401;
    case ErrorCode.FORBIDDEN:
      return 403;
    case ErrorCode.RECORD_NOT_FOUND:
      return 404;
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
      return 400;
    case ErrorCode.DUPLICATE_ENTRY:
      return 409;
    case ErrorCode.API_RATE_LIMITED:
      return 429;
    case ErrorCode.API_UNAVAILABLE:
      return 503;
    case ErrorCode.TIMEOUT:
      return 408;
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.EXTERNAL_API_ERROR:
    case ErrorCode.AI_ERROR:
    case ErrorCode.TOOL_EXECUTION_ERROR:
    case ErrorCode.INTERNAL_SERVER_ERROR:
    case ErrorCode.NETWORK_ERROR:
    default:
      return 500;
  }
}

/**
 * Logger utility for errors
 */
export function logError(error: ApplicationError | Error, context?: string): void {
  const timestamp = new Date().toISOString();
  const errorData = {
    timestamp,
    context,
    error: error instanceof ApplicationError ? error.toJSON() : {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  };

  if (process.env.NODE_ENV === 'production') {
    // In production, you might want to send to external logging service
    // like Sentry, LogRocket, or DataDog
    console.error('Production Error:', JSON.stringify(errorData, null, 2));
  } else {
    // Development logging
    console.error(`[ERROR] ${context || 'Unknown Context'}:`, error);
  }
}

/**
 * Validation helper functions
 */
export const validators = {
  required: (value: any, fieldName: string): void => {
    if (value === undefined || value === null || value === '') {
      throw new ApplicationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        `${fieldName} is required`,
        { field: fieldName }
      );
    }
  },

  string: (value: any, fieldName: string, minLength?: number, maxLength?: number): void => {
    if (typeof value !== 'string') {
      throw new ApplicationError(
        ErrorCode.INVALID_INPUT,
        `${fieldName} must be a string`,
        { field: fieldName, type: 'string', received: typeof value }
      );
    }

    if (minLength !== undefined && value.length < minLength) {
      throw new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be at least ${minLength} characters`,
        { field: fieldName, minLength, currentLength: value.length }
      );
    }

    if (maxLength !== undefined && value.length > maxLength) {
      throw new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be no more than ${maxLength} characters`,
        { field: fieldName, maxLength, currentLength: value.length }
      );
    }
  },

  email: (value: string, fieldName: string = 'email'): void => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be a valid email address`,
        { field: fieldName, value }
      );
    }
  },

  uuid: (value: string, fieldName: string): void => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be a valid UUID`,
        { field: fieldName, value }
      );
    }
  },
};

/**
 * Wrapper for async functions to handle errors consistently
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof ApplicationError) {
        logError(error, fn.name);
        throw error;
      }

      const appError = new ApplicationError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      logError(appError, fn.name);
      throw appError;
    }
  };
}

/**
 * Retry mechanism for external API calls
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw new ApplicationError(
          ErrorCode.EXTERNAL_API_ERROR,
          `Operation failed after ${maxRetries} attempts: ${lastError.message}`,
          { attempts: maxRetries, lastError: lastError.message }
        );
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}
