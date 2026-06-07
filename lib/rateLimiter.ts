/**
 * Simple in-memory rate limiter for alpha.
 * Tracks requests per IP address with a rolling window.
 * Not distributed — works for single-server deployments.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const requestCounts = new Map<string, RateLimitEntry>();

// 10 requests per IP per 10 minutes
const MAX_REQUESTS_PER_WINDOW = 10;
const WINDOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export function getClientIP(req: Request): string {
  // Try to extract IP from headers (Vercel, Cloudflare, etc.)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const cloudflare = req.headers.get('cf-connecting-ip');
  if (cloudflare) {
    return cloudflare;
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetTime) {
    // New window
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_DURATION_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count };
}

// Cleanup old entries periodically (called on startup and every hour)
export function cleanupStaleEntries() {
  const now = Date.now();
  for (const [ip, entry] of requestCounts.entries()) {
    if (now > entry.resetTime) {
      requestCounts.delete(ip);
    }
  }
}

// Run cleanup on module load
cleanupStaleEntries();
// Cleanup every hour
setInterval(cleanupStaleEntries, 60 * 60 * 1000);
