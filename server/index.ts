import { createApp } from './app.js';
import { DB_PATH } from './db.js';

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';

const { app } = createApp();

app.listen({ port: PORT, host: HOST }).then(() => {
  console.log(`[Kingscare API] Listening on http://127.0.0.1:${PORT}`);
  console.log(`[Kingscare SQLite] Database file: ${DB_PATH}`);
});
