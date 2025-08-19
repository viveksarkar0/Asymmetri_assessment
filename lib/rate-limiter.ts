/**
 * Rate Limiting Middleware
 * Implements various rate limiting strategies for API endpoints
 */

import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
  message?: string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const store = new Map<string, RateLimitRecord>();

/**
 * Default key generator based on IP address
 */
function defaultKeyGenerator(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip;
  return `rate_limit:${ip}`;
}

/**
 * Clean up expired records
 */
function cleanup(): void {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetTime < now) {
      store.delete(key);
    }
  }
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: defaultKeyGenerator,
      message: 'Too many requests, please try again later.',
      ...config,
    };
  }

  /**
   * Check if request should be rate limited
   */
  check(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    cleanup();

    const key = this.config.keyGenerator(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let record = store.get(key);

    // Create new record if doesn't exist or window expired
    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
    }

    const allowed = record.count < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - record.count - 1);

    if (allowed) {
      record.count++;
      store.set(key, record);
    }

    return {
      allowed,
      remaining,
      resetTime: record.resetTime,
    };
  }

  /**
   * Update count after request completion (for skip options)
   */
  updateCount(request: NextRequest, success: boolean): void {
    if (
      (success && this.config.skipSuccessfulRequests) ||
      (!success && this.config.skipFailedRequests)
    ) {
      const key = this.config.keyGenerator(request);
      const record = store.get(key);
      if (record) {
        record.count = Math.max(0, record.count - 1);
        store.set(key, record);
      }
    }
  }

  /**
   * Get rate limit headers
   */
  getHeaders(remaining: number, resetTime: number): Record<string, string> {
    return {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
      'X-RateLimit-Window': Math.ceil(this.config.windowMs / 1000).toString(),
    };
  }
}

/**
 * Predefined rate limiters for different use cases
 */

// General API rate limiter - 100 requests per minute
export const apiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

// Chat API rate limiter - 60 requests per minute
export const chatLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  message: 'Too many chat requests, please wait a moment.',
});

// Auth rate limiter - 10 attempts per 15 minutes
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many authentication attempts, please try again later.',
});

// External API rate limiter - 100 requests per hour
export const externalApiLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100,
  keyGenerator: (request: NextRequest) => {
    // Rate limit per user for external APIs
    const userId = request.headers.get('x-user-id') || defaultKeyGenerator(request);
    return `external_api:${userId}`;
  },
});

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(limiter: RateLimiter) {
  return async (request: NextRequest): Promise<Response | null> => {
    try {
      const { allowed, remaining, resetTime } = limiter.check(request);
      const headers = limiter.getHeaders(remaining, resetTime);

      if (!allowed) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'RATE_LIMITED',
              message: limiter['config'].message,
              retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
            },
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
              ...headers,
            },
          }
        );
      }

      // Add rate limit headers to successful requests
      return new Response(null, { headers });
    } catch (error) {
      console.error('Rate limiting error:', error);
      // If rate limiting fails, allow the request through
      return null;
    }
  };
}

/**
 * User-based rate limiter that uses user ID instead of IP
 */
export function createUserRateLimit(config: Omit<RateLimitConfig, 'keyGenerator'>) {
  return new RateLimiter({
    ...config,
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id');
      if (!userId) {
        return defaultKeyGenerator(request);
      }
      return `user_rate_limit:${userId}`;
    },
  });
}

/**
 * Sliding window rate limiter (more accurate but higher memory usage)
 */
export class SlidingWindowRateLimiter {
  private requests = new Map<string, number[]>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: defaultKeyGenerator,
      message: 'Too many requests, please try again later.',
      ...config,
    };
  }

  check(request: NextRequest): { allowed: boolean; remaining: number } {
    const key = this.config.keyGenerator!(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this key
    let requests = this.requests.get(key) || [];

    // Remove requests outside the current window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if under limit
    const allowed = requests.length < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - requests.length - (allowed ? 1 : 0));

    if (allowed) {
      requests.push(now);
      this.requests.set(key, requests);
    }

    return { allowed, remaining };
  }

  cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.config.windowMs;

    for (const [key, requests] of this.requests.entries()) {
      const filtered = requests.filter(timestamp => timestamp > cutoff);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

/**
 * Memory cleanup interval (run every 5 minutes)
 */
if (typeof window === 'undefined') {
  setInterval(() => {
    cleanup();
  }, 5 * 60 * 1000);
}
