import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  History,
  ChevronRight,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { VerificationEnquiry } from '../../types';
import { PageHeader, Tabs, SlideOver, TabItem } from '../../components/ui';

type ComplianceTab = 'VERIFY' | 'RETURNS' | 'REVIEWS';

export const NimasaCompliancePage: React.FC = () => {
  const navigate = useNavigate();
  const { patients, certificateStock, verificationEnquiries, verifyCertificate } =
    useHospital();

  const [activeTab, setActiveTab] = useState<ComplianceTab>('VERIFY');
  const [certInput, setCertInput] = useState('NIM-MC-2026-0401');
  const [enquirerInput, setEnquirerInput] = useState(
    'Port State Control — Lagos Pilotage District'
  );
  const [lastResult, setLastResult] = useState<VerificationEnquiry | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certInput.trim()) return;
    const res = verifyCertificate(certInput, enquirerInput);
    setLastResult(res);
  };

  // Monthly stock reconciliation counts (RQF-702-01)
  const usedCount = certificateStock.filter((s) => s.status === 'Used').length;
  const spoiledCount = certificateStock.filter((s) => s.status === 'Spoiled').length;
  const closingCount = certificateStock.filter(
    (s) => s.status === 'In Cabinet' || s.status === 'Issued to RMP'
  ).length;
  const totalStock = certificateStock.length;
  const balanced = totalStock === usedCount + spoiledCount + closingCount;

  // Referee / Right of Review cases (RQP-704)
  const reviewCases = patients.filter(
    (p) =>
      p.rmp &&
      (p.rmp.determination === 'Not fit' ||
        p.rmp.determination === 'Fit with limitation' ||
        Boolean(p.rmp.rightOfReview))
  );

  // Monthly return rows (RQF-202-01 — zero clinical content)
  const returnRows = patients.filter(
    (p) => p.nimasaMember && p.consentToShareWithNimasa
  );

  const tabs: TabItem<ComplianceTab>[] = [
    { id: 'VERIFY', label: 'Verify Certificate' },
    { id: 'RETURNS', label: 'Monthly Return & Stock', count: returnRows.length },
    { id: 'REVIEWS', label: 'Referee Reviews', count: reviewCases.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification & Returns"
        subtitle="Verify STCW medical certificates, review monthly returns, and track referee cases."
      />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Verification and returns sections"
      />

      {/* TAB 1: VERIFY CERTIFICATE */}
      {activeTab === 'VERIFY' && (
        <div className="pt-2 flex justify-center">
          <div className="w-full max-w-2xl bg-surface-card border border-surface-border rounded shadow-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-ink-primary">
                  Certificate Verification Lookup
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Enter a certificate serial number to confirm authenticity and validity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 hover:underline shrink-0"
              >
                <History className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Recent enquiries ({verificationEnquiries.length})</span>
              </button>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label
                  htmlFor="ver-cert"
                  className="block text-xs font-medium text-ink-secondary mb-1.5"
                >
                  Certificate Serial No.
                </label>
                <input
                  id="ver-cert"
                  type="text"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  placeholder="e.g. NIM-MC-2026-0401"
                  className="w-full h-10 rounded border border-surface-border-strong px-3.5 text-sm font-mono text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>

              <div>
                <label
                  htmlFor="ver-enquirer"
                  className="block text-xs font-medium text-ink-secondary mb-1.5"
                >
                  Enquiring Authority
                </label>
                <input
                  id="ver-enquirer"
                  type="text"
                  value={enquirerInput}
                  onChange={(e) => setEnquirerInput(e.target.value)}
                  className="w-full h-10 rounded border border-surface-border-strong px-3.5 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>

              <div className="pt-1 flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                  <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Outcome and expiry only — no clinical information disclosed
                </span>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium transition-colors shrink-0"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                  <span>Verify</span>
                </button>
              </div>
            </form>

            {lastResult && (
              <div
                role="status"
                className={`p-4 rounded border text-sm flex items-start gap-3 ${
                  lastResult.result === 'Issued'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-red-50/70 border-red-200 text-red-900'
                }`}
              >
                {lastResult.result === 'Issued' ? (
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                )}
                <div className="space-y-1">
                  <div className="font-semibold">
                    <span className="font-mono">{lastResult.certificateNo}</span> —{' '}
                    {lastResult.result === 'Issued'
                      ? 'Verified Genuine'
                      : 'No Record Found'}
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {lastResult.outcomeSummary}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY RETURN & STOCK */}
      {activeTab === 'RETURNS' && (
        <div className="space-y-6 pt-2">
          {/* Compact 1-Row Hairline Stock Summary Bar */}
          <dl className="bg-surface-card border border-surface-border rounded grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-surface-border">
            <div className="px-5 py-3.5">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Opening
              </dt>
              <dd className="text-lg font-semibold text-ink-primary tabular-nums mt-0.5">
                {totalStock}
              </dd>
            </div>
            <div className="px-5 py-3.5">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Issued
              </dt>
              <dd className="text-lg font-semibold text-ink-primary tabular-nums mt-0.5">
                {usedCount}
              </dd>
            </div>
            <div className="px-5 py-3.5">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Spoiled
              </dt>
              <dd className="text-lg font-semibold text-ink-primary tabular-nums mt-0.5">
                {spoiledCount}
              </dd>
            </div>
            <div className="px-5 py-3.5">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Closing
              </dt>
              <dd className="text-lg font-semibold text-ink-primary tabular-nums mt-0.5">
                {closingCount}
              </dd>
            </div>
            <div className="px-5 py-3.5 col-span-2 sm:col-span-1">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Reconciliation
              </dt>
              <dd
                className={`text-sm font-semibold mt-1 ${
                  balanced ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {balanced ? 'Balanced' : 'Unreconciled'}
              </dd>
            </div>
          </dl>

          {/* Spacious Monthly Return Table */}
          <section className="bg-surface-card border border-surface-border rounded overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-ink-primary">
                  Monthly Return of Examinations · November 2026
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Non-clinical summary return submitted within 10 working days of month end.
                </p>
              </div>
              <span className="text-xs font-mono text-ink-muted">
                Form RQF-202-01
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-canvas border-b border-surface-border uppercase tracking-wider text-[11px] font-semibold text-ink-muted">
                    <th scope="col" className="py-3 px-4">Record</th>
                    <th scope="col" className="py-3 px-4">Seafarer</th>
                    <th scope="col" className="py-3 px-4">Category</th>
                    <th scope="col" className="py-3 px-4">Certificate</th>
                    <th scope="col" className="py-3 px-4">Outcome</th>
                    <th scope="col" className="py-3 px-4">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {returnRows.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-canvas transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-primary-700">
                        <Link to={`/nimasa/patients/${p.recordNo}`} className="hover:underline">
                          {p.recordNo}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-ink-primary">
                        {p.fullName}
                      </td>
                      <td className="py-3.5 px-4 text-ink-secondary">
                        {p.rmp?.category}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-ink-secondary">
                        {p.rmp?.issuedCertificate?.certificateNo || 'None'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-ink-primary">
                          {p.rmp?.determination}
                        </span>
                        {p.rmp?.limitationText && (
                          <span className="block text-[11px] text-amber-900 mt-0.5">
                            {p.rmp.limitationText}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-ink-muted">
                        {p.rmp?.issuedCertificate?.expiryDate || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: REFEREE REVIEWS */}
      {activeTab === 'REVIEWS' && (
        <div className="pt-2">
          <div className="bg-surface-card border border-surface-border rounded divide-y divide-surface-border">
            {reviewCases.length === 0 ? (
              <div className="p-10 text-center text-sm text-ink-muted">
                No Not Fit or Limited determinations currently require review tracking.
              </div>
            ) : (
              reviewCases.map((p) => {
                const det = p.rmp?.determination;
                const ror = p.rmp?.rightOfReview;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigate(`/nimasa/patients/${p.recordNo}`)}
                    className="w-full text-left px-5 py-4 hover:bg-surface-canvas transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-medium text-sm text-ink-primary">
                          {p.fullName}
                        </span>
                        <span className="font-mono text-xs text-ink-muted">
                          {p.recordNo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            det === 'Not fit'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}
                        >
                          {det}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted">
                        Right of Review Notice (QAF-804-02):{' '}
                        {ror ? `Issued ${ror.issuedAt}` : 'Pending'} · Receipt signed:{' '}
                        {ror?.seafarerSigned ? 'Yes' : 'No'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs shrink-0">
                      <span className="text-ink-secondary font-medium">
                        {ror?.reviewRequested
                          ? `Referee Review (${ror.refereeOutcome || 'Pending'})`
                          : 'No appeal lodged'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SlideOver Drawer: Recent Verification Enquiries (RQR-204-01) */}
      <SlideOver
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Recent Verification Enquiries"
        subtitle="Audit log of external certificate lookups (RQR-204-01)"
      >
        <div className="divide-y divide-surface-border -my-2">
          {verificationEnquiries.map((v) => (
            <div key={v.id} className="py-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-semibold text-primary-700">
                  {v.certificateNo}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                    v.result === 'Issued'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {v.result}
                </span>
              </div>
              <div className="font-medium text-ink-primary">{v.enquirer}</div>
              <p className="text-ink-muted leading-relaxed">{v.outcomeSummary}</p>
              <div className="font-mono text-[11px] text-ink-muted">{v.timestamp}</div>
            </div>
          ))}
        </div>
      </SlideOver>
    </div>
  );
};
