import React, { useState } from 'react';
import { AlertTriangle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { IdDocumentType, SeafarerCategory } from '../../types';
import { calculateAgeYears } from '../../data/mockRmpData';
import { SlideOver } from '../../components/ui';

const CATEGORIES: SeafarerCategory[] = [
  'Deck (Master / Officer / Lookout)',
  'Engine / Electro-Technical',
  'GMDSS Radio Operator',
  'Catering / Other',
];

const ID_TYPES: IdDocumentType[] = [
  "Seafarer's Identity Document",
  'International Passport',
  'NIN National ID',
  'Discharge Book',
];

interface RegisterSeafarerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (info: {
    recordNo: string;
    name: string;
    isUnder18: boolean;
  }) => void;
}

export const RegisterSeafarerDrawer: React.FC<RegisterSeafarerDrawerProps> = ({
  isOpen,
  onClose,
  onRegistered,
}) => {
  const { registerPatient } = useHospital();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Identity & Age
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1988-05-14');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [nationality, setNationality] = useState('Nigerian');
  const [phone, setPhone] = useState('+234 803 ');
  const [idType, setIdType] = useState<IdDocumentType>(
    "Seafarer's Identity Document"
  );
  const [idNumber, setIdNumber] = useState('NG-SID-2026-4920');
  const [idVerifiedOriginal, setIdVerifiedOriginal] = useState(true);
  const [photoCaptured, setPhotoCaptured] = useState(true);

  // Step 2: Duties & History
  const [category, setCategory] = useState<SeafarerCategory>(
    'Deck (Master / Officer / Lookout)'
  );
  const [lookoutRequired, setLookoutRequired] = useState(true);
  const [previousCertNo, setPreviousCertNo] = useState('');
  const [priorityBasis, setPriorityBasis] = useState<
    | 'None'
    | 'Voyage Extension (Reg. I/9.6)'
    | 'NIMASA Urgent Permission (Reg. I/9.7)'
  >('None');

  // Step 3: Consent & Declaration
  const [nimasaMember, setNimasaMember] = useState(true);
  const [nimasaStaffId, setNimasaStaffId] = useState('NIM-MAR-5120');
  const [healthDeclarationSigned, setHealthDeclarationSigned] = useState(true);
  const [consentToShare, setConsentToShare] = useState(true);

  const age = calculateAgeYears(dob);
  const isUnder16 = age < 16;
  const isUnder18 = age >= 16 && age < 18;

  const step1Valid =
    Boolean(fullName.trim()) &&
    !isUnder16 &&
    idVerifiedOriginal &&
    photoCaptured;

  const canSubmit = step1Valid && healthDeclarationSigned;

  const resetForm = () => {
    setStep(1);
    setFullName('');
    setPhone('+234 803 ');
    setPreviousCertNo('');
  };

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const created = registerPatient({
      fullName: fullName.trim(),
      dob,
      gender,
      nationality,
      phone,
      nimasaMember,
      nimasaStaffId: nimasaMember ? nimasaStaffId : undefined,
      nimasaDepartment: category,
      consentToShareWithNimasa: nimasaMember ? consentToShare : false,
      idType,
      idNumber,
      idVerifiedOriginal,
      photoCaptured,
      category,
      lookoutRequired,
      previousCertNo: previousCertNo.trim() || undefined,
      priorityBasis,
      healthDeclarationSigned,
    });

    onRegistered({
      recordNo: created.recordNo,
      name: created.fullName,
      isUnder18,
    });
    resetForm();
    onClose();
  };

  const stepsMeta = [
    { num: 1 as const, label: '1. Identity & Age' },
    { num: 2 as const, label: '2. Duties & History' },
    { num: 3 as const, label: '3. Consent' },
  ];

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={handleClose}
      widthClass="max-w-xl"
      title="Register Seafarer"
      subtitle="Identity gate, shipboard duties statement, and NDPA 2023 consent"
      footer={
        <>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded border border-surface-border-strong bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-ink-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 rounded border border-surface-border-strong bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-ink-secondary transition-colors"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && !step1Valid}
              onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-navy-900 hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-navy-900 hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>Register Seafarer</span>
            </button>
          )}
        </>
      }
    >
      {/* Crisp 3-Step Indicator */}
      <nav aria-label="Registration steps" className="mb-6">
        <ol className="grid grid-cols-3 border border-surface-border rounded overflow-hidden divide-x divide-surface-border text-xs">
          {stepsMeta.map((s) => {
            const active = step === s.num;
            const done = step > s.num;
            return (
              <li
                key={s.num}
                className={`px-3 py-2.5 text-center font-medium transition-colors ${
                  active
                    ? 'bg-navy-900 text-white'
                    : done
                    ? 'bg-emerald-50/70 text-emerald-800'
                    : 'bg-surface-canvas text-ink-muted'
                }`}
              >
                {s.label}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* STEP 1: IDENTITY & AGE */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="fd-name"
              className="block text-xs font-medium text-ink-secondary mb-1.5"
            >
              Seafarer Full Name (Last, First, Middle) *
            </label>
            <input
              id="fd-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Capt. Olumide Balogun-Peters"
              className="w-full h-10 rounded border border-surface-border-strong px-3 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="fd-dob"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                Date of Birth *{' '}
                <span className="text-ink-muted font-normal">(Age {age})</span>
              </label>
              <input
                id="fd-dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full h-10 rounded border border-surface-border-strong px-3 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>

            <div>
              <label
                htmlFor="fd-gender"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                Gender
              </label>
              <select
                id="fd-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                className="w-full h-10 rounded border border-surface-border-strong px-3 text-sm bg-surface-card text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {isUnder16 && (
            <div
              role="alert"
              className="p-3.5 rounded bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-900"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">
                  Registration Blocked — Under 16 Years (Reg. I/9.4.1)
                </p>
                <p className="mt-0.5">
                  A candidate under 16 cannot be examined for a statutory STCW medical certificate.
                </p>
              </div>
            </div>
          )}

          {isUnder18 && (
            <div className="p-3.5 rounded bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">
                  Under 18 — One-Year Maximum Validity (Reg. I/9.5)
                </p>
                <p className="mt-0.5">
                  This record will be flagged automatically so certificate expiry cannot exceed 1 year.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="fd-nat"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                Nationality
              </label>
              <input
                id="fd-nat"
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full h-10 rounded border border-surface-border-strong px-3 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>
            <div>
              <label
                htmlFor="fd-phone"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                Phone Number *
              </label>
              <input
                id="fd-phone"
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 rounded border border-surface-border-strong px-3 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-surface-border space-y-3">
            <div className="text-xs font-semibold text-ink-primary">
              Original Photographic Identification (RQP-601 §7.2)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                aria-label="Identification document type"
                value={idType}
                onChange={(e) => setIdType(e.target.value as IdDocumentType)}
                className="w-full h-9 rounded border border-surface-border-strong bg-surface-card px-3 text-xs text-ink-primary"
              >
                {ID_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                aria-label="Identification document number"
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Document No."
                className="w-full h-9 rounded border border-surface-border-strong bg-surface-card px-3 text-xs font-mono text-ink-primary"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-ink-secondary">
              <input
                type="checkbox"
                checked={idVerifiedOriginal}
                onChange={(e) => setIdVerifiedOriginal(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600"
              />
              <span>
                Original ID verified (not a photocopy or phone scan) and matches presenter.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-ink-secondary">
              <input
                type="checkbox"
                checked={photoCaptured}
                onChange={(e) => setPhotoCaptured(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600"
              />
              <span>Live photograph captured on the day for examination &amp; collection check.</span>
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: DUTIES & HISTORY */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="fd-category"
              className="block text-xs font-medium text-ink-secondary mb-1.5"
            >
              Department &amp; Duties Category (RQF-503-01)
            </label>
            <select
              id="fd-category"
              value={category}
              onChange={(e) => {
                const val = e.target.value as SeafarerCategory;
                setCategory(val);
                if (val === 'Deck (Master / Officer / Lookout)') {
                  setLookoutRequired(true);
                }
              }}
              className="w-full h-10 rounded border border-surface-border-strong bg-surface-card px-3 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2.5 p-3.5 rounded bg-surface-canvas border border-surface-border cursor-pointer text-xs text-ink-secondary">
            <input
              type="checkbox"
              checked={lookoutRequired}
              disabled={category === 'Deck (Master / Officer / Lookout)'}
              onChange={(e) => setLookoutRequired(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600"
            />
            <span>
              <strong className="text-ink-primary block">
                Lookout duties required
              </strong>
              Applies Table A-I/9 Deck distance, near, and colour vision standards with zero discretion.
            </span>
          </label>

          <div>
            <label
              htmlFor="fd-prev-cert"
              className="block text-xs font-medium text-ink-secondary mb-1.5"
            >
              Previous Medical Certificate Number (Optional)
            </label>
            <input
              id="fd-prev-cert"
              type="text"
              value={previousCertNo}
              onChange={(e) => setPreviousCertNo(e.target.value)}
              placeholder="e.g. NIM-MC-2024-..."
              className="w-full h-10 rounded border border-surface-border-strong px-3 text-sm font-mono text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
            <p className="text-[11px] text-ink-muted mt-1">
              Original is retained by the seafarer until the new certificate or Not Fit notice is issued.
            </p>
          </div>

          <div>
            <label
              htmlFor="fd-priority"
              className="block text-xs font-medium text-ink-secondary mb-1.5"
            >
              Extended or Urgent-Case Priority (RQP-703)
            </label>
            <select
              id="fd-priority"
              value={priorityBasis}
              onChange={(e) =>
                setPriorityBasis(
                  e.target.value as
                    | 'None'
                    | 'Voyage Extension (Reg. I/9.6)'
                    | 'NIMASA Urgent Permission (Reg. I/9.7)'
                )
              }
              className="w-full h-10 rounded border border-surface-border-strong bg-surface-card px-3 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
            >
              <option value="None">Standard examination</option>
              <option value="Voyage Extension (Reg. I/9.6)">
                Voyage Extension (Reg. I/9.6 · Priority 2-day exam)
              </option>
              <option value="NIMASA Urgent Permission (Reg. I/9.7)">
                NIMASA Urgent Permission (Reg. I/9.7 · Priority 2-day exam)
              </option>
            </select>
          </div>
        </div>
      )}

      {/* STEP 3: CONSENT & HEALTH DECLARATION */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-4 rounded bg-surface-canvas border border-surface-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-primary">
                Sponsor / Billing Scope
              </span>
              <div className="inline-flex rounded border border-surface-border-strong bg-surface-card p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setNimasaMember(true);
                    setConsentToShare(true);
                  }}
                  className={`px-2.5 py-1 rounded font-medium ${
                    nimasaMember ? 'bg-navy-900 text-white' : 'text-ink-muted'
                  }`}
                >
                  NIMASA Oversight
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNimasaMember(false);
                    setConsentToShare(false);
                  }}
                  className={`px-2.5 py-1 rounded font-medium ${
                    !nimasaMember ? 'bg-navy-900 text-white' : 'text-ink-muted'
                  }`}
                >
                  Private
                </button>
              </div>
            </div>

            {nimasaMember && (
              <div>
                <label
                  htmlFor="fd-nimasa-id"
                  className="block text-[11px] font-medium text-ink-muted mb-1"
                >
                  NIMASA Staff / Seafarer Reference
                </label>
                <input
                  id="fd-nimasa-id"
                  type="text"
                  value={nimasaStaffId}
                  onChange={(e) => setNimasaStaffId(e.target.value)}
                  className="w-full h-9 rounded border border-surface-border-strong bg-surface-card px-3 text-xs font-mono text-ink-primary"
                />
              </div>
            )}
          </div>

          <label className="flex items-start gap-2.5 p-3.5 rounded border border-surface-border cursor-pointer text-xs text-ink-secondary">
            <input
              type="checkbox"
              checked={healthDeclarationSigned}
              onChange={(e) => setHealthDeclarationSigned(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600"
            />
            <span>
              <strong className="text-ink-primary block">
                Health Declaration signed (RQF-601-02)
              </strong>
              Completed privately by the seafarer and passed sealed directly to the examining practitioner.
            </span>
          </label>

          {nimasaMember && (
            <label className="flex items-start gap-2.5 p-3.5 rounded border border-surface-border cursor-pointer text-xs text-ink-secondary">
              <input
                type="checkbox"
                checked={consentToShare}
                onChange={(e) => setConsentToShare(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600"
              />
              <span>
                <strong className="text-ink-primary block">
                  NDPA 2023 &amp; Outcome-Only Consent
                </strong>
                Seafarer informed of the examination process, right of review, and that company/Agency
                receive fitness outcome only without clinical details.
              </span>
            </label>
          )}
        </div>
      )}
    </SlideOver>
  );
};
