import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ShieldCheck, FileBarChart, Info } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { FitnessDetermination, SeafarerCategory } from '../../types';
import { PageHeader, SlideOver } from '../../components/ui';

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
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles}`}
    >
      {determination}
    </span>
  );
};

export const NimasaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { patients, certificateStock, practice } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [determinationFilter, setDeterminationFilter] = useState<
    'ALL' | FitnessDetermination
  >('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [practiceOpen, setPracticeOpen] = useState(false);

  const seafarers = useMemo(
    () => patients.filter((p) => p.nimasaMember && p.consentToShareWithNimasa && p.rmp),
    [patients]
  );

  const totalExamined = seafarers.length;
  const certsIssuedCount = seafarers.filter((p) =>
    Boolean(p.rmp?.issuedCertificate)
  ).length;
  const pendingCount = seafarers.filter(
    (p) => p.rmp?.determination === 'Pending'
  ).length;
  const notFitOrLimitedCount = seafarers.filter(
    (p) =>
      p.rmp?.determination === 'Not fit' ||
      p.rmp?.determination === 'Fit with limitation'
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
        (p.rmp?.issuedCertificate?.certificateNo.toLowerCase().includes(q) ??
          false) ||
        (p.rmp?.category.toLowerCase().includes(q) ?? false);
      const matchesDet =
        determinationFilter === 'ALL'
          ? true
          : p.rmp?.determination === determinationFilter;
      const matchesCat =
        categoryFilter === 'ALL' ? true : p.rmp?.category === categoryFilter;
      return matchesSearch && matchesDet && matchesCat;
    });
  }, [seafarers, searchQuery, determinationFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seafarer Register"
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{practice.practiceName} · {practice.status} Recognition</span>
            <button
              type="button"
              onClick={() => setPracticeOpen(true)}
              className="inline-flex items-center gap-1 text-primary-700 font-medium hover:underline"
            >
              <Info className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Practice details</span>
            </button>
          </span>
        }
        actions={
          <>
            <Link
              to="/nimasa/compliance"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Verify Certificate &amp; Returns</span>
            </Link>
            <Link
              to="/nimasa/reports"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white border border-surface-border-strong hover:bg-surface-canvas text-ink-primary text-xs font-medium shadow-card transition-colors"
            >
              <FileBarChart className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
              <span>Reports</span>
            </Link>
          </>
        }
      />

      {/* Unified 4-Column Elevated Metric Bar */}
      <div className="surface-panel grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-surface-border overflow-hidden">
        <div className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Seafarers Examined
          </div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1.5">
            {totalExamined}
          </div>
          <div className="text-xs text-ink-muted mt-1">Current reporting period</div>
        </div>

        <div className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Certificates Issued
          </div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1.5">
            {certsIssuedCount}
          </div>
          <div className="text-xs text-ink-muted mt-1">All with supplement attached</div>
        </div>

        <div className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Pending / Reviews
          </div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1.5">
            {pendingCount + notFitOrLimitedCount}
          </div>
          <div className="text-xs text-ink-muted mt-1">
            {pendingCount} pending · {notFitOrLimitedCount} review notices
          </div>
        </div>

        <div className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Stock Remaining
          </div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1.5">
            {stockRemaining}{' '}
            <span className="text-sm font-normal text-ink-muted">
              / {stockTotal}
            </span>
          </div>
          <div className="text-xs text-emerald-800 font-medium mt-1">
            0 blanks unaccounted
          </div>
        </div>
      </div>

      {/* Seafarer Examination & Certification Register */}
      <section
        aria-labelledby="nimasa-directory-heading"
        className="surface-panel overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-surface-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2
              id="nimasa-directory-heading"
              className="text-sm font-semibold text-ink-primary"
            >
              Examination &amp; Certification Register
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Read-only outcomes and certificate status. Select any row for the examination trail.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-56">
              <Search
                aria-hidden="true"
                className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="search"
                aria-label="Search by name, record number, or certificate serial"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, KC-, NIM-MC-..."
                className="w-full h-9 pl-8 pr-3 rounded-xl border border-surface-border-strong bg-white text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <select
              aria-label="Filter by fitness determination"
              value={determinationFilter}
              onChange={(e) =>
                setDeterminationFilter(e.target.value as 'ALL' | FitnessDetermination)
              }
              className="h-9 px-3 rounded-xl border border-surface-border-strong text-xs text-ink-secondary bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"
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
              className="h-9 px-3 rounded-xl border border-surface-border-strong text-xs text-ink-secondary bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"
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
                className="w-full text-left p-4 hover:bg-surface-canvas transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink-primary">
                    {p.fullName}
                  </span>
                  <DeterminationText determination={p.rmp!.determination} />
                </div>
                <div className="text-xs text-ink-muted">
                  <span className="font-mono">{p.recordNo}</span> · {p.rmp!.category}
                </div>
                <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
                  <span className="font-mono">
                    {p.rmp?.issuedCertificate?.certificateNo ||
                      (p.rmp?.rightOfReview ? 'QAF-804-02 Issued' : 'In Examination')}
                  </span>
                  <span>{p.rmp?.issuedCertificate?.expiryDate || '—'}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Desktop 5-Column Data Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-canvas border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th scope="col" className="py-3 px-5">Seafarer</th>
                <th scope="col" className="py-3 px-4">Category</th>
                <th scope="col" className="py-3 px-4">Outcome</th>
                <th scope="col" className="py-3 px-4">Certificate</th>
                <th scope="col" className="py-3 px-5 text-right">Valid Until</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredSeafarers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-muted">
                    No seafarer records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredSeafarers.map((p) => {
                  const rmp = p.rmp!;
                  const subtleFlags = [
                    rmp.isUnder18 ? 'Under 18 (1-yr cap)' : null,
                    rmp.priorityBasis && rmp.priorityBasis !== 'None' ? 'Priority' : null,
                  ].filter(Boolean);

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
                      <td className="py-4 px-5">
                        <div className="font-medium text-sm text-ink-primary">
                          {p.fullName}
                        </div>
                        <div className="text-xs text-ink-muted mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-primary-700">{p.recordNo}</span>
                          {subtleFlags.length > 0 && (
                            <span>· {subtleFlags.join(' · ')}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-ink-secondary">
                        <div>{rmp.category}</div>
                        <div className="text-[11px] text-ink-muted mt-0.5">
                          {rmp.lookoutRequired ? 'Lookout duties' : 'Non-lookout'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <DeterminationText determination={rmp.determination} />
                      </td>
                      <td className="py-4 px-4">
                        {rmp.issuedCertificate ? (
                          <span className="font-mono font-medium text-ink-primary">
                            {rmp.issuedCertificate.certificateNo}
                          </span>
                        ) : rmp.rightOfReview ? (
                          <span className="text-red-800 font-medium">
                            Review Notice Issued
                          </span>
                        ) : (
                          <span className="text-ink-muted">
                            {p.orders.some((o) => o.status !== 'Published')
                              ? 'Pending investigations'
                              : 'In examination'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-ink-secondary">
                        {rmp.issuedCertificate?.expiryDate || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SlideOver Drawer: Recognized Practice Details (RQD-02) */}
      <SlideOver
        isOpen={practiceOpen}
        onClose={() => setPracticeOpen(false)}
        title="Recognized Practice Details"
        subtitle={`Schedule of Recognition (RQD-02) · ${practice.certificateNo}`}
      >
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              Practice Name
            </dt>
            <dd className="text-ink-primary font-medium mt-1">
              {practice.practiceName}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              Recognized Premises (P-1)
            </dt>
            <dd className="text-ink-secondary mt-1">
              {practice.address}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-surface-border">
            <div>
              <dt className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                Status
              </dt>
              <dd className="text-emerald-800 font-medium mt-1">
                {practice.status} Recognition
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                Valid Until
              </dt>
              <dd className="font-mono text-ink-primary mt-1">
                {practice.expiresOn}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                Medical Director
              </dt>
              <dd className="text-ink-secondary mt-1">
                {practice.medicalDirector}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                Renewal Check Due
              </dt>
              <dd className="font-mono text-ink-primary mt-1">
                {practice.renewalCheckDue}
              </dd>
            </div>
          </div>
          <div className="pt-2 border-t border-surface-border">
            <dt className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              Engagement &amp; Returns
            </dt>
            <dd className="text-ink-secondary mt-1">
              Form QAF-802-01 signed {practice.engagementSigned} ·{' '}
              {practice.returnFrequency}
            </dd>
          </div>
        </dl>
      </SlideOver>
    </div>
  );
};
