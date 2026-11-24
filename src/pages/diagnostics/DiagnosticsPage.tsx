import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  ScanLine,
  Ear,
  Eye,
  Save,
  Send,
  Lock,
  CheckCircle2,
  Clock,
  FileCheck,
  Stethoscope,
  Cpu,
  Plus,
  Upload,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { CieStandard, DepartmentEquipment, DiagnosticOrder } from '../../types';
import { PageHeader, SlideOver } from '../../components/ui';

interface DiagnosticsPageProps {
  department: 'Laboratory' | 'Radiology' | 'ENT & Audiology' | 'Eye Clinic';
}

const DECIMAL_OPTIONS = ['0.1', '0.25', '0.33', '0.4', '0.5', '0.67', '0.7', '0.8', '1.0'];

const CIE_OPTIONS: CieStandard[] = [
  'CIE 1',
  'CIE 2',
  'CIE 3',
  'Pending specialist',
  'Failed',
  'Not tested',
];

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({ department }) => {
  const {
    patients,
    departments,
    currentUser,
    activeRole,
    saveOrderDraft,
    publishOrderResult,
    uploadOrderAttachment,
    registerEquipment,
    updateEquipment,
  } = useHospital();

  const deptId =
    department === 'Laboratory'
      ? 'lab'
      : department === 'Radiology'
      ? 'radiology'
      : department === 'ENT & Audiology'
      ? 'ent'
      : 'eye';

  const myDept = departments.find((d) => d.id === deptId);
  const canOpenDoctorChart = activeRole === 'ADMIN' || activeRole === 'DOCTOR';

  // Equipment SlideOver state
  const [eqOpen, setEqOpen] = useState(false);
  const [eqName, setEqName] = useState('');
  const [eqMfg, setEqMfg] = useState('');
  const [eqModel, setEqModel] = useState('');
  const [eqSerial, setEqSerial] = useState('');
  const [eqYear, setEqYear] = useState(new Date().getFullYear());
  const [eqDue, setEqDue] = useState('');
  const [eqSaving, setEqSaving] = useState(false);
  const [eqError, setEqError] = useState<string | null>(null);

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

  const selectedPatient = useMemo(
    () => (selectedOrder ? patients.find((p) => p.id === selectedOrder.patientId) : undefined),
    [patients, selectedOrder]
  );

  // Free-text findings for Lab & Radiology (and optional notes summary for ENT/Eye)
  const [findingsInput, setFindingsInput] = useState('');
  const [referenceInput, setReferenceInput] = useState('');
  const [remarksInput, setRemarksInput] = useState('');
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Structured ENT Audiometry state
  const [audioRight, setAudioRight] = useState({ hz500: 15, hz1000: 15, hz2000: 20, hz3000: 20 });
  const [audioLeft, setAudioLeft] = useState({ hz500: 15, hz1000: 20, hz2000: 20, hz3000: 20 });
  const [speechClear, setSpeechClear] = useState(true);

  // Structured Eye Clinic Snellen & Colour state
  const [unaided, setUnaided] = useState({ right: '0.8', left: '0.8', both: '1.0' });
  const [aided, setAided] = useState({ right: '1.0', left: '1.0', both: '1.0' });
  const [visualAidsRequired, setVisualAidsRequired] = useState(false);
  const [nearVisionMet, setNearVisionMet] = useState(true);
  const [intermediateVisionMet, setIntermediateVisionMet] = useState(true);
  const [visualFieldsNormal, setVisualFieldsNormal] = useState(true);
  const [nightVisionNormal, setNightVisionNormal] = useState(true);
  const [diplopiaAbsent, setDiplopiaAbsent] = useState(true);
  const [colourMethod, setColourMethod] = useState('Ishihara 38-Plate (2024 Ed.) under D65 Lamp');
  const [colourCie, setColourCie] = useState<CieStandard>('CIE 1');

  useEffect(() => {
    if (!selectedOrder) return;
    setFindingsInput(
      selectedOrder.publishedResult ||
        selectedOrder.draftFindings ||
        (department === 'Laboratory'
          ? 'Hb: 14.2 g/dL | WBC: 6.1 x10^9/L | Platelets: 240 x10^9/L | Malaria Parasites: Negative'
          : department === 'Radiology'
          ? 'Lung fields clear bilaterally. Cardiac silhouette normal (CTR = 0.46). No acute bony or pleural lesion.'
          : '')
    );
    setReferenceInput(selectedOrder.referenceRange || '');
    setRemarksInput(
      selectedOrder.scientistRemarks ||
        (department === 'Laboratory'
          ? 'Quality control passed.'
          : department === 'Radiology'
          ? 'Digital radiograph verified.'
          : department === 'ENT & Audiology'
          ? 'Tested in acoustic booth; listening check passed.'
          : 'Screening conducted under D65 illumination at 6m / 40cm.')
    );

    const vh = selectedPatient?.rmp?.visionHearing;
    if (vh) {
      setAudioRight(vh.audiometryRight);
      setAudioLeft(vh.audiometryLeft);
      setSpeechClear(vh.speechClear);
      setUnaided(vh.distanceUnaided);
      setAided(vh.distanceAided);
      setVisualAidsRequired(vh.visualAidsRequired);
      setNearVisionMet(vh.nearVisionMet);
      setIntermediateVisionMet(vh.intermediateVisionMet);
      setVisualFieldsNormal(vh.visualFieldsNormal);
      setNightVisionNormal(vh.nightVisionNormal);
      setDiplopiaAbsent(vh.diplopiaAbsent);
      setColourMethod(vh.colourVisionTestMethod);
      setColourCie(vh.colourVisionCie);
    }
  }, [selectedOrder?.id, department, selectedPatient?.id]);

  const triggerBanner = (msg: string) => {
    setActionBanner(msg);
    setTimeout(() => setActionBanner(null), 5000);
  };

  const buildStructuredSummary = (): string => {
    if (department === 'ENT & Audiology') {
      return `Audiometry R(500/1k/2k/3k Hz): ${audioRight.hz500}/${audioRight.hz1000}/${audioRight.hz2000}/${audioRight.hz3000} dB · L: ${audioLeft.hz500}/${audioLeft.hz1000}/${audioLeft.hz2000}/${audioLeft.hz3000} dB · Speech: ${
        speechClear ? 'Clear' : 'Impaired'
      }${findingsInput.trim() ? ` · ${findingsInput.trim()}` : ''}`;
    }
    if (department === 'Eye Clinic') {
      return `Unaided R:${unaided.right}/L:${unaided.left}/Both:${unaided.both} · Aided R:${aided.right}/L:${aided.left}/Both:${aided.both} · Colour: ${colourCie} (${colourMethod}) · Aids: ${
        visualAidsRequired ? 'Required' : 'No'
      } · Near/Fields/Night: ${nearVisionMet ? 'OK' : 'Abn'}/${visualFieldsNormal ? 'Normal' : 'Defect'}/${
        nightVisionNormal ? 'Normal' : 'Impaired'
      }${findingsInput.trim() ? ` · ${findingsInput.trim()}` : ''}`;
    }
    return findingsInput;
  };

  const handleSaveDraft = async () => {
    if (!selectedOrder) return;
    const summaryText = buildStructuredSummary();
    await saveOrderDraft(selectedOrder.id, summaryText, remarksInput);
    triggerBanner(
      `Draft saved for ${selectedOrder.testName} (${selectedOrder.recordNo}). Not yet released to RMP.`
    );
  };

  const handlePublishResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || publishing) return;
    setPublishing(true);
    try {
      const summaryText = buildStructuredSummary();
      const structuredData =
        department === 'ENT & Audiology'
          ? {
              audiometry: {
                audiometryRight: audioRight,
                audiometryLeft: audioLeft,
                speechClear,
              },
            }
          : department === 'Eye Clinic'
          ? {
              vision: {
                distanceUnaided: unaided,
                distanceAided: aided,
                visualAidsRequired,
                nearVisionMet,
                intermediateVisionMet,
                visualFieldsNormal,
                nightVisionNormal,
                diplopiaAbsent,
                colourVisionTestMethod: colourMethod,
                colourVisionCie: colourCie,
              },
            }
          : undefined;

      await publishOrderResult(
        selectedOrder.id,
        summaryText,
        referenceInput,
        remarksInput,
        department,
        structuredData
      );
      triggerBanner(
        `Objective readings published for ${selectedOrder.patientName} (${selectedOrder.recordNo}) and synced to the RMP examination record.`
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedOrder) return;
    setUploading(true);
    try {
      await uploadOrderAttachment(selectedOrder.id, file);
      triggerBanner(`Uploaded scanned report "${file.name}" for ${selectedOrder.recordNo}.`);
    } catch (err) {
      triggerBanner(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const DeptIcon =
    department === 'Laboratory'
      ? FlaskConical
      : department === 'Radiology'
      ? ScanLine
      : department === 'ENT & Audiology'
      ? Ear
      : Eye;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${department} Orders & Result Entry`}
        subtitle="Inspect the RMP's examination instruction, enter objective test measurements, upload reports, and publish back to the RMP."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setEqError(null);
                setEqOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white border border-surface-border-strong hover:bg-surface-canvas text-xs font-semibold text-ink-primary shadow-card"
            >
              <Cpu className="w-4 h-4 text-primary-600" aria-hidden="true" />
              <span>Equipment ({myDept?.equipment.length || 0})</span>
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-surface-border text-xs text-ink-secondary">
              <Lock className="w-4 h-4 text-ink-muted shrink-0" />
              <span>RMP clinical notes restricted</span>
            </div>
          </div>
        }
      />

      {actionBanner && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl bg-navy-900 text-white text-xs sm:text-sm font-medium shadow-md flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {actionBanner}
          </span>
          {selectedOrder && canOpenDoctorChart && (
            <Link
              to={`/doctor/patients/${selectedOrder.recordNo}`}
              className="underline font-semibold text-xs text-primary-200 hover:text-white shrink-0"
            >
              View in RMP Chart →
            </Link>
          )}
        </div>
      )}

      {/* Main Two-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Pending & Published Orders */}
        <div className="lg:col-span-5 space-y-5">
          <div className="surface-panel overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DeptIcon className="w-4 h-4 text-primary-600" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-ink-primary">
                  Pending &amp; Draft Orders ({pendingOrDraftOrders.length})
                </h2>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary-50 text-navy-800">
                Action Queue
              </span>
            </div>

            <div className="divide-y divide-surface-border/70">
              {pendingOrDraftOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-muted">
                  No pending {department} orders right now. Select a completed order below or wait
                  for RMP referral orders.
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
                          ? 'bg-primary-50/70 border-l-4 border-l-navy-800'
                          : 'hover:bg-surface-canvas'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-primary-700">
                            {ord.recordNo}
                          </span>
                          <span className="text-xs font-semibold text-ink-primary truncate">
                            {ord.patientName}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-ink-primary">{ord.testName}</p>
                        {ord.clinicalInstruction && (
                          <p className="text-[11px] text-ink-secondary line-clamp-1">
                            Instruction: {ord.clinicalInstruction}
                          </p>
                        )}
                        <p className="text-[11px] text-ink-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ord.orderedBy} · {ord.orderedAt}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                          ord.status === 'Draft'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-primary-50 text-navy-800'
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

          {/* Published Orders */}
          <div className="surface-panel overflow-hidden">
            <div className="px-5 py-3.5 border-b border-surface-border/80 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Published Orders ({publishedOrders.length})
              </h3>
            </div>
            <div className="divide-y divide-surface-border/70 max-h-64 overflow-y-auto">
              {publishedOrders.length === 0 ? (
                <div className="p-6 text-center text-xs text-ink-muted">
                  No published {department} results yet.
                </div>
              ) : (
                publishedOrders.map((ord) => {
                  const isSelected = selectedOrder?.id === ord.id;
                  return (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setSelectedOrderId(ord.id)}
                      className={`w-full text-left p-3.5 transition-colors flex items-center justify-between gap-2 ${
                        isSelected ? 'bg-primary-50/50' : 'hover:bg-surface-canvas'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-ink-primary">{ord.testName}</p>
                        <p className="text-[11px] text-ink-muted">
                          {ord.recordNo} · {ord.patientName}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 shrink-0">
                        Published
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Order Instruction + Result Entry Form + Attachment Upload */}
        <div className="lg:col-span-7">
          {!selectedOrder ? (
            <div className="surface-panel p-12 text-center text-sm text-ink-muted">
              Select an order on the left to view instructions and record objective results.
            </div>
          ) : (
            <div className="surface-panel p-6 space-y-5">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-surface-border">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 text-navy-800">
                      {selectedOrder.recordNo}
                    </span>
                    <span className="font-mono text-xs text-ink-muted">
                      Order #{selectedOrder.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedOrder.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : selectedOrder.status === 'Draft'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-primary-50 text-navy-800'
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-ink-primary mt-2">
                    {selectedOrder.testName}
                  </h2>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Seafarer: <strong>{selectedOrder.patientName}</strong> · Requested by:{' '}
                    <strong>{selectedOrder.orderedBy}</strong> ({selectedOrder.orderedAt})
                  </p>
                  {selectedPatient?.rmp && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-canvas border border-surface-border font-medium text-ink-primary">
                        Duty Category: {selectedPatient.rmp.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-canvas border border-surface-border font-medium text-ink-secondary">
                        {selectedPatient.rmp.lookoutRequired
                          ? 'Lookout duties required'
                          : 'Non-lookout role'}
                      </span>
                    </div>
                  )}
                </div>

                {canOpenDoctorChart && (
                  <Link
                    to={`/doctor/patients/${selectedOrder.recordNo}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border-strong bg-white hover:bg-surface-canvas text-xs font-semibold text-ink-primary shrink-0"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-primary-600" />
                    <span>Open RMP Chart</span>
                  </Link>
                )}
              </div>

              {/* Examining RMP Clinical Instruction Box (RQF-403-01) */}
              <div className="p-4 rounded-xl bg-primary-50/70 border border-primary-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-navy-800">
                  <ClipboardList className="w-4 h-4 text-primary-600" aria-hidden="true" />
                  <span>Examining RMP Instruction (RQF-403-01)</span>
                </div>
                <p className="text-xs text-ink-primary leading-relaxed">
                  {selectedOrder.clinicalInstruction ||
                    `Perform ${selectedOrder.testName} according to standard STCW Regulation I/9 protocol and submit objective values to the examining practitioner.`}
                </p>
              </div>

              {/* Confidentiality & RQP-303 Non-Interpretation Guard */}
              <div className="p-3.5 rounded-xl bg-surface-canvas border border-surface-border flex items-start gap-2.5 text-xs text-ink-secondary">
                <Lock className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
                <span>
                  {department === 'ENT & Audiology' || department === 'Eye Clinic' ? (
                    <>
                      <strong>RQP-303 §7.2.2 Delegation Rule:</strong> Support staff record objective
                      measurements only and <strong>must not</strong> inform the seafarer whether the
                      result passes or fails. The RMP&apos;s diagnosis remains restricted.
                    </>
                  ) : (
                    <>
                      <strong>Restricted Scope (QA-P-808):</strong> Attending physician&apos;s
                      clinical notes and diagnosis are hidden. Only the test order, duty category,
                      and RQF-403-01 instruction are shown.
                    </>
                  )}
                </span>
              </div>

              {/* Result Entry Form */}
              <form onSubmit={handlePublishResult} className="space-y-4">
                {department === 'Eye Clinic' && (
                  <div className="space-y-4 p-4 rounded-xl bg-surface-canvas/70 border border-surface-border">
                    <div className="text-xs font-semibold text-ink-primary">
                      STCW Table A-I/9 Vision &amp; Colour Measurements (RQF-603-01)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <span className="font-semibold text-ink-secondary block">
                          Distance Visual Acuity — Unaided (Decimal)
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {(['right', 'left', 'both'] as const).map((eye) => (
                            <div key={eye}>
                              <label className="text-[11px] text-ink-muted capitalize block mb-1">
                                {eye}
                              </label>
                              <select
                                value={unaided[eye]}
                                onChange={(e) => setUnaided({ ...unaided, [eye]: e.target.value })}
                                className="w-full h-9 rounded-lg border border-surface-border-strong bg-white px-2 text-xs font-mono"
                              >
                                {DECIMAL_OPTIONS.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="font-semibold text-ink-secondary block">
                          Distance Visual Acuity — Aided (Decimal)
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {(['right', 'left', 'both'] as const).map((eye) => (
                            <div key={eye}>
                              <label className="text-[11px] text-ink-muted capitalize block mb-1">
                                {eye}
                              </label>
                              <select
                                value={aided[eye]}
                                onChange={(e) => setAided({ ...aided, [eye]: e.target.value })}
                                className="w-full h-9 rounded-lg border border-surface-border-strong bg-white px-2 text-xs font-mono"
                              >
                                {DECIMAL_OPTIONS.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-ink-secondary mb-1">
                          Colour Vision Test Method
                        </label>
                        <input
                          type="text"
                          value={colourMethod}
                          onChange={(e) => setColourMethod(e.target.value)}
                          className="w-full rounded-xl border border-surface-border-strong bg-white px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-ink-secondary mb-1">
                          Ishihara / CIE Colour Outcome
                        </label>
                        <select
                          value={colourCie}
                          onChange={(e) => setColourCie(e.target.value as CieStandard)}
                          className="w-full rounded-xl border border-surface-border-strong bg-white px-3 py-2 text-xs font-medium"
                        >
                          {CIE_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visualAidsRequired}
                          onChange={(e) => setVisualAidsRequired(e.target.checked)}
                          className="rounded border-surface-border-strong"
                        />
                        <span>Visual aids required</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={nearVisionMet}
                          onChange={(e) => setNearVisionMet(e.target.checked)}
                          className="rounded border-surface-border-strong"
                        />
                        <span>Near vision N5/N8 met</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={intermediateVisionMet}
                          onChange={(e) => setIntermediateVisionMet(e.target.checked)}
                          className="rounded border-surface-border-strong"
                        />
                        <span>Intermediate met</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visualFieldsNormal}
                          onChange={(e) => setVisualFieldsNormal(e.target.checked)}
                          className="rounded border-surface-border-strong"
                        />
                        <span>Visual fields normal</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={nightVisionNormal}
                          onChange={(e) => setNightVisionNormal(e.target.checked)}
                          className="rounded border-surface-border-strong"
                        />
                        <span>Night vision normal</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={diplopiaAbsent}
                          onChange={(e) => setDiplopiaAbsent(e.target.checked)}
                          className="rounded border-surface-border-strong"
                        />
                        <span>No diplopia</span>
                      </label>
                    </div>
                  </div>
                )}

                {department === 'ENT & Audiology' && (
                  <div className="space-y-4 p-4 rounded-xl bg-surface-canvas/70 border border-surface-border">
                    <div className="text-xs font-semibold text-ink-primary">
                      Pure-Tone Unaided Audiometry Thresholds in dB (RQW-006)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <span className="font-semibold text-ink-secondary block">Right Ear (dB)</span>
                        <div className="grid grid-cols-4 gap-2">
                          {(['hz500', 'hz1000', 'hz2000', 'hz3000'] as const).map((freq) => (
                            <div key={freq}>
                              <label className="text-[10px] text-ink-muted block mb-1">
                                {freq.replace('hz', '')}Hz
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={110}
                                value={audioRight[freq]}
                                onChange={(e) =>
                                  setAudioRight({ ...audioRight, [freq]: Number(e.target.value) })
                                }
                                className="w-full h-9 rounded-lg border border-surface-border-strong bg-white px-2 text-xs font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="font-semibold text-ink-secondary block">Left Ear (dB)</span>
                        <div className="grid grid-cols-4 gap-2">
                          {(['hz500', 'hz1000', 'hz2000', 'hz3000'] as const).map((freq) => (
                            <div key={freq}>
                              <label className="text-[10px] text-ink-muted block mb-1">
                                {freq.replace('hz', '')}Hz
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={110}
                                value={audioLeft[freq]}
                                onChange={(e) =>
                                  setAudioLeft({ ...audioLeft, [freq]: Number(e.target.value) })
                                }
                                className="w-full h-9 rounded-lg border border-surface-border-strong bg-white px-2 text-xs font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={speechClear}
                        onChange={(e) => setSpeechClear(e.target.checked)}
                        className="rounded border-surface-border-strong"
                      />
                      <span>Whispered / conversational speech test clear &amp; distinct</span>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    {department === 'Laboratory'
                      ? 'Quantitative / Qualitative Laboratory Findings *'
                      : department === 'Radiology'
                      ? 'Radiological Impression & Imaging Findings *'
                      : 'Additional Objective Observations (Optional)'}
                  </label>
                  <textarea
                    rows={department === 'Laboratory' || department === 'Radiology' ? 4 : 2}
                    required={department === 'Laboratory' || department === 'Radiology'}
                    value={findingsInput}
                    onChange={(e) => setFindingsInput(e.target.value)}
                    className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2.5 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Enter structured observations..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1">
                      Reference Interval / Standard
                    </label>
                    <input
                      type="text"
                      value={referenceInput}
                      onChange={(e) => setReferenceInput(e.target.value)}
                      className="w-full rounded-xl border border-surface-border-strong px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1">
                      Instrument / Technician Remarks
                    </label>
                    <input
                      type="text"
                      value={remarksInput}
                      onChange={(e) => setRemarksInput(e.target.value)}
                      className="w-full rounded-xl border border-surface-border-strong px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                {/* Scanned Report / Audiogram / Printout File Upload */}
                <div className="p-4 rounded-xl bg-surface-canvas/80 border border-dashed border-surface-border-strong flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 text-xs">
                    <div className="font-semibold text-ink-primary flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary-600" aria-hidden="true" />
                      <span>Upload Scanned Report / Audiogram / Film (PDF or Image)</span>
                    </div>
                    {selectedOrder.attachmentName ? (
                      <div className="text-[11px]">
                        Attached:{' '}
                        <a
                          href={`/api/orders/${selectedOrder.id}/attachment`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary-700 hover:underline"
                        >
                          {selectedOrder.attachmentName}
                        </a>
                      </div>
                    ) : (
                      <div className="text-[11px] text-ink-muted">
                        Accepted formats: PDF, PNG, JPEG, WebP (up to 10 MB)
                      </div>
                    )}
                  </div>

                  <label className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white border border-surface-border-strong hover:bg-surface-canvas text-xs font-semibold text-ink-primary shadow-card cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 text-primary-600" aria-hidden="true" />
                    <span>
                      {uploading
                        ? 'Uploading...'
                        : selectedOrder.attachmentName
                        ? 'Replace File'
                        : 'Choose File'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      disabled={uploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Save draft & Publish */}
                <div className="pt-4 border-t border-surface-border flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-ink-muted flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-primary-600" />
                    <span>
                      Stamped as:{' '}
                      <strong className="text-ink-primary">
                        {currentUser?.fullName} ({currentUser?.roleTitle})
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-surface-border-strong bg-white hover:bg-surface-canvas text-ink-primary text-xs font-semibold"
                    >
                      <Save className="w-4 h-4 text-ink-muted" />
                      <span>Save draft</span>
                    </button>

                    <button
                      type="submit"
                      disabled={publishing}
                      className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-navy-800 hover:bg-navy-900 disabled:opacity-60 text-white text-xs font-semibold shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>{publishing ? 'Publishing...' : 'Publish to RMP'}</span>
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
        subtitle="Register new instruments with model number and calibration dates, or update status"
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
              placeholder="Equipment Name (e.g. Illuminated Snellen Chart & D65 Lamp)"
              value={eqName}
              onChange={(e) => setEqName(e.target.value)}
              className="w-full rounded-xl border border-surface-border-strong px-3 py-2 text-xs"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Manufacturer (e.g. Keeler)"
                value={eqMfg}
                onChange={(e) => setEqMfg(e.target.value)}
                className="w-full rounded-xl border border-surface-border-strong px-3 py-2 text-xs"
              />
              <input
                type="text"
                required
                placeholder="Model No. *"
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
