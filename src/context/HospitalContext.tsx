import React, { createContext, useContext, useState } from 'react';
import {
  PatientRecord,
  PatientStage,
  RoleType,
  AuditLogEntry,
  DepartmentMaster,
  SystemUser,
  DiagnosticOrder,
  SeafarerCategory,
  IdDocumentType,
  VisionHearingRecord,
  StatutoryCriteriaCheck,
  FitnessDetermination,
  CertificateStockItem,
  DailyEquipmentCheckState,
  SessionRecognitionCheck,
  VerificationEnquiry,
} from '../types';
import { INITIAL_PATIENTS } from '../data/mockPatients';
import { MOCK_DEPARTMENTS } from '../data/mockDepartments';
import { MOCK_USERS, INITIAL_AUDIT_LOG } from '../data/mockUsers';
import {
  enrichPatientsWithRmp,
  INITIAL_CERTIFICATE_STOCK,
  INITIAL_DAILY_EQUIPMENT_CHECK,
  INITIAL_SESSION_CHECK,
  INITIAL_VERIFICATION_ENQUIRIES,
  calculateAgeYears,
} from '../data/mockRmpData';

interface NewPatientInput {
  fullName: string;
  dob: string;
  gender: 'Male' | 'Female';
  phone: string;
  nimasaMember: boolean;
  nimasaStaffId?: string;
  nimasaDepartment?: string;
  consentToShareWithNimasa: boolean;
  nationality?: string;
  idType?: IdDocumentType;
  idNumber?: string;
  idVerifiedOriginal?: boolean;
  photoCaptured?: boolean;
  category?: SeafarerCategory;
  lookoutRequired?: boolean;
  previousCertNo?: string;
  previousColourVisionDate?: string;
  healthDeclarationSigned?: boolean;
  entryExam?: boolean;
  priorityBasis?: 'None' | 'Voyage Extension (Reg. I/9.6)' | 'NIMASA Urgent Permission (Reg. I/9.7)';
}

interface NewOrderTestItem {
  category: 'Blood' | 'Stool' | 'Tissue' | 'Imaging';
  testName: string;
  department: 'Laboratory' | 'Radiology';
  referenceRange: string;
}

interface HospitalContextValue {
  patients: PatientRecord[];
  departments: DepartmentMaster[];
  users: SystemUser[];
  auditLog: AuditLogEntry[];
  activeRole: RoleType;
  setActiveRole: (role: RoleType) => void;
  registerPatient: (input: NewPatientInput) => PatientRecord;
  sendToDoctor: (patientId: string) => void;
  startFirstAssessment: (patientId: string) => void;
  completeFirstAssessment: (
    patientId: string,
    shortSummary: string,
    fullClinicalNote: string
  ) => void;
  orderTests: (patientId: string, tests: NewOrderTestItem[]) => void;
  admitPatient: (patientId: string, wardRoom?: string) => void;
  saveOrderDraft: (
    orderId: string,
    draftFindings: string,
    scientistRemarks?: string
  ) => void;
  publishOrderResult: (
    orderId: string,
    publishedResult: string,
    referenceRange: string,
    scientistRemarks: string,
    department: 'Laboratory' | 'Radiology'
  ) => void;
  recordSecondAssessment: (patientId: string, note: string) => void;
  addMedication: (
    patientId: string,
    med: { name: string; dosage: string; frequency: string; duration: string }
  ) => void;
  dischargePatient: (patientId: string, dischargeSummary: string) => void;
  // STCW Reg. I/9 RMP QSS state & actions
  sessionCheck: SessionRecognitionCheck;
  dailyEquipmentCheck: DailyEquipmentCheckState;
  certificateStock: CertificateStockItem[];
  verificationEnquiries: VerificationEnquiry[];
  confirmSessionCheck: () => void;
  toggleEquipmentCheckItem: (itemId: string) => void;
  saveVisionHearing: (patientId: string, record: VisionHearingRecord) => void;
  saveStatutoryCriteria: (patientId: string, criteria: StatutoryCriteriaCheck) => void;
  recordFitnessDetermination: (
    patientId: string,
    determination: Exclude<FitnessDetermination, 'Pending'>,
    basis: string,
    limitationText?: string,
    reviewNoticeSigned?: boolean
  ) => void;
  issueMedicalCertificate: (
    patientId: string,
    serialNo: string,
    secondCheckerName: string,
    seafarerSigned: boolean,
    validityMonths?: number
  ) => { ok: boolean; error?: string };
  markBlankSpoiled: (serialNo: string, reason: string) => void;
  verifyCertificate: (certificateNo: string, enquirer: string) => VerificationEnquiry;
  resetDemoData: () => void;
}

const HospitalContext = createContext<HospitalContextValue | undefined>(undefined);

function formatNowTimestamp(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `21 Nov 2026, ${hours}:${mins}`;
}

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [patients, setPatients] = useState<PatientRecord[]>(() =>
    enrichPatientsWithRmp(INITIAL_PATIENTS)
  );
  const [departments] = useState<DepartmentMaster[]>(MOCK_DEPARTMENTS);
  const [users] = useState<SystemUser[]>(MOCK_USERS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOG);
  const [activeRole, setActiveRole] = useState<RoleType>('NIMASA');
  const [sessionCheck, setSessionCheck] = useState<SessionRecognitionCheck>(INITIAL_SESSION_CHECK);
  const [dailyEquipmentCheck, setDailyEquipmentCheck] = useState<DailyEquipmentCheckState>(
    INITIAL_DAILY_EQUIPMENT_CHECK
  );
  const [certificateStock, setCertificateStock] = useState<CertificateStockItem[]>(
    INITIAL_CERTIFICATE_STOCK
  );
  const [verificationEnquiries, setVerificationEnquiries] = useState<VerificationEnquiry[]>(
    INITIAL_VERIFICATION_ENQUIRIES
  );

  const appendAudit = (
    actorName: string,
    actorRole: string,
    action: string,
    recordNo: string,
    details: string
  ) => {
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: formatNowTimestamp(),
      actorName,
      actorRole,
      action,
      recordNo,
      details,
    };
    setAuditLog((prev) => [newEntry, ...prev]);
  };

  const upsertTimelineStage = (
    timeline: PatientRecord['timeline'],
    stage: PatientStage,
    actorName: string,
    actorRole: string,
    publicSummary: string
  ) => {
    const timestamp = formatNowTimestamp();
    const existingIndex = timeline.findIndex((t) => t.stage === stage);
    const entry = {
      stage,
      reachedAt: timestamp,
      actorName,
      actorRole,
      publicSummary,
    };
    if (existingIndex >= 0) {
      const copy = [...timeline];
      copy[existingIndex] = entry;
      return copy;
    }
    return [...timeline, entry];
  };

  const registerPatient = (input: NewPatientInput): PatientRecord => {
    const nextNumber = 101 + patients.length;
    const recordNo = `KC-${String(nextNumber).padStart(6, '0')}`;
    const timestamp = formatNowTimestamp();
    const age = calculateAgeYears(input.dob);
    const isUnder18 = age < 18;
    const category = input.category || 'Deck (Master / Officer / Lookout)';
    const lookoutRequired =
      input.lookoutRequired !== undefined
        ? input.lookoutRequired
        : category === 'Deck (Master / Officer / Lookout)';

    const newPatient: PatientRecord = {
      id: `p-${Date.now()}`,
      recordNo,
      fullName: input.fullName,
      dob: input.dob,
      gender: input.gender,
      phone: input.phone,
      nimasaMember: input.nimasaMember,
      nimasaStaffId: input.nimasaMember
        ? input.nimasaStaffId || `NIM-STF-${nextNumber * 17}`
        : undefined,
      nimasaDepartment: input.nimasaMember
        ? input.nimasaDepartment || category
        : undefined,
      consentToShareWithNimasa: input.nimasaMember
        ? input.consentToShareWithNimasa
        : false,
      status: 'Active',
      currentStage: 'Registered',
      currentLocation: 'Front Desk / Reception (RQP-601)',
      arrivedAt: timestamp,
      timeInHospital: '0h 05m',
      vitals: {
        bp: '120/78 mmHg',
        temp: '36.8 °C',
        pulse: '74 bpm',
        spo2: '99%',
        weight: '74 kg',
      },
      medications: [],
      rmp: {
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
          colourVisionLastDate: input.previousColourVisionDate || '21 Nov 2026',
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
      },
      timeline: [
        {
          stage: 'Registered',
          reachedAt: timestamp,
          actorName: 'Chidinma Okafor',
          actorRole: 'Registration Officer',
          publicSummary: `Registered under RQP-601 (${category}${isUnder18 ? ' · Under-18 1-yr cap' : ''}); original photo ID, duties statement & NDPA 2023 consent recorded.`,
        },
      ],
      orders: [],
    };

    setPatients((prev) => [newPatient, ...prev]);
    appendAudit(
      'Chidinma Okafor',
      'Registration Officer',
      'Registered Seafarer (RQP-601)',
      recordNo,
      `Registered ${input.fullName} (${category}; ID verified: ${input.idType || 'SID'}${isUnder18 ? '; UNDER-18 1-YEAR MAX FLAG' : ''}).`
    );
    return newPatient;
  };

  const sendToDoctor = (patientId: string) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target) return;

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          currentStage: 'Awaiting doctor',
          currentLocation: 'Doctor Waiting Lounge',
          timeline: upsertTimelineStage(
            p.timeline,
            'Awaiting doctor',
            'Chidinma Okafor',
            'Front Desk Officer',
            'Triage complete; patient queued for attending physician.'
          ),
        };
      })
    );

    appendAudit(
      'Chidinma Okafor',
      'Front Desk Officer',
      'Sent Patient to Doctor',
      target.recordNo,
      `Dispatched ${target.fullName} to Consultant Physician queue (Stage -> Awaiting doctor).`
    );
  };

  const startFirstAssessment = (patientId: string) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target) return;

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          currentStage: 'In assessment',
          currentLocation: 'Consultation Room 1',
          timeline: upsertTimelineStage(
            p.timeline,
            'In assessment',
            'Dr. Babatunde Fashola-Cole',
            'Consultant Physician',
            'Patient currently in first clinical consultation with physician.'
          ),
        };
      })
    );

    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Consultant Physician',
      'Started First Assessment',
      target.recordNo,
      `Commenced first clinical consultation for ${target.fullName}.`
    );
  };

  const completeFirstAssessment = (
    patientId: string,
    shortSummary: string,
    fullClinicalNote: string
  ) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target) return;

    const cleanSummary =
      shortSummary.trim() ||
      'First assessment complete; physician reviewing next diagnostic or treatment step.';

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        const baseTimeline =
          p.timeline.some((t) => t.stage === 'In assessment')
            ? p.timeline
            : upsertTimelineStage(
                p.timeline,
                'In assessment',
                'Dr. Babatunde Fashola-Cole',
                'Consultant Physician',
                'Initial consultation performed.'
              );

        return {
          ...p,
          currentStage: 'First assessment complete',
          currentLocation: 'Consultation Room 1',
          firstAssessmentSummary: cleanSummary,
          firstAssessmentFullNote: fullClinicalNote,
          timeline: upsertTimelineStage(
            baseTimeline,
            'First assessment complete',
            'Dr. Babatunde Fashola-Cole',
            'Consultant Physician',
            cleanSummary
          ),
        };
      })
    );

    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Consultant Physician',
      'Completed First Assessment',
      target.recordNo,
      `Marked first assessment complete for ${target.fullName}.`
    );
  };

  const orderTests = (patientId: string, tests: NewOrderTestItem[]) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target || tests.length === 0) return;

    const timestamp = formatNowTimestamp();
    const newOrders: DiagnosticOrder[] = tests.map((t, idx) => ({
      id: `ORD-${Date.now().toString().slice(-4)}${idx + 1}`,
      patientId: target.id,
      recordNo: target.recordNo,
      patientName: target.fullName,
      department: t.department,
      category: t.category,
      testName: t.testName,
      orderedBy: 'Dr. Babatunde Fashola-Cole',
      orderedAt: timestamp,
      status: 'Pending',
      referenceRange: t.referenceRange,
    }));

    const hasImaging = tests.some((t) => t.department === 'Radiology');
    const hasLab = tests.some((t) => t.department === 'Laboratory');
    const locationLabel =
      hasImaging && hasLab
        ? 'Laboratory & Radiology'
        : hasImaging
        ? 'Radiology / X-Ray Suite'
        : 'Laboratory';

    const testListText = tests.map((t) => t.testName).join(', ');

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          currentStage: 'Tests requested',
          currentLocation: p.isAdmitted
            ? `${p.wardRoom || 'Inpatient Ward B'} -> ${locationLabel}`
            : locationLabel,
          orders: [...newOrders, ...p.orders],
          timeline: upsertTimelineStage(
            p.timeline,
            'Tests requested',
            'Dr. Babatunde Fashola-Cole',
            'Consultant Physician',
            `First assessment complete; awaiting diagnostic results (${testListText}).`
          ),
        };
      })
    );

    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Consultant Physician',
      'Ordered Diagnostic Tests',
      target.recordNo,
      `Ordered ${tests.length} test(s) for ${target.fullName}: ${testListText}.`
    );
  };

  const admitPatient = (patientId: string, wardRoom = 'Executive Ward B - Bed 07') => {
    const target = patients.find((p) => p.id === patientId);
    if (!target) return;

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          currentStage: 'Admitted',
          isAdmitted: true,
          wardRoom,
          currentLocation: wardRoom,
          timeline: upsertTimelineStage(
            p.timeline,
            'Admitted',
            'Dr. Babatunde Fashola-Cole',
            'Consultant Physician',
            `Patient admitted to ${wardRoom} for inpatient clinical observation and care.`
          ),
        };
      })
    );

    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Consultant Physician',
      'Admitted Patient',
      target.recordNo,
      `Admitted ${target.fullName} to ${wardRoom} (Stage -> Admitted).`
    );
  };

  const saveOrderDraft = (
    orderId: string,
    draftFindings: string,
    scientistRemarks?: string
  ) => {
    let targetRecordNo = '';
    let targetTestName = '';
    let targetDept: 'Laboratory' | 'Radiology' = 'Laboratory';

    setPatients((prev) =>
      prev.map((p) => {
        const hasOrder = p.orders.some((o) => o.id === orderId);
        if (!hasOrder) return p;
        return {
          ...p,
          orders: p.orders.map((o) => {
            if (o.id !== orderId) return o;
            targetRecordNo = p.recordNo;
            targetTestName = o.testName;
            targetDept = o.department;
            return {
              ...o,
              status: 'Draft',
              draftFindings,
              scientistRemarks: scientistRemarks ?? o.scientistRemarks,
            };
          }),
        };
      })
    );

    if (targetRecordNo) {
      const actorName =
        targetDept === 'Laboratory'
          ? 'MLS. Kelechi Nwachukwu'
          : 'Dr. Musa Danbaba';
      const actorRole =
        targetDept === 'Laboratory'
          ? 'Senior Lab Scientist'
          : 'Consultant Radiologist';
      appendAudit(
        actorName,
        actorRole,
        'Saved Diagnostic Result Draft',
        targetRecordNo,
        `Saved draft findings for ${targetTestName}.`
      );
    }
  };

  const publishOrderResult = (
    orderId: string,
    publishedResult: string,
    referenceRange: string,
    scientistRemarks: string,
    department: 'Laboratory' | 'Radiology'
  ) => {
    const actorName =
      department === 'Laboratory'
        ? 'MLS. Kelechi Nwachukwu'
        : 'Dr. Musa Danbaba';
    const actorRole =
      department === 'Laboratory'
        ? 'Senior Lab Scientist'
        : 'Consultant Radiologist';
    const timestamp = formatNowTimestamp();

    let foundRecordNo = '';
    let foundPatientName = '';
    let foundTestName = '';

    setPatients((prev) =>
      prev.map((p) => {
        const targetOrder = p.orders.find((o) => o.id === orderId);
        if (!targetOrder) return p;

        foundRecordNo = p.recordNo;
        foundPatientName = p.fullName;
        foundTestName = targetOrder.testName;

        const updatedOrders: DiagnosticOrder[] = p.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'Published',
                publishedResult,
                referenceRange: referenceRange || o.referenceRange,
                scientistRemarks,
                completedBy: actorName,
                publishedAt: timestamp,
              }
            : o
        );

        return {
          ...p,
          currentStage: 'Results ready',
          currentLocation: p.isAdmitted
            ? `${p.wardRoom} (Results Ready for Doctor)`
            : 'Consultation Room 1 (Results Ready)',
          orders: updatedOrders,
          timeline: upsertTimelineStage(
            p.timeline,
            'Results ready',
            actorName,
            actorRole,
            `Diagnostic result published (${targetOrder.testName}); ready for doctor's second assessment.`
          ),
        };
      })
    );

    if (foundRecordNo) {
      appendAudit(
        actorName,
        actorRole,
        `Published ${department} Result`,
        foundRecordNo,
        `Published ${foundTestName} result for ${foundPatientName} (Stage -> Results ready).`
      );
    }
  };

  const recordSecondAssessment = (patientId: string, note: string) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target) return;

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          currentStage: 'Second assessment',
          currentLocation: 'Consultation Room 1',
          secondAssessmentNote: note,
          timeline: upsertTimelineStage(
            p.timeline,
            'Second assessment',
            'Dr. Babatunde Fashola-Cole',
            'Consultant Physician',
            'Doctor reviewed diagnostic results and completed second clinical assessment.'
          ),
        };
      })
    );

    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Consultant Physician',
      'Completed Second Assessment',
      target.recordNo,
      `Recorded post-investigation second assessment for ${target.fullName}.`
    );
  };

  const addMedication = (
    patientId: string,
    med: { name: string; dosage: string; frequency: string; duration: string }
  ) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target) return;

    const newMed = {
      id: `med-${Date.now()}`,
      ...med,
      prescribedBy: 'Dr. Babatunde Fashola-Cole',
      prescribedAt: formatNowTimestamp(),
    };

    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, medications: [...p.medications, newMed] }
          : p
      )
    );

    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Consultant Physician',
      'Prescribed Medication',
      target.recordNo,
      `Prescribed ${med.name} (${med.dosage}, ${med.frequency} for ${med.duration}) to ${target.fullName}.`
    );
  };

  const dischargePatient = (patientId: string, dischargeSummary: string) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target) return;

    const cleanSummary =
      dischargeSummary.trim() ||
      'Patient clinically stable, counselled on medication compliance, and discharged home.';

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        const withSecond = p.timeline.some((t) => t.stage === 'Second assessment')
          ? p.timeline
          : upsertTimelineStage(
              p.timeline,
              'Second assessment',
              'Dr. Babatunde Fashola-Cole',
              'Consultant Physician',
              'Final pre-discharge clinical review completed.'
            );

        return {
          ...p,
          status: 'Inactive',
          currentStage: 'Discharged',
          currentLocation: 'Discharged',
          isAdmitted: false,
          dischargeSummary: cleanSummary,
          timeline: upsertTimelineStage(
            withSecond,
            'Discharged',
            'Dr. Babatunde Fashola-Cole',
            'Consultant Physician',
            cleanSummary
          ),
        };
      })
    );

    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Consultant Physician',
      'Discharged Patient',
      target.recordNo,
      `Discharged ${target.fullName} (Status -> Inactive / Discharged).`
    );
  };

  const confirmSessionCheck = () => {
    const ts = formatNowTimestamp();
    setSessionCheck((prev) => ({
      ...prev,
      onAgencyRegister: true,
      premisesInScope: true,
      licenceValid: true,
      confirmedAt: ts,
    }));
    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Recognized Medical Practitioner',
      'Session-Start Check (RQW-001)',
      'RQC-301-01',
      'Confirmed current entry on NIMASA QAR-803-01 register, Abuja premises in scope, and valid MDCN licence.'
    );
  };

  const toggleEquipmentCheckItem = (itemId: string) => {
    const ts = formatNowTimestamp();
    setDailyEquipmentCheck((prev) => {
      const updated = prev.items.map((item) =>
        item.id === itemId ? { ...item, passed: !item.passed } : item
      );
      const changed = updated.find((i) => i.id === itemId);
      if (changed) {
        appendAudit(
          'RN. Amina Mohammed',
          'Clinical Support Staff',
          changed.passed ? 'Equipment Check Passed (RQW-002)' : 'Equipment Marked OUT OF USE',
          'RQF-402-01',
          `${changed.label} (${changed.department}) marked ${changed.passed ? 'PASS' : 'FAIL / OUT OF USE'}.`
        );
      }
      return { ...prev, checkedAt: ts, items: updated };
    });
  };

  const saveVisionHearing = (patientId: string, record: VisionHearingRecord) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target || !target.rmp) return;

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId || !p.rmp) return p;
        return {
          ...p,
          rmp: {
            ...p.rmp,
            visionHearing: record,
          },
        };
      })
    );

    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Recognized Medical Practitioner',
      'Recorded Vision & Hearing (RQF-603-01)',
      target.recordNo,
      `Distance aided R:${record.distanceAided.right}/L:${record.distanceAided.left}, Colour: ${record.colourVisionCie}, Unaided hearing satisfactory: ${record.unaidedHearingSatisfactory ? 'Yes' : 'No'}.`
    );
  };

  const saveStatutoryCriteria = (patientId: string, criteria: StatutoryCriteriaCheck) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target || !target.rmp) return;

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId || !p.rmp) return p;
        return {
          ...p,
          rmp: {
            ...p.rmp,
            statutoryCriteria: criteria,
          },
        };
      })
    );

    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Recognized Medical Practitioner',
      'Assessed A-I/9.2 Criteria (RQF-602-01)',
      target.recordNo,
      `Recorded statutory Section A-I/9.2 fitness criteria & lookout fitness (${criteria.fitForLookout ? 'Yes' : 'No'}).`
    );
  };

  const recordFitnessDetermination = (
    patientId: string,
    determination: Exclude<FitnessDetermination, 'Pending'>,
    basis: string,
    limitationText?: string,
    reviewNoticeSigned = true
  ) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target || !target.rmp) return;
    const ts = formatNowTimestamp();
    const needsReviewNotice = determination === 'Not fit' || determination === 'Fit with limitation';

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId || !p.rmp) return p;
        const nextStage: PatientStage =
          determination === 'Not fit' ? 'Discharged' : 'Second assessment';
        const publicOutcome =
          determination === 'Fit'
            ? 'Fitness determination recorded: Fit (awaiting QAF-805-01 certificate issue).'
            : determination === 'Fit with limitation'
            ? `Fitness determination recorded: Fit with limitation ("${limitationText || 'Specified restriction'}"). QAF-804-02 Right of Review issued.`
            : 'Fitness determination recorded: Not fit (no certificate issued; mandatory QAF-804-02 Right of Review issued).';

        return {
          ...p,
          status: determination === 'Not fit' ? 'Inactive' : 'Active',
          currentStage: nextStage,
          currentLocation:
            determination === 'Not fit'
              ? 'Closed — Not Fit (QAF-804-02 Issued)'
              : 'Certification Desk (RQC-701-01 Check)',
          rmp: {
            ...p.rmp,
            determination,
            determinationBasis: basis,
            limitationText: determination === 'Fit with limitation' ? limitationText : undefined,
            rightOfReview: needsReviewNotice
              ? {
                  issuedAt: ts,
                  seafarerSigned: reviewNoticeSigned,
                  reviewRequested: false,
                }
              : undefined,
          },
          timeline: upsertTimelineStage(
            p.timeline,
            nextStage,
            'Dr. Babatunde Fashola-Cole',
            'Recognized Medical Practitioner',
            publicOutcome
          ),
        };
      })
    );

    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Recognized Medical Practitioner',
      `Fitness Determination: ${determination} (RQP-605)`,
      target.recordNo,
      `${determination}${needsReviewNotice ? ' · Mandatory QAF-804-02 Right of Review issued in writing' : ''}.`
    );
  };

  const issueMedicalCertificate = (
    patientId: string,
    serialNo: string,
    secondCheckerName: string,
    seafarerSigned: boolean,
    validityMonths?: number
  ): { ok: boolean; error?: string } => {
    const target = patients.find((p) => p.id === patientId);
    if (!target || !target.rmp) return { ok: false, error: 'Record not found.' };

    const pendingOrders = target.orders.filter((o) => o.status !== 'Published');
    if (pendingOrders.length > 0) {
      return {
        ok: false,
        error: `Cannot issue certificate while ${pendingOrders.length} investigation(s) remain pending (RQP-604 §7.5).`,
      };
    }

    if (target.rmp.determination !== 'Fit' && target.rmp.determination !== 'Fit with limitation') {
      return {
        ok: false,
        error: 'A certificate may only be issued for a Fit or Fit with limitation determination (RQP-701 §7.1).',
      };
    }

    const stockItem = certificateStock.find(
      (s) => s.serialNo === serialNo && (s.status === 'Issued to RMP' || s.status === 'In Cabinet')
    );
    if (!stockItem) {
      return { ok: false, error: 'Selected certificate serial number is not available in stock.' };
    }

    const maxYears: 1 | 2 = target.rmp.isUnder18 ? 1 : 2;
    const maxMonths = maxYears * 12;
    const chosenMonths = Math.min(validityMonths || maxMonths, maxMonths);

    const examDateObj = new Date('2026-11-21');
    const expiryObj = new Date(examDateObj);
    expiryObj.setMonth(expiryObj.getMonth() + chosenMonths);
    const expiryStr = expiryObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const ts = formatNowTimestamp();
    const cert = {
      certificateNo: serialNo,
      supplementNo: `${serialNo}-S`,
      examinationDate: '21 Nov 2026',
      issueDate: '21 Nov 2026',
      expiryDate: expiryStr,
      maxValidityYears: maxYears,
      determination: target.rmp.determination,
      limitation: target.rmp.limitationText,
      fitForLookout: target.rmp.statutoryCriteria.fitForLookout,
      visualAidsRequired: target.rmp.visionHearing.visualAidsRequired,
      unaidedHearingSatisfactory: target.rmp.visionHearing.unaidedHearingSatisfactory,
      colourVisionDate: target.rmp.visionHearing.colourVisionLastDate,
      practitionerName: 'Dr. Babatunde Fashola-Cole',
      practitionerMdcn: 'MDCN/R/44819',
      secondCheckerName,
      seafarerSigned,
    };

    setCertificateStock((prev) =>
      prev.map((s) =>
        s.serialNo === serialNo
          ? {
              ...s,
              status: 'Used',
              assignedTo: 'Dr. Babatunde Fashola-Cole',
              recordNo: target.recordNo,
              seafarerName: target.fullName,
              updatedAt: ts,
            }
          : s
      )
    );

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId || !p.rmp) return p;
        return {
          ...p,
          status: 'Inactive',
          currentStage: 'Discharged',
          currentLocation: `Certificate Issued (${serialNo})`,
          rmp: {
            ...p.rmp,
            issuedCertificate: cert,
          },
          timeline: upsertTimelineStage(
            p.timeline,
            'Discharged',
            'Dr. Babatunde Fashola-Cole',
            'Recognized Medical Practitioner',
            `STCW Reg. I/9 Certificate ${serialNo} + Supplement ${serialNo}-S issued (${cert.determination}; valid until ${expiryStr}).`
          ),
        };
      })
    );

    appendAudit(
      'Dr. Babatunde Fashola-Cole',
      'Recognized Medical Practitioner',
      'Issued Medical Certificate (QAF-805-01)',
      target.recordNo,
      `Issued ${serialNo} + ${serialNo}-S (${cert.determination}; expiry ${expiryStr}; 2nd check by ${secondCheckerName}).`
    );

    return { ok: true };
  };

  const markBlankSpoiled = (serialNo: string, reason: string) => {
    const ts = formatNowTimestamp();
    setCertificateStock((prev) =>
      prev.map((s) =>
        s.serialNo === serialNo
          ? { ...s, status: 'Spoiled', updatedAt: ts, note: reason || 'Marked SPOILED and retained (RQP-702 §7.4).' }
          : s
      )
    );
    appendAudit(
      'Chidinma Okafor',
      'Certificate Stock Custodian',
      'Marked Blank Certificate SPOILED (RQP-702)',
      serialNo,
      `Serial ${serialNo} marked SPOILED and retained for monthly return: ${reason}`
    );
  };

  const verifyCertificate = (certificateNo: string, enquirer: string): VerificationEnquiry => {
    const cleanNo = certificateNo.trim().toUpperCase();
    const matchedPatient = patients.find(
      (p) => p.rmp?.issuedCertificate?.certificateNo.toUpperCase() === cleanNo
    );
    const cert = matchedPatient?.rmp?.issuedCertificate;
    const entry: VerificationEnquiry = {
      id: `ver-${Date.now()}`,
      timestamp: formatNowTimestamp(),
      enquirer: enquirer.trim() || 'NIMASA / Port State Control Officer',
      certificateNo: cleanNo,
      result: cert ? 'Issued' : 'No record',
      outcomeSummary: cert
        ? `Genuine · ${matchedPatient?.fullName} · ${cert.determination}${cert.limitation ? ` (${cert.limitation})` : ''} · Lookout: ${cert.fitForLookout ? 'Yes' : 'No'} · Expires ${cert.expiryDate} · Supplement ${cert.supplementNo} issued (No clinical data disclosed)`
        : 'No record of this certificate serial number issued by Kingscare. Flagged for RQP-204 §7.2 fraud check.',
    };
    setVerificationEnquiries((prev) => [entry, ...prev]);
    appendAudit(
      'Dr. Olumide Balogun',
      'Medical Director',
      'Certificate Verification Enquiry (RQP-204)',
      cleanNo || 'UNKNOWN',
      `Enquiry by ${entry.enquirer}: ${entry.result}. No clinical data disclosed (QA-P-808 §7.4).`
    );
    return entry;
  };

  const resetDemoData = () => {
    setPatients(enrichPatientsWithRmp(INITIAL_PATIENTS));
    setAuditLog(INITIAL_AUDIT_LOG);
    setSessionCheck(INITIAL_SESSION_CHECK);
    setDailyEquipmentCheck(INITIAL_DAILY_EQUIPMENT_CHECK);
    setCertificateStock(INITIAL_CERTIFICATE_STOCK);
    setVerificationEnquiries(INITIAL_VERIFICATION_ENQUIRIES);
  };

  return (
    <HospitalContext.Provider
      value={{
        patients,
        departments,
        users,
        auditLog,
        activeRole,
        setActiveRole,
        registerPatient,
        sendToDoctor,
        startFirstAssessment,
        completeFirstAssessment,
        orderTests,
        admitPatient,
        saveOrderDraft,
        publishOrderResult,
        recordSecondAssessment,
        addMedication,
        dischargePatient,
        sessionCheck,
        dailyEquipmentCheck,
        certificateStock,
        verificationEnquiries,
        confirmSessionCheck,
        toggleEquipmentCheckItem,
        saveVisionHearing,
        saveStatutoryCriteria,
        recordFitnessDetermination,
        issueMedicalCertificate,
        markBlankSpoiled,
        verifyCertificate,
        resetDemoData,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export function useHospital() {
  const ctx = useContext(HospitalContext);
  if (!ctx) {
    throw new Error('useHospital must be used inside HospitalProvider');
  }
  return ctx;
}
