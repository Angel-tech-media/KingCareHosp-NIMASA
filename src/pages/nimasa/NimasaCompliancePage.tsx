import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Scale,
  Lock,
  FileBadge,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { VerificationEnquiry } from '../../types';

export const NimasaCompliancePage: React.FC = () => {
  const { patients, certificateStock, verificationEnquiries, verifyCertificate } = useHospital();

  const [certInput, setCertInput] = useState('NIM-MC-2026-0401');
  const [enquirerInput, setEnquirerInput] = useState('Port State Control — Lagos Pilotage District');
  const [lastResult, setLastResult] = useState<VerificationEnquiry | null>(null);

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
  const returnRows = patients.filter((p) => p.nimasaMember && p.consentToShareWithNimasa);

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          Series 200 &amp; 700 · NIMASA Regulatory Interface
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
          Certificate Verification, Monthly Returns &amp; Referee Reviews
        </h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Verify STCW Reg. I/9 medical certificates (RQP-204), reconcile Kingscare monthly returns &amp; stock
          (RQF-202-01 / RQF-702-01), and monitor independent referee reviews (RQP-704).
        </p>
      </div>

      {/* 1. Certificate Verification Enquiry (RQP-204) */}
      <section className="bg-surface-card rounded-lg border border-surface-border shadow-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-border">
          <div>
            <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-primary-600" aria-hidden="true" />
              Certificate Verification Lookup (RQP-204 · QA-P-808 §7.4)
            </h2>
            <p className="text-xs text-ink-muted">
              Returns validity, fitness outcome, limitation, and expiry only — never clinical diagnoses.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
            <Lock className="w-3 h-3" aria-hidden="true" />
            Zero Clinical Disclosure Enforced
          </span>
        </div>

        <form onSubmit={handleVerify} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label htmlFor="ver-cert" className="block text-xs font-semibold text-ink-secondary mb-1">
              Certificate Serial No. (QAF-805-01)
            </label>
            <input
              id="ver-cert"
              type="text"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              placeholder="e.g. NIM-MC-2026-0401"
              className="w-full rounded-lg border border-surface-border-strong px-3 py-2 text-sm font-mono text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div className="md:col-span-5">
            <label htmlFor="ver-enquirer" className="block text-xs font-semibold text-ink-secondary mb-1">
              Enquiring Authority / Company
            </label>
            <input
              id="ver-enquirer"
              type="text"
              value={enquirerInput}
              onChange={(e) => setEnquirerInput(e.target.value)}
              className="w-full rounded-lg border border-surface-border-strong px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>Verify &amp; Log</span>
            </button>
          </div>
        </form>

        {lastResult && (
          <div
            role="status"
            className={`p-4 rounded-lg border text-xs flex items-start gap-2.5 ${
              lastResult.result === 'Issued'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {lastResult.result === 'Issued' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div>
              <div className="font-bold">
                {lastResult.certificateNo} — {lastResult.result === 'Issued' ? 'VERIFIED GENUINE' : 'NO RECORD FOUND'}
              </div>
              <p className="mt-0.5">{lastResult.outcomeSummary}</p>
            </div>
          </div>
        )}

        <div className="pt-2">
          <div className="text-xs font-bold text-ink-secondary uppercase tracking-wider mb-2">
            Recent Verification Enquiries (RQR-204-01 · {verificationEnquiries.length} logged)
          </div>
          <div className="divide-y divide-surface-border border border-surface-border rounded-lg overflow-hidden">
            {verificationEnquiries.slice(0, 5).map((v) => (
              <div key={v.id} className="p-3 bg-surface-canvas/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono font-bold text-primary-700">{v.certificateNo}</span>
                  <span className="mx-1.5 text-ink-muted">·</span>
                  <span className="font-semibold text-ink-primary">{v.enquirer}</span>
                  <div className="text-ink-muted mt-0.5">{v.outcomeSummary}</div>
                </div>
                <span className="font-mono text-[11px] text-ink-muted shrink-0">{v.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Monthly Stock Reconciliation & Independent Referee Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Stock Reconciliation (RQF-702-01) */}
        <section className="bg-surface-card rounded-lg border border-surface-border shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <h2 className="text-sm font-bold text-ink-primary flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary-600" aria-hidden="true" />
                Monthly Stock Reconciliation (RQF-702-01)
              </h2>
              <p className="text-xs text-ink-muted">Attached to Monthly Return RQF-202-01</p>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                balanced
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {balanced ? 'Balanced (0 unaccounted)' : 'Unreconciled'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-surface-canvas border border-surface-border">
              <div className="text-[11px] text-ink-muted uppercase font-semibold">Opening</div>
              <div className="text-2xl font-bold text-ink-primary mt-1">{totalStock}</div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
              <div className="text-[11px] text-emerald-800 uppercase font-semibold">Issued</div>
              <div className="text-2xl font-bold text-emerald-800 mt-1">{usedCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200">
              <div className="text-[11px] text-amber-900 uppercase font-semibold">Spoiled</div>
              <div className="text-2xl font-bold text-amber-900 mt-1">{spoiledCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-primary-50/60 border border-primary-200">
              <div className="text-[11px] text-primary-800 uppercase font-semibold">Closing</div>
              <div className="text-2xl font-bold text-primary-800 mt-1">{closingCount}</div>
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            Formula (RQP-702 §7.5): Opening ({totalStock}) = Issued ({usedCount}) + Spoiled retained ({spoiledCount}) +
            Closing stock ({closingCount}). Reconciled by non-issuing custodian.
          </p>
        </section>

        {/* Independent Referee Review Cases (RQP-704) */}
        <section className="bg-surface-card rounded-lg border border-surface-border shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <h2 className="text-sm font-bold text-ink-primary flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary-600" aria-hidden="true" />
                Right of Review &amp; Referee Cases (RQP-704 / QA-P-806)
              </h2>
              <p className="text-xs text-ink-muted">Not Fit &amp; Limited determinations with QAF-804-02 status</p>
            </div>
            <span className="text-xs font-semibold text-ink-secondary">{reviewCases.length} cases</span>
          </div>

          <div className="divide-y divide-surface-border">
            {reviewCases.map((p) => (
              <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/nimasa/patients/${p.recordNo}`}
                      className="font-mono font-bold text-primary-700 hover:underline"
                    >
                      {p.recordNo}
                    </Link>
                    <span className="font-semibold text-ink-primary">{p.fullName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        p.rmp?.determination === 'Not fit'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      {p.rmp?.determination}
                    </span>
                  </div>
                  <div className="text-ink-muted mt-1">
                    QAF-804-02 issued: {p.rmp?.rightOfReview?.issuedAt || 'Pending'} · Signed:{' '}
                    {p.rmp?.rightOfReview?.seafarerSigned ? 'Yes' : 'No'}
                    {p.rmp?.rightOfReview?.reviewRequested &&
                      ` · Referee review requested (Records released ${p.rmp.rightOfReview.recordsReleasedAt})`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 3. Monthly Return of Examinations (RQF-202-01 — Zero Clinical Content) */}
      <section className="bg-surface-card rounded-lg border border-surface-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-surface-border flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-ink-primary">
              Monthly Return of Examinations (RQF-202-01 · November 2026)
            </h2>
            <p className="text-xs text-ink-muted">
              Submitted within 10 working days of month end. Contains fitness outcome &amp; certificate serial only —
              no clinical information (QA-P-808 §7.3).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-surface-subtle text-xs font-semibold text-ink-secondary">
            {returnRows.length} seafarers listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-canvas border-b border-surface-border uppercase tracking-wider text-[11px] font-semibold text-ink-muted">
                <th scope="col" className="py-3 px-4">Record</th>
                <th scope="col" className="py-3 px-4">Seafarer</th>
                <th scope="col" className="py-3 px-4">Category</th>
                <th scope="col" className="py-3 px-4">Certificate No.</th>
                <th scope="col" className="py-3 px-4">Outcome / Limitation</th>
                <th scope="col" className="py-3 px-4">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {returnRows.map((p) => (
                <tr key={p.id} className="hover:bg-primary-50/40">
                  <td className="py-3 px-4 font-mono font-semibold text-primary-700">
                    <Link to={`/nimasa/patients/${p.recordNo}`} className="hover:underline">
                      {p.recordNo}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-semibold text-ink-primary">{p.fullName}</td>
                  <td className="py-3 px-4 text-ink-secondary">{p.rmp?.category}</td>
                  <td className="py-3 px-4 font-mono text-ink-secondary">
                    {p.rmp?.issuedCertificate?.certificateNo || 'None (Pending / Not fit)'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-ink-primary">{p.rmp?.determination}</span>
                    {p.rmp?.limitationText && (
                      <span className="block text-[11px] text-amber-900">{p.rmp.limitationText}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-ink-muted">
                    {p.rmp?.issuedCertificate?.expiryDate || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
