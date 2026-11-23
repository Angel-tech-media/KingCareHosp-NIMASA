import type { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './auth.js';
import { ensureBaseStructure, formatDateShort, formatNowTimestamp } from './db.js';
import type { SeafarerRmpData } from './types.js';

export const SAMPLE_DEFAULT_PASSWORD = 'Kingscare@2026';

export const SAMPLE_ACCOUNTS = [
  {
    id: 'usr-admin-1',
    fullName: 'Dr. Olumide Balogun',
    email: 'admin@kingscarehospital.ng',
    roleTitle: 'Medical Director (RMP)',
    portalRole: 'ADMIN' as const,
    department: 'Medical Administration & QSS',
    licenseNo: 'MDCN/R/31402',
  },
  {
    id: 'usr-fd-1',
    fullName: 'Chidinma Okafor',
    email: 'reception@kingscarehospital.ng',
    roleTitle: 'Registration Officer',
    portalRole: 'FRONT_DESK' as const,
    department: 'Front Desk & Identity Gate',
    licenseNo: 'HRB-FD-1042',
  },
  {
    id: 'usr-doc-1',
    fullName: 'Dr. Babatunde Fashola-Cole',
    email: 'b.fashola@kingscarehospital.ng',
    roleTitle: 'Recognized Medical Practitioner',
    portalRole: 'DOCTOR' as const,
    department: 'Maritime Medicine (RMP Desk)',
    licenseNo: 'MDCN/R/44819',
  },
  {
    id: 'usr-lab-1',
    fullName: 'MLS. Kelechi Nwachukwu',
    email: 'k.nwachukwu@kingscarehospital.ng',
    roleTitle: 'Senior Medical Lab Scientist',
    portalRole: 'LAB' as const,
    department: 'Laboratory & Pathology Services',
    licenseNo: 'MLSCN-RA-19402',
  },
  {
    id: 'usr-rad-1',
    fullName: 'Dr. Musa Danbaba',
    email: 'm.danbaba@kingscarehospital.ng',
    roleTitle: 'Consultant Radiologist',
    portalRole: 'RADIOLOGY' as const,
    department: 'Radiology / X-Ray & Diagnostic Imaging',
    licenseNo: 'MDCN/R/50114',
  },
  {
    id: 'usr-nimasa-1',
    fullName: 'Mrs. Boma Dokubo-Peterside',
    email: 'medical.liaison@nimasa.gov.ng',
    roleTitle: 'NIMASA Medical Liaison Officer',
    portalRole: 'NIMASA' as const,
    department: 'NIMASA Maritime Safety & Seafarers Standards',
    licenseNo: 'NIMASA-LIA-008',
  },
];

export function resetToCleanDb(db: DatabaseSync): void {
  db.exec('BEGIN;');
  try {
    db.exec(`
      DELETE FROM sessions;
      DELETE FROM patient_timeline;
      DELETE FROM diagnostic_orders;
      DELETE FROM patients;
      DELETE FROM department_staff;
      DELETE FROM equipment;
      DELETE FROM department_certificates;
      DELETE FROM certificate_stock;
      DELETE FROM session_recognition_checks;
      DELETE FROM verification_enquiries;
      DELETE FROM audit_logs;
      DELETE FROM users;
      DELETE FROM departments;
      DELETE FROM practice_settings;
    `);
    ensureBaseStructure(db);
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function seedSampleClinicData(db: DatabaseSync): void {
  resetToCleanDb(db);
  const nowTs = formatNowTimestamp();
  const todayShort = formatDateShort();
  const pwHash = hashPassword(SAMPLE_DEFAULT_PASSWORD);

  db.exec('BEGIN;');
  try {
    // Practice settings
    db.prepare(
      `UPDATE practice_settings
       SET medical_director = ?, updated_at = ?
       WHERE id = 1`
    ).run('Dr. Olumide Balogun (MDCN/R/31402)', nowTs);

    // 6 Real Password-Hashed User Accounts
    const insertUser = db.prepare(
      `INSERT INTO users (
        id, full_name, email, password_hash, role_title, portal_role, department, license_no, status, last_login, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)`
    );
    for (const acc of SAMPLE_ACCOUNTS) {
      insertUser.run(
        acc.id,
        acc.fullName,
        acc.email,
        pwHash,
        acc.roleTitle,
        acc.portalRole,
        acc.department,
        acc.licenseNo,
        nowTs,
        nowTs
      );
    }

    // Update Department HODs
    const updateDept = db.prepare(
      `UPDATE departments
       SET hod_name = ?, hod_title = ?, hod_qualifications = ?, hod_fellowship = ?, hod_years_experience = ?, hod_email = ?
       WHERE id = ?`
    );
    updateDept.run(
      'Prof. Chikwendu Nwachukwu',
      'Head of Department, Pathology & Laboratory Medicine',
      'BMLS, MSc (Haematology), PhD, FMLSCN',
      'Fellow, Medical Laboratory Science Council of Nigeria (FMLSCN)',
      19,
      'c.nwachukwu@kingscarehospital.ng',
      'lab'
    );
    updateDept.run(
      'Dr. Musa Danbaba',
      'Head of Department, Radiology & Diagnostic Imaging',
      'MBBS, FWACS (Radiology), FMCR',
      'Fellow, West African College of Surgeons (FWACS)',
      15,
      'm.danbaba@kingscarehospital.ng',
      'radiology'
    );
    updateDept.run(
      'Dr. Hadiza Suleiman',
      'Head of Unit, Otorhinolaryngology & Audiology',
      'MBBS, FMCORL',
      'Fellow, National Postgraduate Medical College (ENT)',
      12,
      'h.suleiman@kingscarehospital.ng',
      'ent'
    );
    updateDept.run(
      'Dr. Chinedu Okoro',
      'Head of Unit, Ophthalmology & Colour Vision',
      'MBBS, FWACS (Ophthalmology)',
      'Fellow, West African College of Surgeons (Ophthalmology)',
      14,
      'c.okoro@kingscarehospital.ng',
      'eye'
    );

    // Department Staff
    const insertStaff = db.prepare(
      `INSERT INTO department_staff (id, department_id, name, role, qualification, license_no, shift, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertStaff.run('st-lab-1', 'lab', 'MLS. Kelechi Nwachukwu', 'Senior Medical Laboratory Scientist', 'BMLS (UNN), AMLSCN', 'MLSCN-RA-19402', 'Morning (07:00 - 15:00)', nowTs);
    insertStaff.run('st-lab-2', 'lab', 'MLS. Fatima Abdulkadir', 'Chemical Pathology Scientist', 'BMLS (ABU), MSc Clinical Biochemistry', 'MLSCN-RA-22108', 'Morning (07:00 - 15:00)', nowTs);
    insertStaff.run('st-rad-1', 'radiology', 'Rad. Ibrahim Bello', 'Principal Radiographer', 'B.Rad (UNIMAID), RRBN', 'RRBN-LIC-33120', 'Morning (07:00 - 15:00)', nowTs);
    insertStaff.run('st-ent-1', 'ent', 'RN. Amina Mohammed', 'Certified Audiometry Technician', 'RN, BSc Audiology', 'NMCN-AUD-18409', 'Morning (07:00 - 15:00)', nowTs);
    insertStaff.run('st-eye-1', 'eye', 'OD. Tunde Bakare', 'Senior Clinical Optometrist', 'OD (UNIBEN), ODORBN', 'ODORBN-55210', 'Morning (07:00 - 15:00)', nowTs);

    // Registered Diagnostic Equipment (with Manufacturers, Model Numbers, Serials, Calibration Dates)
    const insertEq = db.prepare(
      `INSERT INTO equipment (
        id, department_id, name, manufacturer, model, year_of_make, serial_no,
        calibration_cert_no, last_calibrated, next_calibration_due, status,
        daily_check_passed, daily_checked_by, daily_checked_at, registered_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`
    );
    insertEq.run('eq-lab-1', 'lab', '5-Part Automated Haematology Analyzer', 'Sysmex', 'Sysmex XN-550', 2024, 'SN-SYS-99420A', 'CAL-SON-2026-104', '10 Aug 2026', '09 Aug 2027', 'Operational', 'MLS. Kelechi Nwachukwu', nowTs, 'Dr. Olumide Balogun', nowTs);
    insertEq.run('eq-lab-2', 'lab', 'Clinical Chemistry Auto-Analyzer', 'Roche Diagnostics', 'Roche Cobas c311', 2023, 'SN-ROC-44109B', 'CAL-SON-2026-108', '14 Aug 2026', '13 Aug 2027', 'Operational', 'MLS. Kelechi Nwachukwu', nowTs, 'Dr. Olumide Balogun', nowTs);
    insertEq.run('eq-rad-1', 'radiology', 'Digital Chest X-Ray System', 'Siemens Healthineers', 'Multix Fusion Max', 2024, 'SN-SIE-88210R', 'NNRA-QC-2026-511', '01 Sep 2026', '31 Aug 2027', 'Operational', 'Dr. Musa Danbaba', nowTs, 'Dr. Olumide Balogun', nowTs);
    insertEq.run('eq-ent-1', 'ent', 'Diagnostic Pure-Tone Audiometer', 'Interacoustics', 'AD226 Hybrid', 2025, 'IA-2026-4410', 'AUD-CAL-2026-22', '12 Oct 2026', '11 Oct 2027', 'Operational', 'RN. Amina Mohammed', nowTs, 'Dr. Olumide Balogun', nowTs);
    insertEq.run('eq-eye-1', 'eye', 'Illuminated Snellen Distance Chart & D65 Colour Lamp', 'Keeler / Ishihara', 'Vista 6M + 38-Plate D65', 2025, 'SN-KEL-30912E', 'OPT-CAL-2026-19', '05 Oct 2026', '04 Oct 2027', 'Operational', 'OD. Tunde Bakare', nowTs, 'Dr. Olumide Balogun', nowTs);

    // Regulatory Certificates
    const insertDeptCert = db.prepare(
      `INSERT INTO department_certificates (id, department_id, type, issuing_body, certificate_no, year_certified, expiry_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertDeptCert.run('cert-lab-1', 'lab', 'MLSCN National Laboratory Accreditation Certificate', 'Medical Laboratory Science Council of Nigeria (MLSCN)', 'MLSCN/ACC/FCT/2025/0184', 2025, '31 Dec 2027', 'Valid', nowTs);
    insertDeptCert.run('cert-rad-1', 'radiology', 'NNRA Diagnostic X-Ray Facility Practice Licence', 'Nigerian Nuclear Regulatory Authority (NNRA)', 'NNRA/MED/2025/0419', 2025, '30 Nov 2027', 'Valid', nowTs);
    insertDeptCert.run('cert-ent-1', 'ent', 'Annual Acoustic Booth Attenuation Certificate', 'Standards Organisation of Nigeria (SON)', 'SON/ACOUSTIC/2026/088', 2026, '11 Oct 2027', 'Valid', nowTs);
    insertDeptCert.run('cert-eye-1', 'eye', 'STCW Table A-I/9 Visual & Colour Standards Verification', 'NIMASA Inspectorate', 'NIM-OPT-2026-014', 2026, '14 Jan 2028', 'Valid', nowTs);

    // Certificate Stock (12 blanks)
    const insertStock = db.prepare(
      `INSERT INTO certificate_stock (serial_no, status, assigned_to, record_no, seafarer_name, updated_at, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const stockSeed = [
      ['NIM-MC-2026-0401', 'Used', 'Dr. Babatunde Fashola-Cole', 'KC-000112', 'Capt. Ibrahim Tukur', nowTs, null],
      ['NIM-MC-2026-0402', 'Used', 'Dr. Babatunde Fashola-Cole', 'KC-000113', 'Ch. Off. Samuel Kalu', nowTs, null],
      ['NIM-MC-2026-0403', 'Spoiled', 'Dr. Babatunde Fashola-Cole', null, null, nowTs, 'Misaligned printer feed; retained per RQP-702'],
      ['NIM-MC-2026-0404', 'Used', 'Dr. Olumide Balogun', 'KC-000114', 'Bolanle Olatunji-Peters', nowTs, null],
      ['NIM-MC-2026-0405', 'Issued to RMP', 'Dr. Babatunde Fashola-Cole', null, null, nowTs, null],
      ['NIM-MC-2026-0406', 'Issued to RMP', 'Dr. Babatunde Fashola-Cole', null, null, nowTs, null],
      ['NIM-MC-2026-0407', 'Issued to RMP', 'Dr. Babatunde Fashola-Cole', null, null, nowTs, null],
      ['NIM-MC-2026-0408', 'Issued to RMP', 'Dr. Olumide Balogun', null, null, nowTs, null],
      ['NIM-MC-2026-0409', 'In Cabinet', null, null, null, nowTs, null],
      ['NIM-MC-2026-0410', 'In Cabinet', null, null, null, nowTs, null],
      ['NIM-MC-2026-0411', 'In Cabinet', null, null, null, nowTs, null],
      ['NIM-MC-2026-0412', 'In Cabinet', null, null, null, nowTs, null],
    ];
    for (const s of stockSeed) {
      insertStock.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6]);
    }

    // Helper for building standard Vision/Hearing & Criteria baseline
    const makeRmp = (overrides: Partial<SeafarerRmpData> = {}): SeafarerRmpData => ({
      nationality: 'Nigerian',
      idType: "Seafarer's Identity Document",
      idNumber: 'NG-SID-2026-4401',
      idVerifiedOriginal: true,
      photoCaptured: true,
      isUnder18: false,
      category: 'Deck (Master / Officer / Lookout)',
      lookoutRequired: true,
      specialDuties: ['Fire-fighting team', 'Bridge watchkeeping'],
      entryExam: false,
      healthDeclarationSigned: true,
      priorityBasis: 'None',
      visionHearing: {
        distanceUnaided: { right: '0.8', left: '0.8', both: '1.0' },
        distanceAided: { right: '1.0', left: '1.0', both: '1.0' },
        visualAidsRequired: false,
        nearVisionMet: true,
        intermediateVisionMet: true,
        visualFieldsNormal: true,
        nightVisionNormal: true,
        diplopiaAbsent: true,
        colourVisionLastDate: todayShort,
        colourVisionTestMethod: 'Ishihara 38-Plate (2024 Ed.) under D65 Lamp',
        colourVisionCie: 'CIE 1',
        colourVisionReferred: false,
        audiometryRight: { hz500: 15, hz1000: 15, hz2000: 20, hz3000: 20 },
        audiometryLeft: { hz500: 15, hz1000: 20, hz2000: 20, hz3000: 20 },
        unaidedHearingSatisfactory: true,
        speechClear: true,
        testedBy: 'RN. Amina Mohammed',
      },
      statutoryCriteria: {
        physicalCapabilityBasicTraining: true,
        hearingAndSpeechAdequate: true,
        noConditionPreventingDuties: true,
        noConditionAggravatedBySea: true,
        noImpairingMedication: true,
        fitForLookout: true,
      },
      determination: 'Pending',
      ...overrides,
    });

    const insertPatient = db.prepare(
      `INSERT INTO patients (
        id, record_no, full_name, dob, gender, phone,
        nimasa_member, nimasa_staff_id, nimasa_department, consent_to_share_with_nimasa,
        status, current_stage, current_location, is_admitted, ward_room,
        arrived_at, time_in_hospital, vitals_json,
        first_assessment_summary, first_assessment_full_note, second_assessment_note,
        medications_json, discharge_summary, rmp_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const insertTimeline = db.prepare(
      `INSERT INTO patient_timeline (patient_id, stage, reached_at, actor_name, actor_role, public_summary)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const insertOrder = db.prepare(
      `INSERT INTO diagnostic_orders (
        id, patient_id, record_no, patient_name, department, category, test_name,
        ordered_by, ordered_at, status, draft_findings, published_result, reference_range,
        scientist_remarks, completed_by, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    // 1. KC-000101 — Results ready (awaiting Dr determination & cert)
    insertPatient.run(
      'p1',
      'KC-000101',
      'Capt. Adewale Ogunlesi',
      '1978-04-12',
      'Male',
      '+234 803 412 8890',
      1,
      'NIM-MAR-2084',
      'Deck (Master / Officer / Lookout)',
      1,
      'Active',
      'Results ready',
      'Consultation Room 1 (Results Ready)',
      0,
      null,
      nowTs,
      '1h 45m',
      JSON.stringify({ bp: '132/84 mmHg', temp: '36.9 °C', pulse: '76 bpm', spo2: '98%', weight: '84 kg' }),
      'First assessment complete; FBC and Lipid Panel published.',
      'Master mariner presenting for periodic STCW Reg. I/9 fitness renewal. Mild controlled hypertension.',
      null,
      JSON.stringify([]),
      null,
      JSON.stringify(makeRmp({ idNumber: 'NG-SID-2024-2084' })),
      nowTs
    );
    insertTimeline.run('p1', 'Registered', nowTs, 'Chidinma Okafor', 'Registration Officer', 'Original photo ID verified & health declaration signed (RQP-601).');
    insertTimeline.run('p1', 'Tests requested', nowTs, 'Dr. Babatunde Fashola-Cole', 'Recognized Medical Practitioner', 'Ordered Full Blood Count & Fasting Lipid Profile.');
    insertTimeline.run('p1', 'Results ready', nowTs, 'MLS. Kelechi Nwachukwu', 'Senior Medical Lab Scientist', 'Laboratory indices published to RMP.');
    insertOrder.run('ORD-9001', 'p1', 'KC-000101', 'Capt. Adewale Ogunlesi', 'Laboratory', 'Blood', 'Full Blood Count (FBC)', 'Dr. Babatunde Fashola-Cole', nowTs, 'Published', null, 'Hb: 14.6 g/dL | WBC: 5.8 x10^9/L | Platelets: 245 x10^9/L', 'Hb: 13.0-17.0 g/dL', 'Within normal adult reference interval.', 'MLS. Kelechi Nwachukwu', nowTs);

    // 2. KC-000102 — Registered at Reception
    insertPatient.run(
      'p2',
      'KC-000102',
      'Engr. Ngozi Eze-Nwosu',
      '1987-09-22',
      'Female',
      '+234 809 310 7721',
      1,
      'NIM-MAR-3319',
      'Engine / Electro-Technical',
      1,
      'Active',
      'Registered',
      'Front Desk / Reception (RQP-601)',
      0,
      null,
      nowTs,
      '0h 15m',
      JSON.stringify({ bp: '118/74 mmHg', temp: '36.7 °C', pulse: '72 bpm', spo2: '99%', weight: '66 kg' }),
      null,
      null,
      null,
      JSON.stringify([]),
      null,
      JSON.stringify(
        makeRmp({
          idNumber: 'NG-SID-2025-3319',
          category: 'Engine / Electro-Technical',
          lookoutRequired: false,
        })
      ),
      nowTs
    );
    insertTimeline.run('p2', 'Registered', nowTs, 'Chidinma Okafor', 'Registration Officer', 'Checked in; awaiting dispatch to RMP.');

    // 3. KC-000103 — Tests requested (Radiology CXR pending)
    insertPatient.run(
      'p3',
      'KC-000103',
      'Samuel Obinna Nwankwo',
      '1991-02-14',
      'Male',
      '+234 802 554 1190',
      1,
      'NIM-MAR-4105',
      'GMDSS Radio Operator',
      1,
      'Active',
      'Tests requested',
      'Radiology / X-Ray Suite',
      0,
      null,
      nowTs,
      '1h 10m',
      JSON.stringify({ bp: '122/78 mmHg', temp: '36.8 °C', pulse: '74 bpm', spo2: '99%', weight: '75 kg' }),
      'Ordered PA Chest X-Ray per employer pre-deployment protocol.',
      'Asymptomatic GMDSS radio operator undergoing initial seafarer medical screening.',
      null,
      JSON.stringify([]),
      null,
      JSON.stringify(
        makeRmp({
          idNumber: 'NG-SID-2026-4105',
          category: 'GMDSS Radio Operator',
          lookoutRequired: false,
          entryExam: true,
        })
      ),
      nowTs
    );
    insertTimeline.run('p3', 'Registered', nowTs, 'Chidinma Okafor', 'Registration Officer', 'Registered for entry exam.');
    insertTimeline.run('p3', 'Tests requested', nowTs, 'Dr. Babatunde Fashola-Cole', 'Recognized Medical Practitioner', 'Referred to Radiology for PA Chest Radiograph.');
    insertOrder.run('ORD-9002', 'p3', 'KC-000103', 'Samuel Obinna Nwankwo', 'Radiology', 'Imaging', 'Chest X-Ray (PA View)', 'Dr. Babatunde Fashola-Cole', nowTs, 'Pending', null, null, 'Clear lung fields, normal CTR', null, null, null);

    // 4. KC-000112 — Fit with Certificate NIM-MC-2026-0401
    insertPatient.run(
      'p4',
      'KC-000112',
      'Capt. Ibrahim Tukur',
      '1974-06-08',
      'Male',
      '+234 805 881 2241',
      1,
      'NIM-MAR-1102',
      'Deck (Master / Officer / Lookout)',
      1,
      'Inactive',
      'Discharged',
      'Certificate Issued (NIM-MC-2026-0401)',
      0,
      null,
      '19 Nov 2026, 08:15',
      '2h 20m',
      JSON.stringify({ bp: '126/80 mmHg', temp: '36.7 °C', pulse: '70 bpm', spo2: '99%', weight: '80 kg' }),
      'All STCW Reg. I/9 criteria satisfied.',
      'Fit without restrictions for unrestricted worldwide deck duties.',
      'Reviewed final vision and audiometry indices; satisfactory.',
      JSON.stringify([]),
      'Certificate NIM-MC-2026-0401 issued.',
      JSON.stringify(
        makeRmp({
          idNumber: 'NG-SID-2023-1102',
          determination: 'Fit',
          determinationBasis: 'Meets all Section A-I/9.2 medical criteria and Table A-I/9 vision/hearing standards.',
          issuedCertificate: {
            certificateNo: 'NIM-MC-2026-0401',
            supplementNo: 'NIM-MC-2026-0401-S',
            examinationDate: '19 Nov 2026',
            issueDate: '19 Nov 2026',
            expiryDate: '19 Nov 2028',
            maxValidityYears: 2,
            determination: 'Fit',
            fitForLookout: true,
            visualAidsRequired: false,
            unaidedHearingSatisfactory: true,
            colourVisionDate: '19 Nov 2026',
            practitionerName: 'Dr. Babatunde Fashola-Cole',
            practitionerMdcn: 'MDCN/R/44819',
            secondCheckerName: 'Chidinma Okafor',
            seafarerSigned: true,
          },
        })
      ),
      '19 Nov 2026, 08:15'
    );
    insertTimeline.run('p4', 'Discharged', '19 Nov 2026, 10:35', 'Dr. Babatunde Fashola-Cole', 'Recognized Medical Practitioner', 'Issued Certificate NIM-MC-2026-0401 (Fit, 2 years).');

    // 5. KC-000114 — Fit with limitation + QAF-804-02 + Cert NIM-MC-2026-0404
    insertPatient.run(
      'p5',
      'KC-000114',
      'Bolanle Olatunji-Peters',
      '1984-11-30',
      'Female',
      '+234 806 902 1173',
      1,
      'NIM-MAR-2910',
      'Catering / Other',
      1,
      'Inactive',
      'Discharged',
      'Certificate Issued (NIM-MC-2026-0404)',
      0,
      null,
      '20 Nov 2026, 09:00',
      '2h 10m',
      JSON.stringify({ bp: '138/88 mmHg', temp: '36.8 °C', pulse: '79 bpm', spo2: '98%', weight: '72 kg' }),
      'Cleared for near-coastal service only; 6-month re-evaluation.',
      'Requires 6-month BP review under ILO/IMO cardiovascular guideline.',
      null,
      JSON.stringify([]),
      'Time-limited certificate issued with QAF-804-02 review notice.',
      JSON.stringify(
        makeRmp({
          idNumber: 'NG-SID-2024-2910',
          category: 'Catering / Other',
          lookoutRequired: false,
          determination: 'Fit with limitation',
          limitationText: 'Near-coastal voyages only; valid for 6 months; to be re-examined.',
          determinationBasis: 'Requires 6-month clinical review under ILO/IMO cardiovascular guideline.',
          rightOfReview: {
            issuedAt: '20 Nov 2026, 11:10',
            seafarerSigned: true,
            reviewRequested: false,
          },
          issuedCertificate: {
            certificateNo: 'NIM-MC-2026-0404',
            supplementNo: 'NIM-MC-2026-0404-S',
            examinationDate: '20 Nov 2026',
            issueDate: '20 Nov 2026',
            expiryDate: '20 May 2027',
            maxValidityYears: 2,
            determination: 'Fit with limitation',
            limitation: 'Near-coastal voyages only; valid for 6 months; to be re-examined.',
            fitForLookout: false,
            visualAidsRequired: false,
            unaidedHearingSatisfactory: true,
            colourVisionDate: '20 Nov 2026',
            practitionerName: 'Dr. Olumide Balogun',
            practitionerMdcn: 'MDCN/R/31402',
            secondCheckerName: 'Chidinma Okafor',
            seafarerSigned: true,
          },
        })
      ),
      '20 Nov 2026, 09:00'
    );
    insertTimeline.run('p5', 'Discharged', '20 Nov 2026, 11:10', 'Dr. Olumide Balogun', 'Medical Director (RMP)', 'Issued Fit with limitation certificate NIM-MC-2026-0404 & QAF-804-02 notice.');

    // 6. KC-000115 — Not fit + QAF-804-02 Review Notice
    insertPatient.run(
      'p6',
      'KC-000115',
      'Yakubu Gowon-Pam',
      '1981-03-17',
      'Male',
      '+234 803 771 5509',
      1,
      'NIM-MAR-3044',
      'Deck (Master / Officer / Lookout)',
      1,
      'Inactive',
      'Discharged',
      'Closed — Not Fit (QAF-804-02 Issued)',
      0,
      null,
      '20 Nov 2026, 12:15',
      '1h 50m',
      JSON.stringify({ bp: '124/80 mmHg', temp: '36.7 °C', pulse: '74 bpm', spo2: '99%', weight: '77 kg' }),
      'Did not meet Table A-I/9 deck distance visual acuity minimum.',
      'Aided right eye visual acuity 0.33 (below mandatory 0.5 Deck Officer threshold); zero discretion per A-I/9.5.',
      null,
      JSON.stringify([]),
      'QAF-804-02 Right of Review issued; referred for independent medical referee.',
      JSON.stringify(
        makeRmp({
          idNumber: 'NG-SID-2025-3044',
          determination: 'Not fit',
          determinationBasis: 'Deck distance acuity (0.33 right eye) below Table A-I/9 mandatory 0.5 standard.',
          rightOfReview: {
            issuedAt: '20 Nov 2026, 14:05',
            seafarerSigned: true,
            reviewRequested: true,
            recordsReleasedAt: '21 Nov 2026, 09:30',
            refereeOutcome: 'Pending',
          },
        })
      ),
      '20 Nov 2026, 12:15'
    );
    insertTimeline.run('p6', 'Discharged', '20 Nov 2026, 14:05', 'Dr. Babatunde Fashola-Cole', 'Recognized Medical Practitioner', 'Recorded Not fit determination; QAF-804-02 Right of Review issued.');

    // Session recognition check
    db.prepare(
      `INSERT INTO session_recognition_checks (
        check_date, practitioner_name, mdcn_no, on_agency_register, premises_in_scope, licence_valid, confirmed_at
      ) VALUES (?, ?, ?, 1, 1, 1, ?)`
    ).run(todayShort, 'Dr. Babatunde Fashola-Cole', 'MDCN/R/44819', nowTs);

    // Verification Enquiries
    const insertEnquiry = db.prepare(
      `INSERT INTO verification_enquiries (id, timestamp, enquirer, certificate_no, result, outcome_summary)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    insertEnquiry.run(
      'ver-1',
      nowTs,
      'Port State Control — Apapa Port Complex',
      'NIM-MC-2026-0401',
      'Issued',
      'Genuine · Capt. Ibrahim Tukur · Fit · Lookout: Yes · Expires 19 Nov 2028 · Supplement NIM-MC-2026-0401-S issued (No clinical data disclosed)'
    );
    insertEnquiry.run(
      'ver-2',
      '20 Nov 2026, 16:40',
      'Shipping Company Crewing Desk — Onne Oil & Gas Free Zone',
      'NIM-MC-2026-0404',
      'Issued',
      'Genuine · Bolanle Olatunji-Peters · Fit with limitation (Near-coastal voyages only) · Expires 20 May 2027 · Supplement NIM-MC-2026-0404-S issued'
    );

    // Initial Audit Log Entries
    const insertAudit = db.prepare(
      `INSERT INTO audit_logs (id, timestamp, actor_name, actor_role, action, record_no, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    insertAudit.run('aud-1', nowTs, 'Dr. Olumide Balogun', 'Medical Director (RMP)', 'Loaded Sample Clinical & Equipment Register', 'SYSTEM', 'Populated 6 staff accounts, 5 calibrated equipment items, 12 blank serials, and 6 seafarer records.');

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
