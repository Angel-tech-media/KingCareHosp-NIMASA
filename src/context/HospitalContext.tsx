import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import {
  AuditLogEntry,
  AuthUser,
  CertificateStockItem,
  DailyEquipmentCheckState,
  DepartmentCertificate,
  DepartmentEquipment,
  DepartmentMaster,
  FitnessDetermination,
  IdDocumentType,
  PatientRecord,
  PracticeSettings,
  RoleType,
  SeafarerCategory,
  SessionRecognitionCheck,
  StatutoryCriteriaCheck,
  SystemUser,
  VerificationEnquiry,
  VisionHearingRecord,
} from '../types';

export interface NewPatientInput {
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

export interface NewOrderTestItem {
  category: 'Blood' | 'Stool' | 'Tissue' | 'Imaging' | 'Audiology' | 'Vision';
  testName: string;
  department: 'Laboratory' | 'Radiology' | 'ENT & Audiology' | 'Eye Clinic';
  referenceRange: string;
  clinicalInstruction?: string;
}

export interface DiagnosticStructuredPayload {
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
    colourVisionCie: VisionHearingRecord['colourVisionCie'];
  };
}

export interface InitialSetupInput {
  practiceName: string;
  address: string;
  certificateNo: string;
  stateFacilityRegNo: string;
  fullName: string;
  email: string;
  licenseNo?: string;
  password: string;
}

export interface EquipmentInput {
  name: string;
  manufacturer?: string;
  model: string;
  yearOfMake: number;
  serialNo: string;
  calibrationCertNo?: string;
  lastCalibrated?: string;
  nextCalibrationDue?: string;
  status: DepartmentEquipment['status'];
}

export interface DepartmentUpdateInput {
  floorLocation: string;
  description: string;
  hodName: string;
  hodTitle: string;
  hodQualifications: string;
  hodFellowship: string;
  hodYearsExperience: number;
  hodEmail: string;
}

export interface StaffInput {
  name: string;
  role: string;
  qualification: string;
  licenseNo: string;
  shift: string;
}

export interface DepartmentCertificateInput {
  type: string;
  issuingBody: string;
  certificateNo: string;
  yearCertified: number;
  expiryDate: string;
  status: DepartmentCertificate['status'];
}

export interface RegisterUserInput {
  fullName: string;
  email: string;
  password: string;
  portalRole: RoleType;
  roleTitle: string;
  department: string;
  licenseNo?: string;
}

export interface StockBatchInput {
  prefix: string;
  startNumber: number;
  count: number;
  assignedTo?: string;
}

interface BootstrapPayload {
  currentUser: AuthUser;
  practice: PracticeSettings;
  patients: PatientRecord[];
  departments: DepartmentMaster[];
  users: SystemUser[];
  auditLog: AuditLogEntry[];
  sessionCheck: SessionRecognitionCheck;
  dailyEquipmentCheck: DailyEquipmentCheckState;
  certificateStock: CertificateStockItem[];
  verificationEnquiries: VerificationEnquiry[];
}

const DEFAULT_PRACTICE: PracticeSettings = {
  practiceName: 'Kingscare Hospitals Limited',
  address: 'Plot 2181, Ibrahim Babangida Way, Wuse Zone 4, Abuja',
  certificateNo: 'NIM-RMP-ABJ-2025-014',
  status: 'Full',
  recognizedFrom: '15 Jan 2025',
  expiresOn: '14 Jan 2028',
  renewalCheckDue: '14 Jul 2027',
  engagementSigned: '12 Jan 2025',
  returnFrequency: 'Monthly (within 10 working days)',
  stateFacilityRegNo: 'FCT-PHMC-2024-0892',
  medicalDirector: 'Medical Director (MDCN Registered)',
};

const EMPTY_SESSION_CHECK: SessionRecognitionCheck = {
  date: '',
  practitionerName: '',
  mdcnNo: '',
  onAgencyRegister: false,
  premisesInScope: false,
  licenceValid: false,
};

const EMPTY_DAILY_EQ: DailyEquipmentCheckState = {
  date: '',
  checkedBy: 'Not yet checked',
  checkedAt: '',
  items: [],
};

interface HospitalContextValue {
  authLoading: boolean;
  initialized: boolean;
  demoToolsEnabled: boolean;
  currentUser: AuthUser | null;
  practice: PracticeSettings;
  patients: PatientRecord[];
  departments: DepartmentMaster[];
  users: SystemUser[];
  auditLog: AuditLogEntry[];
  activeRole: RoleType;
  sessionCheck: SessionRecognitionCheck;
  dailyEquipmentCheck: DailyEquipmentCheckState;
  certificateStock: CertificateStockItem[];
  verificationEnquiries: VerificationEnquiry[];

  // Auth & system
  refreshAuthStatus: () => Promise<void>;
  refreshBootstrap: () => Promise<void>;
  setupInitialAdmin: (input: InitialSetupInput) => Promise<AuthUser>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  seedSampleData: () => Promise<{
    defaultPassword: string;
    accounts: { email: string; fullName: string; portalRole: RoleType }[];
  }>;
  resetDatabase: () => Promise<void>;

  // Master file & user administration
  updatePractice: (input: PracticeSettings) => Promise<void>;
  updateDepartment: (deptId: DepartmentMaster['id'], input: DepartmentUpdateInput) => Promise<void>;
  registerEquipment: (deptId: DepartmentMaster['id'], input: EquipmentInput) => Promise<void>;
  updateEquipment: (equipmentId: string, input: Partial<EquipmentInput>) => Promise<void>;
  deleteEquipment: (equipmentId: string) => Promise<void>;
  registerDepartmentStaff: (deptId: DepartmentMaster['id'], input: StaffInput) => Promise<void>;
  deleteDepartmentStaff: (staffId: string) => Promise<void>;
  registerDepartmentCertificate: (
    deptId: DepartmentMaster['id'],
    input: DepartmentCertificateInput
  ) => Promise<void>;
  deleteDepartmentCertificate: (certId: string) => Promise<void>;
  registerUser: (input: RegisterUserInput) => Promise<void>;
  updateUserStatus: (userId: string, status: SystemUser['status']) => Promise<void>;
  resetUserPassword: (userId: string, password: string) => Promise<void>;

  // Stock control
  receiveStockBatch: (input: StockBatchInput) => Promise<number>;
  assignStockToRmp: (serialNo: string, assignedTo: string) => Promise<void>;
  markBlankSpoiled: (serialNo: string, reason: string) => Promise<void>;

  // Clinical & oversight workflows
  registerPatient: (input: NewPatientInput) => Promise<PatientRecord>;
  sendToDoctor: (patientId: string) => Promise<void>;
  startFirstAssessment: (patientId: string) => Promise<void>;
  completeFirstAssessment: (
    patientId: string,
    shortSummary: string,
    fullClinicalNote: string
  ) => Promise<void>;
  orderTests: (patientId: string, tests: NewOrderTestItem[]) => Promise<void>;
  admitPatient: (patientId: string, wardRoom?: string) => Promise<void>;
  saveOrderDraft: (
    orderId: string,
    draftFindings: string,
    scientistRemarks?: string
  ) => Promise<void>;
  updateOrderInstruction: (orderId: string, clinicalInstruction: string) => Promise<void>;
  publishOrderResult: (
    orderId: string,
    publishedResult: string,
    referenceRange: string,
    scientistRemarks: string,
    department: 'Laboratory' | 'Radiology' | 'ENT & Audiology' | 'Eye Clinic',
    structuredData?: DiagnosticStructuredPayload
  ) => Promise<void>;
  uploadOrderAttachment: (orderId: string, file: File) => Promise<void>;
  recordSecondAssessment: (patientId: string, note: string) => Promise<void>;
  addMedication: (
    patientId: string,
    med: { name: string; dosage: string; frequency: string; duration: string }
  ) => Promise<void>;
  dischargePatient: (patientId: string, dischargeSummary: string) => Promise<void>;
  confirmSessionCheck: () => Promise<void>;
  toggleEquipmentCheckItem: (itemId: string) => Promise<void>;
  saveVisionHearing: (patientId: string, record: VisionHearingRecord) => Promise<void>;
  saveStatutoryCriteria: (patientId: string, criteria: StatutoryCriteriaCheck) => Promise<void>;
  recordFitnessDetermination: (
    patientId: string,
    determination: Exclude<FitnessDetermination, 'Pending'>,
    basis: string,
    limitationText?: string,
    reviewNoticeSigned?: boolean
  ) => Promise<void>;
  issueMedicalCertificate: (
    patientId: string,
    serialNo: string,
    secondCheckerName: string,
    seafarerSigned: boolean,
    validityMonths?: number
  ) => Promise<{ ok: boolean; error?: string }>;
  verifyCertificate: (certificateNo: string, enquirer: string) => Promise<VerificationEnquiry>;
}

const HospitalContext = createContext<HospitalContextValue | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [demoToolsEnabled, setDemoToolsEnabled] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [practice, setPractice] = useState<PracticeSettings>(DEFAULT_PRACTICE);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentMaster[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [sessionCheck, setSessionCheck] = useState<SessionRecognitionCheck>(EMPTY_SESSION_CHECK);
  const [dailyEquipmentCheck, setDailyEquipmentCheck] =
    useState<DailyEquipmentCheckState>(EMPTY_DAILY_EQ);
  const [certificateStock, setCertificateStock] = useState<CertificateStockItem[]>([]);
  const [verificationEnquiries, setVerificationEnquiries] = useState<VerificationEnquiry[]>([]);

  const applyBootstrap = useCallback((data: BootstrapPayload) => {
    setCurrentUser(data.currentUser);
    setPractice(data.practice);
    setPatients(data.patients);
    setDepartments(data.departments);
    setUsers(data.users);
    setAuditLog(data.auditLog);
    setSessionCheck(data.sessionCheck);
    setDailyEquipmentCheck(data.dailyEquipmentCheck);
    setCertificateStock(data.certificateStock);
    setVerificationEnquiries(data.verificationEnquiries);
  }, []);

  const clearOperationalState = useCallback(() => {
    setCurrentUser(null);
    setPatients([]);
    setDepartments([]);
    setUsers([]);
    setAuditLog([]);
    setSessionCheck(EMPTY_SESSION_CHECK);
    setDailyEquipmentCheck(EMPTY_DAILY_EQ);
    setCertificateStock([]);
    setVerificationEnquiries([]);
  }, []);

  const refreshBootstrap = useCallback(async () => {
    const data = await apiRequest<BootstrapPayload>('/api/bootstrap');
    applyBootstrap(data);
  }, [applyBootstrap]);

  const refreshAuthStatus = useCallback(async () => {
    const status = await apiRequest<{
      initialized: boolean;
      demoToolsEnabled?: boolean;
      practice: PracticeSettings;
    }>('/api/auth/status');
    setInitialized(status.initialized);
    setDemoToolsEnabled(status.demoToolsEnabled !== false);
    setPractice(status.practice);

    try {
      const me = await apiRequest<{ user: AuthUser }>('/api/auth/me');
      setCurrentUser(me.user);
      await refreshBootstrap();
    } catch {
      clearOperationalState();
    }
  }, [clearOperationalState, refreshBootstrap]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refreshAuthStatus();
      } catch {
        if (active) clearOperationalState();
      } finally {
        if (active) setAuthLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshAuthStatus, clearOperationalState]);

  const setupInitialAdmin = async (input: InitialSetupInput): Promise<AuthUser> => {
    const res = await apiRequest<{ user: AuthUser }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setInitialized(true);
    setCurrentUser(res.user);
    await refreshBootstrap();
    return res.user;
  };

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await apiRequest<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setCurrentUser(res.user);
    await refreshBootstrap();
    return res.user;
  };

  const logout = async (): Promise<void> => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    clearOperationalState();
    await refreshAuthStatus();
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  };

  const seedSampleData = async () => {
    const res = await apiRequest<{
      ok: boolean;
      defaultPassword: string;
      accounts: { email: string; fullName: string; portalRole: RoleType }[];
    }>('/api/system/seed', { method: 'POST' });
    setInitialized(true);
    if (currentUser) {
      await logout();
    } else {
      await refreshAuthStatus();
    }
    return { defaultPassword: res.defaultPassword, accounts: res.accounts };
  };

  const resetDatabase = async () => {
    await apiRequest('/api/system/reset', { method: 'POST' });
    clearOperationalState();
    await refreshAuthStatus();
  };

  // Master File & Users
  const updatePractice = async (input: PracticeSettings) => {
    await apiRequest('/api/practice', { method: 'PUT', body: JSON.stringify(input) });
    await refreshBootstrap();
  };

  const updateDepartment = async (
    deptId: DepartmentMaster['id'],
    input: DepartmentUpdateInput
  ) => {
    await apiRequest(`/api/departments/${deptId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    await refreshBootstrap();
  };

  const registerEquipment = async (
    deptId: DepartmentMaster['id'],
    input: EquipmentInput
  ) => {
    await apiRequest(`/api/departments/${deptId}/equipment`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await refreshBootstrap();
  };

  const updateEquipment = async (equipmentId: string, input: Partial<EquipmentInput>) => {
    await apiRequest(`/api/equipment/${equipmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    await refreshBootstrap();
  };

  const deleteEquipment = async (equipmentId: string) => {
    await apiRequest(`/api/equipment/${equipmentId}`, { method: 'DELETE' });
    await refreshBootstrap();
  };

  const registerDepartmentStaff = async (
    deptId: DepartmentMaster['id'],
    input: StaffInput
  ) => {
    await apiRequest(`/api/departments/${deptId}/staff`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await refreshBootstrap();
  };

  const deleteDepartmentStaff = async (staffId: string) => {
    await apiRequest(`/api/department-staff/${staffId}`, { method: 'DELETE' });
    await refreshBootstrap();
  };

  const registerDepartmentCertificate = async (
    deptId: DepartmentMaster['id'],
    input: DepartmentCertificateInput
  ) => {
    await apiRequest(`/api/departments/${deptId}/certificates`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await refreshBootstrap();
  };

  const deleteDepartmentCertificate = async (certId: string) => {
    await apiRequest(`/api/department-certificates/${certId}`, { method: 'DELETE' });
    await refreshBootstrap();
  };

  const registerUser = async (input: RegisterUserInput) => {
    await apiRequest('/api/users', { method: 'POST', body: JSON.stringify(input) });
    await refreshBootstrap();
  };

  const updateUserStatus = async (userId: string, status: SystemUser['status']) => {
    await apiRequest(`/api/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await refreshBootstrap();
  };

  const resetUserPassword = async (userId: string, password: string) => {
    await apiRequest(`/api/users/${userId}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
    await refreshBootstrap();
  };

  // Stock control
  const receiveStockBatch = async (input: StockBatchInput) => {
    const res = await apiRequest<{ ok: boolean; insertedCount: number }>('/api/stock/batch', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await refreshBootstrap();
    return res.insertedCount;
  };

  const assignStockToRmp = async (serialNo: string, assignedTo: string) => {
    await apiRequest(`/api/stock/${encodeURIComponent(serialNo)}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedTo }),
    });
    await refreshBootstrap();
  };

  const markBlankSpoiled = async (serialNo: string, reason: string) => {
    await apiRequest(`/api/stock/${encodeURIComponent(serialNo)}/spoil`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    await refreshBootstrap();
  };

  // Clinical & Oversight
  const registerPatient = async (input: NewPatientInput): Promise<PatientRecord> => {
    const res = await apiRequest<{ patient: PatientRecord }>('/api/patients', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await refreshBootstrap();
    return res.patient;
  };

  const sendToDoctor = async (patientId: string) => {
    await apiRequest(`/api/patients/${patientId}/dispatch`, { method: 'POST' });
    await refreshBootstrap();
  };

  const startFirstAssessment = async (patientId: string) => {
    await apiRequest(`/api/patients/${patientId}/start-assessment`, { method: 'POST' });
    await refreshBootstrap();
  };

  const completeFirstAssessment = async (
    patientId: string,
    shortSummary: string,
    fullClinicalNote: string
  ) => {
    await apiRequest(`/api/patients/${patientId}/first-assessment`, {
      method: 'POST',
      body: JSON.stringify({ shortSummary, fullClinicalNote }),
    });
    await refreshBootstrap();
  };

  const orderTests = async (patientId: string, tests: NewOrderTestItem[]) => {
    await apiRequest(`/api/patients/${patientId}/orders`, {
      method: 'POST',
      body: JSON.stringify({ tests }),
    });
    await refreshBootstrap();
  };

  const admitPatient = async (patientId: string, wardRoom?: string) => {
    await apiRequest(`/api/patients/${patientId}/admit`, {
      method: 'POST',
      body: JSON.stringify({ wardRoom }),
    });
    await refreshBootstrap();
  };

  const saveOrderDraft = async (
    orderId: string,
    draftFindings: string,
    scientistRemarks?: string
  ) => {
    await apiRequest(`/api/orders/${orderId}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({ draftFindings, scientistRemarks }),
    });
    await refreshBootstrap();
  };

  const updateOrderInstruction = async (orderId: string, clinicalInstruction: string) => {
    await apiRequest(`/api/orders/${orderId}/instruction`, {
      method: 'PATCH',
      body: JSON.stringify({ clinicalInstruction }),
    });
    await refreshBootstrap();
  };

  const publishOrderResult = async (
    orderId: string,
    publishedResult: string,
    referenceRange: string,
    scientistRemarks: string,
    _department: 'Laboratory' | 'Radiology' | 'ENT & Audiology' | 'Eye Clinic',
    structuredData?: DiagnosticStructuredPayload
  ) => {
    await apiRequest(`/api/orders/${orderId}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        publishedResult,
        referenceRange,
        scientistRemarks,
        ...(structuredData?.audiometry ? { audiometry: structuredData.audiometry } : {}),
        ...(structuredData?.vision ? { vision: structuredData.vision } : {}),
      }),
    });
    await refreshBootstrap();
  };

  const uploadOrderAttachment = async (orderId: string, file: File) => {
    const dataBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read selected file.'));
      reader.readAsDataURL(file);
    });
    await apiRequest(`/api/orders/${orderId}/attachment`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        dataBase64,
      }),
    });
    await refreshBootstrap();
  };

  const recordSecondAssessment = async (patientId: string, note: string) => {
    await apiRequest(`/api/patients/${patientId}/second-assessment`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    await refreshBootstrap();
  };

  const addMedication = async (
    patientId: string,
    med: { name: string; dosage: string; frequency: string; duration: string }
  ) => {
    await apiRequest(`/api/patients/${patientId}/medications`, {
      method: 'POST',
      body: JSON.stringify(med),
    });
    await refreshBootstrap();
  };

  const dischargePatient = async (patientId: string, dischargeSummary: string) => {
    await apiRequest(`/api/patients/${patientId}/discharge`, {
      method: 'POST',
      body: JSON.stringify({ dischargeSummary }),
    });
    await refreshBootstrap();
  };

  const confirmSessionCheck = async () => {
    await apiRequest('/api/session-check', { method: 'POST' });
    await refreshBootstrap();
  };

  const toggleEquipmentCheckItem = async (itemId: string) => {
    await apiRequest(`/api/equipment/${itemId}/daily-check`, { method: 'PATCH' });
    await refreshBootstrap();
  };

  const saveVisionHearing = async (patientId: string, record: VisionHearingRecord) => {
    await apiRequest(`/api/patients/${patientId}/vision-hearing`, {
      method: 'PUT',
      body: JSON.stringify(record),
    });
    await refreshBootstrap();
  };

  const saveStatutoryCriteria = async (patientId: string, criteria: StatutoryCriteriaCheck) => {
    await apiRequest(`/api/patients/${patientId}/statutory-criteria`, {
      method: 'PUT',
      body: JSON.stringify(criteria),
    });
    await refreshBootstrap();
  };

  const recordFitnessDetermination = async (
    patientId: string,
    determination: Exclude<FitnessDetermination, 'Pending'>,
    basis: string,
    limitationText?: string,
    reviewNoticeSigned = true
  ) => {
    await apiRequest(`/api/patients/${patientId}/determination`, {
      method: 'POST',
      body: JSON.stringify({
        determination,
        basis,
        limitationText,
        reviewNoticeSigned,
      }),
    });
    await refreshBootstrap();
  };

  const issueMedicalCertificate = async (
    patientId: string,
    serialNo: string,
    secondCheckerName: string,
    seafarerSigned: boolean,
    validityMonths?: number
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      await apiRequest(`/api/patients/${patientId}/issue-certificate`, {
        method: 'POST',
        body: JSON.stringify({
          serialNo,
          secondCheckerName,
          seafarerSigned,
          validityMonths,
        }),
      });
      await refreshBootstrap();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to issue medical certificate.',
      };
    }
  };

  const verifyCertificate = async (
    certificateNo: string,
    enquirer: string
  ): Promise<VerificationEnquiry> => {
    const res = await apiRequest<{ enquiry: VerificationEnquiry }>('/api/verifications', {
      method: 'POST',
      body: JSON.stringify({ certificateNo, enquirer }),
    });
    await refreshBootstrap();
    return res.enquiry;
  };

  const activeRole: RoleType = currentUser?.portalRole ?? 'NIMASA';

  return (
    <HospitalContext.Provider
      value={{
        authLoading,
        initialized,
        demoToolsEnabled,
        currentUser,
        practice,
        patients,
        departments,
        users,
        auditLog,
        activeRole,
        sessionCheck,
        dailyEquipmentCheck,
        certificateStock,
        verificationEnquiries,
        refreshAuthStatus,
        refreshBootstrap,
        setupInitialAdmin,
        login,
        logout,
        changePassword,
        seedSampleData,
        resetDatabase,
        updatePractice,
        updateDepartment,
        registerEquipment,
        updateEquipment,
        deleteEquipment,
        registerDepartmentStaff,
        deleteDepartmentStaff,
        registerDepartmentCertificate,
        deleteDepartmentCertificate,
        registerUser,
        updateUserStatus,
        resetUserPassword,
        receiveStockBatch,
        assignStockToRmp,
        markBlankSpoiled,
        registerPatient,
        sendToDoctor,
        startFirstAssessment,
        completeFirstAssessment,
        orderTests,
        admitPatient,
        saveOrderDraft,
        updateOrderInstruction,
        publishOrderResult,
        uploadOrderAttachment,
        recordSecondAssessment,
        addMedication,
        dischargePatient,
        confirmSessionCheck,
        toggleEquipmentCheckItem,
        saveVisionHearing,
        saveStatutoryCriteria,
        recordFitnessDetermination,
        issueMedicalCertificate,
        verifyCertificate,
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
