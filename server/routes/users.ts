import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { hashPassword, requireAuth } from '../auth.js';
import { appendAudit, formatNowTimestamp } from '../db.js';

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().email('Valid email address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  portalRole: z.enum(['ADMIN', 'FRONT_DESK', 'DOCTOR', 'LAB', 'RADIOLOGY', 'ENT', 'EYE', 'NIMASA']),
  roleTitle: z.string().trim().min(2, 'System role title is required'),
  department: z.string().trim().min(2, 'Department or organization is required'),
  licenseNo: z.string().trim().optional(),
});

const statusSchema = z.object({
  status: z.enum(['Active', 'On Leave', 'Suspended']),
});

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export function registerUserRoutes(app: FastifyInstance, db: DatabaseSync): void {
  app.post('/api/users', async (req, reply) => {
    const admin = requireAuth(db, req, reply, ['ADMIN']);
    if (!admin) return;

    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid user data' });
    }
    const d = parsed.data;
    const emailLower = d.email.toLowerCase();

    const dup = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(emailLower);
    if (dup) {
      return reply.code(409).send({ error: `An account with email ${emailLower} already exists.` });
    }

    const userId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const nowTs = formatNowTimestamp();
    const passwordHash = hashPassword(d.password);

    db.prepare(
      `INSERT INTO users (
        id, full_name, email, password_hash, role_title, portal_role, department, license_no, status, last_login, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', 'Never', ?)`
    ).run(
      userId,
      d.fullName,
      emailLower,
      passwordHash,
      d.roleTitle,
      d.portalRole,
      d.department,
      d.licenseNo || null,
      nowTs
    );

    appendAudit(
      db,
      admin.fullName,
      admin.roleTitle,
      'USER_CREATED',
      d.portalRole,
      `Created individual account for ${d.fullName} (${emailLower}) with ${d.portalRole} role.`
    );

    return { ok: true, id: userId };
  });

  app.patch('/api/users/:id/status', async (req, reply) => {
    const admin = requireAuth(db, req, reply, ['ADMIN']);
    if (!admin) return;
    const { id } = req.params as { id: string };

    if (id === admin.id) {
      return reply.code(400).send({ error: 'You cannot suspend or alter your own active session status.' });
    }

    const target = db.prepare('SELECT full_name, email FROM users WHERE id = ?').get(id) as
      | { full_name: string; email: string }
      | undefined;
    if (!target) return reply.code(404).send({ error: 'User not found.' });

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid status' });
    }

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(parsed.data.status, id);
    if (parsed.data.status === 'Suspended') {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
    }

    appendAudit(
      db,
      admin.fullName,
      admin.roleTitle,
      'USER_STATUS_UPDATED',
      target.email,
      `Updated account status for ${target.full_name} to ${parsed.data.status}.`
    );

    return { ok: true };
  });

  app.patch('/api/users/:id/password', async (req, reply) => {
    const admin = requireAuth(db, req, reply, ['ADMIN']);
    if (!admin) return;
    const { id } = req.params as { id: string };

    const target = db.prepare('SELECT full_name, email FROM users WHERE id = ?').get(id) as
      | { full_name: string; email: string }
      | undefined;
    if (!target) return reply.code(404).send({ error: 'User not found.' });

    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid password' });
    }

    const newHash = hashPassword(parsed.data.password);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);

    appendAudit(
      db,
      admin.fullName,
      admin.roleTitle,
      'USER_PASSWORD_RESET',
      target.email,
      `Reset password and invalidated active sessions for ${target.full_name}.`
    );

    return { ok: true };
  });
}
