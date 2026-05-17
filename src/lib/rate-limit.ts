/**
 * Tiny in-memory token bucket for auth/payment endpoints.
 * Per-process — fine for v1 single-region deployments. Replace with Cloudflare KV
 * or Upstash Redis once we scale to multiple workers.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: max - 1, resetAt: fresh.resetAt };
  }
  b.count += 1;
  if (b.count > max) return { ok: false, remaining: 0, resetAt: b.resetAt };
  return { ok: true, remaining: max - b.count, resetAt: b.resetAt };
}

export function rlKey(prefix: string, id: string) {
  return `${prefix}:${id}`;
}
