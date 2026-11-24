import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { appendAudit, formatNowTimestamp } from '../db.js';

const practiceSchema = z.object({
  practiceName: z.string().trim().min(2),
  address: z.string().trim().min(4),
  certificateNo: z.string().trim().min(3),
  status: z.string().trim().min(2),
  recognizedFrom: z.string().trim().min(2),
  expiresOn: z.string().trim().min(2),
  renewalCheckDue: z.string().trim().min(2),
  engagementSigned: z.string().trim().min(2),
  returnFrequency: z.string().trim().min(2),
  stateFacilityRegNo: z.string().trim().min(2),
  medicalDirector: z.string().trim().min(2),
});

const departmentUpdateSchema = z.object({
  floorLocation: z.string().trim().min(2),
  description: z.string().trim().min(4),
  hodName: z.string().trim().min(2),
  hodTitle: z.string().trim().min(2),
  hodQualifications: z.string().trim().min(2),
  hodFellowship: z.string().trim().min(2),
  hodYearsExperience: z.coerce.number().int().min(0).max(80),
  hodEmail: z.string().trim().email(),
});

const equipmentCreateSchema = z.object({
  name: z.string().trim().min(2, 'Equipment name is required'),
  manufacturer: z.string().trim().optional().default(''),
  model: z.string().trim().min(1, 'Model number is required'),
  yearOfMake: z.coerce.number().int().min(1980).max(2035),
  serialNo: z.string().trim().min(2, 'Serial number is required'),
  calibrationCertNo: z.string().trim().optional().default(''),
  lastCalibrated: z.string().trim().optional().default(''),
  nextCalibrationDue: z.string().trim().optional().default(''),
  status: z
    .enum(['Operational', 'Calibration Due', 'Maintenance', 'Out of Use'])
    .default('Operational'),
});

const equipmentUpdateSchema = equipmentCreateSchema.partial();

const staffCreateSchema = z.object({
  name: z.string().trim().min(2),
  role: z.string().trim().min(2),
  qualification: z.string().trim().min(2),
  licenseNo: z.string().trim().min(2),
  shift: z.string().trim().min(2),
});

const certCreateSchema = z.object({
  type: z.string().trim().min(2),
  issuingBody: z.string().trim().min(2),
  certificateNo: z.string().trim().min(2),
  yearCertified: z.coerce.number().int().min(1990).max(2035),
  expiryDate: z.string().trim().min(2),
  status: z.enum(['Valid', 'Expiring', 'Expired']).default('Valid'),
});

export function registerMasterFileRoutes(app: FastifyInstance, db: DatabaseSync): void {
  app.put('/api/practice', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN']);
    if (!user) return;

    const parsed = practiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid practice data' });
    }
    const d = parsed.data;
    const nowTs = formatNowTimestamp();

    db.prepare(
      `UPDATE practice_settings
       SET practice_name = ?, address = ?, certificate_no = ?, recognition_status = ?,
           recognized_from = ?, expires_on = ?, renewal_check_due = ?, engagement_signed = ?,
           return_frequency = ?, state_facility_reg_no = ?, medical_director = ?, updated_at = ?
       WHERE id = 1`
    ).run(
      d.practiceName,
      d.address,
      d.certificateNo,
      d.status,
      d.recognizedFrom,
      d.expiresOn,
      d.renewalCheckDue,
      d.engagementSigned,
      d.returnFrequency,
      d.stateFacilityRegNo,
      d.medicalDirector,
      nowTs
    );

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'PRACTICE_SETTINGS_UPDATED',
      d.certificateNo,
      `Updated practice recognition details for ${d.practiceName} (Status: ${d.status}).`
    );

    return { ok: true };
  });

  app.put('/api/departments/:id', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };

    const dept = db.prepare('SELECT id, name FROM departments WHERE id = ?').get(id) as
      | { id: string; name: string }
      | undefined;
    if (!dept) return reply.code(404).send({ error: 'Department not found.' });

    const parsed = departmentUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid department fields' });
    }
    const d = parsed.data;

    db.prepare(
      `UPDATE departments
       SET floor_location = ?, description = ?, hod_name = ?, hod_title = ?,
           hod_qualifications = ?, hod_fellowship = ?, hod_years_experience = ?, hod_email = ?
       WHERE id = ?`
    ).run(
      d.floorLocation,
      d.description,
      d.hodName,
      d.hodTitle,
      d.hodQualifications,
      d.hodFellowship,
      d.hodYearsExperience,
      d.hodEmail,
      id
    );

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'DEPARTMENT_UPDATED',
      id.toUpperCase(),
      `Updated HOD (${d.hodName}) & facility profile for ${dept.name}.`
    );

    return { ok: true };
  });

  app.post('/api/departments/:id/equipment', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN', 'LAB', 'RADIOLOGY', 'ENT', 'EYE']);
    if (!user) return;
    const { id } = req.params as { id: string };

    if (user.portalRole === 'LAB' && id !== 'lab') {
      return reply.code(403).send({ error: 'Lab users can only register Laboratory equipment.' });
    }
    if (user.portalRole === 'RADIOLOGY' && id !== 'radiology') {
      return reply.code(403).send({ error: 'Radiology users can only register Radiology equipment.' });
    }
    if (user.portalRole === 'ENT' && id !== 'ent') {
      return reply.code(403).send({ error: 'ENT users can only register ENT & Audiology equipment.' });
    }
    if (user.portalRole === 'EYE' && id !== 'eye') {
      return reply.code(403).send({ error: 'Eye Clinic users can only register Eye Clinic equipment.' });
    }

    const dept = db.prepare('SELECT id, name FROM departments WHERE id = ?').get(id) as
      | { id: string; name: string }
      | undefined;
    if (!dept) return reply.code(404).send({ error: 'Department not found.' });

    const parsed = equipmentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid equipment fields' });
    }
    const d = parsed.data;
    const eqId = `eq-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const nowTs = formatNowTimestamp();
    const checkPassed = d.status === 'Out of Use' ? 0 : 1;

    db.prepare(
      `INSERT INTO equipment (
        id, department_id, name, manufacturer, model, year_of_make, serial_no,
        calibration_cert_no, last_calibrated, next_calibration_due, status,
        daily_check_passed, daily_checked_by, daily_checked_at, registered_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      eqId,
      id,
      d.name,
      d.manufacturer,
      d.model,
      d.yearOfMake,
      d.serialNo,
      d.calibrationCertNo,
      d.lastCalibrated,
      d.nextCalibrationDue,
      d.status,
      checkPassed,
      user.fullName,
      nowTs,
      user.fullName,
      nowTs
    );

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'EQUIPMENT_REGISTERED',
      d.serialNo,
      `Registered ${d.name} (${d.manufacturer ? `${d.manufacturer} ` : ''}Model: ${d.model}, Serial: ${d.serialNo}, Year: ${d.yearOfMake}) in ${dept.name}.`
    );

    return { ok: true, id: eqId };
  });

  app.patch('/api/equipment/:id', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN', 'LAB', 'RADIOLOGY', 'ENT', 'EYE']);
    if (!user) return;
    const { id } = req.params as { id: string };

    const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return reply.code(404).send({ error: 'Equipment item not found.' });

    const deptId = String(existing.department_id);
    if (user.portalRole === 'LAB' && deptId !== 'lab') {
      return reply.code(403).send({ error: 'Forbidden for non-Lab equipment.' });
    }
    if (user.portalRole === 'RADIOLOGY' && deptId !== 'radiology') {
      return reply.code(403).send({ error: 'Forbidden for non-Radiology equipment.' });
    }
    if (user.portalRole === 'ENT' && deptId !== 'ent') {
      return reply.code(403).send({ error: 'Forbidden for non-ENT equipment.' });
    }
    if (user.portalRole === 'EYE' && deptId !== 'eye') {
      return reply.code(403).send({ error: 'Forbidden for non-Eye Clinic equipment.' });
    }

    const parsed = equipmentUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid equipment update' });
    }
    const d = parsed.data;
    const nextStatus = d.status ?? (String(existing.status) as z.infer<typeof equipmentCreateSchema>['status']);
    const nextPassed =
      nextStatus === 'Out of Use'
        ? 0
        : nextStatus === 'Operational'
        ? 1
        : Number(existing.daily_check_passed);

    db.prepare(
      `UPDATE equipment
       SET name = ?, manufacturer = ?, model = ?, year_of_make = ?, serial_no = ?,
           calibration_cert_no = ?, last_calibrated = ?, next_calibration_due = ?,
           status = ?, daily_check_passed = ?
       WHERE id = ?`
    ).run(
      d.name ?? String(existing.name),
      d.manufacturer ?? String(existing.manufacturer || ''),
      d.model ?? String(existing.model),
      d.yearOfMake ?? Number(existing.year_of_make),
      d.serialNo ?? String(existing.serial_no),
      d.calibrationCertNo ?? String(existing.calibration_cert_no || ''),
      d.lastCalibrated ?? String(existing.last_calibrated || ''),
      d.nextCalibrationDue ?? String(existing.next_calibration_due || ''),
      nextStatus,
      nextPassed,
      id
    );

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'EQUIPMENT_UPDATED',
      d.serialNo ?? String(existing.serial_no),
      `Updated ${d.name ?? String(existing.name)} (${d.model ?? String(existing.model)}) -> Status: ${nextStatus}.`
    );

    return { ok: true };
  });

  app.patch('/api/equipment/:id/daily-check', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN', 'DOCTOR', 'LAB', 'RADIOLOGY', 'ENT', 'EYE']);
    if (!user) return;
    const { id } = req.params as { id: string };

    const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return reply.code(404).send({ error: 'Equipment item not found.' });

    const deptId = String(existing.department_id);
    if (user.portalRole === 'LAB' && deptId !== 'lab') {
      return reply.code(403).send({ error: 'Lab users can only toggle Laboratory equipment checks.' });
    }
    if (user.portalRole === 'RADIOLOGY' && deptId !== 'radiology') {
      return reply.code(403).send({ error: 'Radiology users can only toggle Radiology equipment checks.' });
    }
    if (user.portalRole === 'ENT' && deptId !== 'ent') {
      return reply.code(403).send({ error: 'ENT users can only toggle ENT & Audiology equipment checks.' });
    }
    if (user.portalRole === 'EYE' && deptId !== 'eye') {
      return reply.code(403).send({ error: 'Eye Clinic users can only toggle Eye Clinic equipment checks.' });
    }

    const currentPassed = Boolean(existing.daily_check_passed);
    const nextPassed = currentPassed ? 0 : 1;
    const currentStatus = String(existing.status);
    const nextStatus =
      nextPassed === 0
        ? 'Out of Use'
        : currentStatus === 'Out of Use'
        ? 'Operational'
        : currentStatus;
    const nowTs = formatNowTimestamp();

    db.prepare(
      `UPDATE equipment
       SET daily_check_passed = ?, status = ?, daily_checked_by = ?, daily_checked_at = ?
       WHERE id = ?`
    ).run(nextPassed, nextStatus, user.fullName, nowTs, id);

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      nextPassed ? 'DAILY_EQUIPMENT_CHECK' : 'EQUIPMENT_MARKED_OUT_OF_USE',
      String(existing.serial_no),
      `${String(existing.name)} (${String(existing.model)}) daily check marked ${nextPassed ? 'PASS' : 'OUT OF USE'}.`
    );

    return { ok: true, passed: Boolean(nextPassed) };
  });

  app.delete('/api/equipment/:id', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };

    const existing = db.prepare('SELECT name, model, serial_no FROM equipment WHERE id = ?').get(id) as
      | { name: string; model: string; serial_no: string }
      | undefined;
    if (!existing) return reply.code(404).send({ error: 'Equipment not found.' });

    db.prepare('DELETE FROM equipment WHERE id = ?').run(id);
    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'EQUIPMENT_REMOVED',
      existing.serial_no,
      `Removed ${existing.name} (${existing.model}) from master register.`
    );

    return { ok: true };
  });

  app.post('/api/departments/:id/staff', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };

    const dept = db.prepare('SELECT id, name FROM departments WHERE id = ?').get(id) as
      | { id: string; name: string }
      | undefined;
    if (!dept) return reply.code(404).send({ error: 'Department not found.' });

    const parsed = staffCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid staff details' });
    }
    const d = parsed.data;
    const staffId = `st-${id}-${Date.now()}`;
    const nowTs = formatNowTimestamp();

    db.prepare(
      `INSERT INTO department_staff (id, department_id, name, role, qualification, license_no, shift, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(staffId, id, d.name, d.role, d.qualification, d.licenseNo, d.shift, nowTs);

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'DEPARTMENT_STAFF_ADDED',
      d.licenseNo,
      `Added ${d.name} (${d.role}) to ${dept.name}.`
    );

    return { ok: true, id: staffId };
  });

  app.delete('/api/department-staff/:id', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };

    const existing = db.prepare('SELECT name, license_no FROM department_staff WHERE id = ?').get(id) as
      | { name: string; license_no: string }
      | undefined;
    if (!existing) return reply.code(404).send({ error: 'Staff record not found.' });

    db.prepare('DELETE FROM department_staff WHERE id = ?').run(id);
    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'DEPARTMENT_STAFF_REMOVED',
      existing.license_no,
      `Removed ${existing.name} from department roster.`
    );

    return { ok: true };
  });

  app.post('/api/departments/:id/certificates', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };

    const dept = db.prepare('SELECT id, name FROM departments WHERE id = ?').get(id) as
      | { id: string; name: string }
      | undefined;
    if (!dept) return reply.code(404).send({ error: 'Department not found.' });

    const parsed = certCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid certificate details' });
    }
    const d = parsed.data;
    const certId = `cert-${id}-${Date.now()}`;
    const nowTs = formatNowTimestamp();

    db.prepare(
      `INSERT INTO department_certificates (id, department_id, type, issuing_body, certificate_no, year_certified, expiry_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(certId, id, d.type, d.issuingBody, d.certificateNo, d.yearCertified, d.expiryDate, d.status, nowTs);

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'DEPARTMENT_CERT_ADDED',
      d.certificateNo,
      `Registered ${d.type} (${d.certificateNo}) for ${dept.name}.`
    );

    return { ok: true, id: certId };
  });

  app.delete('/api/department-certificates/:id', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };

    const existing = db.prepare('SELECT type, certificate_no FROM department_certificates WHERE id = ?').get(id) as
      | { type: string; certificate_no: string }
      | undefined;
    if (!existing) return reply.code(404).send({ error: 'Certificate not found.' });

    db.prepare('DELETE FROM department_certificates WHERE id = ?').run(id);
    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'DEPARTMENT_CERT_REMOVED',
      existing.certificate_no,
      `Removed regulatory certificate ${existing.type} (${existing.certificate_no}).`
    );

    return { ok: true };
  });
}
