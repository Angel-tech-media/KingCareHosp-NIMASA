import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
  BellRing,
  ShieldCheck,
  UserCheck,
  Eye,
  Pencil,
  FileText,
  Clock,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { ClinicalNoteType } from '../../types';
import { PageHeader, Tabs, TabItem, ComplianceDetails } from '../../components/ui';
import { OrderDepartment, OrderTestsModal, SampleTestCatalogItem } from './OrderTestsModal';
import { RmpExaminationPanel } from './RmpExaminationPanel';

type PatientChartTab = 'EXAM' | 'INVESTIGATIONS' | 'NOTES' | 'TRAIL';

export const DoctorPatientPage: React.FC = () => {
  const { recordNo } = useParams<{ recordNo: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    patients,
    activeRole,
    currentUser,
    startFirstAssessment,
    addClinicalNote,
    logRestrictedRecordAccess,
    orderTests,
    updateOrderInstruction,
    uploadOrderAttachment,
  } = useHospital();

  const isAdmin = activeRole === 'ADMIN';
  const patient = patients.find((p) => p.recordNo === recordNo) || patients[0];

  const requestedTab = searchParams.get('tab');
  const initialTab: PatientChartTab =
    requestedTab === 'NOTES' ||
    requestedTab === 'INVESTIGATIONS' ||
    requestedTab === 'TRAIL' ||
    requestedTab === 'EXAM'
      ? requestedTab
      : 'EXAM';

  const [activeTab, setActiveTab] = useState<PatientChartTab>(initialTab);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingInstructionText, setEditingInstructionText] = useState('');

  const clinicalNotes = patient?.clinicalNotes || [];
  const defaultNoteType: ClinicalNoteType = isAdmin
    ? 'Peer Review'
    : clinicalNotes.length === 0
    ? 'Initial Examination'
    : 'Handover / Addendum';

  const [noteType, setNoteType] = useState<ClinicalNoteType>(defaultNoteType);
  const [shortSummary, setShortSummary] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    if (
      requestedTab === 'NOTES' ||
      requestedTab === 'INVESTIGATIONS' ||
      requestedTab === 'TRAIL' ||
      requestedTab === 'EXAM'
    ) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    if (!patient) return;
    setNoteType(
      isAdmin
        ? 'Peer Review'
        : (patient.clinicalNotes?.length || 0) === 0
        ? 'Initial Examination'
        : 'Handover / Addendum'
    );
    setShortSummary('');
    setNoteContent('');
  }, [patient?.id, isAdmin]);

  useEffect(() => {
    if (!patient || activeTab !== 'NOTES') return;
    void logRestrictedRecordAccess(
      patient.id,
      isAdmin
        ? 'Medical Director / Peer Review (RQP-304)'
        : 'Practitioner Clinical & Handover Review'
    );
  }, [patient?.id, activeTab, isAdmin, logRestrictedRecordAccess]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const publishedOrders = patient.orders.filter((o) => o.status === 'Published');
  const rmp = patient.rmp;

  const handleSelectTab = (next: PatientChartTab) => {
    setActiveTab(next);
    if (next === 'EXAM') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: next }, { replace: true });
    }
  };

  const handleFileClinicalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      showToast('Please enter your clinical findings or review note before filing.');
      return;
    }
    setSavingNote(true);
    try {
      await addClinicalNote(patient.id, {
        noteType,
        summary: shortSummary.trim() || undefined,
        content: noteContent.trim(),
      });
      setNoteContent('');
      setShortSummary('');
      if (!isAdmin) {
        setNoteType('Handover / Addendum');
      }
      showToast(`Signed "${noteType}" permanently added to ${patient.recordNo} clinical file.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save clinical note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleConfirmTestOrders = async (
    selectedTests: SampleTestCatalogItem[],
    instructionsByDept: Record<OrderDepartment, string>
  ) => {
    await orderTests(
      patient.id,
      selectedTests.map((t) => ({
        category: t.category,
        testName: t.testName,
        department: t.department,
        referenceRange: t.referenceRange,
        clinicalInstruction: (instructionsByDept[t.department] || '').trim(),
      }))
    );
    handleSelectTab('INVESTIGATIONS');
    showToast(`Ordered ${selectedTests.length} investigation(s) with department instructions.`);
  };

  const handleSaveEditedInstruction = async (orderId: string) => {
    await updateOrderInstruction(orderId, editingInstructionText.trim());
    setEditingOrderId(null);
    showToast('Updated clinical instruction for receiving department.');
  };

  const determinationStyle =
    rmp?.determination === 'Fit'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : rmp?.determination === 'Fit with limitation'
      ? 'bg-amber-50 text-amber-900 border-amber-200'
      : rmp?.determination === 'Not fit'
      ? 'bg-red-50 text-red-800 border-red-200'
      : 'bg-slate-100 text-slate-700 border-slate-300';

  const tabs: TabItem<PatientChartTab>[] = [
    { id: 'EXAM', label: 'Examination' },
    {
      id: 'INVESTIGATIONS',
      label: 'Investigations & Instructions',
      count: patient.orders.length,
    },
    {
      id: 'NOTES',
      label: 'Clinical Case File & Notes',
      count: clinicalNotes.length,
    },
    { id: 'TRAIL', label: 'Trail', count: patient.timeline.length },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & NIMASA Preview Link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/doctor"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Seafarer Queue</span>
        </Link>

        {isAdmin && (
          <Link
            to={`/nimasa/patients/${patient.recordNo}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 hover:underline"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>NIMASA Oversight View ({patient.recordNo})</span>
          </Link>
        )}
      </div>

      {/* Live Toast */}
      {feedbackToast && (
        <div
          role="status"
          className="px-4 py-3 rounded bg-navy-900 text-white text-xs font-medium flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            {feedbackToast}
          </span>
          <span className="text-slate-300 text-[11px] hidden sm:inline">
            Stamped by {currentUser?.fullName || 'Examining RMP'}
          </span>
        </div>
      )}

      {/* Results Ready Banner (Quiet) */}
      {publishedOrders.length > 0 && rmp?.determination === 'Pending' && (
        <div className="px-4 py-3 rounded bg-primary-50/70 border border-primary-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-4 h-4 text-primary-700 shrink-0" aria-hidden="true" />
            <span className="text-ink-primary">
              <strong>Results ready:</strong>{' '}
              {publishedOrders.map((o) => o.testName).join(', ')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('INVESTIGATIONS')}
            className="text-primary-700 font-semibold hover:underline"
          >
            Review results ({publishedOrders.length})
          </button>
        </div>
      )}

      {/* Clean Decluttered Seafarer Header + Single-Line Vitals */}
      <div className="bg-surface-card border border-surface-border rounded p-6 space-y-4">
        <PageHeader
          title={patient.fullName}
          subtitle={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
              <span className="font-mono font-semibold text-primary-700">
                {patient.recordNo}
              </span>
              <span>·</span>
              <span>{rmp?.category || 'Seafarer'}</span>
              {rmp?.entryExam && (
                <>
                  <span>·</span>
                  <span className="text-navy-800 font-semibold">Entry / Recruit Exam</span>
                </>
              )}
              <span>·</span>
              <span>
                {patient.gender} · DOB {patient.dob} · {rmp?.nationality || 'Nigerian'}
              </span>
              <span>·</span>
              <span className="font-mono">{rmp?.idNumber || 'ID Verified'}</span>
              {rmp?.isUnder18 && (
                <>
                  <span>·</span>
                  <span className="text-amber-800 font-medium">Under 18 (1-yr cap)</span>
                </>
              )}
            </span>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              {rmp && (
                <span
                  className={`px-2.5 py-1 rounded text-xs font-semibold border ${determinationStyle}`}
                >
                  {rmp.determination}
                </span>
              )}

              {patient.status === 'Active' &&
                (patient.currentStage === 'Registered' ||
                  patient.currentStage === 'Awaiting doctor') && (
                  <button
                    type="button"
                    onClick={() => {
                      startFirstAssessment(patient.id);
                      showToast('Started STCW Reg. I/9 medical fitness examination.');
                    }}
                    className="h-9 px-3.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                  >
                    Start Examination
                  </button>
                )}

              {activeTab !== 'NOTES' && (
                <button
                  type="button"
                  onClick={() => handleSelectTab('NOTES')}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-surface-border-strong bg-white hover:bg-surface-canvas text-ink-primary text-xs font-semibold transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-primary-700" aria-hidden="true" />
                  <span>
                    Clinical File ({clinicalNotes.length})
                  </span>
                </button>
              )}

              {patient.status === 'Active' && (
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
                >
                  <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Order Investigations</span>
                </button>
              )}
            </div>
          }
        />

        {/* Quiet Single-Line Vitals Strip */}
        <div className="pt-3 border-t border-surface-border flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-muted">
          <span>
            BP <strong className="text-ink-primary font-mono">{patient.vitals.bp}</strong>
          </span>
          <span>
            Temp <strong className="text-ink-primary font-mono">{patient.vitals.temp}</strong>
          </span>
          <span>
            Pulse <strong className="text-ink-primary font-mono">{patient.vitals.pulse}</strong>
          </span>
          <span>
            SpO₂ <strong className="text-ink-primary font-mono">{patient.vitals.spo2}</strong>
          </span>
          <span>
            Weight <strong className="text-ink-primary font-mono">{patient.vitals.weight}</strong>
          </span>
        </div>
      </div>

      {/* 4 Clean Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleSelectTab}
        ariaLabel="Seafarer clinical chart tabs"
      />

      {/* TAB 1: EXAMINATION (4-Step Stepper) */}
      {activeTab === 'EXAM' && (
        <RmpExaminationPanel patient={patient} onFeedback={showToast} />
      )}

      {/* TAB 2: INVESTIGATIONS (Unified Orders + Published Results) */}
      {activeTab === 'INVESTIGATIONS' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">
                Diagnostic Orders &amp; Published Results
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                All required investigations must be published before a medical certificate can be issued (30-day cap).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <>
                  <Link
                    to="/eye"
                    className="h-8 px-3 rounded-xl border border-surface-border-strong bg-white hover:bg-surface-canvas inline-flex items-center text-xs font-medium text-ink-secondary"
                  >
                    Eye Clinic
                  </Link>
                  <Link
                    to="/ent"
                    className="h-8 px-3 rounded-xl border border-surface-border-strong bg-white hover:bg-surface-canvas inline-flex items-center text-xs font-medium text-ink-secondary"
                  >
                    ENT &amp; Audiology
                  </Link>
                  <Link
                    to="/lab"
                    className="h-8 px-3 rounded-xl border border-surface-border-strong bg-white hover:bg-surface-canvas inline-flex items-center text-xs font-medium text-ink-secondary"
                  >
                    Laboratory
                  </Link>
                  <Link
                    to="/radiology"
                    className="h-8 px-3 rounded-xl border border-surface-border-strong bg-white hover:bg-surface-canvas inline-flex items-center text-xs font-medium text-ink-secondary"
                  >
                    Radiology
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(true)}
                className="h-8 px-3.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold"
              >
                + Order Tests &amp; Instructions
              </button>
            </div>
          </div>

          {patient.orders.length === 0 ? (
            <div className="p-10 text-center rounded border border-dashed border-surface-border-strong bg-surface-card text-sm text-ink-muted">
              No diagnostic investigations ordered for this seafarer.
            </div>
          ) : (
            <div className="bg-surface-card border border-surface-border rounded divide-y divide-surface-border">
              {patient.orders.map((ord) => (
                <div key={ord.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-semibold text-sm text-ink-primary">
                        {ord.testName}
                      </span>
                      <span className="font-mono text-xs text-ink-muted">{ord.id}</span>
                      <span className="text-xs text-ink-muted">
                        · {ord.department} ({ord.category})
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        ord.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : ord.status === 'Draft'
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  {editingOrderId === ord.id ? (
                    <div className="p-3.5 rounded-xl bg-primary-50/50 border border-primary-200 space-y-2.5 text-xs">
                      <label className="block font-semibold text-navy-800">
                        Instruction for {ord.department}
                      </label>
                      <textarea
                        rows={2}
                        value={editingInstructionText}
                        onChange={(e) => setEditingInstructionText(e.target.value)}
                        placeholder={`Write examination instruction for ${ord.department} (keep confidential diagnoses private)...`}
                        className="w-full rounded-xl border border-surface-border-strong bg-white px-3 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingOrderId(null)}
                          className="h-8 px-3 rounded-xl border border-surface-border-strong bg-white text-xs font-medium text-ink-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditedInstruction(ord.id)}
                          className="h-8 px-3.5 rounded-xl bg-navy-800 text-white text-xs font-semibold"
                        >
                          Save Instruction
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3.5 py-2.5 rounded-xl bg-primary-50/60 border border-primary-100 text-xs text-ink-secondary flex items-start justify-between gap-3">
                      <div>
                        <strong className="text-navy-800">
                          Instruction for {ord.department}:
                        </strong>{' '}
                        {ord.clinicalInstruction || 'No specific instruction added yet.'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOrderId(ord.id);
                          setEditingInstructionText(ord.clinicalInstruction || '');
                        }}
                        className="inline-flex items-center gap-1 text-primary-700 font-semibold hover:underline shrink-0"
                      >
                        <Pencil className="w-3 h-3" aria-hidden="true" />
                        <span>{ord.clinicalInstruction ? 'Edit' : 'Add Instruction'}</span>
                      </button>
                    </div>
                  )}

                  {ord.status === 'Published' ? (
                    <div className="p-3.5 rounded-xl bg-surface-canvas border border-surface-border text-xs space-y-1.5">
                      <div className="font-medium text-ink-primary">
                        {ord.publishedResult}
                      </div>
                      <div className="text-ink-muted flex flex-wrap gap-x-4 gap-y-1">
                        <span>Ref: {ord.referenceRange || 'N/A'}</span>
                        <span>Verified by {ord.completedBy} · {ord.publishedAt}</span>
                      </div>
                      {ord.scientistRemarks && (
                        <div className="text-ink-secondary">Note: {ord.scientistRemarks}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-ink-muted">
                      Ordered {ord.orderedAt} — awaiting publication from {ord.department}.
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    {ord.attachmentName ? (
                      <a
                        href={`/api/orders/${ord.id}/attachment`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-primary-700 hover:underline"
                      >
                        <span>View Uploaded Report ({ord.attachmentName})</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-ink-muted">No report file attached</span>
                    )}

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border-strong bg-white hover:bg-surface-canvas text-xs font-medium text-ink-secondary cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          try {
                            await uploadOrderAttachment(ord.id, file);
                            showToast(`Attached report "${file.name}" to ${ord.testName}.`);
                          } catch (err) {
                            showToast(
                              err instanceof Error ? err.message : 'Failed to upload attachment.'
                            );
                          }
                        }}
                      />
                      <span>
                        {ord.attachmentName ? 'Replace Report (PDF/Image)' : 'Upload External / Scanned Report'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CHRONOLOGICAL CLINICAL CASE FILE & RECORD COMPLETENESS */}
      {activeTab === 'NOTES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Chronological Case File History (Read-Only Permanent Entries) */}
            <div className="p-5 rounded-2xl border border-surface-border bg-surface-card space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-700" aria-hidden="true" />
                    <span>Confidential Clinical Case File &amp; Handover History</span>
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Complete chronological filing across all examining doctors and peer reviewers. Earlier entries are permanently preserved and never overwritten.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-800 text-xs font-semibold">
                  {clinicalNotes.length} {clinicalNotes.length === 1 ? 'Signed Entry' : 'Signed Entries'}
                </span>
              </div>

              <ComplianceDetails
                label="View clinical privacy & multi-doctor access rules"
                items={[
                  {
                    code: 'RQP-802 §7.2.1 & Annex B (R-17)',
                    description:
                      'Authorises covering practitioners in the practice and the Medical Director to access full clinical records for continuity of care, filing, and peer review — with every access automatically logged in RQR-802-01.',
                  },
                  {
                    code: 'RQP-801',
                    description:
                      'Requires permanent, tamper-evident retention of examination notes (10-year statutory retention) without overwriting prior practitioners’ findings.',
                  },
                  {
                    code: 'QA-P-808',
                    description:
                      'Strictly hidden from Reception, Eye Clinic, ENT, Laboratory, Radiology, employers, and NIMASA sponsor views.',
                  },
                ]}
              />

              {clinicalNotes.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-surface-border-strong bg-surface-canvas text-center text-xs text-ink-muted">
                  No clinical notes have been filed for {patient.fullName} yet. Use the form below to file the first signed examination note.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {clinicalNotes.map((entry, idx) => {
                    const badgeStyle =
                      entry.noteType === 'Peer Review'
                        ? 'bg-purple-50 text-purple-900 border-purple-200'
                        : entry.noteType === 'Follow-Up Review'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : entry.noteType === 'Handover / Addendum'
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-primary-50 text-primary-800 border-primary-200';

                    return (
                      <article
                        key={entry.id}
                        className="p-4 rounded-xl border border-surface-border bg-surface-canvas space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-ink-muted">
                              #{idx + 1}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}
                            >
                              {entry.noteType}
                            </span>
                            <span className="text-xs font-semibold text-ink-primary">
                              {entry.authorName}
                            </span>
                            {entry.authorLicense && (
                              <span className="font-mono text-xs text-primary-700">
                                ({entry.authorLicense})
                              </span>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs text-ink-muted font-mono">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {entry.createdAt}
                          </span>
                        </div>

                        {entry.summary && (
                          <div className="text-xs text-ink-secondary bg-white px-3 py-1.5 rounded-lg border border-surface-border">
                            <strong className="text-ink-primary">Stage Summary:</strong>{' '}
                            {entry.summary}
                          </div>
                        )}

                        <div className="text-sm text-ink-primary whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-lg border border-surface-border">
                          {entry.content}
                        </div>

                        <div className="text-xs text-ink-muted">
                          Signed by {entry.authorName} · {entry.authorRole}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Append New Signed Entry Form */}
            <form
              onSubmit={handleFileClinicalNote}
              className="p-5 rounded-2xl border border-surface-border bg-surface-card space-y-4"
            >
              <div>
                <h2 className="text-base font-semibold text-ink-primary">
                  Add Signed Entry to Clinical File
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Appends a new signed note under{' '}
                  <strong className="text-ink-secondary">
                    {currentUser?.fullName || 'Examining Practitioner'}
                  </strong>
                  {currentUser?.licenseNo ? ` (${currentUser.licenseNo})` : ''} without altering any previous doctor&apos;s notes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">
                    Note Category
                  </label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as ClinicalNoteType)}
                    className="w-full h-10 rounded-xl border border-surface-border-strong bg-white px-3 text-xs font-medium text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
                  >
                    <option value="Initial Examination">
                      Initial Examination (First Consultation)
                    </option>
                    <option value="Handover / Addendum">
                      Handover / Addendum (Additional or Minor Finding)
                    </option>
                    <option value="Follow-Up Review">
                      Follow-Up Review (Post-Investigation Review)
                    </option>
                    <option value="Peer Review">
                      Peer Review / Medical Director Audit Note
                    </option>
                  </select>
                </div>

                {noteType !== 'Peer Review' && (
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1">
                      Stage Summary (Optional Non-Clinical Status)
                    </label>
                    <input
                      type="text"
                      value={shortSummary}
                      onChange={(e) => setShortSummary(e.target.value)}
                      placeholder="e.g., Initial exam recorded; awaiting Eye & Lab results"
                      className="w-full h-10 rounded-xl border border-surface-border-strong px-3 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">
                  {noteType === 'Peer Review'
                    ? 'Medical Director / Peer Review Clinical Commentary (Confidential)'
                    : 'Confidential Clinical Findings, Diagnosis & Handover Notes'}
                </label>
                <textarea
                  rows={5}
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder={
                    noteType === 'Handover / Addendum'
                      ? 'Record incidental or minor clinical findings, handover context for a covering doctor, or follow-up observations...'
                      : noteType === 'Peer Review'
                      ? 'Record peer-review observations, consistency verification against STCW fitness standards, or Medical Director audit sign-off...'
                      : 'Record full clinical history, physical examination findings, differential diagnosis, and clinical reasoning...'
                  }
                  className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2.5 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-xs text-ink-muted">
                  Restricted access is logged automatically in the hospital Access Log.
                </span>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="h-10 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                >
                  {savingNote ? 'Filing Signed Note...' : `File Signed ${noteType}`}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="p-5 rounded-2xl border border-surface-border bg-surface-card space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  Examination Checklist
                </h2>
              </div>
              <p className="text-xs text-ink-muted">
                Verify all required clinical steps are complete before closing the chart.
              </p>
              <ul className="divide-y divide-surface-border text-xs">
                {[
                  {
                    label: '1. Photo ID & live photograph verified',
                    done: Boolean(rmp?.idVerifiedOriginal && rmp?.photoCaptured),
                  },
                  {
                    label: '2. Health declaration signed',
                    done: Boolean(rmp?.healthDeclarationSigned),
                  },
                  {
                    label: '3. Shipboard role & duties recorded',
                    done: Boolean(rmp?.category),
                  },
                  {
                    label: '4. Medical fitness criteria confirmed',
                    done: Boolean(rmp?.statutoryCriteria),
                  },
                  {
                    label: '5. Vision, colour & hearing recorded',
                    done: Boolean(rmp?.visionHearing),
                  },
                  {
                    label: '6. Department test results published',
                    done: patient.orders.every((o) => o.status === 'Published'),
                  },
                  {
                    label: '7. Final fitness decision recorded',
                    done: rmp?.determination !== 'Pending',
                  },
                  {
                    label: '8. Appeal rights notice issued (if limited/unfit)',
                    done: rmp?.determination === 'Fit' || Boolean(rmp?.rightOfReview),
                  },
                  {
                    label: '9. Medical certificate issued',
                    done:
                      rmp?.determination === 'Not fit' || Boolean(rmp?.issuedCertificate),
                  },
                ].map((row) => (
                  <li key={row.label} className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-ink-secondary">{row.label}</span>
                    <span
                      className={`text-xs font-semibold shrink-0 ${
                        row.done ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {row.done ? 'Complete' : 'Pending'}
                    </span>
                  </li>
                ))}
              </ul>

              <ComplianceDetails
                label="View NIMASA audit form codes"
                items={[
                  { code: 'RQF-601-01 / 02', description: 'Identity gate & health declaration' },
                  { code: 'QAF-804-01', description: 'Confidential examination record' },
                  { code: 'RQF-403-01', description: 'Department & specialist referral instruction' },
                  { code: 'QAF-804-02', description: 'Right of review notification' },
                  { code: 'QAF-805-01', description: 'STCW Seafarer Medical Certificate' },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ELECTRONIC TRAIL */}
      {activeTab === 'TRAIL' && (
        <div className="bg-surface-card border border-surface-border rounded divide-y divide-surface-border">
          {patient.timeline.map((t, i) => (
            <div
              key={`${t.stage}-${i}`}
              className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="font-semibold text-ink-primary">{t.stage}</span>
                  <span className="font-mono text-ink-muted">{t.reachedAt}</span>
                </div>
                <p className="text-xs text-ink-secondary">{t.publicSummary}</p>
              </div>
              <div className="text-xs text-ink-muted flex items-center gap-1.5 shrink-0">
                <UserCheck className="w-3.5 h-3.5 text-primary-700" aria-hidden="true" />
                <span>
                  <strong className="text-ink-secondary">{t.actorName}</strong> ({t.actorRole})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <OrderTestsModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        patientName={patient.fullName}
        recordNo={patient.recordNo}
        onConfirmOrders={handleConfirmTestOrders}
      />
    </div>
  );
};
