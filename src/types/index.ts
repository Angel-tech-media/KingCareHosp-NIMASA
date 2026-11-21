export type PatientStage =
  | 'Registered'
  | 'Awaiting doctor'
  | 'In assessment'
  | 'First assessment complete'
  | 'Tests requested'
  | 'Admitted'
  | 'Results ready'
  | 'Second assessment'
  | 'Discharged';

export type PatientStatus = 'Active' | 'Inactive';

export type RoleType =
  | 'NIMASA'
  | 'FRONT_DESK'
  | 'DOCTOR'
  | 'LAB'
  | 'RADIOLOGY'
  | 'ADMIN';

export interface StageHistoryEntry {
  stage: PatientStage;
  reachedAt: string;
  actorName: string;
  actorRole: string;
  publicSummary: string;
}

export interface DiagnosticOrder {
  id: string;
  patientId: string;
  recordNo: string;
  patientName: string;
  department: 'Laboratory' | 'Radiology';
  category: 'Blood' | 'Stool' | 'Tissue' | 'Imaging';
  testName: string;
  orderedBy: string;
  orderedAt: string;
  status: 'Pending' | 'Draft' | 'Published';
  draftFindings?: string;
  publishedResult?: string;
  referenceRange?: string;
  scientistRemarks?: string;
  completedBy?: string;
  publishedAt?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  prescribedAt: string;
}

export interface PatientRecord {
  id: string;
  recordNo: string;
  fullName: string;
  dob: string;
  gender: 'Male' | 'Female';
  phone: string;
  nimasaMember: boolean;
  nimasaStaffId?: string;
  nimasaDepartment?: string;
  consentToShareWithNimasa: boolean;
  status: PatientStatus;
  currentStage: PatientStage;
  currentLocation: string;
  isAdmitted?: boolean;
  wardRoom?: string;
  arrivedAt: string;
  timeInHospital: string;
  vitals: {
    bp: string;
    temp: string;
    pulse: string;
    spo2: string;
    weight: string;
  };
  firstAssessmentSummary?: string;
  firstAssessmentFullNote?: string;
  secondAssessmentNote?: string;
  medications: MedicationItem[];
  dischargeSummary?: string;
  timeline: StageHistoryEntry[];
  orders: DiagnosticOrder[];
}

export interface DepartmentStaff {
  id: string;
  name: string;
  role: string;
  qualification: string;
  licenseNo: string;
  shift: string;
}

export interface DepartmentEquipment {
  id: string;
  name: string;
  model: string;
  yearOfMake: number;
  serialNo: string;
  status: 'Operational' | 'Calibration Due' | 'Maintenance';
}

export interface DepartmentCertificate {
  id: string;
  type: string;
  issuingBody: string;
  certificateNo: string;
  yearCertified: number;
  expiryDate: string;
  status: 'Valid' | 'Expiring' | 'Expired';
}

export interface DepartmentMaster {
  id: 'lab' | 'radiology' | 'ent' | 'eye';
  name: string;
  shortCode: string;
  floorLocation: string;
  description: string;
  hod: {
    name: string;
    title: string;
    qualifications: string;
    fellowship: string;
    yearsExperience: number;
    email: string;
  };
  staff: DepartmentStaff[];
  equipment: DepartmentEquipment[];
  certificates: DepartmentCertificate[];
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  portalCategory: RoleType;
  department: string;
  status: 'Active' | 'On Leave';
  lastLogin: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  recordNo: string;
  details: string;
}
