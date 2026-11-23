import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Users,
  FileBadge,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  ChevronRight,
  FileBarChart,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { FitnessDetermination, SeafarerCategory } from '../../types';
import { PRACTICE_RECOGNITION } from '../../data/mockRmpData';

const ALL_CATEGORIES: SeafarerCategory[] = [
  'Deck (Master / Officer / Lookout)',
  'Engine / Electro-Technical',
  'GMDSS Radio Operator',
  'Catering / Other',
];

const DeterminationBadge: React.FC<{ determination: FitnessDetermination }> = ({
  determination,
}) => {
  const styles =
    determination === 'Fit'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : determination === 'Fit with limitation'
      ? 'bg-amber-50 text-amber-900 border-amber-200'
      : determination === 'Not fit'
      ? 'bg-red-50 text-red-800 border-red-200'
      : 'bg-blue-50 text-blue-800 border-blue-200';

  const dot =
    determination === 'Fit'
      ? 'bg-emerald-600'
      : determination === 'Fit with limitation'
      ? 'bg-amber-600'
      : determination === 'Not fit'
      ? 'bg-red-600'
      : 'bg-blue-600';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${styles}`}
    >
      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {determination}
    </span>
  );
};

export const NimasaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { patients, certificateStock } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [determinationFilter, setDeterminationFilter] = useState<'ALL' | FitnessDetermination>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const seafarers = useMemo(
    () => patients.filter((p) => p.nimasaMember && p.consentToShareWithNimasa && p.rmp),
    [patients]
  );

  const totalExamined = seafarers.length;
  const certsIssuedCount = seafarers.filter((p) => Boolean(p.rmp?.issuedCertificate)).length;
  const pendingCount = seafarers.filter((p) => p.rmp?.determination === 'Pending').length;
  const notFitOrLimitedCount = seafarers.filter(
    (p) => p.rmp?.determination === 'Not fit' || p.rmp?.determination === 'Fit with limitation'
  ).length;

  // Stock reconciliation KPI (RQP-702)
  const stockUsed = certificateStock.filter((s) => s.status === 'Used').length;
  const stockSpoiled = certificateStock.filter((s) => s.status === 'Spoiled').length;
  const stockRemaining = certificateStock.filter(
    (s) => s.status === 'In Cabinet' || s.status === 'Issued to RMP'
  ).length;
  const stockTotal = certificateStock.length;
  const stockPct = Math.round(((stockUsed + stockSpoiled) / Math.max(1, stockTotal)) * 100);

  const filteredSeafarers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return seafarers.filter((p) => {
      const matchesSearch =
        p.fullName.toLowerCase().includes(q) ||
        p.recordNo.toLowerCase().includes(q) ||
        (p.rmp?.issuedCertificate?.certificateNo.toLowerCase().includes(q) ?? false) ||
        (p.rmp?.category.toLowerCase().includes(q) ?? false);

      const matchesDet =
        determinationFilter === 'ALL' ? true : p.rmp?.determination === determinationFilter;

      const matchesCat =
        categoryFilter === 'ALL' ? true : p.rmp?.category === categoryFilter;

      return matchesSearch && matchesDet && matchesCat;
    });
  }, [seafarers, searchQuery, determinationFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Top Page Title + Regulatory Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-ink-primary">
            Recognized practice oversight
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            STCW Regulation I/9 seafarer medical examinations, fitness outcomes, and QAF-805-01 certificate tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/nimasa/compliance"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.99]"
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Verify certificate &amp; returns</span>
          </Link>
          <Link
            to="/nimasa/reports"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-surface-card border border-surface-border-strong hover:bg-primary-50/50 hover:border-primary-300 text-ink-primary font-medium text-sm shadow-card transition-all active:scale-[0.99]"
          >
            <FileBarChart className="w-4 h-4 text-primary-600" aria-hidden="true" />
            <span>Reports</span>
          </Link>
        </div>
      </div>

      {/* Recognized Practice Card (RQD-02) + Abuja Map Preview */}
      <div className="bg-surface-card rounded-lg border border-surface-border shadow-card p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                NIMASA Full Recognition ({PRACTICE_RECOGNITION.certificateNo})
              </span>
              <span className="text-xs text-ink-muted font-medium">
                Valid until {PRACTICE_RECOGNITION.expiresOn} · QAF-802-02
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-ink-primary">
              {PRACTICE_RECOGNITION.practiceName}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-ink-secondary pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Recognized Premises P-1: Plot 412 Ahmadu Bello Way, Garki II, Abuja, FCT
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Medical Director: {PRACTICE_RECOGNITION.medicalDirector} · Monthly returns
                </span>
              </div>
            </div>
          </div>

          {/* Stylised Abuja Map Placeholder */}
          <div className="relative h-32 rounded-lg border border-surface-border bg-surface-subtle overflow-hidden flex items-center justify-center">
            <svg
              aria-hidden="true"
              className="absolute inset-0 w-full h-full text-slate-200"
              viewBox="0 0 300 120"
              fill="none"
            >
              <path
                d="M0 30 H300 M0 65 H300 M0 95 H300 M60 0 V120 M145 0 V120 M230 0 V120"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10 110 Q 120 40 290 15"
                stroke="#93c5fd"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
            <div className="relative z-10 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center">
                <MapPin className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-ink-primary">
                  Kingscare Garki II, Abuja
                </p>
                <p className="text-[11px] text-ink-muted">
                  Recognized Premises P-1 · Verified
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pure STCW RMP KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-lg border border-surface-border p-5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Seafarers Examined
            </span>
            <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-ink-primary mt-3">{totalExamined}</p>
          <p className="text-xs text-ink-muted mt-1">
            Deck, Engine, GMDSS &amp; Catering (RQF-202-01)
          </p>
        </div>

        <div className="bg-surface-card rounded-lg border border-surface-border p-5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Certificates Issued
            </span>
            <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileBadge className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-3xl font-bold text-emerald-800">{certsIssuedCount}</p>
            <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              QAF-805-01 + S
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            100% carry RQF-701-01 supplement (IND-06)
          </p>
        </div>

        <div className="bg-surface-card rounded-lg border border-surface-border p-5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Pending / Review Cases
            </span>
            <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-3xl font-bold text-ink-primary">{pendingCount}</p>
            <span className="text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              {notFitOrLimitedCount} QAF-804-02
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            30-day pending cap (RQP-604) · 21-day review
          </p>
        </div>

        <div className="bg-surface-card rounded-lg border border-surface-border p-5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Certificate Stock (RQP-702)
            </span>
            <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-3xl font-bold text-ink-primary">
              {stockRemaining}{' '}
              <span className="text-base font-medium text-ink-muted">
                / {stockTotal} left
              </span>
            </p>
            <span className="text-xs font-semibold text-emerald-800">
              0 unaccounted
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Blank certificate stock usage"
            aria-valuenow={stockUsed + stockSpoiled}
            aria-valuemin={0}
            aria-valuemax={stockTotal}
            className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden mt-2.5"
          >
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${stockPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Seafarer Examination & Certification Directory */}
      <section
        aria-labelledby="nimasa-directory-heading"
        className="bg-surface-card rounded-lg border border-surface-border shadow-card overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-surface-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 id="nimasa-directory-heading" className="text-base font-bold text-ink-primary">
              Seafarer Examination &amp; Certification Register (Read-Only)
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Outcome and certificate status only — confidential clinical notes &amp; diagnoses remain restricted to
              Kingscare (QA-P-808).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial sm:w-60">
              <Search
                aria-hidden="true"
                className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="search"
                aria-label="Search seafarers by name, record number, or certificate serial"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, KC-, NIM-MC-..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-surface-border-strong text-xs sm:text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div
              role="group"
              aria-label="Filter by fitness determination"
              className="inline-flex flex-wrap rounded-lg border border-surface-border p-0.5 bg-surface-canvas"
            >
              {(['ALL', 'Pending', 'Fit', 'Fit with limitation', 'Not fit'] as const).map((det) => (
                <button
                  key={det}
                  type="button"
                  aria-pressed={determinationFilter === det}
                  onClick={() => setDeterminationFilter(det)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    determinationFilter === det
                      ? 'bg-surface-card text-ink-primary shadow-sm'
                      : 'text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  {det === 'ALL' ? 'All Outcomes' : det}
                </button>
              ))}
            </div>

            <div className="relative">
              <Filter
                aria-hidden="true"
                className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <select
                aria-label="Filter by seafarer department category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-8 pr-7 py-1.5 rounded-lg border border-surface-border-strong text-xs font-medium text-ink-secondary bg-surface-card focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="ALL">All Categories ({seafarers.length})</option>
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Stacked Card List (< md) */}
        <div className="md:hidden divide-y divide-surface-border">
          {filteredSeafarers.length === 0 ? (
            <div className="py-10 px-4 text-center text-ink-muted text-sm">
              No seafarer records match your current filter.
            </div>
          ) : (
            filteredSeafarers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/nimasa/patients/${p.recordNo}`)}
                className="w-full text-left p-4 hover:bg-primary-50/40 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-primary-700">{p.recordNo}</span>
                  <DeterminationBadge determination={p.rmp!.determination} />
                </div>
                <div>
                  <div className="font-semibold text-ink-primary">{p.fullName}</div>
                  <div className="text-xs text-ink-muted">{p.rmp!.category}</div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-border/70">
                  <span className="font-mono text-ink-secondary">
                    {p.rmp?.issuedCertificate?.certificateNo ||
                      (p.rmp?.rightOfReview ? 'QAF-804-02 Issued' : 'In Examination')}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary-700">
                    Audit Trail <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Desktop Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table
            aria-label="STCW Seafarer Examination and Certification Register"
            className="w-full text-left border-collapse"
          >
            <thead>
              <tr className="bg-surface-canvas border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th scope="col" className="py-3 px-4">Record No.</th>
                <th scope="col" className="py-3 px-4">Seafarer &amp; Duties Category</th>
                <th scope="col" className="py-3 px-4">Determination</th>
                <th scope="col" className="py-3 px-4">Certificate / Notice</th>
                <th scope="col" className="py-3 px-4">Expiry</th>
                <th scope="col" className="py-3 px-4">Flags</th>
                <th scope="col" className="py-3 px-4 text-right">RMP Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-sm">
              {filteredSeafarers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-ink-muted text-sm">
                    No seafarer records match your current filter.
                  </td>
                </tr>
              ) : (
                filteredSeafarers.map((p) => {
                  const rmp = p.rmp!;
                  return (
                    <tr
                      key={p.id}
                      tabIndex={0}
                      role="link"
                      aria-label={`View STCW examination trail for ${p.fullName}, record ${p.recordNo}`}
                      onClick={() => navigate(`/nimasa/patients/${p.recordNo}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/nimasa/patients/${p.recordNo}`);
                        }
                      }}
                      className="hover:bg-primary-50/50 focus-visible:bg-primary-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-primary-700">
                        {p.recordNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-ink-primary group-hover:text-primary-700 transition-colors">
                          {p.fullName}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {rmp.category} · {rmp.lookoutRequired ? 'Lookout' : 'Non-lookout'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <DeterminationBadge determination={rmp.determination} />
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {rmp.issuedCertificate ? (
                          <div>
                            <span className="font-mono font-semibold text-ink-primary">
                              {rmp.issuedCertificate.certificateNo}
                            </span>
                            <span className="block text-[11px] text-ink-muted">
                              + Supplement {rmp.issuedCertificate.supplementNo}
                            </span>
                          </div>
                        ) : rmp.rightOfReview ? (
                          <span className="text-red-800 font-medium">
                            QAF-804-02 Issued{rmp.rightOfReview.reviewRequested ? ' · Referee Review' : ''}
                          </span>
                        ) : (
                          <span className="text-ink-muted inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            {p.orders.some((o) => o.status !== 'Published')
                              ? 'Pending Lab / Specialist'
                              : 'In RMP Examination'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-ink-secondary">
                        {rmp.issuedCertificate?.expiryDate || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {rmp.isUnder18 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold">
                              &lt;18 (1-yr)
                            </span>
                          )}
                          {rmp.priorityBasis && rmp.priorityBasis !== 'None' && (
                            <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 text-[10px] font-semibold">
                              Priority
                            </span>
                          )}
                          {rmp.visionHearing.colourVisionReferred && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold inline-flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" aria-hidden="true" />
                              Vision Ref
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 group-hover:translate-x-0.5 transition-transform">
                          Timeline
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
