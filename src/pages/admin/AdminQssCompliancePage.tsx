import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  Pencil,
  Database,
  RotateCcw,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { PageHeader, SlideOver, Tabs } from '../../components/ui';

type QssTab = 'RECOGNITION' | 'KPIS' | 'EQUIPMENT' | 'STOCK';

export const AdminQssCompliancePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    practice,
    users,
    patients,
    dailyEquipmentCheck,
    certificateStock,
    updatePractice,
    toggleEquipmentCheckItem,
    receiveStockBatch,
    assignStockToRmp,
    markBlankSpoiled,
    seedSampleData,
    resetDatabase,
  } = useHospital();

  const [activeTab, setActiveTab] = useState<QssTab>('RECOGNITION');
  const [spoilReason, setSpoilReason] = useState('Printing error on expiry field');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit Recognition Drawer
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceForm, setPracticeForm] = useState(practice);

  // Receive Stock Batch Drawer
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchPrefix, setBatchPrefix] = useState('NIM-MC-2026-');
  const [batchStart, setBatchStart] = useState(401);
  const [batchCount, setBatchCount] = useState(10);
  const [batchAssignTo, setBatchAssignTo] = useState('');

  // Assign Single Blank Drawer
  const [assignSerial, setAssignSerial] = useState<string | null>(null);
  const [assignTargetRmp, setAssignTargetRmp] = useState('');

  // Database Tools Drawer
  const [dbToolsOpen, setDbToolsOpen] = useState(false);

  const rmpUsers = users.filter(
    (u) => u.portalCategory === 'DOCTOR' || u.portalCategory === 'ADMIN'
  );

  // Compute live KPIs (IND-01 to IND-16 subset driven by live DB)
  const totalWithRmp = patients.filter((p) => p.rmp).length;
  const idVerifiedPct =
    totalWithRmp === 0
      ? 100
      : Math.round(
          (patients.filter((p) => p.rmp?.idVerifiedOriginal && p.rmp?.photoCaptured).length /
            totalWithRmp) *
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
  const eqPassPct =
    dailyEquipmentCheck.items.length === 0
      ? 100
      : Math.round((passedEquipmentCount / dailyEquipmentCheck.items.length) * 100);
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
      count: failedEquipmentCount > 0 ? failedEquipmentCount : dailyEquipmentCheck.items.length,
    },
    { id: 'STOCK', label: 'Certificate Stock', count: availableStockCount },
  ];

  const handleSavePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      await updatePractice(practiceForm);
      setPracticeOpen(false);
      setFeedback('Updated NIMASA Schedule of Recognition details.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update practice.');
    } finally {
      setSaving(false);
    }
  };

  const handleReceiveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const inserted = await receiveStockBatch({
        prefix: batchPrefix,
        startNumber: batchStart,
        count: batchCount,
        assignedTo: batchAssignTo.trim() || undefined,
      });
      setBatchOpen(false);
      setFeedback(`Logged ${inserted} new blank certificate serial(s) into stock register.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to log blank batch.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSerial || !assignTargetRmp.trim()) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await assignStockToRmp(assignSerial, assignTargetRmp.trim());
      setFeedback(`Assigned blank ${assignSerial} to ${assignTargetRmp.trim()}.`);
      setAssignSerial(null);
      setAssignTargetRmp('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to assign serial.');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSample = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await seedSampleData();
      navigate('/login');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load sample data.');
      setSaving(false);
    }
  };

  const handleResetClean = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await resetDatabase();
      navigate('/login');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reset database.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recognition & Stock"
        subtitle="NIMASA Schedule of Recognition, live QSS performance indicators, daily equipment checks, and certificate stock."
        actions={
          <button
            type="button"
            onClick={() => setDbToolsOpen(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white border border-surface-border-strong hover:bg-surface-canvas text-xs font-semibold text-ink-primary shadow-card transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-primary-600" aria-hidden="true" />
            <span>Database Tools</span>
          </button>
        }
      />

      {feedback && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center justify-between gap-3"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && !practiceOpen && !batchOpen && !assignSerial && (
        <div role="alert" className="px-4 py-3 rounded-xl bg-crimson-50 border border-crimson-100 text-xs text-crimson-700">
          {errorMsg}
        </div>
      )}

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Recognition and stock sections"
      />

      {activeTab === 'RECOGNITION' && (
        <section className="surface-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">Schedule of Recognition</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                {practice.practiceName} · State Health Reg: {practice.stateFacilityRegNo} · Form QAF-802-02
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                {practice.status} · {practice.certificateNo}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPracticeForm(practice);
                  setErrorMsg(null);
                  setPracticeOpen(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-surface-border-strong bg-white hover:bg-surface-canvas text-xs font-semibold text-ink-primary"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit Recognition</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-surface-border border-b border-surface-border bg-surface-canvas/50">
            <div className="px-6 py-4">
              <span className="text-[11px] font-medium text-ink-muted block">Recognized From</span>
              <span className="text-sm font-semibold text-ink-primary mt-0.5 block">
                {practice.recognizedFrom}
              </span>
            </div>
            <div className="px-6 py-4">
              <span className="text-[11px] font-medium text-ink-muted block">Expires On</span>
              <span className="text-sm font-semibold text-ink-primary mt-0.5 block">
                {practice.expiresOn}
              </span>
            </div>
            <div className="px-6 py-4">
              <span className="text-[11px] font-medium text-ink-muted block">6-Month Renewal Due</span>
              <span className="text-sm font-semibold text-navy-800 mt-0.5 block">
                {practice.renewalCheckDue}
              </span>
            </div>
            <div className="px-6 py-4">
              <span className="text-[11px] font-medium text-ink-muted block">Engagement Signed</span>
              <span className="text-sm font-semibold text-ink-primary mt-0.5 block">
                {practice.engagementSigned}
              </span>
            </div>
          </div>

          {rmpUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted space-y-2">
              <p>No RMP doctors registered yet.</p>
              <Link to="/admin/users" className="text-primary-700 font-semibold hover:underline">
                Register an RMP Doctor in Users &amp; Roles →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-canvas/70 border-b border-surface-border uppercase tracking-wider text-[11px] font-semibold text-ink-muted">
                    <th scope="col" className="py-3 px-6">Recognized Practitioner</th>
                    <th scope="col" className="py-3 px-4">Role / Scope</th>
                    <th scope="col" className="py-3 px-4">MDCN / Licence No.</th>
                    <th scope="col" className="py-3 px-4">Department</th>
                    <th scope="col" className="py-3 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {rmpUsers.map((pr) => (
                    <tr key={pr.id} className="hover:bg-surface-canvas/60">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-ink-primary text-sm">{pr.name}</div>
                        <div className="text-xs font-mono text-ink-muted mt-0.5">{pr.email}</div>
                      </td>
                      <td className="py-4 px-4 text-ink-secondary">{pr.role}</td>
                      <td className="py-4 px-4 font-mono text-ink-secondary">
                        {pr.licenseNo || 'Pending entry'}
                      </td>
                      <td className="py-4 px-4 text-ink-secondary">{pr.department}</td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                          {pr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'KPIS' && (
        <section className="surface-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">QSS Performance Indicators</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Calculated directly from live SQLite examinations and equipment logs · RQM-01 §13
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
                  <span className="font-semibold text-navy-800">{k.id}</span>
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
        <section className="surface-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">Daily Equipment Readiness</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Synced directly from Master File equipment · Select any instrument to toggle PASS / OUT OF USE.
              </p>
            </div>
            <span className="text-xs font-semibold text-ink-primary tabular-nums">
              {passedEquipmentCount}/{dailyEquipmentCheck.items.length} Passed
            </span>
          </div>

          {dailyEquipmentCheck.items.length === 0 ? (
            <div className="p-12 text-center space-y-2.5 text-xs text-ink-muted">
              <div className="text-sm font-medium text-ink-primary">
                No diagnostic equipment registered yet
              </div>
              <p>Register instruments in the Master File first; they will appear here automatically.</p>
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 text-white font-semibold"
              >
                Go to Master File →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {dailyEquipmentCheck.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleEquipmentCheckItem(item.id)}
                  className={`w-full px-6 py-4 text-left flex items-center justify-between gap-4 transition-colors ${
                    item.passed ? 'hover:bg-surface-canvas/70' : 'bg-crimson-50/70 hover:bg-crimson-50'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-ink-primary">{item.label}</div>
                    <div className="text-xs text-ink-muted mt-0.5">{item.department}</div>
                  </div>
                  {item.passed ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-crimson-50 text-crimson-700 text-xs font-medium shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                      OUT OF USE
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'STOCK' && (
        <section className="surface-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">
                Blank Certificate Stock Register
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Every QAF-805-01 blank tracked by serial number. Spoiled blanks remain retained for audit.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                aria-label="Reason when marking a blank certificate spoiled"
                type="text"
                value={spoilReason}
                onChange={(e) => setSpoilReason(e.target.value)}
                placeholder="Spoilage reason..."
                className="rounded-xl border border-surface-border-strong bg-white px-3.5 py-2 text-xs text-ink-primary sm:w-56 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setBatchOpen(true);
                }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>+ Receive Blank Batch</span>
              </button>
            </div>
          </div>

          {certificateStock.length === 0 ? (
            <div className="p-12 text-center space-y-3 text-xs text-ink-muted">
              <div className="text-sm font-medium text-ink-primary">
                No QAF-805-01 certificate serials received yet
              </div>
              <p>Log an incoming serial number range to issue medical certificates in RMP exams.</p>
              <button
                type="button"
                onClick={() => setBatchOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 text-white font-semibold"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Receive First Blank Batch</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-canvas/70 border-b border-surface-border uppercase tracking-wider text-[11px] font-semibold text-ink-muted">
                    <th scope="col" className="py-3 px-6">Serial No.</th>
                    <th scope="col" className="py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4">Assigned RMP / Seafarer</th>
                    <th scope="col" className="py-3 px-4">Updated</th>
                    <th scope="col" className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {certificateStock.map((item) => (
                    <tr key={item.serialNo} className="hover:bg-surface-canvas/60">
                      <td className="py-3.5 px-6 font-mono font-semibold text-navy-800">
                        {item.serialNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full font-medium ${
                            item.status === 'Used'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.status === 'Spoiled'
                              ? 'bg-crimson-50 text-crimson-600'
                              : item.status === 'Issued to RMP'
                              ? 'bg-primary-50 text-navy-800'
                              : 'bg-surface-canvas text-ink-secondary'
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
                        {item.note && <div className="text-[11px] text-crimson-600 mt-0.5">{item.note}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-ink-muted">{item.updatedAt}</td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          {item.status === 'In Cabinet' && (
                            <button
                              type="button"
                              onClick={() => {
                                setAssignSerial(item.serialNo);
                                setAssignTargetRmp(rmpUsers[0]?.name || '');
                              }}
                              className="px-2.5 py-1 rounded-lg border border-primary-200 bg-primary-50 hover:bg-primary-100 text-navy-800 text-[11px] font-medium"
                            >
                              Assign to RMP
                            </button>
                          )}
                          {(item.status === 'Issued to RMP' || item.status === 'In Cabinet') && (
                            <button
                              type="button"
                              onClick={() => markBlankSpoiled(item.serialNo, spoilReason)}
                              className="px-2.5 py-1 rounded-lg border border-crimson-100 bg-crimson-50 hover:bg-crimson-100 text-crimson-700 text-[11px] font-medium transition-colors"
                            >
                              Mark Spoiled
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Drawer: Edit Recognition Details */}
      <SlideOver
        isOpen={practiceOpen}
        onClose={() => setPracticeOpen(false)}
        title="Edit Recognition Details"
        subtitle="Update Schedule of Recognition (RQD-02)"
      >
        <form onSubmit={handleSavePractice} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-crimson-50 text-xs text-crimson-700">{errorMsg}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Practice Name</label>
            <input
              type="text"
              required
              value={practiceForm.practiceName}
              onChange={(e) => setPracticeForm({ ...practiceForm, practiceName: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Address</label>
            <input
              type="text"
              required
              value={practiceForm.address}
              onChange={(e) => setPracticeForm({ ...practiceForm, address: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">NIMASA Cert No.</label>
              <input
                type="text"
                required
                value={practiceForm.certificateNo}
                onChange={(e) => setPracticeForm({ ...practiceForm, certificateNo: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Status</label>
              <input
                type="text"
                required
                value={practiceForm.status}
                onChange={(e) => setPracticeForm({ ...practiceForm, status: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Expires On</label>
              <input
                type="text"
                required
                value={practiceForm.expiresOn}
                onChange={(e) => setPracticeForm({ ...practiceForm, expiresOn: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Medical Director</label>
              <input
                type="text"
                required
                value={practiceForm.medicalDirector}
                onChange={(e) => setPracticeForm({ ...practiceForm, medicalDirector: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setPracticeOpen(false)}
              className="h-10 px-4 rounded-xl border border-surface-border-strong text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-navy-800 text-white text-xs font-semibold"
            >
              {saving ? 'Saving...' : 'Save Recognition'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Drawer: Receive Blank Batch */}
      <SlideOver
        isOpen={batchOpen}
        onClose={() => setBatchOpen(false)}
        title="Receive Blank Certificate Batch"
        subtitle="Log sequential QAF-805-01 serial numbers received from NIMASA"
      >
        <form onSubmit={handleReceiveBatch} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-crimson-50 text-xs text-crimson-700">{errorMsg}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Serial Prefix</label>
            <input
              type="text"
              required
              value={batchPrefix}
              onChange={(e) => setBatchPrefix(e.target.value)}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Start Number</label>
              <input
                type="number"
                required
                min={1}
                value={batchStart}
                onChange={(e) => setBatchStart(Number(e.target.value))}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Quantity (1-100)</label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">
              Assign Immediately to RMP (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave blank to store in Locked Cabinet"
              value={batchAssignTo}
              onChange={(e) => setBatchAssignTo(e.target.value)}
              list="rmp-suggestions"
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
            <datalist id="rmp-suggestions">
              {rmpUsers.map((u) => (
                <option key={u.id} value={u.name} />
              ))}
            </datalist>
          </div>
          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setBatchOpen(false)}
              className="h-10 px-4 rounded-xl border border-surface-border-strong text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-navy-800 text-white text-xs font-semibold"
            >
              {saving ? 'Logging...' : 'Receive Batch'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Drawer: Assign Single Blank to RMP */}
      <SlideOver
        isOpen={Boolean(assignSerial)}
        onClose={() => setAssignSerial(null)}
        title="Assign Blank Certificate"
        subtitle={assignSerial ? `Issue serial ${assignSerial} from cabinet to an RMP` : ''}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">RMP Practitioner Name *</label>
            <input
              type="text"
              required
              value={assignTargetRmp}
              onChange={(e) => setAssignTargetRmp(e.target.value)}
              list="rmp-suggestions"
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setAssignSerial(null)}
              className="h-10 px-4 rounded-xl border border-surface-border-strong text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-navy-800 text-white text-xs font-semibold"
            >
              {saving ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Drawer: Database Tools */}
      <SlideOver
        isOpen={dbToolsOpen}
        onClose={() => setDbToolsOpen(false)}
        title="SQLite Database Tools"
        subtitle="Switch between sample demonstration records and a clean empty setup"
      >
        <div className="space-y-5 text-xs">
          <div className="p-4 rounded-xl bg-surface-canvas border border-surface-border space-y-3">
            <div className="font-semibold text-sm text-ink-primary">Load Sample Clinic Data</div>
            <p className="text-ink-secondary leading-relaxed">
              Replaces current database tables with 6 sample role accounts (password{' '}
              <code className="font-mono font-semibold">Kingscare@2026</code>), 5 calibrated devices, 12
              blank serials, and 6 seafarer records, then signs out so you can test each login.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-semibold"
            >
              <Database className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Load Sample Data</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-crimson-50/70 border border-crimson-100 space-y-3">
            <div className="font-semibold text-sm text-crimson-700">Reset to Clean Empty Database</div>
            <p className="text-ink-secondary leading-relaxed">
              Clears all users, equipment, seafarers, and audit entries so the app restarts on the
              First-Time Practice &amp; Admin Setup wizard.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={handleResetClean}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-crimson-500 hover:bg-crimson-600 text-white font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Database</span>
            </button>
          </div>
        </div>
      </SlideOver>
    </div>
  );
};
