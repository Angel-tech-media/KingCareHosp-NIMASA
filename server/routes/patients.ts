import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import {
  appendAudit,
  calculateAgeYears,
  formatDateShort,
  formatNowTimestamp,
  getPatientById,
  UPLOADS_DIR,
} from '../db.js';
import type {
  CieStandard,
  FitnessDetermination,
  IssuedCertificate,
  MedicationItem,
  PatientRecord,
  PatientStage,
  RoleType,
  SeafarerRmpData,
} from '../types.js';

const newPatientSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  dob: z.string().trim().min(4, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female']),
  phone: z.string().trim().min(4, 'Phone number is required'),
  nimasaMember: z.boolean().default(true),
  nimasaStaffId: z.string().trim().optional(),
  nimasaDepartment: z.string().trim().optional(),
  consentToShareWithNimasa: z.boolean().default(true),
  nationality: z.string().trim().optional(),
  idType: z
    .enum([
      "Seafarer's Identity Document",
      'International Passport',
      'Passport',
      'NIN National ID',
      'National ID Card (NIMC)',
      'Discharge Book',
      'Certificate of Competency',
    ])
    .optional(),
  idNumber: z.string().trim().optional(),
  idVerifiedOriginal: z.boolean().optional(),
  photoCaptured: z.boolean().optional(),
  category: z
    .enum([
      'Deck (Master / Officer / Lookout)',
      'Engine / Electro-Technical',
      'GMDSS Radio Operator',
      'Catering / Other',
    ])
    .optional(),
  lookoutRequired: z.boolean().optional(),
  previousCertNo: z.string().trim().optional(),
  previousColourVisionDate: z.string().trim().optional(),
  healthDeclarationSigned: z.boolean().optional(),
  entryExam: z.boolean().optional(),
  priorityBasis: z
    .enum(['None', 'Voyage Extension (Reg. I/9.6)', 'NIMASA Urgent Permission (Reg. I/9.7)'])
    .optional(),
});

const orderTestsSchema = z.object({
  tests: z
    .array(
      z.object({
        category: z.enum(['Blood', 'Stool', 'Tissue', 'Imaging', 'Audiology', 'Vision']),
        testName: z.string().trim().min(2),
        department: z.enum(['Laboratory', 'Radiology', 'ENT & Audiology', 'Eye Clinic']),
        referenceRange: z.string().trim().optional().default(''),
        clinicalInstruction: z.string().trim().optional().default(''),
      })
    )
    .min(1),
});

const attachmentUploadSchema = z.object({
  fileName: z.string().trim().min(1, 'File name is required'),
  mimeType: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'image/webp'], {
    error: 'Only PDF, PNG, JPEG, or WebP reports are supported.',
  }),
  dataBase64: z.string().min(4, 'File content is empty'),
});

const ALLOWED_ORDER_DEPT: Partial<Record<RoleType, string>> = {
  LAB: 'Laboratory',
  RADIOLOGY: 'Radiology',
  ENT: 'ENT & Audiology',
  EYE: 'Eye Clinic',
};

function ensureOrderDepartmentAccess(role: RoleType, dept: string): string | null {
  if (role === 'DOCTOR' || role === 'ADMIN') return null;
  const expected = ALLOWED_ORDER_DEPT[role];
  if (!expected || dept !== expected) {
    return `${role} accounts can only access ${expected || 'assigned department'} orders.`;
  }
  return null;
}

function upsertTimeline(
  db: DatabaseSync,
  patientId: string,
  stage: PatientStage,
  actorName: string,
  actorRole: string,
  publicSummary: string
): void {
  const ts = formatNowTimestamp();
  const existing = db
    .prepare('SELECT id FROM patient_timeline WHERE patient_id = ? AND stage = ?')
    .get(patientId, stage) as { id: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE patient_timeline
       SET reached_at = ?, actor_name = ?, actor_role = ?, public_summary = ?
       WHERE id = ?`
    ).run(ts, actorName, actorRole, publicSummary, existing.id);
  } else {
    db.prepare(
      `INSERT INTO patient_timeline (patient_id, stage, reached_at, actor_name, actor_role, public_summary)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(patientId, stage, ts, actorName, actorRole, publicSummary);
  }
}

function parseAcuity(val: string | undefined): number {
  const n = Number.parseFloat(String(val || '0'));
  return Number.isNaN(n) ? 0 : n;
}

function evaluateDeckLookoutBlock(rmp: SeafarerRmpData): boolean {
  const isDeckOrLookout =
    rmp.category === 'Deck (Master / Officer / Lookout)' || rmp.lookoutRequired;
  if (!isDeckOrLookout) return false;

  const vh = rmp.visionHearing;
  const rAided = parseAcuity(vh.distanceAided.right);
  const lAided = parseAcuity(vh.distanceAided.left);
  const visionFailed = rAided < 0.5 || lAided < 0.5 || !vh.visualFieldsNormal || !vh.nightVisionNormal;
  const colourFailed = vh.colourVisionCie === 'Failed';
  return visionFailed || colourFailed;
}

export function registerPatientRoutes(app: FastifyInstance, db: DatabaseSync): void {
  app.post('/api/patients', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['FRONT_DESK', 'ADMIN']);
    if (!user) return;

    const parsed = newPatientSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid registration data' });
    }
    const input = parsed.data;
    const age = calculateAgeYears(input.dob);
    if (age < 16) {
      return reply
        .code(400)
        .send({ error: `Candidate age is ${age}. STCW Reg. I/9 requires minimum age of 16 years.` });
    }

    const maxRow = db
      .prepare(
        `SELECT MAX(CAST(substr(record_no, 4) AS INTEGER)) AS max_num FROM patients`
      )
      .get() as { max_num: number | null };
    const nextNumber = Math.max(100, Number(maxRow?.max_num || 100)) + 1;
    const recordNo = `KC-${String(nextNumber).padStart(6, '0')}`;
    const id = `p-${Date.now()}-${nextNumber}`;
    const ts = formatNowTimestamp();
    const isUnder18 = age < 18;
    const category = input.category || 'Deck (Master / Officer / Lookout)';
    const lookoutRequired =
      input.lookoutRequired !== undefined
        ? input.lookoutRequired
        : category === 'Deck (Master / Officer / Lookout)';

    const rmp: SeafarerRmpData = {
      nationality: input.nationality || 'Nigerian',
      idType: input.idType || "Seafarer's Identity Document",
      idNumber: input.idNumber || `NG-SID-2026-${nextNumber}`,
      idVerifiedOriginal: input.idVerifiedOriginal ?? true,
      photoCaptured: input.photoCaptured ?? true,
      isUnder18,
      previousCertNo: input.previousCertNo || undefined,
      previousColourVisionDate: input.previousColourVisionDate || undefined,
      category,
      lookoutRequired,
      specialDuties: lookoutRequired
        ? ['Fire-fighting team', 'Breathing apparatus', 'Bridge watchkeeping']
        : ['Fire-fighting team', 'Breathing apparatus'],
      entryExam: input.entryExam ?? false,
      healthDeclarationSigned: input.healthDeclarationSigned ?? true,
      priorityBasis: input.priorityBasis || 'None',
      visionHearing: {
        distanceUnaided: { right: '0.8', left: '0.8', both: '1.0' },
        distanceAided: { right: '1.0', left: '1.0', both: '1.0' },
        visualAidsRequired: false,
        nearVisionMet: true,
        intermediateVisionMet: true,
        visualFieldsNormal: true,
        nightVisionNormal: true,
        diplopiaAbsent: true,
        colourVisionLastDate: input.previousColourVisionDate || formatDateShort(),
        colourVisionTestMethod: 'Ishihara 38-Plate (2024 Ed.) under D65 Lamp',
        colourVisionCie: 'CIE 1',
        colourVisionReferred: false,
        audiometryRight: { hz500: 15, hz1000: 15, hz2000: 20, hz3000: 20 },
        audiometryLeft: { hz500: 15, hz1000: 20, hz2000: 20, hz3000: 20 },
        unaidedHearingSatisfactory: true,
        speechClear: true,
      },
      statutoryCriteria: {
        physicalCapabilityBasicTraining: false,
        hearingAndSpeechAdequate: false,
        noConditionPreventingDuties: false,
        noConditionAggravatedBySea: false,
        noImpairingMedication: false,
        fitForLookout: lookoutRequired,
      },
      determination: 'Pending',
    };

    const vitals = {
      bp: '120/78 mmHg',
      temp: '36.8 °C',
      pulse: '74 bpm',
      spo2: '99%',
      weight: '74 kg',
    };

    db.exec('BEGIN;');
    try {
      db.prepare(
        `INSERT INTO patients (
          id, record_no, full_name, dob, gender, phone,
          nimasa_member, nimasa_staff_id, nimasa_department, consent_to_share_with_nimasa,
          status, current_stage, current_location, is_admitted, ward_room,
          arrived_at, time_in_hospital, vitals_json, medications_json, rmp_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 'Registered', 'Front Desk / Reception (RQP-601)', 0, NULL, ?, '0h 05m', ?, '[]', ?, ?)`
      ).run(
        id,
        recordNo,
        input.fullName,
        input.dob,
        input.gender,
        input.phone,
        input.nimasaMember ? 1 : 0,
        input.nimasaMember ? input.nimasaStaffId || `NIM-STF-${nextNumber}` : null,
        input.nimasaMember ? input.nimasaDepartment || category : null,
        input.nimasaMember && input.consentToShareWithNimasa ? 1 : 0,
        ts,
        JSON.stringify(vitals),
        JSON.stringify(rmp),
        ts
      );

      upsertTimeline(
        db,
        id,
        'Registered',
        user.fullName,
        user.roleTitle,
        `Registered under RQP-601 (${category}${isUnder18 ? ' · Under-18 1-yr cap' : ''}); original photo ID, duties statement & NDPA 2023 consent recorded.`
      );

      appendAudit(
        db,
        user.fullName,
        user.roleTitle,
        'Registered Seafarer (RQP-601)',
        recordNo,
        `Registered ${input.fullName} (${category}; ID: ${rmp.idType}${isUnder18 ? '; UNDER-18 1-YEAR MAX FLAG' : ''}).`
      );

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    const patient = getPatientById(db, id) as PatientRecord;
    return { patient };
  });

  app.post('/api/patients/:id/dispatch', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['FRONT_DESK', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target) return reply.code(404).send({ error: 'Seafarer record not found.' });

    db.prepare(
      `UPDATE patients SET current_stage = 'Awaiting doctor', current_location = 'Doctor Waiting Lounge' WHERE id = ?`
    ).run(id);
    upsertTimeline(
      db,
      id,
      'Awaiting doctor',
      user.fullName,
      user.roleTitle,
      'Triage complete; candidate queued for Recognized Medical Practitioner.'
    );
    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'Dispatched Seafarer to RMP',
      target.recordNo,
      `Dispatched ${target.fullName} to RMP examination queue.`
    );
    return { ok: true };
  });

  app.post('/api/patients/:id/start-assessment', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target) return reply.code(404).send({ error: 'Seafarer record not found.' });

    db.prepare(
      `UPDATE patients SET current_stage = 'In assessment', current_location = 'Consultation Room 1' WHERE id = ?`
    ).run(id);
    upsertTimeline(
      db,
      id,
      'In assessment',
      user.fullName,
      user.roleTitle,
      'Candidate currently in STCW Reg. I/9 clinical examination with RMP.'
    );
    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'Started RMP Assessment',
      target.recordNo,
      `Commenced assessment for ${target.fullName}.`
    );
    return { ok: true };
  });

  app.post('/api/patients/:id/first-assessment', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target) return reply.code(404).send({ error: 'Seafarer record not found.' });

    const body = (req.body || {}) as { shortSummary?: string; fullClinicalNote?: string };
    const cleanSummary =
      body.shortSummary?.trim() || 'First assessment complete; physician reviewing next clinical step.';

    if (!target.timeline.some((t) => t.stage === 'In assessment')) {
      upsertTimeline(db, id, 'In assessment', user.fullName, user.roleTitle, 'Initial consultation performed.');
    }

    db.prepare(
      `UPDATE patients
       SET current_stage = 'First assessment complete', current_location = 'Consultation Room 1',
           first_assessment_summary = ?, first_assessment_full_note = ?
       WHERE id = ?`
    ).run(cleanSummary, body.fullClinicalNote || '', id);

    upsertTimeline(db, id, 'First assessment complete', user.fullName, user.roleTitle, cleanSummary);
    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'Completed First Assessment',
      target.recordNo,
      `Saved initial clinical findings for ${target.fullName}.`
    );
    return { ok: true };
  });

  app.post('/api/patients/:id/second-assessment', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target) return reply.code(404).send({ error: 'Seafarer record not found.' });

    const body = (req.body || {}) as { note?: string };
    db.prepare(
      `UPDATE patients
       SET current_stage = 'Second assessment', current_location = 'Consultation Room 1',
           second_assessment_note = ?
       WHERE id = ?`
    ).run(body.note || '', id);

    upsertTimeline(
      db,
      id,
      'Second assessment',
      user.fullName,
      user.roleTitle,
      'RMP reviewed diagnostic results and completed second clinical evaluation.'
    );
    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'Completed Second Assessment',
      target.recordNo,
      `Recorded post-investigation clinical note for ${target.fullName}.`
    );
    return { ok: true };
  });

  app.post('/api/patients/:id/orders', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target) return reply.code(404).send({ error: 'Seafarer record not found.' });

    const parsed = orderTestsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Select at least one test' });
    }

    const ts = formatNowTimestamp();
    const tests = parsed.data.tests;
    const uniqueDepts = Array.from(new Set(tests.map((t) => t.department)));
    const locationLabel =
      uniqueDepts.length === 1
        ? uniqueDepts[0]
        : `Diagnostic Suites (${uniqueDepts.join(', ')})`;

    const insertOrder = db.prepare(
      `INSERT INTO diagnostic_orders (
        id, patient_id, record_no, patient_name, department, category, test_name,
        clinical_instruction, ordered_by, ordered_at, status, reference_range
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`
    );

    db.exec('BEGIN;');
    try {
      tests.forEach((t, idx) => {
        const orderId = `ORD-${Date.now().toString().slice(-5)}${idx + 1}`;
        insertOrder.run(
          orderId,
          target.id,
          target.recordNo,
          target.fullName,
          t.department,
          t.category,
          t.testName,
          t.clinicalInstruction || '',
          user.fullName,
          ts,
          t.referenceRange || ''
        );
      });

      const nextLoc = target.isAdmitted
        ? `${target.wardRoom || 'Inpatient Ward B'} -> ${locationLabel}`
        : locationLabel;
      db.prepare(`UPDATE patients SET current_stage = 'Tests requested', current_location = ? WHERE id = ?`).run(
        nextLoc,
        id
      );

      const testList = tests.map((t) => t.testName).join(', ');
      upsertTimeline(
        db,
        id,
        'Tests requested',
        user.fullName,
        user.roleTitle,
        `Diagnostic investigations ordered (${testList}).`
      );
      appendAudit(
        db,
        user.fullName,
        user.roleTitle,
        'Ordered Diagnostic Tests',
        target.recordNo,
        `Ordered ${tests.length} investigation(s) for ${target.fullName}: ${testList}.`
      );
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return { ok: true };
  });

  app.post('/api/patients/:id/admit', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target) return reply.code(404).send({ error: 'Record not found.' });

    const body = (req.body || {}) as { wardRoom?: string };
    const ward = body.wardRoom?.trim() || 'Executive Ward B - Bed 07';

    db.prepare(
      `UPDATE patients SET current_stage = 'Admitted', is_admitted = 1, ward_room = ?, current_location = ? WHERE id = ?`
    ).run(ward, ward, id);

    upsertTimeline(db, id, 'Admitted', user.fullName, user.roleTitle, `Admitted to ${ward} for observation.`);
    appendAudit(db, user.fullName, user.roleTitle, 'Admitted Patient', target.recordNo, `Admitted ${target.fullName} to ${ward}.`);
    return { ok: true };
  });

  app.post('/api/patients/:id/medications', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target) return reply.code(404).send({ error: 'Record not found.' });

    const med = (req.body || {}) as {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    };
    const nextMed: MedicationItem = {
      id: `med-${Date.now()}`,
      name: med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      duration: med.duration || '',
      prescribedBy: user.fullName,
      prescribedAt: formatNowTimestamp(),
    };
    const nextList = [...target.medications, nextMed];
    db.prepare('UPDATE patients SET medications_json = ? WHERE id = ?').run(JSON.stringify(nextList), id);
    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'Prescribed Medication',
      target.recordNo,
      `Prescribed ${nextMed.name} (${nextMed.dosage}) to ${target.fullName}.`
    );
    return { ok: true };
  });

  app.post('/api/patients/:id/discharge', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target) return reply.code(404).send({ error: 'Record not found.' });

    const body = (req.body || {}) as { dischargeSummary?: string };
    const cleanSummary =
      body.dischargeSummary?.trim() || 'Clinically stable and discharged.';

    if (!target.timeline.some((t) => t.stage === 'Second assessment')) {
      upsertTimeline(
        db,
        id,
        'Second assessment',
        user.fullName,
        user.roleTitle,
        'Final pre-discharge clinical review completed.'
      );
    }

    db.prepare(
      `UPDATE patients
       SET status = 'Inactive', current_stage = 'Discharged', current_location = 'Discharged',
           is_admitted = 0, discharge_summary = ?
       WHERE id = ?`
    ).run(cleanSummary, id);

    upsertTimeline(db, id, 'Discharged', user.fullName, user.roleTitle, cleanSummary);
    appendAudit(db, user.fullName, user.roleTitle, 'Discharged Patient', target.recordNo, `Discharged ${target.fullName}.`);
    return { ok: true };
  });

  app.patch('/api/orders/:orderId/draft', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['LAB', 'RADIOLOGY', 'ENT', 'EYE', 'DOCTOR', 'ADMIN']);
    if (!user) return;
    const { orderId } = req.params as { orderId: string };

    const order = db.prepare('SELECT * FROM diagnostic_orders WHERE id = ?').get(orderId) as
      | Record<string, unknown>
      | undefined;
    if (!order) return reply.code(404).send({ error: 'Diagnostic order not found.' });

    const dept = String(order.department);
    const deptErr = ensureOrderDepartmentAccess(user.portalRole, dept);
    if (deptErr) return reply.code(403).send({ error: deptErr });

    const body = (req.body || {}) as { draftFindings?: string; scientistRemarks?: string };
    db.prepare(
      `UPDATE diagnostic_orders SET status = 'Draft', draft_findings = ?, scientist_remarks = ? WHERE id = ?`
    ).run(
      body.draftFindings || '',
      body.scientistRemarks ?? (order.scientist_remarks ? String(order.scientist_remarks) : ''),
      orderId
    );

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'Saved Diagnostic Draft',
      String(order.record_no),
      `Saved draft findings for ${String(order.test_name)}.`
    );
    return { ok: true };
  });

  app.post('/api/orders/:orderId/publish', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['LAB', 'RADIOLOGY', 'ENT', 'EYE', 'DOCTOR', 'ADMIN']);
    if (!user) return;
    const { orderId } = req.params as { orderId: string };

    const order = db.prepare('SELECT * FROM diagnostic_orders WHERE id = ?').get(orderId) as
      | Record<string, unknown>
      | undefined;
    if (!order) return reply.code(404).send({ error: 'Diagnostic order not found.' });

    const dept = String(order.department);
    const deptErr = ensureOrderDepartmentAccess(user.portalRole, dept);
    if (deptErr) return reply.code(403).send({ error: deptErr });

    const body = (req.body || {}) as {
      publishedResult?: string;
      referenceRange?: string;
      scientistRemarks?: string;
      audiometry?: {
        audiometryRight: { hz500: number; hz1000: number; hz2000: number; hz3000: number };
        audiometryLeft: { hz500: number; hz1000: number; hz2000: number; hz3000: number };
        speechClear: boolean;
      };
      vision?: {
        distanceUnaided: { right: string; left: string; both: string };
        distanceAided: { right: string; left: string; both: string };
        visualAidsRequired: boolean;
        nearVisionMet: boolean;
        intermediateVisionMet: boolean;
        visualFieldsNormal: boolean;
        nightVisionNormal: boolean;
        diplopiaAbsent: boolean;
        colourVisionTestMethod: string;
        colourVisionCie: CieStandard;
      };
    };
    const ts = formatNowTimestamp();

    db.exec('BEGIN;');
    try {
      db.prepare(
        `UPDATE diagnostic_orders
         SET status = 'Published', published_result = ?, reference_range = ?, scientist_remarks = ?,
             completed_by = ?, published_at = ?
         WHERE id = ?`
      ).run(
        body.publishedResult || '',
        body.referenceRange || String(order.reference_range || ''),
        body.scientistRemarks || '',
        user.fullName,
        ts,
        orderId
      );

      const patientId = String(order.patient_id);
      const patient = getPatientById(db, patientId);

      // Sync structured ENT / Eye delegated readings directly into RQF-603-01 for RMP review
      if (patient?.rmp && (body.audiometry || body.vision)) {
        const updatedVh = { ...patient.rmp.visionHearing, testedBy: user.fullName };
        if (body.audiometry) {
          updatedVh.audiometryRight = body.audiometry.audiometryRight;
          updatedVh.audiometryLeft = body.audiometry.audiometryLeft;
          updatedVh.speechClear = body.audiometry.speechClear;
        }
        if (body.vision) {
          updatedVh.distanceUnaided = body.vision.distanceUnaided;
          updatedVh.distanceAided = body.vision.distanceAided;
          updatedVh.visualAidsRequired = body.vision.visualAidsRequired;
          updatedVh.nearVisionMet = body.vision.nearVisionMet;
          updatedVh.intermediateVisionMet = body.vision.intermediateVisionMet;
          updatedVh.visualFieldsNormal = body.vision.visualFieldsNormal;
          updatedVh.nightVisionNormal = body.vision.nightVisionNormal;
          updatedVh.diplopiaAbsent = body.vision.diplopiaAbsent;
          updatedVh.colourVisionTestMethod = body.vision.colourVisionTestMethod;
          updatedVh.colourVisionCie = body.vision.colourVisionCie;
          updatedVh.colourVisionLastDate = formatDateShort();
          updatedVh.colourVisionReferred = body.vision.colourVisionCie === 'Pending specialist';
        }
        const nextRmp: SeafarerRmpData = {
          ...patient.rmp,
          visionHearing: updatedVh,
        };
        db.prepare('UPDATE patients SET rmp_json = ? WHERE id = ?').run(
          JSON.stringify(nextRmp),
          patientId
        );
      }

      const allPublished = patient
        ? patient.orders.every((o) => o.id === orderId || o.status === 'Published')
        : true;

      if (patient && allPublished) {
        const nextLoc = patient.isAdmitted
          ? `${patient.wardRoom} (Results Ready for RMP)`
          : 'Consultation Room 1 (Results Ready)';
        db.prepare(`UPDATE patients SET current_stage = 'Results ready', current_location = ? WHERE id = ?`).run(
          nextLoc,
          patientId
        );
        upsertTimeline(
          db,
          patientId,
          'Results ready',
          user.fullName,
          user.roleTitle,
          `Diagnostic result published (${String(order.test_name)}); ready for RMP review.`
        );
      }

      appendAudit(
        db,
        user.fullName,
        user.roleTitle,
        `Published ${dept} Result`,
        String(order.record_no),
        `Published ${String(order.test_name)} for ${String(order.patient_name)}.`
      );
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return { ok: true };
  });

  app.post('/api/orders/:orderId/attachment', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['LAB', 'RADIOLOGY', 'ENT', 'EYE', 'DOCTOR', 'ADMIN']);
    if (!user) return;
    const { orderId } = req.params as { orderId: string };

    const order = db.prepare('SELECT * FROM diagnostic_orders WHERE id = ?').get(orderId) as
      | Record<string, unknown>
      | undefined;
    if (!order) return reply.code(404).send({ error: 'Diagnostic order not found.' });

    const deptErr = ensureOrderDepartmentAccess(user.portalRole, String(order.department));
    if (deptErr) return reply.code(403).send({ error: deptErr });

    const parsed = attachmentUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message || 'Invalid attachment' });
    }

    const { fileName, mimeType, dataBase64 } = parsed.data;
    const rawB64 = dataBase64.includes(',') ? dataBase64.split(',')[1] || '' : dataBase64;
    const buffer = Buffer.from(rawB64, 'base64');
    if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
      return reply
        .code(400)
        .send({ error: 'Attachment must be non-empty and under 10 MB.' });
    }

    const originalName = path.basename(fileName);
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const diskPath = path.join(UPLOADS_DIR, `${orderId}_${Date.now()}_${safeName}`);

    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(diskPath, buffer);

    db.prepare(
      `UPDATE diagnostic_orders SET attachment_name = ?, attachment_mime = ?, attachment_path = ? WHERE id = ?`
    ).run(originalName, mimeType, diskPath, orderId);

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'REPORT_FILE_UPLOADED',
      String(order.record_no),
      `Uploaded diagnostic attachment "${originalName}" for ${String(order.test_name)}.`
    );

    return { ok: true, attachmentName: originalName };
  });

  app.get('/api/orders/:orderId/attachment', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['ADMIN', 'DOCTOR', 'LAB', 'RADIOLOGY', 'ENT', 'EYE']);
    if (!user) return;
    const { orderId } = req.params as { orderId: string };

    const order = db.prepare('SELECT * FROM diagnostic_orders WHERE id = ?').get(orderId) as
      | Record<string, unknown>
      | undefined;
    if (!order) return reply.code(404).send({ error: 'Diagnostic order not found.' });

    const deptErr = ensureOrderDepartmentAccess(user.portalRole, String(order.department));
    if (deptErr) return reply.code(403).send({ error: deptErr });

    const filePath = order.attachment_path ? String(order.attachment_path) : '';
    const fileName = order.attachment_name ? String(order.attachment_name) : 'report';
    const mimeType = order.attachment_mime ? String(order.attachment_mime) : 'application/octet-stream';

    if (!filePath || !fs.existsSync(filePath)) {
      return reply.code(404).send({ error: 'Report file not found on disk.' });
    }

    const fileBuffer = fs.readFileSync(filePath);
    reply.header('Content-Type', mimeType);
    reply.header('Content-Disposition', `inline; filename="${fileName.replace(/"/g, '')}"`);
    return reply.send(fileBuffer);
  });

  app.put('/api/patients/:id/vision-hearing', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target || !target.rmp) return reply.code(404).send({ error: 'Seafarer RMP record not found.' });

    const vh = req.body as SeafarerRmpData['visionHearing'];
    const nextRmp: SeafarerRmpData = {
      ...target.rmp,
      visionHearing: vh,
    };

    db.prepare('UPDATE patients SET rmp_json = ? WHERE id = ?').run(JSON.stringify(nextRmp), id);
    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'Recorded Vision & Hearing (RQF-603-01)',
      target.recordNo,
      `Distance aided R:${vh.distanceAided.right}/L:${vh.distanceAided.left}, Colour: ${vh.colourVisionCie}.`
    );
    return { ok: true };
  });

  app.put('/api/patients/:id/statutory-criteria', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target || !target.rmp) return reply.code(404).send({ error: 'Seafarer RMP record not found.' });

    const criteria = req.body as SeafarerRmpData['statutoryCriteria'];
    const nextRmp: SeafarerRmpData = {
      ...target.rmp,
      statutoryCriteria: criteria,
    };

    db.prepare('UPDATE patients SET rmp_json = ? WHERE id = ?').run(JSON.stringify(nextRmp), id);
    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'Assessed A-I/9.2 Criteria (RQF-602-01)',
      target.recordNo,
      `Recorded Section A-I/9.2 statutory fitness criteria (Lookout: ${criteria.fitForLookout ? 'Yes' : 'No'}).`
    );
    return { ok: true };
  });

  app.post('/api/patients/:id/determination', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target || !target.rmp) return reply.code(404).send({ error: 'Seafarer RMP record not found.' });

    const body = (req.body || {}) as {
      determination: Exclude<FitnessDetermination, 'Pending'>;
      basis: string;
      limitationText?: string;
      reviewNoticeSigned?: boolean;
    };

    if (body.determination === 'Fit' && evaluateDeckLookoutBlock(target.rmp)) {
      return reply.code(400).send({
        error:
          'Blocked (STCW Table A-I/9.5): Zero discretion for Deck/Lookout visual or colour failure. Select Fit with limitation or Not fit.',
      });
    }

    const ts = formatNowTimestamp();
    const needsReviewNotice =
      body.determination === 'Not fit' || body.determination === 'Fit with limitation';
    const nextStage: PatientStage =
      body.determination === 'Not fit' ? 'Discharged' : 'Second assessment';
    const nextStatus = body.determination === 'Not fit' ? 'Inactive' : 'Active';
    const nextLocation =
      body.determination === 'Not fit'
        ? 'Closed — Not Fit (QAF-804-02 Issued)'
        : 'Certification Desk (RQC-701-01 Check)';

    const nextRmp: SeafarerRmpData = {
      ...target.rmp,
      determination: body.determination,
      determinationBasis: body.basis,
      limitationText:
        body.determination === 'Fit with limitation' ? body.limitationText : undefined,
      rightOfReview: needsReviewNotice
        ? {
            issuedAt: ts,
            seafarerSigned: body.reviewNoticeSigned ?? true,
            reviewRequested: false,
          }
        : undefined,
    };

    const publicOutcome =
      body.determination === 'Fit'
        ? 'Fitness determination recorded: Fit (awaiting QAF-805-01 certificate issue).'
        : body.determination === 'Fit with limitation'
        ? `Fitness determination recorded: Fit with limitation ("${body.limitationText || 'Specified restriction'}"). QAF-804-02 Right of Review issued.`
        : 'Fitness determination recorded: Not fit (no certificate issued; mandatory QAF-804-02 Right of Review issued).';

    db.prepare(
      `UPDATE patients
       SET status = ?, current_stage = ?, current_location = ?, rmp_json = ?
       WHERE id = ?`
    ).run(nextStatus, nextStage, nextLocation, JSON.stringify(nextRmp), id);

    upsertTimeline(db, id, nextStage, user.fullName, user.roleTitle, publicOutcome);
    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      `Fitness Determination: ${body.determination} (RQP-605)`,
      target.recordNo,
      `${body.determination}${needsReviewNotice ? ' · QAF-804-02 Right of Review issued' : ''}.`
    );

    return { ok: true };
  });

  app.post('/api/patients/:id/issue-certificate', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const { id } = req.params as { id: string };
    const target = getPatientById(db, id);
    if (!target || !target.rmp) {
      return reply.code(404).send({ ok: false, error: 'Seafarer RMP record not found.' });
    }

    const pendingOrders = target.orders.filter((o) => o.status !== 'Published');
    if (pendingOrders.length > 0) {
      return reply.code(400).send({
        ok: false,
        error: `Cannot issue certificate while ${pendingOrders.length} investigation(s) remain pending (RQP-604 §7.5).`,
      });
    }

    if (target.rmp.determination !== 'Fit' && target.rmp.determination !== 'Fit with limitation') {
      return reply.code(400).send({
        ok: false,
        error:
          'A certificate may only be issued for a Fit or Fit with limitation determination (RQP-701 §7.1).',
      });
    }

    const body = (req.body || {}) as {
      serialNo: string;
      secondCheckerName: string;
      seafarerSigned: boolean;
      validityMonths?: number;
    };

    const stockRow = db
      .prepare('SELECT * FROM certificate_stock WHERE serial_no = ?')
      .get(body.serialNo) as { serial_no: string; status: string } | undefined;

    if (!stockRow || (stockRow.status !== 'Issued to RMP' && stockRow.status !== 'In Cabinet')) {
      return reply.code(400).send({
        ok: false,
        error: 'Selected certificate serial number is not available in stock.',
      });
    }

    const maxYears: 1 | 2 = target.rmp.isUnder18 ? 1 : 2;
    const maxMonths = maxYears * 12;
    const chosenMonths = Math.min(body.validityMonths || maxMonths, maxMonths);

    const examDateObj = new Date();
    const expiryObj = new Date(examDateObj);
    expiryObj.setMonth(expiryObj.getMonth() + chosenMonths);
    const examDateStr = formatDateShort(examDateObj);
    const expiryStr = formatDateShort(expiryObj);
    const ts = formatNowTimestamp(examDateObj);

    const cert: IssuedCertificate = {
      certificateNo: body.serialNo,
      supplementNo: `${body.serialNo}-S`,
      examinationDate: examDateStr,
      issueDate: examDateStr,
      expiryDate: expiryStr,
      maxValidityYears: maxYears,
      determination: target.rmp.determination,
      limitation: target.rmp.limitationText,
      fitForLookout: target.rmp.statutoryCriteria.fitForLookout,
      visualAidsRequired: target.rmp.visionHearing.visualAidsRequired,
      unaidedHearingSatisfactory: target.rmp.visionHearing.unaidedHearingSatisfactory,
      colourVisionDate: target.rmp.visionHearing.colourVisionLastDate,
      practitionerName: user.fullName,
      practitionerMdcn: user.licenseNo || 'MDCN Registered',
      secondCheckerName: body.secondCheckerName,
      seafarerSigned: body.seafarerSigned,
    };

    const nextRmp: SeafarerRmpData = {
      ...target.rmp,
      issuedCertificate: cert,
    };

    db.exec('BEGIN;');
    try {
      db.prepare(
        `UPDATE certificate_stock
         SET status = 'Used', assigned_to = ?, record_no = ?, seafarer_name = ?, updated_at = ?
         WHERE serial_no = ?`
      ).run(user.fullName, target.recordNo, target.fullName, ts, body.serialNo);

      db.prepare(
        `UPDATE patients
         SET status = 'Inactive', current_stage = 'Discharged', current_location = ?, rmp_json = ?
         WHERE id = ?`
      ).run(`Certificate Issued (${body.serialNo})`, JSON.stringify(nextRmp), id);

      upsertTimeline(
        db,
        id,
        'Discharged',
        user.fullName,
        user.roleTitle,
        `STCW Reg. I/9 Certificate ${body.serialNo} + Supplement ${body.serialNo}-S issued (${cert.determination}; valid until ${expiryStr}).`
      );

      appendAudit(
        db,
        user.fullName,
        user.roleTitle,
        'Issued Medical Certificate (QAF-805-01)',
        target.recordNo,
        `Issued ${body.serialNo} + ${body.serialNo}-S (${cert.determination}; expiry ${expiryStr}; 2nd check by ${body.secondCheckerName}).`
      );
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return { ok: true, certificate: cert };
  });

  app.post('/api/session-check', async (req, reply) => {
    const user = requireAuth(db, req, reply, ['DOCTOR', 'ADMIN']);
    if (!user) return;
    const nowTs = formatNowTimestamp();
    const today = formatDateShort();
    const mdcn = user.licenseNo || 'MDCN Registered';

    db.prepare(
      `INSERT INTO session_recognition_checks (
        check_date, practitioner_name, mdcn_no, on_agency_register, premises_in_scope, licence_valid, confirmed_at
      ) VALUES (?, ?, ?, 1, 1, 1, ?)`
    ).run(today, user.fullName, mdcn, nowTs);

    appendAudit(
      db,
      user.fullName,
      user.roleTitle,
      'Session-Start Check (RQW-001)',
      'RQC-301-01',
      `Confirmed current entry on NIMASA QAR-803-01 register, premises in scope, and valid licence (${mdcn}).`
    );

    return { ok: true };
  });
}
