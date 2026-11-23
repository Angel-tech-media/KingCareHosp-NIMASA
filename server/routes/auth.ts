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
  SESSION_COOKIE,
  setSessionCookie,
  verifyPassword,
} from '../auth.js';
import { appendAudit, formatNowTimestamp, getPracticeSettings } from '../db.js';
import type { AuthUser, RoleType } from '../types.js';

const setupSchema = z.object({
  practiceName: z.string().trim().min(2, 'Practice name is required'),
  address: z.string().trim().min(5, 'Practice address is required'),
  certificateNo: z.string().trim().min(3, 'Recognition certificate number is required'),
  stateFacilityRegNo: z.string().trim().min(3, 'State facility registration number is required'),
  fullName: z.string().trim().min(2, 'Admin full name is required'),
  email: z.string().trim().email('Valid official email is required'),
  licenseNo: z.string().trim().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export function registerAuthRoutes(app: FastifyInstance, db: DatabaseSync): void {
  app.get('/api/auth/status', async () => {
    const countRow = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    const practice = getPracticeSettings(db);
    return {
      initialized: countRow.count > 0,
      userCount: countRow.count,
      practice,
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
    setSessionCookie(reply, token);

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
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid credentials' });
    }

    const emailLower = parsed.data.email.toLowerCase();
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
      return reply.code(401).send({ error: 'Invalid official email or password.' });
    }

    if (row.status === 'Suspended') {
      return reply
        .code(403)
        .send({ error: 'This account has been suspended. Contact the Medical Director.' });
    }

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
    setSessionCookie(reply, token);

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
    clearSessionCookie(reply);
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
