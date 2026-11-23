import {
  CertificateStockItem,
  DailyEquipmentCheckState,
  PatientRecord,
  SeafarerCategory,
  SeafarerRmpData,
  SessionRecognitionCheck,
  VerificationEnquiry,
} from '../types';

export const PRACTICE_RECOGNITION = {
  practiceName: 'Kingscare Specialist Hospital, Abuja',
  certificateNo: 'NIM-RMP-ABJ-2025-014',
  status: 'Full' as const,
  recognizedFrom: '15 Jan 2025',
  expiresOn: '14 Jan 2028',
  renewalCheckDue: '14 Jul 2027',
  engagementSigned: '12 Jan 2025',
  returnFrequency: 'Monthly (within 10 working days)',
  stateFacilityRegNo: 'FCT-PHMC-2024-0892',
  medicalDirector: 'Dr. Olumide Balogun (MDCN/R/31402)',
  practitioners: [
    {
      ref: 'M-1',
      name: 'Dr. Olumide Balogun',
      role: 'Medical Director (RMP)',
      mdcnNo: 'MDCN/R/31402',
      licenceExpiry: '31 Dec 2026',
      agencyRegisterRef: 'QAR-803-01 / #014-A',
      scope: 'Deck, Engine, GMDSS, Catering (Abuja Premises P-1)',
      status: 'Full',
      cpdHoursYtd: 14,
    },
    {
      ref: 'M-2',
      name: 'Dr. Babatunde Fashola-Cole',
      role: 'Consultant Physician (RMP)',
      mdcnNo: 'MDCN/R/44819',
      licenceExpiry: '31 Dec 2026',
      agencyRegisterRef: 'QAR-803-01 / #014-B',
      scope: 'Deck, Engine, GMDSS, Catering (Abuja Premises P-1)',
      status: 'Full',
      cpdHoursYtd: 12,
    },
  ],
};

export const INITIAL_SESSION_CHECK: SessionRecognitionCheck = {
  date: '21 Nov 2026',
  practitionerName: 'Dr. Babatunde Fashola-Cole',
  mdcnNo: 'MDCN/R/44819',
  onAgencyRegister: true,
  premisesInScope: true,
  licenceValid: true,
  confirmedAt: '21 Nov 2026, 07:45',
};

export const INITIAL_DAILY_EQUIPMENT_CHECK: DailyEquipmentCheckState = {
  date: '21 Nov 2026',
  checkedBy: 'RN. Amina Mohammed (Authorised Support Staff)',
  checkedAt: '21 Nov 2026, 07:50',
  items: [
    { id: 'eq-cal', label: 'All calibration dates in order (RQR-402-01)', department: 'All', passed: true },
    { id: 'eq-dist', label: 'Snellen/logMAR distance chart (0.1–1.0) & lighting', department: 'Eye Clinic', passed: true },
    { id: 'eq-near', label: 'Near & intermediate vision test cards', department: 'Eye Clinic', passed: true },
    { id: 'eq-colour', label: 'Ishihara colour plates (current ed.) & daylight lamp', department: 'Eye Clinic', passed: true },
    { id: 'eq-audio', label: 'Pure-tone audiometer listening check (500–3000 Hz)', department: 'ENT / Audiology', passed: true },
    { id: 'eq-room', label: 'Audiometry booth / quiet room ambient noise check', department: 'ENT / Audiology', passed: true },
    { id: 'eq-bp', label: 'Validated blood pressure device & cuff sizes', department: 'Consultation', passed: true },
    { id: 'eq-scale', label: 'Weighing scale zero-check & height measure', department: 'Consultation', passed: true },
    { id: 'eq-urine', label: 'Urinalysis reagent strips within expiry', department: 'Laboratory', passed: true },
  ],
};

export const INITIAL_CERTIFICATE_STOCK: CertificateStockItem[] = [
  { serialNo: 'NIM-MC-2026-0401', status: 'Used', assignedTo: 'Dr. Babatunde Fashola-Cole', recordNo: 'KC-000112', seafarerName: 'Capt. Chinedu Okonkwo', updatedAt: '19 Nov 2026, 15:10' },
  { serialNo: 'NIM-MC-2026-0402', status: 'Used', assignedTo: 'Dr. Babatunde Fashola-Cole', recordNo: 'KC-000113', seafarerName: 'Engr. Aisha Bello-Sani', updatedAt: '19 Nov 2026, 16:40' },
  { serialNo: 'NIM-MC-2026-0403', status: 'Spoiled', assignedTo: 'Dr. Babatunde Fashola-Cole', updatedAt: '20 Nov 2026, 10:15', note: 'Printing misalignment on expiry date — marked SPOILED and retained (RQP-702 §7.4).' },
  { serialNo: 'NIM-MC-2026-0404', status: 'Used', assignedTo: 'Dr. Olumide Balogun', recordNo: 'KC-000114', seafarerName: 'Tunde Adebayo', updatedAt: '20 Nov 2026, 11:20' },
  { serialNo: 'NIM-MC-2026-0405', status: 'Used', assignedTo: 'Dr. Olumide Balogun', recordNo: 'KC-000115', seafarerName: 'Grace Etim-Udoh', updatedAt: '20 Nov 2026, 14:05' },
  { serialNo: 'NIM-MC-2026-0406', status: 'Issued to RMP', assignedTo: 'Dr. Babatunde Fashola-Cole', updatedAt: '21 Nov 2026, 07:55' },
  { serialNo: 'NIM-MC-2026-0407', status: 'Issued to RMP', assignedTo: 'Dr. Babatunde Fashola-Cole', updatedAt: '21 Nov 2026, 07:55' },
  { serialNo: 'NIM-MC-2026-0408', status: 'Issued to RMP', assignedTo: 'Dr. Babatunde Fashola-Cole', updatedAt: '21 Nov 2026, 07:55' },
  { serialNo: 'NIM-MC-2026-0409', status: 'Issued to RMP', assignedTo: 'Dr. Olumide Balogun', updatedAt: '21 Nov 2026, 07:58' },
  { serialNo: 'NIM-MC-2026-0410', status: 'In Cabinet', updatedAt: '01 Nov 2026, 09:00' },
  { serialNo: 'NIM-MC-2026-0411', status: 'In Cabinet', updatedAt: '01 Nov 2026, 09:00' },
  { serialNo: 'NIM-MC-2026-0412', status: 'In Cabinet', updatedAt: '01 Nov 2026, 09:00' },
];

export const INITIAL_VERIFICATION_ENQUIRIES: VerificationEnquiry[] = [
  {
    id: 'ver-1',
    timestamp: '21 Nov 2026, 08:20',
    enquirer: 'Port State Control — Apapa Port Complex',
    certificateNo: 'NIM-MC-2026-0401',
    result: 'Issued',
    outcomeSummary: 'Valid · Fit · Lookout: Yes · Expires 19 Nov 2028 (No clinical data disclosed)',
  },
  {
    id: 'ver-2',
    timestamp: '20 Nov 2026, 15:45',
    enquirer: 'Nigerian Maritime Crewing Ltd (Employer)',
    certificateNo: 'NIM-MC-2026-0404',
    result: 'Issued',
    outcomeSummary: 'Valid · Fit with limitation (Near-coastal voyages only; 6-month review) · Expires 20 May 2027',
  },
];

export function calculateAgeYears(dobIso: string): number {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return 30;
  const ref = new Date('2026-11-21');
  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function averageAudiometry(ear: { hz500: number; hz1000: number; hz2000: number; hz3000: number }): number {
  return Math.round((ear.hz500 + ear.hz1000 + ear.hz2000 + ear.hz3000) / 4);
}

export function evaluateTableAI9(rmp: SeafarerRmpData): {
  distancePass: boolean;
  unaidedPass: boolean;
  colourPass: boolean;
  hearingPass: boolean;
  deckZeroDiscretionBlock: boolean;
  notes: string[];
} {
  const notes: string[] = [];
  const uR = parseFloat(rmp.visionHearing.distanceUnaided.right) || 0;
  const uL = parseFloat(rmp.visionHearing.distanceUnaided.left) || 0;
  const aR = parseFloat(rmp.visionHearing.distanceAided.right) || 0;
  const aL = parseFloat(rmp.visionHearing.distanceAided.left) || 0;
  const aB = parseFloat(rmp.visionHearing.distanceAided.both) || Math.max(aR, aL);

  const unaidedPass = uR >= 0.1 && uL >= 0.1;
  if (!unaidedPass) {
    notes.push('Unaided distance vision below 0.1 minimum in at least one eye (B-I/9.10).');
  }

  let distancePass = true;
  let colourPass = true;
  const isDeck = rmp.category === 'Deck (Master / Officer / Lookout)' || rmp.lookoutRequired;

  if (isDeck) {
    distancePass = aR >= 0.5 && aL >= 0.5;
    if (!distancePass) {
      notes.push('Deck / Lookout requires aided distance vision ≥ 0.5 in each eye (Table A-I/9; zero discretion under A-I/9.5).');
    } else if (Math.max(aR, aL) < 0.7) {
      notes.push('Table A-I/9 Note 2: Neither eye reaches 0.7 — consider Clinical Vision Specialist referral.');
    }
    colourPass = rmp.visionHearing.colourVisionCie === 'CIE 1' || rmp.visionHearing.colourVisionCie === 'CIE 2';
    if (!colourPass) {
      notes.push('Deck / Lookout requires CIE Standard 1 or 2 colour vision.');
    }
  } else if (
    rmp.category === 'Engine / Electro-Technical' ||
    rmp.category === 'GMDSS Radio Operator'
  ) {
    distancePass = aR >= 0.4 && aL >= 0.4 && aB >= 0.4;
    if (!distancePass) {
      notes.push('Engine / GMDSS requires 0.4 in each eye and ≥ 0.4 combined (QA-P-804 §7.2.2; no Agency discretion granted).');
    }
    colourPass =
      rmp.visionHearing.colourVisionCie === 'CIE 1' ||
      rmp.visionHearing.colourVisionCie === 'CIE 2' ||
      rmp.visionHearing.colourVisionCie === 'CIE 3';
    if (!colourPass) {
      notes.push('Engine / GMDSS requires CIE Standard 1, 2 or 3.');
    }
  }

  const avgR = averageAudiometry(rmp.visionHearing.audiometryRight);
  const avgL = averageAudiometry(rmp.visionHearing.audiometryLeft);
  const better = Math.min(avgR, avgL);
  const other = Math.max(avgR, avgL);
  const hearingPass = better <= 30 && other <= 40;
  if (!hearingPass) {
    notes.push(`Unaided audiometry (${better} dB / ${other} dB) exceeds ILO/IMO threshold (≤ 30 dB better ear, ≤ 40 dB other ear).`);
  }

  const deckZeroDiscretionBlock = isDeck && (!distancePass || !colourPass || !rmp.visionHearing.nearVisionMet);

  return {
    distancePass,
    unaidedPass,
    colourPass,
    hearingPass,
    deckZeroDiscretionBlock,
    notes,
  };
}

function defaultCategoryForDept(dept?: string, index = 0): SeafarerCategory {
  const d = (dept || '').toLowerCase();
  if (d.includes('eng') || d.includes('marine environment') || d.includes('technical')) {
    return 'Engine / Electro-Technical';
  }
  if (d.includes('radio') || d.includes('comm') || d.includes('isps')) {
    return 'GMDSS Radio Operator';
  }
  if (d.includes('admin') || d.includes('finance') || d.includes('cater')) {
    return 'Catering / Other';
  }
  return index % 3 === 1 ? 'Engine / Electro-Technical' : 'Deck (Master / Officer / Lookout)';
}

export function enrichPatientsWithRmp(basePatients: PatientRecord[]): PatientRecord[] {
  return basePatients.map((p, idx) => {
    const category = defaultCategoryForDept(p.nimasaDepartment, idx);
    const lookoutRequired = category === 'Deck (Master / Officer / Lookout)';

    // Make patient index 4 (5th record) a 17-year-old cadet to demonstrate Reg. I/9.5 1-year max validity
    const dob = idx === 4 ? '2009-04-12' : p.dob;
    const isUnder18 = calculateAgeYears(dob) < 18;

    const isDischarged = p.status === 'Inactive' || p.currentStage === 'Discharged';

    // Default clean Table A-I/9 measurements
    const rmp: SeafarerRmpData = {
      nationality: 'Nigerian',
      idType: idx % 2 === 0 ? "Seafarer's Identity Document" : 'International Passport',
      idNumber: idx % 2 === 0 ? `NG-SID-2026-${4100 + idx}` : `A0948${210 + idx}`,
      idVerifiedOriginal: true,
      photoCaptured: true,
      isUnder18,
      previousCertNo: idx === 4 ? undefined : `NIM-MC-2024-${1200 + idx}`,
      previousColourVisionDate: idx === 4 ? undefined : '18 Nov 2024',
      category,
      lookoutRequired,
      specialDuties: lookoutRequired
        ? ['Fire-fighting team', 'Breathing apparatus', 'Bridge watchkeeping']
        : ['Fire-fighting team', 'Breathing apparatus', 'Confined spaces'],
      entryExam: idx === 4,
      healthDeclarationSigned: true,
      priorityBasis:
        idx === 2 ? 'NIMASA Urgent Permission (Reg. I/9.7)' : 'None',
      visionHearing: {
        distanceUnaided: { right: '0.8', left: '0.8', both: '1.0' },
        distanceAided: { right: '1.0', left: '1.0', both: '1.0' },
        visualAidsRequired: idx === 1 || idx === 3,
        nearVisionMet: true,
        intermediateVisionMet: true,
        visualFieldsNormal: true,
        nightVisionNormal: true,
        diplopiaAbsent: true,
        colourVisionLastDate: '21 Nov 2026',
        colourVisionTestMethod: 'Ishihara 38-Plate (2024 Ed.) under D65 Lamp',
        colourVisionCie: idx === 1 ? 'Pending specialist' : 'CIE 1',
        colourVisionReferred: idx === 1,
        audiometryRight: { hz500: 15, hz1000: 15, hz2000: 20, hz3000: 20 },
        audiometryLeft: { hz500: 15, hz1000: 20, hz2000: 20, hz3000: 25 },
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
        fitForLookout: lookoutRequired,
      },
      determination: isDischarged ? 'Fit' : 'Pending',
      determinationBasis: isDischarged
        ? 'Meets all five Section A-I/9.2 criteria, Table A-I/9 vision/colour standards, and ILO/IMO hearing thresholds.'
        : undefined,
    };

    // Special demo cases matching NIMASA QSS scenarios:
    // Case A: Discharged #114 -> Fit with limitation + QAF-804-02 signed
    if (p.recordNo === 'KC-000114') {
      rmp.determination = 'Fit with limitation';
      rmp.limitationText = 'Near-coastal voyages only; valid for 6 months; to be re-examined.';
      rmp.determinationBasis = 'Requires 6-month clinical review under ILO/IMO cardiovascular guideline; safe for near-coastal duties.';
      rmp.rightOfReview = {
        issuedAt: '20 Nov 2026, 11:10',
        seafarerSigned: true,
        reviewRequested: false,
      };
      rmp.issuedCertificate = {
        certificateNo: 'NIM-MC-2026-0404',
        supplementNo: 'NIM-MC-2026-0404-S',
        examinationDate: '20 Nov 2026',
        issueDate: '20 Nov 2026',
        expiryDate: '20 May 2027',
        maxValidityYears: 2,
        determination: 'Fit with limitation',
        limitation: rmp.limitationText,
        fitForLookout: false,
        visualAidsRequired: false,
        unaidedHearingSatisfactory: true,
        colourVisionDate: '20 Nov 2026',
        practitionerName: 'Dr. Olumide Balogun',
        practitionerMdcn: 'MDCN/R/31402',
        secondCheckerName: 'Chidinma Okafor (Stock Custodian)',
        seafarerSigned: true,
      };
    } else if (p.recordNo === 'KC-000115') {
      // Case B: Not Fit case with signed QAF-804-02 + active Independent Referee Review (RQP-704)
      rmp.determination = 'Not fit';
      rmp.visionHearing.distanceAided = { right: '0.33', left: '0.4', both: '0.4' };
      rmp.statutoryCriteria.fitForLookout = false;
      rmp.determinationBasis = 'Deck officer distance vision (0.33 right eye) below Table A-I/9 mandatory 0.5 minimum; zero discretion under A-I/9.5.';
      rmp.rightOfReview = {
        issuedAt: '20 Nov 2026, 14:05',
        seafarerSigned: true,
        reviewRequested: true,
        recordsReleasedAt: '21 Nov 2026, 09:30',
        refereeOutcome: 'Pending',
      };
    } else if (isDischarged) {
      const certSerial =
        p.recordNo === 'KC-000112'
          ? 'NIM-MC-2026-0401'
          : p.recordNo === 'KC-000113'
          ? 'NIM-MC-2026-0402'
          : `NIM-MC-2026-039${idx}`;
      rmp.issuedCertificate = {
        certificateNo: certSerial,
        supplementNo: `${certSerial}-S`,
        examinationDate: '19 Nov 2026',
        issueDate: '19 Nov 2026',
        expiryDate: isUnder18 ? '19 Nov 2027' : '19 Nov 2028',
        maxValidityYears: isUnder18 ? 1 : 2,
        determination: 'Fit',
        fitForLookout: lookoutRequired,
        visualAidsRequired: rmp.visionHearing.visualAidsRequired,
        unaidedHearingSatisfactory: true,
        colourVisionDate: '19 Nov 2026',
        practitionerName: 'Dr. Babatunde Fashola-Cole',
        practitionerMdcn: 'MDCN/R/44819',
        secondCheckerName: 'Chidinma Okafor (Stock Custodian)',
        seafarerSigned: true,
      };
    }

    return {
      ...p,
      dob,
      rmp,
    };
  });
}
