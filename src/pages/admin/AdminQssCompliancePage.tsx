import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileBadge,
  Wrench,
  Award,
  BarChart3,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { PRACTICE_RECOGNITION } from '../../data/mockRmpData';

export const AdminQssCompliancePage: React.FC = () => {
  const {
    patients,
    dailyEquipmentCheck,
    certificateStock,
    toggleEquipmentCheckItem,
    markBlankSpoiled,
  } = useHospital();

  const [spoilReason, setSpoilReason] = useState('Printing error on expiry field');

  // Compute live KPIs (IND-01 to IND-16 subset driven by live state)
  const totalWithRmp = patients.filter((p) => p.rmp).length;
  const idVerifiedPct = Math.round(
    (patients.filter((p) => p.rmp?.idVerifiedOriginal && p.rmp?.photoCaptured).length /
      Math.max(1, totalWithRmp)) *
      100
  );
  const notFitOrLimited = patients.filter(
    (p) => p.rmp?.determination === 'Not fit' || p.rmp?.determination === 'Fit with limitation'
  );
  const reviewNoticePct =
    notFitOrLimited.length === 0
      ? 100
      : Math.round(
          (notFitOrLimited.filter((p) => Boolean(p.rmp?.rightOfReview)).length /
            notFitOrLimited.length) *
            100
        );
  const eqPassPct = Math.round(
    (dailyEquipmentCheck.items.filter((i) => i.passed).length /
      dailyEquipmentCheck.items.length) *
      100
  );

  const kpis = [
    { id: 'IND-01', label: 'Exams by RMP current on NIMASA register', target: '100%', value: '100%', ok: true },
    { id: 'IND-02', label: 'Original photo ID verified & day photo captured', target: '100%', value: `${idVerifiedPct}%`, ok: idVerifiedPct === 100 },
    { id: 'IND-03', label: 'Records assessing all 5 Section A-I/9.2 criteria', target: '100%', value: '100%', ok: true },
    { id: 'IND-05', label: 'Not fit / limited cases with QAF-804-02 issued', target: '100%', value: `${reviewNoticePct}%`, ok: reviewNoticePct === 100 },
    { id: 'IND-06', label: 'Certificates carrying every A-I/9.7 item (+ RQF-701-01)', target: '100%', value: '100%', ok: true },
    { id: 'IND-08', label: 'Equipment within calibration & daily checks passed', target: '100%', value: `${eqPassPct}%`, ok: eqPassPct === 100 },
    { id: 'IND-09', label: 'Clinical information disclosed to a company', target: '0', value: '0', ok: true },
    { id: 'IND-10', label: 'Blank QAF-805-01 certificates unaccounted for', target: '0', value: '0', ok: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded mb-1.5">
          <Award className="w-3.5 h-3.5" aria-hidden="true" />
          RQM-01 · RQD-02 · RQP-402 · RQP-702
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
          RMP Quality Standards System (QSS) &amp; Stock Control
        </h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Schedule of Recognition (RQD-02), QSS Performance Indicators (IND-01 to IND-16), Daily Equipment Checks
          (RQF-402-01), and Blank Certificate Stock Register (RQR-702-01).
        </p>
      </div>

      {/* 1. Schedule of Recognition (RQD-02) */}
      <section className="bg-surface-card rounded-lg border border-surface-border shadow-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-border">
          <div>
            <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              Schedule of Recognition (RQD-02 · Form QAF-802-02)
            </h2>
            <p className="text-xs text-ink-muted">
              {PRACTICE_RECOGNITION.practiceName} · State Health Reg: {PRACTICE_RECOGNITION.stateFacilityRegNo}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            {PRACTICE_RECOGNITION.status} Recognition · {PRACTICE_RECOGNITION.certificateNo}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-surface-canvas border border-surface-border">
            <span className="text-ink-muted block">Recognized From</span>
            <strong className="text-ink-primary">{PRACTICE_RECOGNITION.recognizedFrom}</strong>
          </div>
          <div className="p-3 rounded-lg bg-surface-canvas border border-surface-border">
            <span className="text-ink-muted block">Expires On</span>
            <strong className="text-ink-primary">{PRACTICE_RECOGNITION.expiresOn}</strong>
          </div>
          <div className="p-3 rounded-lg bg-surface-canvas border border-surface-border">
            <span className="text-ink-muted block">6-Month Renewal Readiness Due</span>
            <strong className="text-primary-700">{PRACTICE_RECOGNITION.renewalCheckDue}</strong>
          </div>
          <div className="p-3 rounded-lg bg-surface-canvas border border-surface-border">
            <span className="text-ink-muted block">Engagement (QAF-802-01)</span>
            <strong className="text-ink-primary">Signed {PRACTICE_RECOGNITION.engagementSigned}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-canvas border-b border-surface-border uppercase tracking-wider text-[11px] font-semibold text-ink-muted">
                <th scope="col" className="py-2.5 px-3">Ref</th>
                <th scope="col" className="py-2.5 px-3">Recognized Practitioner</th>
                <th scope="col" className="py-2.5 px-3">MDCN Reg No.</th>
                <th scope="col" className="py-2.5 px-3">QAR-803-01 Entry</th>
                <th scope="col" className="py-2.5 px-3">CPD Hours (Min 10/yr)</th>
                <th scope="col" className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {PRACTICE_RECOGNITION.practitioners.map((pr) => (
                <tr key={pr.ref}>
                  <td className="py-2.5 px-3 font-mono font-bold text-primary-700">{pr.ref}</td>
                  <td className="py-2.5 px-3 font-semibold text-ink-primary">
                    {pr.name}
                    <span className="block text-[11px] font-normal text-ink-muted">{pr.scope}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-ink-secondary">{pr.mdcnNo}</td>
                  <td className="py-2.5 px-3 font-mono text-ink-secondary">{pr.agencyRegisterRef}</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-800">{pr.cpdHoursYtd} hrs</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                      {pr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. QSS Performance Indicators (RQM-01 §13) */}
      <section className="bg-surface-card rounded-lg border border-surface-border shadow-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-600" aria-hidden="true" />
            QSS Performance Indicators Scorecard (RQM-01 §13 · RQP-107)
          </h2>
          <span className="text-xs text-ink-muted">Live from system registers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div
              key={k.id}
              className={`p-3.5 rounded-lg border ${
                k.ok ? 'bg-surface-canvas border-surface-border' : 'bg-amber-50 border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                <span className="text-primary-700">{k.id}</span>
                <span className="text-ink-muted">Target: {k.target}</span>
              </div>
              <div className={`text-2xl font-bold mt-1 ${k.ok ? 'text-emerald-800' : 'text-amber-900'}`}>
                {k.value}
              </div>
              <p className="text-xs text-ink-secondary mt-1 leading-snug">{k.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Interactive Daily Equipment Check (RQW-002 / RQF-402-01) */}
      <section className="bg-surface-card rounded-lg border border-surface-border shadow-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-border">
          <div>
            <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary-600" aria-hidden="true" />
              Daily Equipment Checks (RQF-402-01 · RQW-002)
            </h2>
            <p className="text-xs text-ink-muted">
              Checked by {dailyEquipmentCheck.checkedBy} · {dailyEquipmentCheck.checkedAt}. Click any item to toggle
              PASS / OUT OF USE (updates Doctor workspace &amp; Audit Log live).
            </p>
          </div>
          <span className="text-xs font-semibold text-ink-secondary">
            {dailyEquipmentCheck.items.filter((i) => i.passed).length}/{dailyEquipmentCheck.items.length} Passed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {dailyEquipmentCheck.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleEquipmentCheckItem(item.id)}
              className={`p-3 rounded-lg border text-left transition-all flex items-start justify-between gap-2 ${
                item.passed
                  ? 'bg-surface-canvas border-surface-border hover:border-primary-300'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}
            >
              <div className="text-xs">
                <div className="font-semibold text-ink-primary">{item.label}</div>
                <div className="text-[11px] text-ink-muted mt-0.5">{item.department}</div>
              </div>
              {item.passed ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shrink-0">
                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                  PASS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold shrink-0">
                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  OUT OF USE
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Blank Certificate Stock Register (RQR-702-01) */}
      <section className="bg-surface-card rounded-lg border border-surface-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-surface-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-primary-600" aria-hidden="true" />
              Blank Certificate Stock Register (RQR-702-01 · Form QAF-805-01)
            </h2>
            <p className="text-xs text-ink-muted">
              Every blank accounted for by serial number. Spoiled certificates are retained and never discarded.
            </p>
          </div>
          <input
            aria-label="Reason when marking a blank certificate spoiled"
            type="text"
            value={spoilReason}
            onChange={(e) => setSpoilReason(e.target.value)}
            placeholder="Spoilage reason..."
            className="rounded-lg border border-surface-border-strong px-3 py-1.5 text-xs sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-canvas border-b border-surface-border uppercase tracking-wider text-[11px] font-semibold text-ink-muted">
                <th scope="col" className="py-3 px-4">Serial No.</th>
                <th scope="col" className="py-3 px-4">Status</th>
                <th scope="col" className="py-3 px-4">Assigned RMP / Seafarer</th>
                <th scope="col" className="py-3 px-4">Updated</th>
                <th scope="col" className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {certificateStock.map((item) => (
                <tr key={item.serialNo} className="hover:bg-primary-50/30">
                  <td className="py-3 px-4 font-mono font-bold text-primary-700">{item.serialNo}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded font-semibold border ${
                        item.status === 'Used'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.status === 'Spoiled'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : item.status === 'Issued to RMP'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-ink-secondary">
                    {item.seafarerName ? (
                      <>
                        <strong className="text-ink-primary">{item.seafarerName}</strong> ({item.recordNo})
                      </>
                    ) : item.assignedTo ? (
                      item.assignedTo
                    ) : (
                      'Locked Cabinet (Custodian)'
                    )}
                    {item.note && <div className="text-[11px] text-red-700 mt-0.5">{item.note}</div>}
                  </td>
                  <td className="py-3 px-4 font-mono text-ink-muted">{item.updatedAt}</td>
                  <td className="py-3 px-4 text-right">
                    {(item.status === 'Issued to RMP' || item.status === 'In Cabinet') && (
                      <button
                        type="button"
                        onClick={() => markBlankSpoiled(item.serialNo, spoilReason)}
                        className="px-2.5 py-1 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-semibold transition-colors"
                      >
                        Mark SPOILED
                      </button>
                    )}
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
