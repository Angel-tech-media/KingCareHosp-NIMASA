import path from 'node:path';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDemoEndpointsEnabled(): boolean {
  return !isProductionEnv() && process.env.DISABLE_DEMO_ENDPOINTS !== 'true';
}

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine(
    (p) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p),
    'Password must include uppercase, lowercase, and a number'
  );

// In-memory sliding-window rate limiter & per-email login failure lockout
const rateLimitBuckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const existing = rateLimitBuckets.get(key) || [];
  const active = existing.filter((ts) => ts > cutoff);

  if (active.length >= maxRequests) {
    const oldest = active[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateLimitBuckets.set(key, active);
    return { allowed: false, retryAfterSeconds };
  }

  active.push(now);
  rateLimitBuckets.set(key, active);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(req: FastifyRequest): string {
  if (process.env.TRUST_PROXY === 'true') {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim().length > 0) {
      return xff.split(',')[0].trim();
    }
  }
  return req.ip || 'unknown';
}

export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

const loginFailures = new Map<string, { count: number; lockedUntil: number }>();

export function getAccountLockoutSeconds(emailLower: string): number {
  const record = loginFailures.get(emailLower);
  if (!record) return 0;
  const now = Date.now();
  if (record.lockedUntil > now) {
    return Math.max(1, Math.ceil((record.lockedUntil - now) / 1000));
  }
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    loginFailures.delete(emailLower);
  }
  return 0;
}

export function recordFailedLogin(emailLower: string): {
  locked: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const existing = loginFailures.get(emailLower);
  if (existing && existing.lockedUntil > now) {
    return {
      locked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.lockedUntil - now) / 1000)),
    };
  }

  const nextCount = (existing && existing.lockedUntil === 0 ? existing.count : 0) + 1;
  if (nextCount >= LOGIN_MAX_FAILURES) {
    const lockedUntil = now + LOGIN_LOCKOUT_MS;
    loginFailures.set(emailLower, { count: nextCount, lockedUntil });
    return {
      locked: true,
      retryAfterSeconds: Math.ceil(LOGIN_LOCKOUT_MS / 1000),
    };
  }

  loginFailures.set(emailLower, { count: nextCount, lockedUntil: 0 });
  return { locked: false, retryAfterSeconds: 0 };
}

export function clearFailedLogins(emailLower: string): void {
  loginFailures.delete(emailLower);
}

export function resetSecurityState(): void {
  rateLimitBuckets.clear();
  loginFailures.clear();
}

export type AllowedUploadMime =
  | 'application/pdf'
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp';

export function verifyUploadedFileMagicBytes(
  buffer: Buffer,
  mimeType: AllowedUploadMime
): boolean {
  if (mimeType === 'application/pdf') {
    return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  if (mimeType === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  return false;
}

export function isPathInsideDir(targetPath: string, baseDir: string): boolean {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  const baseWithSep = resolvedBase.endsWith(path.sep) ? resolvedBase : `${resolvedBase}${path.sep}`;

  if (process.platform === 'win32') {
    return resolvedTarget.toLowerCase().startsWith(baseWithSep.toLowerCase());
  }
  return resolvedTarget.startsWith(baseWithSep);
}

function isPrivateLanHost5173(host: string): boolean {
  const idx = host.lastIndexOf(':');
  if (idx === -1) return false;
  const hostname = host.slice(0, idx);
  const port = host.slice(idx + 1);
  if (port !== '5173') return false;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  const parts = hostname.split('.');
  if (parts.length !== 4) return false;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;

  if (nums[0] === 10) return true;
  if (nums[0] === 192 && nums[1] === 168) return true;
  if (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) return true;
  return false;
}

function isOriginAllowed(req: FastifyRequest, originHeader: string): boolean {
  let originUrl: URL;
  try {
    originUrl = new URL(originHeader);
  } catch {
    return false;
  }

  const rawHostHeader = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  const expectedHost = rawHostHeader.split(',')[0].trim().toLowerCase();
  const originHost = originUrl.host.toLowerCase();

  if (expectedHost && originHost === expectedHost) {
    return true;
  }

  const allowedCsv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowedCsv.includes(originUrl.origin.toLowerCase())) {
    return true;
  }

  if (!isProductionEnv() && isPrivateLanHost5173(originHost)) {
    return true;
  }

  return false;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function registerSecurityHooks(app: FastifyInstance): void {
  app.addHook('onRequest', async (req, reply) => {
    if (req.url.startsWith('/api/')) {
      const ip = getClientIp(req);
      const rl = checkRateLimit(`api:${ip}`, 240, 60_000);
      if (!rl.allowed) {
        reply.header('Retry-After', String(rl.retryAfterSeconds));
        return reply
          .code(429)
          .send({ error: 'Too many requests. Please wait a moment before trying again.' });
      }
    }

    if (MUTATING_METHODS.has(req.method.toUpperCase())) {
      const secFetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
      if (secFetchSite === 'cross-site') {
        return reply.code(403).send({ error: 'Cross-site request blocked.' });
      }

      const originHeader = req.headers.origin;
      if (typeof originHeader === 'string' && originHeader.trim().length > 0) {
        if (!isOriginAllowed(req, originHeader.trim())) {
          return reply.code(403).send({ error: 'Cross-origin request blocked.' });
        }
      }
    }
  });

  app.addHook('onSend', async (req, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    reply.header('Cross-Origin-Opener-Policy', 'same-origin');
    reply.header('Cross-Origin-Resource-Policy', 'same-origin');

    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
    if (isProductionEnv() || forwardedProto === 'https') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    if (req.url.startsWith('/api/') && !reply.getHeader('Cache-Control')) {
      reply.header('Cache-Control', 'no-store, no-cache, must-revalidate');
      reply.header('Pragma', 'no-cache');
    }
    if (req.url.startsWith('/api/') && !reply.getHeader('Content-Security-Policy')) {
      reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    }

    return payload;
  });
}
