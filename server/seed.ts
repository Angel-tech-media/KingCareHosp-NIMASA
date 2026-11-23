import { openDatabase, DB_PATH } from './db.js';
import { seedSampleClinicData, SAMPLE_DEFAULT_PASSWORD, SAMPLE_ACCOUNTS } from './seedData.js';

const db = openDatabase();
seedSampleClinicData(db);
db.close();

console.log(`Seeded SQLite database at: ${DB_PATH}`);
console.log(`Default password for all sample accounts: ${SAMPLE_DEFAULT_PASSWORD}`);
for (const acc of SAMPLE_ACCOUNTS) {
  console.log(`  - [${acc.portalRole}] ${acc.email} (${acc.fullName})`);
}
