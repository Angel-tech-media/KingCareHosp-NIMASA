import crypto from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import type { AuthUser, RoleType } from './types.js';
import { isProductionEnv } from './security.js';

export const SESSION_COOKIE = 'kc_session';
const SESSION_TTL_HOURS = Math.max(1, Number(process.env.SESSION_TTL_HOURS || 12) || 12);
const SESSION_IDLE_MINUTES = Math.max(5, Number(process.env.SESSION_IDLE_MINUTES || 60) || 60);

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      result[key] = decodeURIComponent(val);
    }
  }
  return result;
}

export function setSessionCookie(
  reply: FastifyReply,
  token: string,
  req?: FastifyRequest
): void {
  const maxAge = SESSION_TTL_HOURS * 3600;
  const forwardedProto = String(req?.headers['x-forwarded-proto'] || '').toLowerCase();
  const secure = isProductionEnv() || forwardedProto === 'https';
  reply.header(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
  );
}

export function clearSessionCookie(reply: FastifyReply, req?: FastifyRequest): void {
  const forwardedProto = String(req?.headers['x-forwarded-proto'] || '').toLowerCase();
  const secure = isProductionEnv() || forwardedProto === 'https';
  reply.header(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`
  );
}

export function createSession(db: DatabaseSync, userId: string): string {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowIso);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(nowMs + SESSION_TTL_HOURS * 3600 * 1000).toISOString();
  db.prepare(
    'INSERT INTO sessions (token, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)'
  ).run(token, userId, nowIso, expiresAt, nowIso);
  return token;
}

export function deleteSession(db: DatabaseSync, token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function getAuthenticatedUser(db: DatabaseSync, req: FastifyRequest): AuthUser | null {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.role_title, u.portal_role, u.department, u.license_no, u.status,
              s.expires_at, s.created_at, s.last_seen_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as
    | {
        id: string;
        full_name: string;
        email: string;
        role_title: string;
        portal_role: RoleType;
        department: string;
        license_no: string | null;
        status: 'Active' | 'On Leave' | 'Suspended';
        expires_at: string;
        created_at: string;
        last_seen_at: string | null;
      }
    | undefined;

  if (!row) return null;
  const nowMs = Date.now();
  const expiresMs = new Date(row.expires_at).getTime();
  const lastSeenMs = new Date(row.last_seen_at || row.created_at).getTime();

  if (
    Number.isNaN(expiresMs) ||
    expiresMs < nowMs ||
    Number.isNaN(lastSeenMs) ||
    nowMs - lastSeenMs > SESSION_IDLE_MINUTES * 60 * 1000 ||
    row.status !== 'Active'
  ) {
    deleteSession(db, token);
    return null;
  }

  if (nowMs - lastSeenMs > 60_000) {
    db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token = ?').run(
      new Date(nowMs).toISOString(),
      token
    );
  }

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    roleTitle: row.role_title,
    portalRole: row.portal_role,
    department: row.department,
    licenseNo: row.license_no || undefined,
    status: row.status,
  };
}

export function requireAuth(
  db: DatabaseSync,
  req: FastifyRequest,
  reply: FastifyReply,
  allowedRoles?: RoleType[]
): AuthUser | null {
  const user = getAuthenticatedUser(db, req);
  if (!user) {
    reply.code(401).send({ error: 'Authentication required. Please sign in.' });
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(user.portalRole)) {
    reply.code(403).send({
      error: `Access denied. ${user.portalRole} role cannot perform this action.`,
    });
    return null;
  }
  return user;
}
