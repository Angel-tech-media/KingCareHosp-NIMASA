import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  ScanLine,
  Save,
  Send,
  Lock,
  CheckCircle2,
  Clock,
  FileCheck,
  Stethoscope,
  Cpu,
  Plus,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { DiagnosticOrder, DepartmentEquipment } from '../../types';
import { SlideOver } from '../../components/ui';

interface DiagnosticsPageProps {
  department: 'Laboratory' | 'Radiology';
}

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({
  department,
}) => {
  const { patients, departments, saveOrderDraft, publishOrderResult, registerEquipment, updateEquipment } =
    useHospital();
  const [eqOpen, setEqOpen] = useState(false);
  const [eqName, setEqName] = useState('');
  const [eqMfg, setEqMfg] = useState('');
  const [eqModel, setEqModel] = useState('');
  const [eqSerial, setEqSerial] = useState('');
  const [eqYear, setEqYear] = useState(new Date().getFullYear());
  const [eqDue, setEqDue] = useState('');
  const [eqSaving, setEqSaving] = useState(false);
  const [eqError, setEqError] = useState<string | null>(null);

  const deptId = department === 'Laboratory' ? 'lab' : 'radiology';
  const myDept = departments.find((d) => d.id === deptId);

  // Flatten all orders for this department
  const departmentOrders = useMemo(() => {
    const list: DiagnosticOrder[] = [];
    patients.forEach((p) => {
      p.orders.forEach((o) => {
        if (o.department === department) {
          list.push(o);
        }
      });
    });
    return list;
  }, [patients, department]);

  const pendingOrDraftOrders = useMemo(
    () => departmentOrders.filter((o) => o.status !== 'Published'),
    [departmentOrders]
  );

  const publishedOrders = useMemo(
    () => departmentOrders.filter((o) => o.status === 'Published'),
    [departmentOrders]
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    pendingOrDraftOrders[0]?.id || departmentOrders[0]?.id || null
  );

  const selectedOrder =
    departmentOrders.find((o) => o.id === selectedOrderId) ||
    pendingOrDraftOrders[0] ||
    departmentOrders[0] ||
    null;

  const [findingsInput, setFindingsInput] = useState('');
  const [referenceInput, setReferenceInput] = useState('');
  const [remarksInput, setRemarksInput] = useState('');
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedOrder) return;
    setFindingsInput(
      selectedOrder.publishedResult ||
        selectedOrder.draftFindings ||
        (department === 'Laboratory'
          ? 'Trophozoites of P. falciparum: Negative (No malaria parasites seen) | WBC: 6.1 x10^9/L | Hb: 13.8 g/dL | Platelets: 240 x10^9/L'
          : 'Lung fields are clear bilaterally. Cardiac silhouette is within normal limits (CTR = 0.46). Costophrenic angles are sharp. No acute bony lesion.')
    );
    setReferenceInput(
      selectedOrder.referenceRange ||
        (department === 'Laboratory'
          ? 'Normal adult haematological / parasitological reference interval'
          : 'Normal anatomical radiological appearance')
    );
    setRemarksInput(
      selectedOrder.scientistRemarks ||
        (department === 'Laboratory'
          ? 'Quality control passed. Verified by Senior Medical Lab Scientist.'
          : 'Digital radiograph verified by Consultant Radiologist.')
    );
  }, [selectedOrder?.id, department]);

  const triggerBanner = (msg: string) => {
    setActionBanner(msg);
    setTimeout(() => setActionBanner(null), 4000);
  };

  const handleSaveDraft = () => {
    if (!selectedOrder) return;
    saveOrderDraft(selectedOrder.id, findingsInput, remarksInput);
    triggerBanner(
      `Draft saved for ${selectedOrder.testName} (${selectedOrder.recordNo}). Result not yet released to doctor.`
    );
  };

  const handlePublishResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    publishOrderResult(
      selectedOrder.id,
      findingsInput,
      referenceInput,
      remarksInput,
      department
    );
    triggerBanner(
      `Result published for ${selectedOrder.patientName} (${selectedOrder.recordNo})! Patient stage moved to "Results ready".`
    );
  };

  const isLab = department === 'Laboratory';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded mb-1.5">
            {isLab ? (
              <FlaskConical className="w-3.5 h-3.5" />
            ) : (
              <ScanLine className="w-3.5 h-3.5" />
            )}
            {isLab
              ? 'Hospital Laboratory & Pathology Workbench'
              : 'Hospital Radiology & Diagnostic Imaging Workbench'}
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            {department} Orders & Result Entry
          </h1>
          <p className="text-sm text-slate-500">
            Open a pending order, enter diagnostic result values, save a draft,
            or publish to alert the ordering doctor.
          </p>
        </div>

        {/* Department Equipment + Privacy Notice */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEqError(null);
              setEqOpen(true);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white border border-surface-border-strong hover:bg-surface-canvas text-xs font-semibold text-ink-primary shadow-card"
          >
            <Cpu className="w-4 h-4 text-primary-600" aria-hidden="true" />
            <span>Equipment ({myDept?.equipment.length || 0})</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-surface-border text-xs text-ink-secondary">
            <Lock className="w-4 h-4 text-ink-muted shrink-0" />
            <span>Clinical notes restricted</span>
          </div>
        </div>
      </div>

      {actionBanner && (
        <div className="p-3.5 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-medium shadow-md flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {actionBanner}
          </span>
          {selectedOrder && (
            <Link
              to={`/doctor/patients/${selectedOrder.recordNo}`}
              className="underline font-bold text-xs text-emerald-100 hover:text-white"
            >
              View in Doctor Chart →
            </Link>
          )}
        </div>
      )}

      {/* Main Two-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Pending & Completed Orders List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Pending & Draft Orders ({pendingOrDraftOrders.length})
              </h2>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                Action Required
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {pendingOrDraftOrders.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  All {department} orders have been published! Select a
                  completed order below or order new tests from the Doctor view.
                </div>
              ) : (
                pendingOrDraftOrders.map((ord) => {
                  const isSelected = selectedOrder?.id === ord.id;
                  return (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setSelectedOrderId(ord.id)}
                      className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700">
                            {ord.recordNo}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            {ord.patientName}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {ord.testName}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Ordered by {ord.orderedBy} • {ord.orderedAt}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border shrink-0 ${
                          ord.status === 'Draft'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Recently Published Orders */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Published Orders ({publishedOrders.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-200 max-h-64 overflow-y-auto">
              {publishedOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`w-full text-left p-3.5 transition-colors flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {ord.testName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {ord.recordNo} • {ord.patientName}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Published
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Result Entry Form */}
        <div className="lg:col-span-7">
          {!selectedOrder ? (
            <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-sm text-slate-500">
              Select an order on the left to enter diagnostic results.
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
              {/* Order Header (Only Order + Patient Name + Record No. — No Doctor Notes) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedOrder.recordNo}
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      Order #{selectedOrder.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                        selectedOrder.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedOrder.status === 'Draft'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1.5">
                    {selectedOrder.testName}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Patient: <strong>{selectedOrder.patientName}</strong> •
                    Requested by: <strong>{selectedOrder.orderedBy}</strong> at{' '}
                    {selectedOrder.orderedAt}
                  </p>
                </div>

                <Link
                  to={`/doctor/patients/${selectedOrder.recordNo}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  <span>Open Doctor Chart</span>
                </Link>
              </div>

              {/* Privacy Guard Box */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Restricted Scope:</strong> Attending doctor&apos;s
                  clinical assessment notes are not displayed to {department}{' '}
                  personnel. Only the investigation order, patient name, and
                  record number are visible.
                </span>
              </div>

              {/* Result Entry Fields */}
              <form onSubmit={handlePublishResult} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isLab
                      ? 'Quantitative / Qualitative Laboratory Findings *'
                      : 'Radiological Impression & Imaging Findings *'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={findingsInput}
                    onChange={(e) => setFindingsInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Enter structured parameters or imaging report..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reference Interval / Standard
                    </label>
                    <input
                      type="text"
                      value={referenceInput}
                      onChange={(e) => setReferenceInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isLab
                        ? 'Lab Scientist Quality Remarks'
                        : 'Radiologist Verification Note'}
                    </label>
                    <input
                      type="text"
                      value={remarksInput}
                      onChange={(e) => setRemarksInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Separate "Save draft" and "Publish result" buttons */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>
                      Stamped as:{' '}
                      <strong>
                        {isLab
                          ? 'MLS. Kelechi Nwachukwu (Senior Lab Scientist)'
                          : 'Dr. Musa Danbaba (Consultant Radiologist)'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold shadow-sm transition-colors"
                    >
                      <Save className="w-4 h-4 text-slate-600" />
                      <span>Save draft</span>
                    </button>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>Publish result</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Department Equipment Registration & Status SlideOver */}
      <SlideOver
        isOpen={eqOpen}
        onClose={() => setEqOpen(false)}
        title={`${department} Equipment Register`}
        subtitle="Register new instruments with model number and calibration dates, or toggle readiness"
      >
        <div className="space-y-6">
          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Registered Units ({myDept?.equipment.length || 0})
            </div>
            {!myDept || myDept.equipment.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-canvas text-xs text-ink-muted">
                No {department} equipment registered yet. Add one below.
              </div>
            ) : (
              <div className="space-y-2">
                {myDept.equipment.map((eq) => (
                  <div
                    key={eq.id}
                    className="p-3.5 rounded-xl bg-surface-canvas/80 border border-surface-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-ink-primary">{eq.name}</div>
                      <div className="font-mono text-[11px] text-ink-muted mt-0.5">
                        Model: {eq.model} · SN: {eq.serialNo}
                      </div>
                    </div>
                    <select
                      aria-label={`Status for ${eq.name}`}
                      value={eq.status}
                      onChange={(e) =>
                        updateEquipment(eq.id, {
                          status: e.target.value as DepartmentEquipment['status'],
                        })
                      }
                      className="rounded-lg border border-surface-border-strong bg-white px-2 py-1 text-xs"
                    >
                      <option value="Operational">Operational</option>
                      <option value="Calibration Due">Calibration Due</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Out of Use">Out of Use</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setEqSaving(true);
              setEqError(null);
              try {
                await registerEquipment(deptId, {
                  name: eqName,
                  manufacturer: eqMfg,
                  model: eqModel,
                  yearOfMake: eqYear,
                  serialNo: eqSerial,
                  nextCalibrationDue: eqDue,
                  status: 'Operational',
                });
                setEqName('');
                setEqMfg('');
                setEqModel('');
                setEqSerial('');
                setEqDue('');
              } catch (err) {
                setEqError(err instanceof Error ? err.message : 'Failed to register unit.');
              } finally {
                setEqSaving(false);
              }
            }}
            className="pt-5 border-t border-surface-border space-y-3.5"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              + Register New {department} Instrument
            </div>
            {eqError && (
              <div className="p-2.5 rounded-xl bg-crimson-50 text-xs text-crimson-700">{eqError}</div>
            )}
            <input
              type="text"
              required
              placeholder="Equipment Name (e.g. Automated Haematology Analyzer)"
              value={eqName}
              onChange={(e) => setEqName(e.target.value)}
              className="w-full rounded-xl border border-surface-border-strong px-3 py-2 text-xs"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Manufacturer (e.g. Sysmex)"
                value={eqMfg}
                onChange={(e) => setEqMfg(e.target.value)}
                className="w-full rounded-xl border border-surface-border-strong px-3 py-2 text-xs"
              />
              <input
                type="text"
                required
                placeholder="Model No. (e.g. XN-550) *"
                value={eqModel}
                onChange={(e) => setEqModel(e.target.value)}
                className="w-full rounded-xl border border-surface-border-strong px-3 py-2 text-xs font-mono"
              />
              <input
                type="text"
                required
                placeholder="Serial No. *"
                value={eqSerial}
                onChange={(e) => setEqSerial(e.target.value)}
                className="w-full rounded-xl border border-surface-border-strong px-3 py-2 text-xs font-mono"
              />
              <input
                type="number"
                required
                min={1980}
                max={2035}
                value={eqYear}
                onChange={(e) => setEqYear(Number(e.target.value))}
                className="w-full rounded-xl border border-surface-border-strong px-3 py-2 text-xs font-mono"
              />
            </div>
            <input
              type="text"
              placeholder="Next Calibration Due (e.g. 15 Nov 2027)"
              value={eqDue}
              onChange={(e) => setEqDue(e.target.value)}
              className="w-full rounded-xl border border-surface-border-strong px-3 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={eqSaving}
              className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 disabled:opacity-60 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{eqSaving ? 'Registering...' : 'Save Equipment'}</span>
            </button>
          </form>
        </div>
      </SlideOver>
    </div>
  );
};
