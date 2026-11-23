import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Send,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  Camera,
  FileText,
  Lock,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { StageChip, StatusChip } from '../../components/ui/StageChip';
import { IdDocumentType, SeafarerCategory } from '../../types';
import { calculateAgeYears } from '../../data/mockRmpData';

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

export const FrontDeskPage: React.FC = () => {
  const { patients, registerPatient, sendToDoctor } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1988-05-14');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [nationality, setNationality] = useState('Nigerian');
  const [phone, setPhone] = useState('+234 803 ');
  const [idType, setIdType] = useState<IdDocumentType>("Seafarer's Identity Document");
  const [idNumber, setIdNumber] = useState('NG-SID-2026-4920');
  const [idVerifiedOriginal, setIdVerifiedOriginal] = useState(true);
  const [photoCaptured, setPhotoCaptured] = useState(true);
  const [category, setCategory] = useState<SeafarerCategory>('Deck (Master / Officer / Lookout)');
  const [lookoutRequired, setLookoutRequired] = useState(true);
  const [previousCertNo, setPreviousCertNo] = useState('');
  const [previousColourVisionDate, setPreviousColourVisionDate] = useState('');
  const [priorityBasis, setPriorityBasis] = useState<
    'None' | 'Voyage Extension (Reg. I/9.6)' | 'NIMASA Urgent Permission (Reg. I/9.7)'
  >('None');
  const [healthDeclarationSigned, setHealthDeclarationSigned] = useState(true);
  const [nimasaMember, setNimasaMember] = useState(true);
  const [nimasaStaffId, setNimasaStaffId] = useState('NIM-MAR-5120');
  const [consentToShare, setConsentToShare] = useState(true);

  const [justGeneratedRecord, setJustGeneratedRecord] = useState<{
    recordNo: string;
    name: string;
    isUnder18: boolean;
  } | null>(null);

  const age = calculateAgeYears(dob);
  const isUnder16 = age < 16;
  const isUnder18 = age >= 16 && age < 18;
  const canSubmit =
    Boolean(fullName.trim()) &&
    !isUnder16 &&
    idVerifiedOriginal &&
    photoCaptured &&
    healthDeclarationSigned;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
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
      previousColourVisionDate: previousColourVisionDate.trim() || undefined,
      priorityBasis,
      healthDeclarationSigned,
    });

    setJustGeneratedRecord({
      recordNo: created.recordNo,
      name: created.fullName,
      isUnder18,
    });

    setFullName('');
    setPhone('+234 803 ');
    setPreviousCertNo('');
  };

  const filteredArrivals = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => {
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.recordNo.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.rmp?.category.toLowerCase().includes(q) ?? false)
      );
    });
  }, [patients, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded mb-1.5">
            RQP-601 · RQW-003 · Reception & Identity Gate
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
            Seafarer Registration & Today&apos;s Arrivals
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Verify original photographic ID, enforce STCW age limits (≥16), capture duties statement
            (<span className="font-mono text-xs">RQF-503-01</span>), and dispatch to the Recognized Medical Practitioner.
          </p>
        </div>

        <Link
          to="/nimasa"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-card border border-surface-border-strong hover:bg-primary-50/50 text-xs font-semibold text-ink-secondary shadow-card transition-colors"
        >
          <span>Verify Live on NIMASA Portal</span>
          <ArrowUpRight className="w-4 h-4 text-primary-600" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Register New Seafarer Form (5 cols) */}
        <section
          aria-labelledby="register-seafarer-heading"
          className="lg:col-span-5 bg-surface-card rounded-lg border border-surface-border shadow-card p-6"
        >
          <div className="flex items-center gap-2.5 pb-4 border-b border-surface-border">
            <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 flex items-center justify-center">
              <UserPlus className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="register-seafarer-heading" className="text-base font-bold text-ink-primary">
                Register Seafarer (RQF-601-01)
              </h2>
              <p className="text-xs text-ink-muted">
                Generates a unique Kingscare record number & stamps reception trail
              </p>
            </div>
          </div>

          {justGeneratedRecord && (
            <div
              role="status"
              className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs">
                <p className="font-bold text-emerald-900">
                  Seafarer Registered — Record No.{' '}
                  <span className="font-mono underline">{justGeneratedRecord.recordNo}</span>
                </p>
                <p className="text-emerald-800 mt-0.5">
                  {justGeneratedRecord.name} added to arrivals
                  {justGeneratedRecord.isUnder18 ? ' (Flagged: Under-18 1-year max validity).' : '.'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-5 space-y-4">
            {/* Identity & Demographics */}
            <div>
              <label htmlFor="fd-name" className="block text-xs font-semibold text-ink-secondary mb-1">
                Seafarer Full Name (Last, First, Middle) *
              </label>
              <input
                id="fd-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Capt. Olumide Balogun-Peters"
                className="w-full rounded-lg border border-surface-border-strong px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fd-dob" className="block text-xs font-semibold text-ink-secondary mb-1">
                  Date of Birth * <span className="text-ink-muted font-normal">(Age: {age})</span>
                </label>
                <input
                  id="fd-dob"
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-lg border border-surface-border-strong px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label htmlFor="fd-gender" className="block text-xs font-semibold text-ink-secondary mb-1">
                  Gender (A-I/9.7.2.3)
                </label>
                <select
                  id="fd-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                  className="w-full rounded-lg border border-surface-border-strong px-3 py-2 text-sm bg-surface-card text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* Mandatory STCW Age Gate Alerts */}
            {isUnder16 && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-900"
              >
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold">Registration Blocked — Under 16 Years (Reg. I/9.4.1)</p>
                  <p className="mt-0.5">
                    A person under 16 cannot be examined for a statutory STCW medical certificate (RQP-601 §7.3.1).
                  </p>
                </div>
              </div>
            )}

            {isUnder18 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold">UNDER 18: ONE-YEAR MAXIMUM VALIDITY (Reg. I/9.5)</p>
                  <p className="mt-0.5">
                    Record will be automatically flagged so the certificate cannot exceed 1 year.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fd-nat" className="block text-xs font-semibold text-ink-secondary mb-1">
                  Nationality (A-I/9.7.2.4)
                </label>
                <input
                  id="fd-nat"
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full rounded-lg border border-surface-border-strong px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label htmlFor="fd-phone" className="block text-xs font-semibold text-ink-secondary mb-1">
                  Phone Number *
                </label>
                <input
                  id="fd-phone"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-surface-border-strong px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>

            {/* Original Photographic ID Gate (RQW-003 §5.1) */}
            <div className="p-3.5 rounded-lg bg-surface-canvas border border-surface-border space-y-2.5">
              <div className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-primary-600" aria-hidden="true" />
                Original Photo ID & Day Photo (RQP-601 §7.2)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  aria-label="Identification document type"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as IdDocumentType)}
                  className="w-full rounded-lg border border-surface-border-strong bg-surface-card px-2.5 py-1.5 text-xs text-ink-primary"
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
                  className="w-full rounded-lg border border-surface-border-strong bg-surface-card px-2.5 py-1.5 text-xs font-mono text-ink-primary"
                />
              </div>
              <label className="flex items-start gap-2 cursor-pointer text-xs text-ink-secondary">
                <input
                  type="checkbox"
                  checked={idVerifiedOriginal}
                  onChange={(e) => setIdVerifiedOriginal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600"
                />
                <span>
                  <strong>Original ID checked</strong> (no photocopy/phone scan) &amp; person matches photo.
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer text-xs text-ink-secondary">
                <input
                  type="checkbox"
                  checked={photoCaptured}
                  onChange={(e) => setPhotoCaptured(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600"
                />
                <span>Live photograph captured on the day for RMP &amp; certificate collection check.</span>
              </label>
            </div>

            {/* Duties & Department Statement (RQF-503-01) */}
            <div className="p-3.5 rounded-lg bg-surface-canvas border border-surface-border space-y-2.5">
              <div className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary-600" aria-hidden="true" />
                Duties &amp; Department Statement (RQF-503-01)
              </div>
              <select
                aria-label="Seafarer department and category"
                value={category}
                onChange={(e) => {
                  const val = e.target.value as SeafarerCategory;
                  setCategory(val);
                  if (val === 'Deck (Master / Officer / Lookout)') setLookoutRequired(true);
                }}
                className="w-full rounded-lg border border-surface-border-strong bg-surface-card px-2.5 py-2 text-xs font-medium text-ink-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-secondary">
                <input
                  type="checkbox"
                  checked={lookoutRequired}
                  disabled={category === 'Deck (Master / Officer / Lookout)'}
                  onChange={(e) => setLookoutRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-border-strong text-primary-600"
                />
                <span>
                  Required to undertake <strong>lookout duties</strong> (applies Deck Table A-I/9 standard)
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label htmlFor="fd-prev-cert" className="block text-[11px] font-medium text-ink-muted mb-1">
                    Previous Cert No. (if any)
                  </label>
                  <input
                    id="fd-prev-cert"
                    type="text"
                    value={previousCertNo}
                    onChange={(e) => setPreviousCertNo(e.target.value)}
                    placeholder="e.g. NIM-MC-2024-..."
                    className="w-full rounded-lg border border-surface-border-strong bg-surface-card px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="fd-priority" className="block text-[11px] font-medium text-ink-muted mb-1">
                    Priority / Extended Basis (RQP-703)
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
                    className="w-full rounded-lg border border-surface-border-strong bg-surface-card px-2 py-1.5 text-xs"
                  >
                    <option value="None">Standard examination</option>
                    <option value="Voyage Extension (Reg. I/9.6)">Voyage Extension (Reg. I/9.6)</option>
                    <option value="NIMASA Urgent Permission (Reg. I/9.7)">NIMASA Urgent Permission (Reg. I/9.7)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Health Declaration & NDPA Consent */}
            <div className="p-3.5 rounded-lg bg-surface-canvas border border-surface-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  Health Declaration &amp; NDPA 2023 Consent
                </span>
                <div className="inline-flex rounded-lg border border-surface-border-strong bg-surface-card p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setNimasaMember(true);
                      setConsentToShare(true);
                    }}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      nimasaMember ? 'bg-primary-600 text-white' : 'text-ink-muted'
                    }`}
                  >
                    NIMASA
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNimasaMember(false);
                      setConsentToShare(false);
                    }}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      !nimasaMember ? 'bg-slate-800 text-white' : 'text-ink-muted'
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>

              {nimasaMember && (
                <input
                  aria-label="NIMASA staff or seafarer ID"
                  type="text"
                  value={nimasaStaffId}
                  onChange={(e) => setNimasaStaffId(e.target.value)}
                  placeholder="NIMASA Staff / Seafarer Ref"
                  className="w-full rounded-lg border border-surface-border-strong bg-surface-card px-2.5 py-1.5 text-xs font-mono"
                />
              )}

              <label className="flex items-start gap-2 cursor-pointer text-xs text-ink-secondary">
                <input
                  type="checkbox"
                  checked={healthDeclarationSigned}
                  onChange={(e) => setHealthDeclarationSigned(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600"
                />
                <span>
                  <strong>RQF-601-02 Health Declaration signed</strong> by seafarer &amp; passed sealed to RMP
                  (unread by reception staff, RQP-601 §7.5).
                </span>
              </label>

              {nimasaMember && (
                <label className="flex items-start gap-2 cursor-pointer text-xs text-ink-secondary">
                  <input
                    type="checkbox"
                    checked={consentToShare}
                    onChange={(e) => setConsentToShare(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600"
                  />
                  <span>
                    <strong>NDPA 2023 &amp; NIMASA Consent:</strong> Seafarer informed of exam process, right of
                    review, and that company/Agency receive fitness outcome only (no clinical notes).
                  </span>
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Register Seafarer &amp; Generate Record Number</span>
            </button>
          </form>
        </section>

        {/* Right Column: Search & Today's Arrivals List (7 cols) */}
        <section
          aria-labelledby="arrivals-heading"
          className="lg:col-span-7 bg-surface-card rounded-lg border border-surface-border shadow-card overflow-hidden"
        >
          <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 id="arrivals-heading" className="text-base font-bold text-ink-primary">
                Today&apos;s Arrivals &amp; Seafarer Directory
              </h2>
              <p className="text-xs text-ink-muted">
                Click <strong>&quot;Send to RMP&quot;</strong> on registered seafarers to dispatch to the
                Recognized Medical Practitioner.
              </p>
            </div>

            <div className="relative sm:w-64">
              <Search
                aria-hidden="true"
                className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="search"
                aria-label="Search seafarers by name, record number, or category"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, KC-000, category..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-surface-border-strong text-xs sm:text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>

          <div className="divide-y divide-surface-border max-h-[760px] overflow-y-auto">
            {filteredArrivals.map((patient) => {
              const canSendToDoctor = patient.currentStage === 'Registered';
              return (
                <div
                  key={patient.id}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-canvas transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary-700">
                        {patient.recordNo}
                      </span>
                      <span className="font-semibold text-sm text-ink-primary">
                        {patient.fullName}
                      </span>
                      {patient.nimasaMember && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                          <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                          NIMASA
                        </span>
                      )}
                      {patient.rmp?.isUnder18 && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-semibold">
                          Under 18 (1-yr max)
                        </span>
                      )}
                      {patient.rmp?.priorityBasis && patient.rmp.priorityBasis !== 'None' && (
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 text-[11px] font-semibold">
                          Priority (RQP-703)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                      <span>{patient.rmp?.category || 'Seafarer'}</span>
                      <span>·</span>
                      <span>
                        ID: {patient.rmp?.idNumber || 'Verified'}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {patient.arrivedAt}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <StageChip stage={patient.currentStage} />
                    <StatusChip status={patient.status} />

                    {canSendToDoctor ? (
                      <button
                        type="button"
                        onClick={() => sendToDoctor(patient.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Send to RMP</span>
                      </button>
                    ) : (
                      <Link
                        to={`/doctor/patients/${patient.recordNo}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-surface-border-strong text-xs font-medium text-ink-secondary hover:bg-surface-subtle transition-colors"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
