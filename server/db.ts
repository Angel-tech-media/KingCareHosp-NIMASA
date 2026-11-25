import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import type {
  AuditLogEntry,
  AuthUser,
  CertificateStockItem,
  ClinicalNoteEntry,
  ClinicalNoteType,
  DailyEquipmentCheckState,
  DepartmentCertificate,
  DepartmentEquipment,
  DepartmentMaster,
  DepartmentStaff,
  DiagnosticOrder,
  MedicationItem,
  PatientRecord,
  PatientStage,
  PatientStatus,
  PracticeSettings,
  RoleType,
  SeafarerRmpData,
  SessionRecognitionCheck,
  StageHistoryEntry,
  SystemUser,
  VerificationEnquiry,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DB_PATH = path.join(__dirname, 'data', 'kingscare.db');
export const UPLOADS_DIR = path.join(__dirname, 'data', 'uploads');

export function formatDateShort(date = new Date()): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatNowTimestamp(date = new Date()): string {
  const datePart = formatDateShort(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${datePart}, ${hours}:${mins}`;
}

export function calculateAgeYears(dobIso: string): number {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return 25;
  const ref = new Date();
  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function openDatabase(customPath = DB_PATH): DatabaseSync {
  fs.mkdirSync(path.dirname(customPath), { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const db = new DatabaseSync(customPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS practice_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      practice_name TEXT NOT NULL,
      address TEXT NOT NULL,
      state_facility_reg_no TEXT NOT NULL,
      certificate_no TEXT NOT NULL,
      recognition_status TEXT NOT NULL,
      recognized_from TEXT NOT NULL,
      expires_on TEXT NOT NULL,
      renewal_check_due TEXT NOT NULL,
      engagement_signed TEXT NOT NULL,
      return_frequency TEXT NOT NULL,
      medical_director TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role_title TEXT NOT NULL,
      portal_role TEXT NOT NULL,
      department TEXT NOT NULL,
      license_no TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      last_login TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_seen_at TEXT
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_code TEXT NOT NULL,
      floor_location TEXT NOT NULL,
      description TEXT NOT NULL,
      hod_name TEXT NOT NULL,
      hod_title TEXT NOT NULL,
      hod_qualifications TEXT NOT NULL,
      hod_fellowship TEXT NOT NULL,
      hod_years_experience INTEGER NOT NULL DEFAULT 0,
      hod_email TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS department_staff (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      qualification TEXT NOT NULL,
      license_no TEXT NOT NULL,
      shift TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      manufacturer TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL,
      year_of_make INTEGER NOT NULL,
      serial_no TEXT NOT NULL,
      calibration_cert_no TEXT NOT NULL DEFAULT '',
      last_calibrated TEXT NOT NULL DEFAULT '',
      next_calibration_due TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Operational',
      daily_check_passed INTEGER NOT NULL DEFAULT 1,
      daily_checked_by TEXT NOT NULL DEFAULT '',
      daily_checked_at TEXT NOT NULL DEFAULT '',
      registered_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS department_certificates (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      issuing_body TEXT NOT NULL,
      certificate_no TEXT NOT NULL,
      year_certified INTEGER NOT NULL,
      expiry_date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      record_no TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT NOT NULL,
      nimasa_member INTEGER NOT NULL,
      nimasa_staff_id TEXT,
      nimasa_department TEXT,
      consent_to_share_with_nimasa INTEGER NOT NULL,
      status TEXT NOT NULL,
      current_stage TEXT NOT NULL,
      current_location TEXT NOT NULL,
      is_admitted INTEGER NOT NULL DEFAULT 0,
      ward_room TEXT,
      arrived_at TEXT NOT NULL,
      time_in_hospital TEXT NOT NULL,
      vitals_json TEXT NOT NULL,
      first_assessment_summary TEXT,
      first_assessment_full_note TEXT,
      second_assessment_note TEXT,
      medications_json TEXT NOT NULL,
      discharge_summary TEXT,
      rmp_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patient_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      stage TEXT NOT NULL,
      reached_at TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      public_summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patient_clinical_notes (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      note_type TEXT NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL,
      author_license TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS diagnostic_orders (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      record_no TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      department TEXT NOT NULL,
      category TEXT NOT NULL,
      test_name TEXT NOT NULL,
      clinical_instruction TEXT,
      attachment_name TEXT,
      attachment_mime TEXT,
      attachment_path TEXT,
      ordered_by TEXT NOT NULL,
      ordered_at TEXT NOT NULL,
      status TEXT NOT NULL,
      draft_findings TEXT,
      published_result TEXT,
      reference_range TEXT,
      scientist_remarks TEXT,
      completed_by TEXT,
      published_at TEXT
    );

    CREATE TABLE IF NOT EXISTS certificate_stock (
      serial_no TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      assigned_to TEXT,
      record_no TEXT,
      seafarer_name TEXT,
      updated_at TEXT NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS session_recognition_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      check_date TEXT NOT NULL,
      practitioner_name TEXT NOT NULL,
      mdcn_no TEXT NOT NULL,
      on_agency_register INTEGER NOT NULL,
      premises_in_scope INTEGER NOT NULL,
      licence_valid INTEGER NOT NULL,
      confirmed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_enquiries (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      enquirer TEXT NOT NULL,
      certificate_no TEXT NOT NULL,
      result TEXT NOT NULL,
      outcome_summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      record_no TEXT NOT NULL,
      details TEXT NOT NULL
    );
  `);

  // Idempotent column migrations for existing databases
  const sessionCols = (
    db.prepare('PRAGMA table_info(sessions)').all() as { name: string }[]
  ).map((c) => c.name);
  if (!sessionCols.includes('last_seen_at')) {
    db.exec('ALTER TABLE sessions ADD COLUMN last_seen_at TEXT;');
  }

  const orderCols = (
    db.prepare('PRAGMA table_info(diagnostic_orders)').all() as { name: string }[]
  ).map((c) => c.name);
  const missingCols: [string, string][] = [
    ['clinical_instruction', 'TEXT'],
    ['attachment_name', 'TEXT'],
    ['attachment_mime', 'TEXT'],
    ['attachment_path', 'TEXT'],
  ];
  for (const [col, colType] of missingCols) {
    if (!orderCols.includes(col)) {
      db.exec(`ALTER TABLE diagnostic_orders ADD COLUMN ${col} ${colType};`);
    }
  }

  // Idempotent backfill: preserve any pre-existing assessment notes into patient_clinical_notes
  const legacyNoteRows = db
    .prepare(
      `SELECT id, first_assessment_summary, first_assessment_full_note, second_assessment_note, created_at
       FROM patients
       WHERE (first_assessment_full_note IS NOT NULL AND trim(first_assessment_full_note) <> '')
          OR (second_assessment_note IS NOT NULL AND trim(second_assessment_note) <> '')`
    )
    .all() as Record<string, unknown>[];

  for (const pRow of legacyNoteRows) {
    const pid = String(pRow.id);
    const existingCount = (
      db
        .prepare('SELECT COUNT(*) AS cnt FROM patient_clinical_notes WHERE patient_id = ?')
        .get(pid) as { cnt: number }
    ).cnt;
    if (existingCount > 0) continue;

    if (pRow.first_assessment_full_note && String(pRow.first_assessment_full_note).trim()) {
      const t1 = db
        .prepare(
          `SELECT actor_name, actor_role, reached_at FROM patient_timeline
           WHERE patient_id = ? AND stage IN ('First assessment complete', 'In assessment')
           ORDER BY id DESC LIMIT 1`
        )
        .get(pid) as Record<string, unknown> | undefined;
      db.prepare(
        `INSERT INTO patient_clinical_notes (
          id, patient_id, note_type, summary, content, author_name, author_role, author_license, created_at
        ) VALUES (?, ?, 'Initial Examination', ?, ?, ?, ?, NULL, ?)`
      ).run(
        `cn-init-${pid}`,
        pid,
        pRow.first_assessment_summary ? String(pRow.first_assessment_summary) : null,
        String(pRow.first_assessment_full_note).trim(),
        t1?.actor_name ? String(t1.actor_name) : 'Examining RMP',
        t1?.actor_role ? String(t1.actor_role) : 'Recognized Medical Practitioner (RMP)',
        t1?.reached_at ? String(t1.reached_at) : String(pRow.created_at)
      );
    }

    if (pRow.second_assessment_note && String(pRow.second_assessment_note).trim()) {
      const t2 = db
        .prepare(
          `SELECT actor_name, actor_role, reached_at FROM patient_timeline
           WHERE patient_id = ? AND stage = 'Second assessment'
           ORDER BY id DESC LIMIT 1`
        )
        .get(pid) as Record<string, unknown> | undefined;
      db.prepare(
        `INSERT INTO patient_clinical_notes (
          id, patient_id, note_type, summary, content, author_name, author_role, author_license, created_at
        ) VALUES (?, ?, 'Follow-Up Review', NULL, ?, ?, ?, NULL, ?)`
      ).run(
        `cn-rev-${pid}`,
        pid,
        String(pRow.second_assessment_note).trim(),
        t2?.actor_name ? String(t2.actor_name) : 'Examining RMP',
        t2?.actor_role ? String(t2.actor_role) : 'Recognized Medical Practitioner (RMP)',
        t2?.reached_at ? String(t2.reached_at) : String(pRow.created_at)
      );
    }
  }

  ensureBaseStructure(db);
  return db;
}

export function ensureBaseStructure(db: DatabaseSync): void {
  const existingPractice = db
    .prepare('SELECT id FROM practice_settings WHERE id = 1')
    .get();

  if (!existingPractice) {
    db.prepare(
      `INSERT INTO practice_settings (
        id, practice_name, address, state_facility_reg_no, certificate_no,
        recognition_status, recognized_from, expires_on, renewal_check_due,
        engagement_signed, return_frequency, medical_director, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      1,
      'Kingscare Hospitals Limited',
      'Plot 2181, Ibrahim Babangida Way, Wuse Zone 4, Abuja',
      'FCT-PHMC-2024-0892',
      'NIM-RMP-ABJ-2025-014',
      'Full',
      '15 Jan 2025',
      '14 Jan 2028',
      '14 Jul 2027',
      '12 Jan 2025',
      'Monthly (within 10 working days)',
      'Medical Director (MDCN Registered)',
      formatNowTimestamp()
    );
  }

  const baseDepartments = [
    {
      id: 'lab',
      name: 'Laboratory & Pathology Services',
      short_code: 'DEPT-LAB',
      floor_location: 'Ground Floor, East Wing (Suite G-04)',
      description:
        'Haematology, chemical pathology, medical microbiology, urinalysis, and screening tests.',
      hod_name: 'Unassigned HOD',
      hod_title: 'Head of Department, Pathology & Laboratory Medicine',
      hod_qualifications: 'Pending entry',
      hod_fellowship: 'MLSCN',
      hod_years_experience: 0,
      hod_email: 'lab@kingscarehospitals.com',
    },
    {
      id: 'radiology',
      name: 'Radiology / X-Ray & Diagnostic Imaging',
      short_code: 'DEPT-RAD',
      floor_location: 'Ground Floor, North Wing (Suite G-11)',
      description:
        'Digital chest radiography, ultrasound scanning, and ECG telemetry for seafarer screening.',
      hod_name: 'Unassigned HOD',
      hod_title: 'Head of Department, Radiology & Imaging',
      hod_qualifications: 'Pending entry',
      hod_fellowship: 'NNRA / WACS',
      hod_years_experience: 0,
      hod_email: 'radiology@kingscarehospitals.com',
    },
    {
      id: 'ent',
      name: 'ENT & Audiology Unit',
      short_code: 'DEPT-ENT',
      floor_location: 'First Floor, Clinical Suite 1-03',
      description:
        'Pure-tone unaided audiometry (500-3000 Hz) and vestibular screening per STCW Table A-I/9.',
      hod_name: 'Unassigned HOD',
      hod_title: 'Head of Unit, Otorhinolaryngology & Audiology',
      hod_qualifications: 'Pending entry',
      hod_fellowship: 'ORL',
      hod_years_experience: 0,
      hod_email: 'ent@kingscarehospitals.com',
    },
    {
      id: 'eye',
      name: 'Ophthalmology & Colour Vision Clinic',
      short_code: 'DEPT-EYE',
      floor_location: 'First Floor, Clinical Suite 1-07',
      description:
        'Distance/near visual acuity charts, Ishihara colour plate testing under D65 light, and visual fields.',
      hod_name: 'Unassigned HOD',
      hod_title: 'Head of Unit, Ophthalmology & Optometry',
      hod_qualifications: 'Pending entry',
      hod_fellowship: 'ODORBN / WACS',
      hod_years_experience: 0,
      hod_email: 'eye@kingscarehospitals.com',
    },
  ];

  const insertDept = db.prepare(
    `INSERT OR IGNORE INTO departments (
      id, name, short_code, floor_location, description,
      hod_name, hod_title, hod_qualifications, hod_fellowship, hod_years_experience, hod_email
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const d of baseDepartments) {
    insertDept.run(
      d.id,
      d.name,
      d.short_code,
      d.floor_location,
      d.description,
      d.hod_name,
      d.hod_title,
      d.hod_qualifications,
      d.hod_fellowship,
      d.hod_years_experience,
      d.hod_email
    );
  }
}

export function appendAudit(
  db: DatabaseSync,
  actorName: string,
  actorRole: string,
  action: string,
  recordNo: string,
  details: string
): void {
  const id = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  db.prepare(
    `INSERT INTO audit_logs (id, timestamp, actor_name, actor_role, action, record_no, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, formatNowTimestamp(), actorName, actorRole, action, recordNo, details);
}

export function appendClinicalNote(
  db: DatabaseSync,
  params: {
    patientId: string;
    noteType: ClinicalNoteType;
    summary?: string;
    content: string;
    authorName: string;
    authorRole: string;
    authorLicense?: string;
  }
): ClinicalNoteEntry {
  const id = `cn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = formatNowTimestamp();
  const cleanSummary = params.summary?.trim() || undefined;
  const cleanContent = params.content.trim();
  const cleanLicense = params.authorLicense?.trim() || undefined;

  db.prepare(
    `INSERT INTO patient_clinical_notes (
      id, patient_id, note_type, summary, content, author_name, author_role, author_license, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.patientId,
    params.noteType,
    cleanSummary ?? null,
    cleanContent,
    params.authorName,
    params.authorRole,
    cleanLicense ?? null,
    createdAt
  );

  return {
    id,
    noteType: params.noteType,
    summary: cleanSummary,
    content: cleanContent,
    authorName: params.authorName,
    authorRole: params.authorRole,
    authorLicense: cleanLicense,
    createdAt,
  };
}

export function getPracticeSettings(db: DatabaseSync): PracticeSettings {
  const row = db
    .prepare('SELECT * FROM practice_settings WHERE id = 1')
    .get() as Record<string, unknown>;

  return {
    practiceName: String(row.practice_name),
    address: String(row.address),
    certificateNo: String(row.certificate_no),
    status: String(row.recognition_status),
    recognizedFrom: String(row.recognized_from),
    expiresOn: String(row.expires_on),
    renewalCheckDue: String(row.renewal_check_due),
    engagementSigned: String(row.engagement_signed),
    returnFrequency: String(row.return_frequency),
    stateFacilityRegNo: String(row.state_facility_reg_no),
    medicalDirector: String(row.medical_director),
  };
}

export function getPatientById(db: DatabaseSync, id: string): PatientRecord | null {
  const row = db
    .prepare('SELECT * FROM patients WHERE id = ?')
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;

  const timelineRows = db
    .prepare('SELECT * FROM patient_timeline WHERE patient_id = ? ORDER BY id ASC')
    .all(id) as Record<string, unknown>[];

  const orderRows = db
    .prepare('SELECT * FROM diagnostic_orders WHERE patient_id = ? ORDER BY rowid DESC')
    .all(id) as Record<string, unknown>[];

  const noteRows = db
    .prepare('SELECT * FROM patient_clinical_notes WHERE patient_id = ? ORDER BY rowid ASC')
    .all(id) as Record<string, unknown>[];

  const clinicalNotes: ClinicalNoteEntry[] = noteRows.map((n) => ({
    id: String(n.id),
    noteType: String(n.note_type) as ClinicalNoteType,
    summary: n.summary ? String(n.summary) : undefined,
    content: String(n.content),
    authorName: String(n.author_name),
    authorRole: String(n.author_role),
    authorLicense: n.author_license ? String(n.author_license) : undefined,
    createdAt: String(n.created_at),
  }));

  const timeline: StageHistoryEntry[] = timelineRows.map((t) => ({
    stage: String(t.stage) as PatientStage,
    reachedAt: String(t.reached_at),
    actorName: String(t.actor_name),
    actorRole: String(t.actor_role),
    publicSummary: String(t.public_summary),
  }));

  const orders: DiagnosticOrder[] = orderRows.map((o) => ({
    id: String(o.id),
    patientId: String(o.patient_id),
    recordNo: String(o.record_no),
    patientName: String(o.patient_name),
    department: String(o.department) as DiagnosticOrder['department'],
    category: String(o.category) as DiagnosticOrder['category'],
    testName: String(o.test_name),
    clinicalInstruction: o.clinical_instruction ? String(o.clinical_instruction) : undefined,
    attachmentName: o.attachment_name ? String(o.attachment_name) : undefined,
    attachmentMime: o.attachment_mime ? String(o.attachment_mime) : undefined,
    orderedBy: String(o.ordered_by),
    orderedAt: String(o.ordered_at),
    status: String(o.status) as DiagnosticOrder['status'],
    draftFindings: o.draft_findings ? String(o.draft_findings) : undefined,
    publishedResult: o.published_result ? String(o.published_result) : undefined,
    referenceRange: o.reference_range ? String(o.reference_range) : undefined,
    scientistRemarks: o.scientist_remarks ? String(o.scientist_remarks) : undefined,
    completedBy: o.completed_by ? String(o.completed_by) : undefined,
    publishedAt: o.published_at ? String(o.published_at) : undefined,
  }));

  let vitals = { bp: '120/78 mmHg', temp: '36.8 °C', pulse: '74 bpm', spo2: '99%', weight: '74 kg' };
  let medications: MedicationItem[] = [];
  let rmp: SeafarerRmpData | undefined = undefined;

  try {
    vitals = JSON.parse(String(row.vitals_json));
  } catch {
    // fallback default
  }
  try {
    medications = JSON.parse(String(row.medications_json));
  } catch {
    medications = [];
  }
  if (row.rmp_json) {
    try {
      rmp = JSON.parse(String(row.rmp_json)) as SeafarerRmpData;
    } catch {
      rmp = undefined;
    }
  }

  return {
    id: String(row.id),
    recordNo: String(row.record_no),
    fullName: String(row.full_name),
    dob: String(row.dob),
    gender: String(row.gender) as 'Male' | 'Female',
    phone: String(row.phone),
    nimasaMember: Boolean(row.nimasa_member),
    nimasaStaffId: row.nimasa_staff_id ? String(row.nimasa_staff_id) : undefined,
    nimasaDepartment: row.nimasa_department ? String(row.nimasa_department) : undefined,
    consentToShareWithNimasa: Boolean(row.consent_to_share_with_nimasa),
    status: String(row.status) as PatientStatus,
    currentStage: String(row.current_stage) as PatientStage,
    currentLocation: String(row.current_location),
    isAdmitted: Boolean(row.is_admitted),
    wardRoom: row.ward_room ? String(row.ward_room) : undefined,
    arrivedAt: String(row.arrived_at),
    timeInHospital: String(row.time_in_hospital),
    vitals,
    firstAssessmentSummary: row.first_assessment_summary
      ? String(row.first_assessment_summary)
      : undefined,
    firstAssessmentFullNote: row.first_assessment_full_note
      ? String(row.first_assessment_full_note)
      : undefined,
    secondAssessmentNote: row.second_assessment_note
      ? String(row.second_assessment_note)
      : undefined,
    clinicalNotes,
    medications,
    dischargeSummary: row.discharge_summary ? String(row.discharge_summary) : undefined,
    timeline,
    orders,
    rmp,
  };
}

function redactVisionHearing(
  vh: SeafarerRmpData['visionHearing'],
  mode: 'none' | 'eye' | 'ent'
): SeafarerRmpData['visionHearing'] {
  if (mode === 'eye') {
    return {
      ...vh,
      audiometryRight: { hz500: 0, hz1000: 0, hz2000: 0, hz3000: 0 },
      audiometryLeft: { hz500: 0, hz1000: 0, hz2000: 0, hz3000: 0 },
      unaidedHearingSatisfactory: false,
      speechClear: false,
    };
  }
  if (mode === 'ent') {
    return {
      ...vh,
      distanceUnaided: { right: '—', left: '—', both: '—' },
      distanceAided: { right: '—', left: '—', both: '—' },
      visualAidsRequired: false,
      nearVisionMet: false,
      intermediateVisionMet: false,
      visualFieldsNormal: false,
      nightVisionNormal: false,
      diplopiaAbsent: false,
      colourVisionLastDate: '—',
      colourVisionTestMethod: 'Restricted (QA-P-808)',
      colourVisionCie: 'Not tested',
      colourVisionReferred: false,
    };
  }
  return {
    distanceUnaided: { right: '—', left: '—', both: '—' },
    distanceAided: { right: '—', left: '—', both: '—' },
    visualAidsRequired: vh.visualAidsRequired,
    nearVisionMet: false,
    intermediateVisionMet: false,
    visualFieldsNormal: false,
    nightVisionNormal: false,
    diplopiaAbsent: false,
    colourVisionLastDate: vh.colourVisionLastDate,
    colourVisionTestMethod: 'Restricted (QA-P-808)',
    colourVisionCie: 'Not tested',
    colourVisionReferred: vh.colourVisionReferred,
    audiometryRight: { hz500: 0, hz1000: 0, hz2000: 0, hz3000: 0 },
    audiometryLeft: { hz500: 0, hz1000: 0, hz2000: 0, hz3000: 0 },
    unaidedHearingSatisfactory: vh.unaidedHearingSatisfactory,
    speechClear: false,
    testedBy: undefined,
  };
}

function redactForNimasa(p: PatientRecord): PatientRecord {
  const safeOrders: DiagnosticOrder[] = p.orders.map((o) => ({
    ...o,
    clinicalInstruction: undefined,
    attachmentName: undefined,
    attachmentMime: undefined,
    draftFindings: undefined,
    publishedResult: o.status === 'Published' ? 'Completed (clinical result restricted under QA-P-808)' : undefined,
    scientistRemarks: undefined,
  }));

  const safeRmp: SeafarerRmpData | undefined = p.rmp
    ? {
        ...p.rmp,
        visionHearing: redactVisionHearing(p.rmp.visionHearing, 'none'),
        determinationBasis: p.rmp.determinationBasis
          ? 'Clinical rationale restricted to Examining RMP (QA-P-808)'
          : undefined,
      }
    : undefined;

  return {
    ...p,
    vitals: {
      bp: 'Restricted',
      temp: '—',
      pulse: '—',
      spo2: '—',
      weight: '—',
    },
    firstAssessmentSummary: undefined,
    firstAssessmentFullNote: undefined,
    secondAssessmentNote: undefined,
    clinicalNotes: [],
    medications: [],
    dischargeSummary: undefined,
    orders: safeOrders,
    rmp: safeRmp,
  };
}

function redactForFrontDesk(p: PatientRecord): PatientRecord {
  const safeRmp: SeafarerRmpData | undefined = p.rmp
    ? {
        ...p.rmp,
        determinationBasis: undefined,
        limitationText: undefined,
        rightOfReview: undefined,
        visionHearing: redactVisionHearing(p.rmp.visionHearing, 'none'),
        statutoryCriteria: {
          physicalCapabilityBasicTraining: false,
          hearingAndSpeechAdequate: false,
          noConditionPreventingDuties: false,
          noConditionAggravatedBySea: false,
          noImpairingMedication: false,
          fitForLookout: p.rmp.statutoryCriteria.fitForLookout,
        },
      }
    : undefined;

  return {
    ...p,
    vitals: {
      bp: 'Restricted',
      temp: '—',
      pulse: '—',
      spo2: '—',
      weight: '—',
    },
    firstAssessmentSummary: undefined,
    firstAssessmentFullNote: undefined,
    secondAssessmentNote: undefined,
    clinicalNotes: [],
    medications: [],
    dischargeSummary: undefined,
    orders: [],
    timeline: p.timeline.map((t) => ({
      ...t,
      publicSummary: `Stage reached: ${t.stage}`,
    })),
    rmp: safeRmp,
  };
}

const DEPT_BY_ROLE: Partial<Record<RoleType, DiagnosticOrder['department']>> = {
  LAB: 'Laboratory',
  RADIOLOGY: 'Radiology',
  ENT: 'ENT & Audiology',
  EYE: 'Eye Clinic',
};

const DEPT_ID_BY_ROLE: Partial<Record<RoleType, DepartmentMaster['id']>> = {
  LAB: 'lab',
  RADIOLOGY: 'radiology',
  ENT: 'ent',
  EYE: 'eye',
};

function redactForDiagnosticDept(p: PatientRecord, role: RoleType): PatientRecord {
  const allowedDept = DEPT_BY_ROLE[role];
  const deptOrders = allowedDept ? p.orders.filter((o) => o.department === allowedDept) : [];
  const vhMode = role === 'EYE' ? 'eye' : role === 'ENT' ? 'ent' : 'none';

  const safeRmp: SeafarerRmpData | undefined = p.rmp
    ? {
        ...p.rmp,
        determinationBasis: undefined,
        limitationText: undefined,
        rightOfReview: undefined,
        issuedCertificate: undefined,
        visionHearing: redactVisionHearing(p.rmp.visionHearing, vhMode),
        statutoryCriteria: {
          physicalCapabilityBasicTraining: false,
          hearingAndSpeechAdequate: false,
          noConditionPreventingDuties: false,
          noConditionAggravatedBySea: false,
          noImpairingMedication: false,
          fitForLookout: p.rmp.statutoryCriteria.fitForLookout,
        },
      }
    : undefined;

  return {
    ...p,
    vitals: {
      bp: 'Restricted',
      temp: '—',
      pulse: '—',
      spo2: '—',
      weight: '—',
    },
    firstAssessmentSummary: undefined,
    firstAssessmentFullNote: undefined,
    secondAssessmentNote: undefined,
    clinicalNotes: [],
    medications: [],
    dischargeSummary: undefined,
    timeline: [],
    orders: deptOrders,
    rmp: safeRmp,
  };
}

export function getFullBootstrap(db: DatabaseSync, currentUser: AuthUser) {
  const practice = getPracticeSettings(db);
  const role = currentUser.portalRole;
  const ownDeptId = DEPT_ID_BY_ROLE[role];
  const canViewAllDepts = role === 'ADMIN' || role === 'DOCTOR';

  const eqRows = db
    .prepare(
      `SELECT e.*, d.name AS department_name
       FROM equipment e
       JOIN departments d ON d.id = e.department_id
       ORDER BY e.created_at DESC`
    )
    .all() as Record<string, unknown>[];

  let departments: DepartmentMaster[] = [];
  if (canViewAllDepts || ownDeptId) {
    const deptRows = (
      ownDeptId
        ? db.prepare('SELECT * FROM departments WHERE id = ? ORDER BY rowid ASC').all(ownDeptId)
        : db.prepare('SELECT * FROM departments ORDER BY rowid ASC').all()
    ) as Record<string, unknown>[];

    const staffRows = (
      ownDeptId
        ? db
            .prepare('SELECT * FROM department_staff WHERE department_id = ? ORDER BY created_at DESC')
            .all(ownDeptId)
        : db.prepare('SELECT * FROM department_staff ORDER BY created_at DESC').all()
    ) as Record<string, unknown>[];

    const certRows = (
      ownDeptId
        ? db
            .prepare(
              'SELECT * FROM department_certificates WHERE department_id = ? ORDER BY created_at DESC'
            )
            .all(ownDeptId)
        : db.prepare('SELECT * FROM department_certificates ORDER BY created_at DESC').all()
    ) as Record<string, unknown>[];

    departments = deptRows.map((d) => {
      const deptId = String(d.id) as DepartmentMaster['id'];
      const staff: DepartmentStaff[] = staffRows
        .filter((s) => String(s.department_id) === deptId)
        .map((s) => ({
          id: String(s.id),
          name: String(s.name),
          role: String(s.role),
          qualification: String(s.qualification),
          licenseNo: String(s.license_no),
          shift: String(s.shift),
        }));

      const equipment: DepartmentEquipment[] = eqRows
        .filter((e) => String(e.department_id) === deptId)
        .map((e) => ({
          id: String(e.id),
          name: String(e.name),
          manufacturer: String(e.manufacturer || ''),
          model: String(e.model),
          yearOfMake: Number(e.year_of_make),
          serialNo: String(e.serial_no),
          calibrationCertNo: String(e.calibration_cert_no || ''),
          lastCalibrated: String(e.last_calibrated || ''),
          nextCalibrationDue: String(e.next_calibration_due || ''),
          registeredBy: String(e.registered_by || ''),
          status: String(e.status) as DepartmentEquipment['status'],
        }));

      const certificates: DepartmentCertificate[] = certRows
        .filter((c) => String(c.department_id) === deptId)
        .map((c) => ({
          id: String(c.id),
          type: String(c.type),
          issuingBody: String(c.issuing_body),
          certificateNo: String(c.certificate_no),
          yearCertified: Number(c.year_certified),
          expiryDate: String(c.expiry_date),
          status: String(c.status) as DepartmentCertificate['status'],
        }));

      return {
        id: deptId,
        name: String(d.name),
        shortCode: String(d.short_code),
        floorLocation: String(d.floor_location),
        description: String(d.description),
        hod: {
          name: String(d.hod_name),
          title: String(d.hod_title),
          qualifications: String(d.hod_qualifications),
          fellowship: String(d.hod_fellowship),
          yearsExperience: Number(d.hod_years_experience),
          email: String(d.hod_email),
        },
        staff,
        equipment,
        certificates,
      };
    });
  }

  let users: SystemUser[] = [];
  if (role === 'ADMIN') {
    const userRows = db
      .prepare(
        'SELECT id, full_name, email, role_title, portal_role, department, license_no, status, last_login FROM users ORDER BY created_at DESC'
      )
      .all() as Record<string, unknown>[];

    users = userRows.map((u) => ({
      id: String(u.id),
      name: String(u.full_name),
      email: String(u.email),
      role: String(u.role_title),
      portalCategory: String(u.portal_role) as RoleType,
      department: String(u.department),
      licenseNo: u.license_no ? String(u.license_no) : undefined,
      status: String(u.status) as SystemUser['status'],
      lastLogin: String(u.last_login),
    }));
  }

  const patientIds = db
    .prepare('SELECT id FROM patients ORDER BY rowid DESC')
    .all() as { id: string }[];

  let patients = patientIds
    .map((r) => getPatientById(db, r.id))
    .filter((p): p is PatientRecord => p !== null);

  if (role === 'NIMASA') {
    patients = patients
      .filter((p) => p.nimasaMember && p.consentToShareWithNimasa)
      .map(redactForNimasa);
  } else if (role === 'FRONT_DESK') {
    patients = patients.map(redactForFrontDesk);
  } else if (ownDeptId) {
    const allowedDept = DEPT_BY_ROLE[role];
    patients = patients
      .filter((p) => p.orders.some((o) => o.department === allowedDept))
      .map((p) => redactForDiagnosticDept(p, role));
  }

  let certificateStock: CertificateStockItem[] = [];
  if (canViewAllDepts || role === 'NIMASA') {
    const stockRows = db
      .prepare('SELECT * FROM certificate_stock ORDER BY serial_no ASC')
      .all() as Record<string, unknown>[];
    const consentedRecordNos = new Set(patients.map((p) => p.recordNo));

    certificateStock = stockRows.map((s) => {
      const recNo = s.record_no ? String(s.record_no) : undefined;
      const maskPii = role === 'NIMASA' && Boolean(recNo) && !consentedRecordNos.has(recNo!);
      return {
        serialNo: String(s.serial_no),
        status: String(s.status) as CertificateStockItem['status'],
        assignedTo: s.assigned_to ? String(s.assigned_to) : undefined,
        recordNo: maskPii ? undefined : recNo,
        seafarerName: maskPii ? undefined : s.seafarer_name ? String(s.seafarer_name) : undefined,
        updatedAt: String(s.updated_at),
        note: maskPii ? undefined : s.note ? String(s.note) : undefined,
      };
    });
  }

  const scopedEqRows = ownDeptId
    ? eqRows.filter((e) => String(e.department_id) === ownDeptId)
    : eqRows;
  const latestEqCheck = scopedEqRows.find((e) => Boolean(e.daily_checked_at));
  const dailyEquipmentCheck: DailyEquipmentCheckState = {
    date: formatDateShort(),
    checkedBy: latestEqCheck
      ? canViewAllDepts || ownDeptId
        ? String(latestEqCheck.daily_checked_by || 'Clinical Support Staff')
        : 'On-duty clinical team'
      : 'Awaiting first check',
    checkedAt: latestEqCheck ? String(latestEqCheck.daily_checked_at) : formatNowTimestamp(),
    items: scopedEqRows.map((e) => ({
      id: String(e.id),
      label:
        canViewAllDepts || ownDeptId
          ? `${String(e.name)}${e.model ? ` (${String(e.model)})` : ''}`
          : String(e.department_name),
      department: String(e.department_name),
      passed: Boolean(e.daily_check_passed),
    })),
  };

  let sessionCheck: SessionRecognitionCheck = {
    date: formatDateShort(),
    practitionerName: '',
    mdcnNo: '',
    onAgencyRegister: false,
    premisesInScope: false,
    licenceValid: false,
  };
  if (canViewAllDepts) {
    const sessionRow = db
      .prepare('SELECT * FROM session_recognition_checks ORDER BY id DESC LIMIT 1')
      .get() as Record<string, unknown> | undefined;

    sessionCheck = sessionRow
      ? {
          date: String(sessionRow.check_date),
          practitionerName: String(sessionRow.practitioner_name),
          mdcnNo: String(sessionRow.mdcn_no),
          onAgencyRegister: Boolean(sessionRow.on_agency_register),
          premisesInScope: Boolean(sessionRow.premises_in_scope),
          licenceValid: Boolean(sessionRow.licence_valid),
          confirmedAt: String(sessionRow.confirmed_at),
        }
      : {
          date: formatDateShort(),
          practitionerName: currentUser.fullName,
          mdcnNo: currentUser.licenseNo || 'Pending confirmation',
          onAgencyRegister: false,
          premisesInScope: false,
          licenceValid: false,
        };
  }

  let verificationEnquiries: VerificationEnquiry[] = [];
  if (role === 'ADMIN' || role === 'NIMASA') {
    const enquiryRows = db
      .prepare('SELECT * FROM verification_enquiries ORDER BY rowid DESC')
      .all() as Record<string, unknown>[];
    verificationEnquiries = enquiryRows.map((v) => ({
      id: String(v.id),
      timestamp: String(v.timestamp),
      enquirer: String(v.enquirer),
      certificateNo: String(v.certificate_no),
      result: String(v.result) as VerificationEnquiry['result'],
      outcomeSummary: String(v.outcome_summary),
    }));
  }

  const auditRows = (
    role === 'ADMIN'
      ? db.prepare('SELECT * FROM audit_logs ORDER BY rowid DESC LIMIT 200').all()
      : role === 'NIMASA'
      ? db
          .prepare(
            "SELECT * FROM audit_logs WHERE action = 'CERTIFICATE_VERIFICATION' ORDER BY rowid DESC LIMIT 50"
          )
          .all()
      : db
          .prepare('SELECT * FROM audit_logs WHERE actor_name = ? ORDER BY rowid DESC LIMIT 30')
          .all(currentUser.fullName)
  ) as Record<string, unknown>[];

  const auditLog: AuditLogEntry[] = auditRows.map((a) => ({
    id: String(a.id),
    timestamp: String(a.timestamp),
    actorName: String(a.actor_name),
    actorRole: String(a.actor_role),
    action: String(a.action),
    recordNo: String(a.record_no),
    details: String(a.details),
  }));

  return {
    currentUser,
    practice,
    patients,
    departments,
    users,
    auditLog,
    sessionCheck,
    dailyEquipmentCheck,
    certificateStock,
    verificationEnquiries,
  };
}
