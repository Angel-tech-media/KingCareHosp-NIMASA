import Fastify from 'fastify';
import { DB_PATH, openDatabase, UPLOADS_DIR } from './db.js';
import { registerSecurityHooks, isProductionEnv } from './security.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerSystemRoutes } from './routes/system.js';
import { registerMasterFileRoutes } from './routes/masterFile.js';
import { registerUserRoutes } from './routes/users.js';
import { registerStockAndVerificationRoutes } from './routes/stock.js';
import { registerPatientRoutes } from './routes/patients.js';

export interface CreateAppOptions {
  dbPath?: string;
  uploadsDir?: string;
}

export function createApp(options: CreateAppOptions = {}) {
  const dbPath = options.dbPath ?? DB_PATH;
  const uploadsDir = options.uploadsDir ?? UPLOADS_DIR;

  const db = openDatabase(dbPath);
  const app = Fastify({ logger: false, bodyLimit: 16 * 1024 * 1024 });

  registerSecurityHooks(app);

  app.get('/api/health', async () => ({
    status: 'ok',
  }));

  registerAuthRoutes(app, db);
  registerSystemRoutes(app, db);
  registerMasterFileRoutes(app, db);
  registerUserRoutes(app, db);
  registerStockAndVerificationRoutes(app, db);
  registerPatientRoutes(app, db, uploadsDir);

  app.setErrorHandler((err, _req, reply) => {
    const statusCode =
      typeof (err as { statusCode?: number }).statusCode === 'number' &&
      (err as { statusCode: number }).statusCode >= 400 &&
      (err as { statusCode: number }).statusCode < 500
        ? (err as { statusCode: number }).statusCode
        : 500;

    console.error('[API Error]', err);

    if (statusCode < 500) {
      return reply.code(statusCode).send({
        error: err instanceof Error ? err.message : 'Bad request',
      });
    }

    return reply.code(500).send({
      error: isProductionEnv()
        ? 'Internal server error'
        : err instanceof Error
        ? err.message
        : 'Internal server error',
    });
  });

  return { app, db };
}
