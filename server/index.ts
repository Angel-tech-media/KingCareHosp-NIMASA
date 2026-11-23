import Fastify from 'fastify';
import { openDatabase, DB_PATH } from './db.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerSystemRoutes } from './routes/system.js';
import { registerMasterFileRoutes } from './routes/masterFile.js';
import { registerUserRoutes } from './routes/users.js';
import { registerStockAndVerificationRoutes } from './routes/stock.js';
import { registerPatientRoutes } from './routes/patients.js';

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';

const db = openDatabase();
const app = Fastify({ logger: false });

app.get('/api/health', async () => ({
  status: 'ok',
  dbPath: DB_PATH,
}));

registerAuthRoutes(app, db);
registerSystemRoutes(app, db);
registerMasterFileRoutes(app, db);
registerUserRoutes(app, db);
registerStockAndVerificationRoutes(app, db);
registerPatientRoutes(app, db);

app.setErrorHandler((err, _req, reply) => {
  console.error('[API Error]', err);
  reply.code(500).send({
    error: err instanceof Error ? err.message : 'Internal server error',
  });
});

app.listen({ port: PORT, host: HOST }).then(() => {
  console.log(`[Kingscare API] Listening on http://127.0.0.1:${PORT}`);
  console.log(`[Kingscare SQLite] Database file: ${DB_PATH}`);
});
