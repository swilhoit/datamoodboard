type Key = string

// Simple in-memory token bucket per key (IP or user)
// For production, replace with Redis/Upstash.
export function createRateLimiter({ tokens, windowMs }: { tokens: number; windowMs: number }) {
  const buckets = new Map<Key, { tokens: number; resetAt: number }>()

  return {
    check: (key: Key) => {
      const now = Date.now()
      const bucket = buckets.get(key)
      if (!bucket || now > bucket.resetAt) {
        buckets.set(key, { tokens: tokens - 1, resetAt: now + windowMs })
        return { allowed: true, remaining: tokens - 1, resetAt: now + windowMs }
      }
      if (bucket.tokens <= 0) {
        return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
      }
      bucket.tokens -= 1
      return { allowed: true, remaining: bucket.tokens, resetAt: bucket.resetAt }
    }
  }
}


