import * as crypto from 'crypto';

/**
 * URL-safe random tokens used for share links and referral codes.
 * Uses crypto.randomBytes (CSPRNG) — collision probability is negligible.
 *
 * Alphabet excludes lookalikes (0/O, 1/l/I) to prevent users mistyping a
 * URL they read off a screenshot.
 */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';

function fromBytes(len: number): string {
  // Generate slightly more bytes than chars to get good distribution after mod
  const bytes = crypto.randomBytes(len * 2);
  let out = '';
  for (let i = 0; i < bytes.length && out.length < len; i++) {
    const idx = bytes[i] % ALPHABET.length;
    out += ALPHABET[idx];
  }
  return out;
}

/** Prefixed share token, e.g. 'r_aBc23xyz789Q' for roasts. */
export function generateShareToken(prefix: 'r' | 'q' | 'p', length = 12): string {
  return `${prefix}_${fromBytes(length)}`;
}

/** 6-char referral code, e.g. 'X7HJ4K'. Short enough to fit in a tweet. */
export function generateReferralCode(): string {
  // Use only uppercase for referral codes — easier to read aloud / type
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(12);
  let out = '';
  for (let i = 0; i < bytes.length && out.length < 6; i++) {
    out += upper[bytes[i] % upper.length];
  }
  return out;
}

/**
 * SHA-256 hash of an IP address — used for anti-abuse rate tracking without
 * storing the raw IP. Salted with JWT_SECRET so an attacker with DB access
 * can't easily rainbow-table the hashes back to IPs.
 */
export function hashIp(ip: string): string {
  const salt = process.env.JWT_SECRET || 'dev-salt';
  return crypto.createHash('sha256').update(salt + ':' + ip).digest('hex');
}

/** Extract client IP respecting Render/Vercel proxy headers (matches AppModule pattern). */
export function clientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  return (ip?.trim() || req.ip || '0.0.0.0') as string;
}
