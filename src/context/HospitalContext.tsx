import React, { createContext, useContext, useState } from 'react';
import {
  PatientRecord,
  PatientStage,
  RoleType,
  AuditLogEntry,
  DepartmentMaster,
  SystemUser,
  DiagnosticOrder,
} from '../types';
import { INITIAL_PATIENTS } from '../data/mockPatients';
import { MOCK_DEPARTMENTS } from '../data/mockDepartments';
import { MOCK_USERS, INITIAL_AUDIT_LOG } from '../data/mockUsers';

interface NewPatientInput {
  fullName: string;
  dob: string;
  gender: 'Male' | 'Female';
  phone: string;
  nimasaMember: boolean;
  nimasaStaffId?: string;
  nimasaDepartment?: string;
  consentToShareWithNimasa: boolean;
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
  const [patients, setPatients] = useState<PatientRecord[]>(INITIAL_PATIENTS);
  const [departments] = useState<DepartmentMaster[]>(MOCK_DEPARTMENTS);
  const [users] = useState<SystemUser[]>(MOCK_USERS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOG);
  const [activeRole, setActiveRole] = useState<RoleType>('NIMASA');

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
        ? input.nimasaDepartment || 'Maritime Safety & Administration'
        : undefined,
      consentToShareWithNimasa: input.nimasaMember
        ? input.consentToShareWithNimasa
        : false,
      status: 'Active',
      currentStage: 'Registered',
      currentLocation: 'Front Desk / Triage Reception',
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
      timeline: [
        {
          stage: 'Registered',
          reachedAt: timestamp,
          actorName: 'Chidinma Okafor',
          actorRole: 'Front Desk Officer',
          publicSummary: input.nimasaMember
            ? 'Registered at Front Desk; NIMASA membership and journey-sharing consent recorded.'
            : 'Registered at Front Desk as general hospital patient.',
        },
      ],
      orders: [],
    };

    setPatients((prev) => [newPatient, ...prev]);
    appendAudit(
      'Chidinma Okafor',
      'Front Desk Officer',
      'Registered New Patient',
      recordNo,
      `Registered ${input.fullName} (${input.nimasaMember ? 'NIMASA Member' : 'Private Patient'}).`
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

  const resetDemoData = () => {
    setPatients(INITIAL_PATIENTS);
    setAuditLog(INITIAL_AUDIT_LOG);
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
