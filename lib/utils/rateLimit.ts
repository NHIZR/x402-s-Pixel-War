/**
 * In-memory rate limiting utility for API endpoints
 * Tracks request timestamps per identifier (e.g., wallet address)
 */

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a request is allowed based on rate limiting rules
 *
 * @param identifier - Unique identifier (e.g., wallet address)
 * @param maxRequests - Maximum number of requests allowed in the time window (default: 1)
 * @param windowMs - Time window in milliseconds (default: 24 hours)
 * @returns Object with allowed status and reset timestamp if rate limited
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 1,
  windowMs: number = 24 * 60 * 60 * 1000 // 24 hours
): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(identifier);

  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(identifier, entry);
  }

  // Filter out timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

  // Check if limit is exceeded
  if (entry.timestamps.length >= maxRequests) {
    // Calculate when the oldest request will expire
    const oldestTimestamp = entry.timestamps[0];
    const resetAt = oldestTimestamp + windowMs;

    return {
      allowed: false,
      resetAt,
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return { allowed: true };
}

/**
 * Clear the rate limit store (useful for testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Get the current state of rate limiting for an identifier (useful for debugging)
 */
export function getRateLimitState(identifier: string): RateLimitEntry | undefined {
  return rateLimitStore.get(identifier);
}
