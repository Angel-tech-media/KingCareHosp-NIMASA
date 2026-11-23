import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { appendAudit, formatNowTimestamp, getPatientById } from '../db.js';
import type { VerificationEnquiry } from '../types.js';

const batchSchema = z.object({
  prefix: z.string().trim().min(2).default('NIM-MC-2026-'),
  startNumber: z.coerce.number().int().min(1).max(999999),
  count: z.coerce.number().int().min(1).max(100),
  assignedTo: z.string().trim().optional(),
});

const assignSchema = z.object({
  assignedTo: z.string().trim().min(2, 'RMP practitioner name is required'),
});

const spoilSchema = z.object({
  reason: z.string().trim().min(2, 'Spoilage reason is required'),
});

const verifySchema = z.object({
  certificateNo: z.string().trim().min(2, 'Certificate serial number is required'),
  enquirer: z.string().trim().optional(),
});

export function registerStockAndVerificationRoutes(
  app: FastifyInstance,
  db: DatabaseSync
): void {
  app.post('/api/stock/batch', async (req, reply) => {
    const admin = requireAuth(db, req, reply, ['ADMIN']);
    if (!admin) return;

    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid stock batch' });
    }
    const { prefix, startNumber, count, assignedTo } = parsed.data;
    const nowTs = formatNowTimestamp();
    const status = assignedTo ? 'Issued to RMP' : 'In Cabinet';

    let insertedCount = 0;
    const insertStmt = db.prepare(
      `INSERT OR IGNORE INTO certificate_stock (serial_no, status, assigned_to, updated_at)
       VALUES (?, ?, ?, ?)`
    );

    db.exec('BEGIN;');
    try {
      for (let i = 0; i < count; i++) {
        const num = String(startNumber + i).padStart(4, '0');
        const serialNo = `${prefix}${num}`.toUpperCase();
        const res = insertStmt.run(serialNo, status, assignedTo || null, nowTs);
        if (res.changes > 0) insertedCount += 1;
      }

      if (insertedCount === 0) {
        db.exec('ROLLBACK;');
        return reply
          .code(409)
          .send({ error: 'All serial numbers in that range already exist in stock.' });
      }

      const firstSerial = `${prefix}${String(startNumber).padStart(4, '0')}`.toUpperCase();
      const lastSerial = `${prefix}${String(startNumber + count - 1).padStart(4, '0')}`.toUpperCase();
      appendAudit(
        db,
        admin.fullName,
        admin.roleTitle,
        'STOCK_BATCH_RECEIVED',
        firstSerial,
        `Logged ${insertedCount} QAF-805-01 blank(s) (${firstSerial} to ${lastSerial}) · Status: ${status}${assignedTo ? ` (${assignedTo})` : ''}.`
      );
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return { ok: true, insertedCount };
  });

  app.patch('/api/stock/:serialNo/assign', async (req, reply) => {
    const admin = requireAuth(db, req, reply, ['ADMIN']);
    if (!admin) return;
    const { serialNo } = req.params as { serialNo: string };

    const parsed = assignSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid assignment' });
    }

    const row = db
      .prepare('SELECT status FROM certificate_stock WHERE serial_no = ?')
      .get(serialNo) as { status: string } | undefined;
    if (!row) return reply.code(404).send({ error: 'Serial number not found in stock.' });
    if (row.status !== 'In Cabinet' && row.status !== 'Issued to RMP') {
      return reply
        .code(400)
        .send({ error: `Cannot assign serial ${serialNo} because it is ${row.status}.` });
    }

    const nowTs = formatNowTimestamp();
    db.prepare(
      `UPDATE certificate_stock SET status = 'Issued to RMP', assigned_to = ?, updated_at = ? WHERE serial_no = ?`
    ).run(parsed.data.assignedTo, nowTs, serialNo);

    appendAudit(
      db,
      admin.fullName,
      admin.roleTitle,
      'STOCK_ASSIGNED',
      serialNo,
      `Assigned blank certificate ${serialNo} from locked cabinet to ${parsed.data.assignedTo}.`
    );

    return { ok: true };
  });

  app.patch('/api/stock/:serialNo/spoil', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN', 'DOCTOR']);
    if (!user) return;
    const { serialNo } = req.params as { serialNo: string };

    const parsed = spoilSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Spoilage reason required' });
    }

    const row = db
      .prepare('SELECT status FROM certificate_stock WHERE serial_no = ?')
      .get(serialNo) as { status: string } | undefined;
    if (!row) return reply.code(404).send({ error: 'Serial number not found in stock.' });
    if (row.status === 'Used' || row.status === 'Spoiled') {
      return reply.code(400).send({ error: `Serial ${serialNo} is already marked ${row.status}.` });
    }

    const nowTs = formatNowTimestamp();
    db.prepare(
      `UPDATE certificate_stock SET status = 'Spoiled', updated_at = ?, note = ? WHERE serial_no = ?`
    ).run(nowTs, parsed.data.reason, serialNo);

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'BLANK_SPOILED',
      serialNo,
      `Serial ${serialNo} marked SPOILED and retained for audit: ${parsed.data.reason}`
    );

    return { ok: true };
  });

  app.post('/api/verifications', async (req, reply) => {
    const user = requireAuth(db, req, reply);
    if (!user) return;

    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Certificate serial required' });
    }

    const cleanNo = parsed.data.certificateNo.toUpperCase();
    const enquirer = parsed.data.enquirer?.trim() || 'NIMASA / Port State Control Officer';

    // Find matching patient certificate (zero clinical data returned)
    const patientIds = db.prepare('SELECT id FROM patients').all() as { id: string }[];
    let matchedName = '';
    let matchedCert: NonNullable<ReturnType<typeof getPatientById>>['rmp'] extends infer R
      ? R extends { issuedCertificate?: infer C }
        ? C
        : undefined
      : undefined;

    for (const row of patientIds) {
      const patient = getPatientById(db, row.id);
      const cert = patient?.rmp?.issuedCertificate;
      if (cert && cert.certificateNo.toUpperCase() === cleanNo) {
        matchedName = patient.fullName;
        matchedCert = cert;
        break;
      }
    }

    const nowTs = formatNowTimestamp();
    const enquiry: VerificationEnquiry = {
      id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: nowTs,
      enquirer,
      certificateNo: cleanNo,
      result: matchedCert ? 'Issued' : 'No record',
      outcomeSummary: matchedCert
        ? `Genuine · ${matchedName} · ${matchedCert.determination}${
            matchedCert.limitation ? ` (${matchedCert.limitation})` : ''
          } · Lookout: ${matchedCert.fitForLookout ? 'Yes' : 'No'} · Expires ${
            matchedCert.expiryDate
          } · Supplement ${matchedCert.supplementNo} issued (No clinical data disclosed)`
        : 'No record of this certificate serial number issued by this practice. Flagged for RQP-204 §7.2 verification.',
    };

    db.prepare(
      `INSERT INTO verification_enquiries (id, timestamp, enquirer, certificate_no, result, outcome_summary)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      enquiry.id,
      enquiry.timestamp,
      enquiry.enquirer,
      enquiry.certificateNo,
      enquiry.result,
      enquiry.outcomeSummary
    );

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'CERTIFICATE_VERIFICATION',
      cleanNo,
      `Verification enquiry by ${enquiry.enquirer}: ${enquiry.result}. No clinical info disclosed (QA-P-808).`
    );

    return { enquiry };
  });
}
