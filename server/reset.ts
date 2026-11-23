import { openDatabase, DB_PATH } from './db.js';
import { resetToCleanDb } from './seedData.js';

const db = openDatabase();
resetToCleanDb(db);
db.close();

console.log(`Reset SQLite database to clean empty setup state at: ${DB_PATH}`);
