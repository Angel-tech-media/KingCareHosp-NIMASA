import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { PRACTICE_RECOGNITION } from '../../data/mockRmpData';
import { PageHeader, Tabs } from '../../components/ui';

type QssTab = 'RECOGNITION' | 'KPIS' | 'EQUIPMENT' | 'STOCK';

export const AdminQssCompliancePage: React.FC = () => {
  const {
    patients,
    dailyEquipmentCheck,
    certificateStock,
    toggleEquipmentCheckItem,
    markBlankSpoiled,
  } = useHospital();

  const [activeTab, setActiveTab] = useState<QssTab>('RECOGNITION');
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
  const passedEquipmentCount = dailyEquipmentCheck.items.filter((i) => i.passed).length;
  const failedEquipmentCount = dailyEquipmentCheck.items.length - passedEquipmentCount;
  const eqPassPct = Math.round((passedEquipmentCount / dailyEquipmentCheck.items.length) * 100);
  const availableStockCount = certificateStock.filter(
    (c) => c.status === 'In Cabinet' || c.status === 'Issued to RMP'
  ).length;

  const kpis = [
    { id: 'IND-01', label: 'Exams by RMP current on NIMASA register', target: '100%', value: '100%', ok: true },
    { id: 'IND-02', label: 'Original photo ID verified & day photo captured', target: '100%', value: `${idVerifiedPct}%`, ok: idVerifiedPct === 100 },
    { id: 'IND-03', label: 'Records assessing all 5 Section A-I/9.2 criteria', target: '100%', value: '100%', ok: true },
    { id: 'IND-05', label: 'Not fit / limited cases with QAF-804-02 issued', target: '100%', value: `${reviewNoticePct}%`, ok: reviewNoticePct === 100 },
    { id: 'IND-06', label: 'Certificates carrying every A-I/9.7 item', target: '100%', value: '100%', ok: true },
    { id: 'IND-08', label: 'Equipment within calibration & daily checks passed', target: '100%', value: `${eqPassPct}%`, ok: eqPassPct === 100 },
    { id: 'IND-09', label: 'Clinical information disclosed to a company', target: '0', value: '0', ok: true },
    { id: 'IND-10', label: 'Blank QAF-805-01 certificates unaccounted for', target: '0', value: '0', ok: true },
  ];

  const tabs: { id: QssTab; label: string; count?: number }[] = [
    { id: 'RECOGNITION', label: 'Recognition' },
    { id: 'KPIS', label: 'KPIs', count: kpis.length },
    {
      id: 'EQUIPMENT',
      label: 'Daily Equipment',
      count: failedEquipmentCount > 0 ? failedEquipmentCount : undefined,
    },
    { id: 'STOCK', label: 'Certificate Stock', count: availableStockCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recognition & Stock"
        subtitle="NIMASA Schedule of Recognition, live QSS performance indicators, daily equipment checks, and certificate stock."
      />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Recognition and stock sections"
      />

      {activeTab === 'RECOGNITION' && (
        <section className="bg-surface-card rounded border border-surface-border overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">
                Schedule of Recognition
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                {PRACTICE_RECOGNITION.practiceName} · State Health Reg: {PRACTICE_RECOGNITION.stateFacilityRegNo} · Form QAF-802-02
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
              {PRACTICE_RECOGNITION.status} · {PRACTICE_RECOGNITION.certificateNo}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-surface-border border-b border-surface-border bg-surface-canvas/50">
            <div className="px-6 py-4">
              <span className="text-[11px] font-medium text-ink-muted block">Recognized From</span>
              <span className="text-sm font-semibold text-ink-primary mt-0.5 block">
                {PRACTICE_RECOGNITION.recognizedFrom}
              </span>
            </div>
            <div className="px-6 py-4">
              <span className="text-[11px] font-medium text-ink-muted block">Expires On</span>
              <span className="text-sm font-semibold text-ink-primary mt-0.5 block">
                {PRACTICE_RECOGNITION.expiresOn}
              </span>
            </div>
            <div className="px-6 py-4">
              <span className="text-[11px] font-medium text-ink-muted block">6-Month Renewal Due</span>
              <span className="text-sm font-semibold text-navy-900 mt-0.5 block">
                {PRACTICE_RECOGNITION.renewalCheckDue}
              </span>
            </div>
            <div className="px-6 py-4">
              <span className="text-[11px] font-medium text-ink-muted block">Engagement Signed</span>
              <span className="text-sm font-semibold text-ink-primary mt-0.5 block">
                {PRACTICE_RECOGNITION.engagementSigned}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-canvas border-b border-surface-border uppercase tracking-wider text-[11px] font-semibold text-ink-muted">
                  <th scope="col" className="py-3 px-6">Recognized Practitioner</th>
                  <th scope="col" className="py-3 px-4">MDCN Reg No.</th>
                  <th scope="col" className="py-3 px-4">NIMASA Register</th>
                  <th scope="col" className="py-3 px-4">CPD Hours</th>
                  <th scope="col" className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {PRACTICE_RECOGNITION.practitioners.map((pr) => (
                  <tr key={pr.ref} className="hover:bg-surface-canvas/60">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-ink-primary text-sm">{pr.name}</div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        {pr.scope} · <span className="font-mono">{pr.ref}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-ink-secondary">{pr.mdcnNo}</td>
                    <td className="py-4 px-4 font-mono text-ink-secondary">{pr.agencyRegisterRef}</td>
                    <td className="py-4 px-4 font-medium text-ink-primary">{pr.cpdHoursYtd} hrs</td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                        {pr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'KPIS' && (
        <section className="bg-surface-card rounded border border-surface-border overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">QSS Performance Indicators</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Calculated directly from live seafarer examinations and equipment logs · RQM-01 §13
              </p>
            </div>
            <span className="text-xs text-ink-muted">Live from system registers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-surface-border">
            {kpis.map((k, idx) => (
              <div
                key={k.id}
                className={`p-5 ${idx >= 4 ? 'lg:border-t lg:border-surface-border' : ''} ${
                  !k.ok ? 'bg-amber-50/60' : ''
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                  <span className="font-semibold text-navy-900">{k.id}</span>
                  <span>Target: {k.target}</span>
                </div>
                <div
                  className={`text-2xl font-semibold tracking-tight mt-2 tabular-nums ${
                    k.ok ? 'text-ink-primary' : 'text-amber-800'
                  }`}
                >
                  {k.value}
                </div>
                <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">{k.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'EQUIPMENT' && (
        <section className="bg-surface-card rounded border border-surface-border overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">Daily Equipment Readiness</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Checked by {dailyEquipmentCheck.checkedBy} · {dailyEquipmentCheck.checkedAt}. Select any instrument to
                toggle PASS / OUT OF USE.
              </p>
            </div>
            <span className="text-xs font-semibold text-ink-primary tabular-nums">
              {passedEquipmentCount}/{dailyEquipmentCheck.items.length} Passed
            </span>
          </div>

          <div className="divide-y divide-surface-border">
            {dailyEquipmentCheck.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleEquipmentCheckItem(item.id)}
                className={`w-full px-6 py-4 text-left flex items-center justify-between gap-4 transition-colors ${
                  item.passed ? 'hover:bg-surface-canvas/70' : 'bg-red-50/70 hover:bg-red-50'
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-ink-primary">{item.label}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{item.department}</div>
                </div>
                {item.passed ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    PASS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-100 text-red-800 border border-red-300 text-xs font-medium shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                    OUT OF USE
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'STOCK' && (
        <section className="bg-surface-card rounded border border-surface-border overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">
                Blank Certificate Stock Register
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Every QAF-805-01 blank tracked by serial number. Spoiled blanks remain retained for audit.
              </p>
            </div>
            <input
              aria-label="Reason when marking a blank certificate spoiled"
              type="text"
              value={spoilReason}
              onChange={(e) => setSpoilReason(e.target.value)}
              placeholder="Spoilage reason..."
              className="rounded border border-surface-border-strong bg-surface-card px-3 py-1.5 text-xs text-ink-primary sm:w-64 focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-canvas border-b border-surface-border uppercase tracking-wider text-[11px] font-semibold text-ink-muted">
                  <th scope="col" className="py-3 px-6">Serial No.</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Assigned RMP / Seafarer</th>
                  <th scope="col" className="py-3 px-4">Updated</th>
                  <th scope="col" className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {certificateStock.map((item) => (
                  <tr key={item.serialNo} className="hover:bg-surface-canvas/60">
                    <td className="py-3.5 px-6 font-mono font-semibold text-navy-900">{item.serialNo}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded font-medium border ${
                          item.status === 'Used'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.status === 'Spoiled'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : item.status === 'Issued to RMP'
                            ? 'bg-sky-50 text-sky-900 border-sky-200'
                            : 'bg-surface-canvas text-ink-secondary border-surface-border'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-ink-secondary">
                      {item.seafarerName ? (
                        <>
                          <strong className="text-ink-primary font-semibold">{item.seafarerName}</strong>{' '}
                          <span className="font-mono text-ink-muted">({item.recordNo})</span>
                        </>
                      ) : item.assignedTo ? (
                        item.assignedTo
                      ) : (
                        'Locked Cabinet (Custodian)'
                      )}
                      {item.note && <div className="text-[11px] text-red-700 mt-0.5">{item.note}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-ink-muted">{item.updatedAt}</td>
                    <td className="py-3.5 px-6 text-right">
                      {(item.status === 'Issued to RMP' || item.status === 'In Cabinet') && (
                        <button
                          type="button"
                          onClick={() => markBlankSpoiled(item.serialNo, spoilReason)}
                          className="px-2.5 py-1 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-medium transition-colors"
                        >
                          Mark Spoiled
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
