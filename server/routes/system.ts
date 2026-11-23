import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { clearSessionCookie, getAuthenticatedUser, requireAuth } from '../auth.js';
import { getFullBootstrap } from '../db.js';
import { resetToCleanDb, SAMPLE_ACCOUNTS, SAMPLE_DEFAULT_PASSWORD, seedSampleClinicData } from '../seedData.js';

export function registerSystemRoutes(app: FastifyInstance, db: DatabaseSync): void {
  app.get('/api/bootstrap', async (req, reply) => {
    const user = requireAuth(db, req, reply);
    if (!user) return;
    return getFullBootstrap(db, user);
  });

  app.post('/api/system/seed', async (req, reply) => {
    const countRow = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    if (countRow.count > 0) {
      const user = requireAuth(db, req, reply, ['ADMIN']);
      if (!user) return;
    }

    seedSampleClinicData(db);
    // Old sessions were cleared inside seedSampleClinicData -> clear browser cookie cleanly
    const existing = getAuthenticatedUser(db, req);
    if (!existing) {
      clearSessionCookie(reply);
    }

    return {
      ok: true,
      defaultPassword: SAMPLE_DEFAULT_PASSWORD,
      accounts: SAMPLE_ACCOUNTS.map((a) => ({
        email: a.email,
        fullName: a.fullName,
        portalRole: a.portalRole,
      })),
    };
  });

  app.post('/api/system/reset', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN']);
    if (!user) return;

    resetToCleanDb(db);
    clearSessionCookie(reply);
    return { ok: true };
  });
}
