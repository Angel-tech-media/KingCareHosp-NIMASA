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

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  roleTitle: string;
  portalRole: RoleType;
  department: string;
  licenseNo?: string;
  status: 'Active' | 'On Leave' | 'Suspended';
}

export interface PracticeSettings {
  practiceName: string;
  address: string;
  certificateNo: string;
  status: string;
  recognizedFrom: string;
  expiresOn: string;
  renewalCheckDue: string;
  engagementSigned: string;
  returnFrequency: string;
  stateFacilityRegNo: string;
  medicalDirector: string;
}

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

export type SeafarerCategory =
  | 'Deck (Master / Officer / Lookout)'
  | 'Engine / Electro-Technical'
  | 'GMDSS Radio Operator'
  | 'Catering / Other';

export type IdDocumentType =
  | "Seafarer's Identity Document"
  | 'International Passport'
  | 'Passport'
  | 'NIN National ID'
  | 'National ID Card (NIMC)'
  | 'Discharge Book'
  | 'Certificate of Competency';

export type FitnessDetermination =
  | 'Pending'
  | 'Fit'
  | 'Fit with limitation'
  | 'Not fit';

export type CieStandard =
  | 'CIE 1'
  | 'CIE 2'
  | 'CIE 3'
  | 'Not tested'
  | 'Failed'
  | 'Pending specialist';

export interface VisionHearingRecord {
  distanceUnaided: { right: string; left: string; both: string };
  distanceAided: { right: string; left: string; both: string };
  visualAidsRequired: boolean;
  nearVisionMet: boolean;
  intermediateVisionMet: boolean;
  visualFieldsNormal: boolean;
  nightVisionNormal: boolean;
  diplopiaAbsent: boolean;
  colourVisionLastDate: string;
  colourVisionTestMethod: string;
  colourVisionCie: CieStandard;
  colourVisionReferred: boolean;
  audiometryRight: { hz500: number; hz1000: number; hz2000: number; hz3000: number };
  audiometryLeft: { hz500: number; hz1000: number; hz2000: number; hz3000: number };
  unaidedHearingSatisfactory: boolean;
  speechClear: boolean;
  testedBy?: string;
}

export interface StatutoryCriteriaCheck {
  physicalCapabilityBasicTraining: boolean; // A-I/9.2.1
  hearingAndSpeechAdequate: boolean; // A-I/9.2.2
  noConditionPreventingDuties: boolean; // A-I/9.2.3
  noConditionAggravatedBySea: boolean; // A-I/9.2.4
  noImpairingMedication: boolean; // A-I/9.2.5
  fitForLookout: boolean; // A-I/9.7.3.6
}

export interface RightOfReviewNotice {
  issuedAt: string;
  seafarerSigned: boolean;
  reviewRequested?: boolean;
  recordsReleasedAt?: string;
  refereeOutcome?: 'Pending' | 'Confirmed' | 'Varied' | 'Set aside';
}

export interface IssuedCertificate {
  certificateNo: string; // QAF-805-01 serial
  supplementNo: string; // certificateNo + "-S" (RQF-701-01)
  examinationDate: string;
  issueDate: string;
  expiryDate: string;
  maxValidityYears: 1 | 2;
  determination: 'Fit' | 'Fit with limitation';
  limitation?: string;
  fitForLookout: boolean;
  visualAidsRequired: boolean;
  unaidedHearingSatisfactory: boolean;
  colourVisionDate: string;
  practitionerName: string;
  practitionerMdcn: string;
  secondCheckerName: string;
  seafarerSigned: boolean;
}

export interface SeafarerRmpData {
  nationality: string;
  idType: IdDocumentType;
  idNumber: string;
  idVerifiedOriginal: boolean;
  photoCaptured: boolean;
  isUnder18: boolean;
  previousCertNo?: string;
  previousColourVisionDate?: string;
  category: SeafarerCategory;
  lookoutRequired: boolean;
  specialDuties: string[];
  entryExam: boolean;
  healthDeclarationSigned: boolean;
  priorityBasis?: 'None' | 'Voyage Extension (Reg. I/9.6)' | 'NIMASA Urgent Permission (Reg. I/9.7)';
  visionHearing: VisionHearingRecord;
  statutoryCriteria: StatutoryCriteriaCheck;
  determination: FitnessDetermination;
  determinationBasis?: string;
  limitationText?: string;
  rightOfReview?: RightOfReviewNotice;
  issuedCertificate?: IssuedCertificate;
}

export interface CertificateStockItem {
  serialNo: string;
  status: 'In Cabinet' | 'Issued to RMP' | 'Used' | 'Spoiled';
  assignedTo?: string;
  recordNo?: string;
  seafarerName?: string;
  updatedAt: string;
  note?: string;
}

export interface DailyEquipmentCheckState {
  date: string;
  checkedBy: string;
  checkedAt: string;
  items: {
    id: string;
    label: string;
    department: string;
    passed: boolean;
  }[];
}

export interface SessionRecognitionCheck {
  date: string;
  practitionerName: string;
  mdcnNo: string;
  onAgencyRegister: boolean;
  premisesInScope: boolean;
  licenceValid: boolean;
  confirmedAt?: string;
}

export interface VerificationEnquiry {
  id: string;
  timestamp: string;
  enquirer: string;
  certificateNo: string;
  result: 'Issued' | 'No record';
  outcomeSummary: string;
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
  rmp?: SeafarerRmpData;
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
  manufacturer?: string;
  model: string;
  yearOfMake: number;
  serialNo: string;
  calibrationCertNo?: string;
  lastCalibrated?: string;
  nextCalibrationDue?: string;
  registeredBy?: string;
  status: 'Operational' | 'Calibration Due' | 'Maintenance' | 'Out of Use';
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
  licenseNo?: string;
  status: 'Active' | 'On Leave' | 'Suspended';
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
