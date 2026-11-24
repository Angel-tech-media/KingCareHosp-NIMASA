import React, { useState } from 'react';
import {
  ShieldAlert,
  ClipboardCheck,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Plus,
  Users,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

interface NonConformityItem {
  id: string;
  date: string;
  source: string;
  provision: string;
  severity: 'Major' | 'Minor' | 'Observation';
  affectsCertificate: boolean;
  summary: string;
  rootCause: string;
  status: 'Open' | 'Plan Submitted (30d)' | 'Closed (Verified)';
}

const INITIAL_NCS: NonConformityItem[] = [
  {
    id: 'NC-2026-001',
    date: '14 Oct 2026',
    source: 'Internal Audit (RQP-103)',
    provision: 'RQP-402 §7.3 (RQW-002)',
    severity: 'Minor',
    affectsCertificate: false,
    summary: 'Audiometer daily listening check signed at 08:20 instead of before 08:00 first examination.',
    rootCause: 'Opening clinic checklist was not pinned to reception handoff board.',
    status: 'Closed (Verified)',
  },
  {
    id: 'NC-2026-002',
    date: '05 Nov 2026',
    source: 'Record Completeness Check (RQC-801-01)',
    provision: 'RQP-801 §7.2.2',
    severity: 'Minor',
    affectsCertificate: false,
    summary: 'One Fit-with-limitation record completeness check completed on working day 2 instead of within 1 working day.',
    rootCause: 'Records Custodian not alerted immediately on limited determination.',
    status: 'Plan Submitted (30d)',
  },
];

const STANDING_RISKS = [
  { ref: 'R1', risk: 'Pressure from a company, manning agent or seafarer on the determination', control: 'RQP-108 §7.4 (Same-day log & Agency report)', score: 8 },
  { ref: 'R2', risk: 'A practitioner examines while not on the Agency’s published register', control: 'RQP-301 §7.2 / RQW-001 (Daily session-start check)', score: 5 },
  { ref: 'R3', risk: 'Impersonation of the seafarer at examination or certificate collection', control: 'RQP-601 §7.2 (Original photo ID + live day photo)', score: 8 },
  { ref: 'R4', risk: 'Blank QAF-805-01 certificate stock lost, stolen or misused', control: 'RQP-702 (Locked cabinet, serial log, monthly non-issuer recon)', score: 6 },
  { ref: 'R5', risk: 'Clinical information or diagnosis disclosed to a shipping company', control: 'RQP-802 §7.3 / QA-P-808 (Outcome-only rule + access log)', score: 6 },
  { ref: 'R6', risk: 'Vision or audiometry equipment out of calibration producing wrong results', control: 'RQP-402 / RQW-002 (Annual calibration + daily check)', score: 6 },
  { ref: 'R7', risk: 'Seafarer found Not fit or limited is not told of the right of review', control: 'RQP-605 §7.3 (Mandatory QAF-804-02 + 1-day check)', score: 5 },
  { ref: 'R8', risk: 'Practitioners apply the fitness standard inconsistently', control: 'RQP-304 (Quarterly peer review ≥5 + 2x/yr consistency)', score: 6 },
  { ref: 'R9', risk: 'Loss of Practice recognition or a practitioner’s MDCN registration', control: 'RQP-201 §7.6 (6-month renewal) & RQP-301 §7.3 (Council check)', score: 5 },
];

type GovTab = 'CAPA' | 'RISKS' | 'AUDIT_PEER' | 'INDEPENDENCE';

export const AdminGovernancePage: React.FC = () => {
  const { patients } = useHospital();
  const [activeTab, setActiveTab] = useState<GovTab>('CAPA');
  const [ncs, setNcs] = useState<NonConformityItem[]>(INITIAL_NCS);

  // Quick NC form state
  const [ncProvision, setNcProvision] = useState('RQP-605 §7.3');
  const [ncSeverity, setNcSeverity] = useState<'Major' | 'Minor' | 'Observation'>('Minor');
  const [ncSummary, setNcSummary] = useState('');
  const [ncAffectsCert, setNcAffectsCert] = useState(false);

  const handleAddNc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncSummary.trim()) return;
    const next: NonConformityItem = {
      id: `NC-2026-00${ncs.length + 1}`,
      date: '21 Nov 2026',
      source: 'Self-Report / QSS Review',
      provision: ncProvision,
      severity: ncSeverity,
      affectsCertificate: ncAffectsCert,
      summary: ncSummary.trim(),
      rootCause: 'Under investigation (30-day plan due; "human error" not accepted per RQP-105 §7.3).',
      status: 'Open',
    };
    setNcs((prev) => [next, ...prev]);
    setNcSummary('');
    setNcAffectsCert(false);
  };

  const limitedOrUnfitCount = patients.filter(
    (p) => p.rmp?.determination === 'Not fit' || p.rmp?.determination === 'Fit with limitation'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded mb-1.5">
          Series 100 &amp; 300 · RQP-103 · RQP-105 · RQP-106 · RQP-108 · RQP-304
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
          QSS Governance, Audit, CAPA &amp; Risk Register
        </h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Internal audit programme, non-conformity &amp; corrective action register (RQR-105-01), the 9 standing
          RMP risks (RQR-106-01), clinical peer review (RQP-304), and impartiality declarations (RQP-108).
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-surface-card rounded-lg border border-surface-border shadow-card overflow-hidden">
        <div
          role="tablist"
          aria-label="QSS Governance Modules"
          className="border-b border-surface-border px-4 pt-3 flex flex-wrap items-center gap-2 bg-surface-canvas"
        >
          {(
            [
              { id: 'CAPA', label: `Non-Conformities & CAPA (${ncs.length})`, icon: ShieldAlert },
              { id: 'RISKS', label: '9 Standing Risks (RQR-106-01)', icon: AlertTriangle },
              { id: 'AUDIT_PEER', label: 'Internal Audit & Peer Review', icon: ClipboardCheck },
              { id: 'INDEPENDENCE', label: 'Independence & Complaints', icon: Scale },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors inline-flex items-center gap-2 ${
                  activeTab === t.id
                    ? 'border-primary-600 text-primary-700 bg-surface-card rounded-t-lg'
                    : 'border-transparent text-ink-muted hover:text-ink-primary'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-5 sm:p-6">
          {/* TAB 1: CAPA / Non-conformities */}
          {activeTab === 'CAPA' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddNc}
                className="p-4 rounded-lg bg-surface-canvas border border-surface-border space-y-3"
              >
                <div className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary-600" aria-hidden="true" />
                  Raise Non-Conformity (RQF-105-01 · Recorded within 2 working days)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <input
                    type="text"
                    value={ncProvision}
                    onChange={(e) => setNcProvision(e.target.value)}
                    placeholder="Clause / Provision"
                    className="rounded-lg border border-surface-border-strong bg-surface-card px-3 py-2 font-mono"
                  />
                  <select
                    value={ncSeverity}
                    onChange={(e) => setNcSeverity(e.target.value as 'Major' | 'Minor' | 'Observation')}
                    className="rounded-lg border border-surface-border-strong bg-surface-card px-3 py-2"
                  >
                    <option value="Major">Major (Report to MD same day)</option>
                    <option value="Minor">Minor (30d plan / 90d close)</option>
                    <option value="Observation">Observation</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={ncSummary}
                    onChange={(e) => setNcSummary(e.target.value)}
                    placeholder="Describe non-conformity against provision..."
                    className="sm:col-span-2 rounded-lg border border-surface-border-strong bg-surface-card px-3 py-2"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-ink-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ncAffectsCert}
                      onChange={(e) => setNcAffectsCert(e.target.checked)}
                      className="rounded border-surface-border-strong text-red-600"
                    />
                    May affect certificate validity or seafarer right (triggers same-day NIMASA AHSU notice, RQP-105 §7.2)
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold"
                  >
                    Log in RQR-105-01
                  </button>
                </div>
              </form>

              <div className="divide-y divide-surface-border border border-surface-border rounded-lg overflow-hidden">
                {ncs.map((nc) => (
                  <div key={nc.id} className="p-4 space-y-1.5 text-xs bg-surface-card">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary-700">{nc.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold border ${
                            nc.severity === 'Major'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : nc.severity === 'Minor'
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {nc.severity}
                        </span>
                        <span className="font-mono text-ink-muted">{nc.provision}</span>
                        {nc.affectsCertificate && (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-900 font-bold">
                            Same-Day NIMASA AHSU Notice
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          nc.status === 'Closed (Verified)'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {nc.status}
                      </span>
                    </div>
                    <p className="font-medium text-ink-primary">{nc.summary}</p>
                    <p className="text-ink-muted">
                      <strong>Root cause:</strong> {nc.rootCause} · <span>{nc.source} ({nc.date})</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 9 Standing Risks (RQR-106-01) */}
          {activeTab === 'RISKS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-canvas border-b border-surface-border uppercase tracking-wider text-[11px] font-semibold text-ink-muted">
                    <th scope="col" className="py-3 px-4">Ref</th>
                    <th scope="col" className="py-3 px-4">Standing Risk (RQP-106 §7.2)</th>
                    <th scope="col" className="py-3 px-4">QSS Control</th>
                    <th scope="col" className="py-3 px-4 text-right">Rating (1–25)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {STANDING_RISKS.map((r) => (
                    <tr key={r.ref} className="hover:bg-primary-50/30">
                      <td className="py-3 px-4 font-mono font-bold text-primary-700">{r.ref}</td>
                      <td className="py-3 px-4 font-medium text-ink-primary">{r.risk}</td>
                      <td className="py-3 px-4 text-ink-secondary">{r.control}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
                          {r.score} (Controlled)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Internal Audit & Clinical Peer Review */}
          {activeTab === 'AUDIT_PEER' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
              <div className="p-4 rounded-lg bg-surface-canvas border border-surface-border space-y-3">
                <div className="font-bold text-ink-primary text-sm flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-primary-600" aria-hidden="true" />
                  Annual Internal Audit Programme (RQF-103-01)
                </div>
                <ul className="space-y-2">
                  <li className="p-2.5 rounded bg-surface-card border border-surface-border flex items-center justify-between">
                    <div>
                      <strong className="text-ink-primary">Series 600 &amp; 700 (H1 &amp; H2 — Twice Yearly)</strong>
                      <div className="text-ink-muted">
                        Checklist RQC-103-01 · 10 records/RMP including all {limitedOrUnfitCount} Not Fit/Limited cases
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  </li>
                  <li className="p-2.5 rounded bg-surface-card border border-surface-border flex items-center justify-between">
                    <div>
                      <strong className="text-ink-primary">Series 100–500, 800 &amp; Premises (Annual)</strong>
                      <div className="text-ink-muted">Checklist RQC-103-02 + 4-Direction Register Verification (RQC-101-01)</div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  </li>
                  <li className="p-2.5 rounded bg-surface-card border border-surface-border flex items-center justify-between">
                    <div>
                      <strong className="text-ink-primary">Record Retrieval Test (RQF-102-01 · IND-15)</strong>
                      <div className="text-ink-muted">10/10 sampled certificates retrieved within 1 working day (100%)</div>
                    </div>
                    <span className="font-mono font-bold text-emerald-800">10/10</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-surface-canvas border border-surface-border space-y-3">
                <div className="font-bold text-ink-primary text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-600" aria-hidden="true" />
                  Clinical Peer Review &amp; Consistency (RQP-304)
                </div>
                <ul className="space-y-2">
                  <li className="p-2.5 rounded bg-surface-card border border-surface-border flex items-center justify-between">
                    <div>
                      <strong className="text-ink-primary">Quarterly Peer Review (RQF-304-01 · IND-11)</strong>
                      <div className="text-ink-muted">≥ 5 records reviewed per practitioner per quarter by another RMP</div>
                    </div>
                    <span className="font-mono font-bold text-emerald-800">6 / 5</span>
                  </li>
                  <li className="p-2.5 rounded bg-surface-card border border-surface-border flex items-center justify-between">
                    <div>
                      <strong className="text-ink-primary">Consistency Exercise (RQF-304-02)</strong>
                      <div className="text-ink-muted">Twice yearly on 5 anonymised borderline cases across all RMPs</div>
                    </div>
                    <span className="font-mono font-bold text-emerald-800">2 / yr</span>
                  </li>
                  <li className="p-2.5 rounded bg-surface-card border border-surface-border flex items-center justify-between">
                    <div>
                      <strong className="text-ink-primary">Management Review (RQF-104-01)</strong>
                      <div className="text-ink-muted">Held twice yearly covering all 14 standing inputs</div>
                    </div>
                    <span className="font-mono font-bold text-emerald-800">14 / 14</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: Independence & Complaints */}
          {activeTab === 'INDEPENDENCE' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
              <div className="p-4 rounded-lg bg-surface-canvas border border-surface-border space-y-2.5">
                <h3 className="text-sm font-bold text-ink-primary">
                  Professional Independence &amp; Conflict Controls (RQP-108)
                </h3>
                <p className="text-ink-secondary">
                  Every RMP holds current annual <strong>QAF-801-01</strong> (Independence Declaration) and{' '}
                  <strong>QAF-108-01</strong> (Impartiality Declaration). All support staff hold signed{' '}
                  <strong>RQF-108-01</strong>.
                </p>
                <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                  Fee Rule Verified (RQP-108 §7.2.1): Examination fee is identical regardless of Fit, Fit with
                  limitation, or Not fit outcome.
                </div>
                <p className="text-ink-muted">
                  Declared company conflicts (RQR-108-01): <strong>0</strong> · Unreported pressure/offers: <strong>0</strong>
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface-canvas border border-surface-border space-y-2.5">
                <h3 className="text-sm font-bold text-ink-primary">
                  Feedback &amp; Complaints Separation (RQP-109)
                </h3>
                <p className="text-ink-secondary">
                  Service complaints (RQF-109-01) are acknowledged within <strong>2 working days</strong> and
                  determined within <strong>20 working days</strong>, with right to escalate to NIMASA under QA-P-110.
                </p>
                <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-950">
                  <strong>Hard Separation (RQP-109 §7.1):</strong> A seafarer challenging a Not Fit or Limited
                  determination is never processed as a complaint — they are immediately directed to the{' '}
                  <strong>Independent Referee Review (QA-P-806 / QAF-806-01)</strong>.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
