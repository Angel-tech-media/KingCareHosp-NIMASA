import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getAuthenticatedUser,
  hashPassword,
  parseCookies,
  requireAuth,
  SESSION_COOKIE,
  setSessionCookie,
  verifyPassword,
} from '../auth.js';
import { appendAudit, formatNowTimestamp, getPracticeSettings } from '../db.js';
import {
  checkRateLimit,
  clearFailedLogins,
  getAccountLockoutSeconds,
  getClientIp,
  isDemoEndpointsEnabled,
  recordFailedLogin,
  strongPasswordSchema,
} from '../security.js';
import type { AuthUser, RoleType } from '../types.js';

const setupSchema = z.object({
  practiceName: z.string().trim().min(2, 'Practice name is required').max(160),
  address: z.string().trim().min(5, 'Practice address is required').max(260),
  certificateNo: z.string().trim().min(3, 'Recognition certificate number is required').max(64),
  stateFacilityRegNo: z.string().trim().min(3, 'State facility registration number is required').max(64),
  fullName: z.string().trim().min(2, 'Admin full name is required').max(120),
  email: z.string().trim().email('Valid official email is required').max(160),
  licenseNo: z.string().trim().max(64).optional(),
  password: strongPasswordSchema,
});

const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required').max(160),
  password: z.string().min(1, 'Password is required').max(128),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(128),
  newPassword: strongPasswordSchema,
});

export function registerAuthRoutes(app: FastifyInstance, db: DatabaseSync): void {
  app.get('/api/auth/status', async () => {
    const countRow = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    const practice = getPracticeSettings(db);
    return {
      initialized: countRow.count > 0,
      practice,
      demoToolsEnabled: isDemoEndpointsEnabled(),
    };
  });

  app.post('/api/auth/setup', async (req, reply) => {
    const countRow = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    if (countRow.count > 0) {
      return reply
        .code(409)
        .send({ error: 'Practice is already initialized. Please sign in with your account.' });
    }

    const parsed = setupSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid setup fields' });
    }

    const data = parsed.data;
    const nowTs = formatNowTimestamp();
    const userId = `usr-admin-${Date.now()}`;
    const emailLower = data.email.toLowerCase();
    const passwordHash = hashPassword(data.password);
    const mdDisplay = data.licenseNo ? `${data.fullName} (${data.licenseNo})` : data.fullName;

    db.exec('BEGIN;');
    try {
      db.prepare(
        `UPDATE practice_settings
         SET practice_name = ?, address = ?, certificate_no = ?, state_facility_reg_no = ?, medical_director = ?, updated_at = ?
         WHERE id = 1`
      ).run(
        data.practiceName,
        data.address,
        data.certificateNo,
        data.stateFacilityRegNo,
        mdDisplay,
        nowTs
      );

      db.prepare(
        `INSERT INTO users (
          id, full_name, email, password_hash, role_title, portal_role, department, license_no, status, last_login, created_at
        ) VALUES (?, ?, ?, ?, 'Medical Director & QSS Admin', 'ADMIN', 'Medical Administration & QSS', ?, 'Active', ?, ?)`
      ).run(userId, data.fullName, emailLower, passwordHash, data.licenseNo || null, nowTs, nowTs);

      appendAudit(
        db,
        data.fullName,
        'Medical Director & QSS Admin',
        'INITIAL_ADMIN_CREATED',
        data.certificateNo,
        `Initialized practice "${data.practiceName}" and created initial Administrator account (${emailLower}).`
      );

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    const token = createSession(db, userId);
    setSessionCookie(reply, token, req);

    const user: AuthUser = {
      id: userId,
      fullName: data.fullName,
      email: emailLower,
      roleTitle: 'Medical Director & QSS Admin',
      portalRole: 'ADMIN',
      department: 'Medical Administration & QSS',
      licenseNo: data.licenseNo || undefined,
      status: 'Active',
    };

    return { user };
  });

  app.post('/api/auth/login', async (req, reply) => {
    const ipRl = checkRateLimit(`login:${getClientIp(req)}`, 15, 15 * 60_000);
    if (!ipRl.allowed) {
      reply.header('Retry-After', String(ipRl.retryAfterSeconds));
      return reply
        .code(429)
        .send({ error: 'Too many sign-in attempts from this network. Please wait before trying again.' });
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid credentials' });
    }

    const emailLower = parsed.data.email.toLowerCase();
    const lockoutSec = getAccountLockoutSeconds(emailLower);
    if (lockoutSec > 0) {
      reply.header('Retry-After', String(lockoutSec));
      return reply
        .code(429)
        .send({ error: 'Too many failed sign-in attempts. Please wait before trying again.' });
    }

    const row = db
      .prepare('SELECT * FROM users WHERE lower(email) = ?')
      .get(emailLower) as
      | {
          id: string;
          full_name: string;
          email: string;
          password_hash: string;
          role_title: string;
          portal_role: RoleType;
          department: string;
          license_no: string | null;
          status: 'Active' | 'On Leave' | 'Suspended';
        }
      | undefined;

    if (!row || !verifyPassword(parsed.data.password, row.password_hash)) {
      const fail = recordFailedLogin(emailLower);
      if (fail.locked) {
        appendAudit(
          db,
          'System Security',
          'Auth Guard',
          'LOGIN_LOCKOUT',
          emailLower,
          'Account temporarily locked after repeated failed sign-in attempts.'
        );
        reply.header('Retry-After', String(fail.retryAfterSeconds));
        return reply
          .code(429)
          .send({ error: 'Too many failed sign-in attempts. Please wait before trying again.' });
      }
      return reply.code(401).send({ error: 'Invalid official email or password.' });
    }

    if (row.status === 'Suspended') {
      return reply
        .code(403)
        .send({ error: 'This account has been suspended. Contact the Medical Director.' });
    }

    clearFailedLogins(emailLower);

    const nowTs = formatNowTimestamp();
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(nowTs, row.id);
    appendAudit(
      db,
      row.full_name,
      row.role_title,
      'USER_LOGIN',
      row.portal_role,
      `Signed in to ${row.portal_role} workspace (${row.email}).`
    );

    const token = createSession(db, row.id);
    setSessionCookie(reply, token, req);

    const user: AuthUser = {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      roleTitle: row.role_title,
      portalRole: row.portal_role,
      department: row.department,
      licenseNo: row.license_no || undefined,
      status: row.status,
    };

    return { user };
  });

  app.post('/api/auth/logout', async (req, reply) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    if (token) {
      deleteSession(db, token);
    }
    clearSessionCookie(reply, req);
    return { ok: true };
  });

  app.post('/api/auth/change-password', async (req, reply) => {
    const rl = checkRateLimit(`chpw:${getClientIp(req)}`, 10, 15 * 60_000);
    if (!rl.allowed) {
      reply.header('Retry-After', String(rl.retryAfterSeconds));
      return reply
        .code(429)
        .send({ error: 'Too many password change attempts. Please wait before trying again.' });
    }

    const authUser = requireAuth(db, req, reply);
    if (!authUser) return;

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid password payload' });
    }

    const row = db
      .prepare('SELECT password_hash FROM users WHERE id = ?')
      .get(authUser.id) as { password_hash: string } | undefined;
    if (!row || !verifyPassword(parsed.data.currentPassword, row.password_hash)) {
      return reply.code(401).send({ error: 'Current password is incorrect.' });
    }

    if (parsed.data.newPassword === parsed.data.currentPassword) {
      return reply
        .code(400)
        .send({ error: 'New password must be different from your current password.' });
    }

    const newHash = hashPassword(parsed.data.newPassword);
    db.exec('BEGIN;');
    try {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, authUser.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(authUser.id);
      appendAudit(
        db,
        authUser.fullName,
        authUser.roleTitle,
        'USER_PASSWORD_CHANGED',
        authUser.portalRole,
        `Changed account password for ${authUser.email} and invalidated prior sessions.`
      );
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    clearFailedLogins(authUser.email.toLowerCase());
    const newToken = createSession(db, authUser.id);
    setSessionCookie(reply, newToken, req);
    return { ok: true };
  });

  app.get('/api/auth/me', async (req, reply) => {
    const user = getAuthenticatedUser(db, req);
    if (!user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }
    return { user };
  });
}
