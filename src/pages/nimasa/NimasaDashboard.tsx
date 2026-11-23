import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ShieldCheck, FileBarChart } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { FitnessDetermination, SeafarerCategory } from '../../types';
import { PRACTICE_RECOGNITION } from '../../data/mockRmpData';

const ALL_CATEGORIES: SeafarerCategory[] = [
  'Deck (Master / Officer / Lookout)',
  'Engine / Electro-Technical',
  'GMDSS Radio Operator',
  'Catering / Other',
];

const DeterminationText: React.FC<{ determination: FitnessDetermination }> = ({
  determination,
}) => {
  const styles =
    determination === 'Fit'
      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
      : determination === 'Fit with limitation'
      ? 'text-amber-900 bg-amber-50 border-amber-200'
      : determination === 'Not fit'
      ? 'text-red-800 bg-red-50 border-red-200'
      : 'text-slate-700 bg-slate-100 border-slate-300';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles}`}>
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

  const stockRemaining = certificateStock.filter(
    (s) => s.status === 'In Cabinet' || s.status === 'Issued to RMP'
  ).length;
  const stockTotal = certificateStock.length;

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
      const matchesCat = categoryFilter === 'ALL' ? true : p.rmp?.category === categoryFilter;
      return matchesSearch && matchesDet && matchesCat;
    });
  }, [seafarers, searchQuery, determinationFilter, categoryFilter]);

  return (
    <div className="space-y-5">
      {/* Crisp Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-primary">
            Recognized Practice Register
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            {PRACTICE_RECOGNITION.practiceName} · Recognition{' '}
            <span className="font-mono text-ink-secondary">{PRACTICE_RECOGNITION.certificateNo}</span> ·
            Valid until {PRACTICE_RECOGNITION.expiresOn}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/nimasa/compliance"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Verify Certificate &amp; Returns</span>
          </Link>
          <Link
            to="/nimasa/reports"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-surface-card border border-surface-border-strong hover:bg-surface-subtle text-ink-primary text-xs font-medium transition-colors"
          >
            <FileBarChart className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
            <span>Reports</span>
          </Link>
        </div>
      </div>

      {/* Institutional Facility Summary Strip (No fake map) */}
      <dl className="bg-surface-card border border-surface-border rounded grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-surface-border text-xs">
        <div className="p-3.5">
          <dt className="text-[11px] text-ink-muted uppercase tracking-wider font-medium">
            Recognized Premises
          </dt>
          <dd className="text-ink-primary font-medium mt-1">
            P-1 · Plot 412 Ahmadu Bello Way, Garki II, Abuja
          </dd>
        </div>
        <div className="p-3.5">
          <dt className="text-[11px] text-ink-muted uppercase tracking-wider font-medium">
            Medical Director (RMP)
          </dt>
          <dd className="text-ink-primary font-medium mt-1">
            {PRACTICE_RECOGNITION.medicalDirector}
          </dd>
        </div>
        <div className="p-3.5">
          <dt className="text-[11px] text-ink-muted uppercase tracking-wider font-medium">
            Engagement &amp; Returns
          </dt>
          <dd className="text-ink-primary font-medium mt-1">
            QAF-802-01 Signed · {PRACTICE_RECOGNITION.returnFrequency}
          </dd>
        </div>
        <div className="p-3.5">
          <dt className="text-[11px] text-ink-muted uppercase tracking-wider font-medium">
            Renewal Check Due
          </dt>
          <dd className="text-ink-primary font-mono font-medium mt-1">
            {PRACTICE_RECOGNITION.renewalCheckDue} (6 mo prior)
          </dd>
        </div>
      </dl>

      {/* Unified 4-Column Hairline Metric Bar */}
      <div className="bg-surface-card border border-surface-border rounded grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-surface-border">
        <div className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Seafarers Examined
          </div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1.5">
            {totalExamined}
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">Active reporting period (RQF-202-01)</div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Certificates Issued
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-semibold text-ink-primary tabular-nums">
              {certsIssuedCount}
            </span>
            <span className="text-[11px] font-mono text-emerald-800">QAF-805-01 + S</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">100% include RQF-701-01 supplement</div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Pending / Review Cases
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-semibold text-ink-primary tabular-nums">
              {pendingCount}
            </span>
            <span className="text-[11px] text-ink-muted">
              · {notFitOrLimitedCount} QAF-804-02 issued
            </span>
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">30-day pending cap · 21-day referee window</div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Blank Stock Balance
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-semibold text-ink-primary tabular-nums">
              {stockRemaining}
              <span className="text-sm font-normal text-ink-muted"> / {stockTotal}</span>
            </span>
            <span className="text-[11px] text-emerald-800 font-medium">Reconciled</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">0 blanks unaccounted (RQR-702-01)</div>
        </div>
      </div>

      {/* Seafarer Examination & Certification Register */}
      <section
        aria-labelledby="nimasa-directory-heading"
        className="bg-surface-card border border-surface-border rounded overflow-hidden"
      >
        <div className="px-4 py-3.5 border-b border-surface-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 id="nimasa-directory-heading" className="text-sm font-semibold text-ink-primary">
              Seafarer Examinations &amp; Outcomes
            </h2>
            <p className="text-[11px] text-ink-muted">
              Non-clinical register per QA-P-808. Select any row to inspect the stamped STCW Reg. I/9 trail.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-56">
              <Search
                aria-hidden="true"
                className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2"
              />
              <input
                type="search"
                aria-label="Search by name, record number, or certificate serial"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, KC-, NIM-MC-..."
                className="w-full h-8 pl-8 pr-2.5 rounded border border-surface-border-strong text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>

            <select
              aria-label="Filter by fitness determination"
              value={determinationFilter}
              onChange={(e) => setDeterminationFilter(e.target.value as 'ALL' | FitnessDetermination)}
              className="h-8 px-2.5 rounded border border-surface-border-strong text-xs text-ink-secondary bg-surface-card focus:outline-none focus:ring-2 focus:ring-primary-700"
            >
              <option value="ALL">All outcomes</option>
              <option value="Pending">Pending</option>
              <option value="Fit">Fit</option>
              <option value="Fit with limitation">Fit with limitation</option>
              <option value="Not fit">Not fit</option>
            </select>

            <select
              aria-label="Filter by seafarer category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 px-2.5 rounded border border-surface-border-strong text-xs text-ink-secondary bg-surface-card focus:outline-none focus:ring-2 focus:ring-primary-700"
            >
              <option value="ALL">All categories ({seafarers.length})</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Stacked List (< md) */}
        <div className="md:hidden divide-y divide-surface-border">
          {filteredSeafarers.length === 0 ? (
            <div className="py-10 px-4 text-center text-ink-muted text-xs">
              No seafarer records match the current filter.
            </div>
          ) : (
            filteredSeafarers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/nimasa/patients/${p.recordNo}`)}
                className="w-full text-left p-3.5 hover:bg-surface-canvas transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-primary-700">{p.recordNo}</span>
                  <DeterminationText determination={p.rmp!.determination} />
                </div>
                <div className="text-sm font-medium text-ink-primary">{p.fullName}</div>
                <div className="text-xs text-ink-muted">{p.rmp!.category}</div>
                <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                  <span className="font-mono">
                    {p.rmp?.issuedCertificate?.certificateNo ||
                      (p.rmp?.rightOfReview ? 'QAF-804-02 Issued' : 'In Examination')}
                  </span>
                  <span className="font-medium text-primary-700">Open trail</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Desktop Data Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-canvas border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th scope="col" className="py-2.5 px-4">Record</th>
                <th scope="col" className="py-2.5 px-4">Seafarer</th>
                <th scope="col" className="py-2.5 px-4">Department / Duties</th>
                <th scope="col" className="py-2.5 px-4">Outcome</th>
                <th scope="col" className="py-2.5 px-4">Certificate / Notice</th>
                <th scope="col" className="py-2.5 px-4">Expiry</th>
                <th scope="col" className="py-2.5 px-4 text-right">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredSeafarers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-ink-muted">
                    No seafarer records match the current filter.
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
                      aria-label={`Open examination trail for ${p.fullName}, ${p.recordNo}`}
                      onClick={() => navigate(`/nimasa/patients/${p.recordNo}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/nimasa/patients/${p.recordNo}`);
                        }
                      }}
                      className="hover:bg-surface-canvas focus-visible:bg-primary-50/40 focus-visible:outline-none cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-primary-700">
                        {p.recordNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-ink-primary">
                          {p.fullName}
                          {rmp.isUnder18 && (
                            <span className="ml-2 text-[10px] font-mono font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              &lt;18 · 1YR
                            </span>
                          )}
                          {rmp.priorityBasis && rmp.priorityBasis !== 'None' && (
                            <span className="ml-1.5 text-[10px] font-mono font-semibold text-red-800 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                              PRIORITY
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-muted font-mono">{rmp.idNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-ink-secondary">
                        <div>{rmp.category}</div>
                        <div className="text-[11px] text-ink-muted">
                          {rmp.lookoutRequired ? 'Lookout duties' : 'Non-lookout'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <DeterminationText determination={rmp.determination} />
                      </td>
                      <td className="py-3 px-4">
                        {rmp.issuedCertificate ? (
                          <div>
                            <span className="font-mono font-medium text-ink-primary">
                              {rmp.issuedCertificate.certificateNo}
                            </span>
                            <span className="block text-[11px] text-ink-muted font-mono">
                              Supp. {rmp.issuedCertificate.supplementNo}
                            </span>
                          </div>
                        ) : rmp.rightOfReview ? (
                          <span className="text-red-800 font-medium">
                            QAF-804-02{rmp.rightOfReview.reviewRequested ? ' · Referee Review' : ''}
                          </span>
                        ) : (
                          <span className="text-ink-muted">
                            {p.orders.some((o) => o.status !== 'Published')
                              ? 'Pending Lab / Specialist'
                              : 'In Examination'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-ink-secondary">
                        {rmp.issuedCertificate?.expiryDate || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-primary-700 hover:underline">
                        View trail
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
