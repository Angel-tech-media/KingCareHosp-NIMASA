import crypto from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import type { AuthUser, RoleType } from './types.js';

export const SESSION_COOKIE = 'kc_session';
const SESSION_TTL_DAYS = 7;

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

export function setSessionCookie(reply: FastifyReply, token: string): void {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  reply.header(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
  );
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.header(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export function createSession(db: DatabaseSync, userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).run(token, userId, createdAt, expiresAt);
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
      `SELECT u.id, u.full_name, u.email, u.role_title, u.portal_role, u.department, u.license_no, u.status, s.expires_at
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
      }
    | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now() || row.status === 'Suspended') {
    deleteSession(db, token);
    return null;
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
