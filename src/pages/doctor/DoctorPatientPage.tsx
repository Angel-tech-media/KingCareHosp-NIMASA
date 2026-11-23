import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
  BellRing,
  ShieldCheck,
  UserCheck,
  Eye,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { PageHeader, Tabs, TabItem } from '../../components/ui';
import { OrderTestsModal, SampleTestCatalogItem } from './OrderTestsModal';
import { RmpExaminationPanel } from './RmpExaminationPanel';

type PatientChartTab = 'EXAM' | 'INVESTIGATIONS' | 'NOTES' | 'TRAIL';

export const DoctorPatientPage: React.FC = () => {
  const { recordNo } = useParams<{ recordNo: string }>();
  const {
    patients,
    startFirstAssessment,
    completeFirstAssessment,
    orderTests,
    recordSecondAssessment,
  } = useHospital();

  const patient = patients.find((p) => p.recordNo === recordNo) || patients[0];

  const [activeTab, setActiveTab] = useState<PatientChartTab>('EXAM');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [shortSummary, setShortSummary] = useState(
    patient.firstAssessmentSummary ||
      'Examination in progress; awaiting diagnostic or specialist findings.'
  );
  const [fullNote, setFullNote] = useState(
    patient.firstAssessmentFullNote ||
      'Seafarer examined in private consultation room. Alert, afebrile, systemic examination documented against Section A-I/9.2 criteria.'
  );
  const [secondNote, setSecondNote] = useState(
    patient.secondAssessmentNote ||
      'Reviewed published investigation findings against Table A-I/9 and ILO/IMO Guidelines.'
  );
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    setShortSummary(
      patient.firstAssessmentSummary ||
        'Examination in progress; awaiting diagnostic or specialist findings.'
    );
    setFullNote(
      patient.firstAssessmentFullNote ||
        'Seafarer examined in private consultation room. Alert, oriented, cardiorespiratory examination documented.'
    );
    setSecondNote(
      patient.secondAssessmentNote ||
        'Reviewed published investigation findings against Table A-I/9 and ILO/IMO Guidelines.'
    );
  }, [patient.id]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const publishedOrders = patient.orders.filter((o) => o.status === 'Published');
  const rmp = patient.rmp;

  const handleMarkFirstAssessmentComplete = (e: React.FormEvent) => {
    e.preventDefault();
    completeFirstAssessment(patient.id, shortSummary, fullNote);
    showToast('Confidential examination note saved and stamped.');
  };

  const handleConfirmTestOrders = (selectedTests: SampleTestCatalogItem[]) => {
    orderTests(
      patient.id,
      selectedTests.map((t) => ({
        category: t.category,
        testName: t.testName,
        department: t.department,
        referenceRange: t.referenceRange,
      }))
    );
    setActiveTab('INVESTIGATIONS');
    showToast(`Ordered ${selectedTests.length} investigation(s).`);
  };

  const handleSaveSecondAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    recordSecondAssessment(patient.id, secondNote);
    showToast('Post-referral clinical review recorded.');
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
      label: 'Investigations',
      count: patient.orders.length,
    },
    { id: 'NOTES', label: 'Clinical Notes' },
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

        <Link
          to={`/nimasa/patients/${patient.recordNo}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 hover:underline"
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span>NIMASA Oversight View ({patient.recordNo})</span>
        </Link>
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
            Stamped by Dr. Babatunde Fashola-Cole
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
        onChange={setActiveTab}
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
            <div className="flex items-center gap-2">
              <Link
                to="/lab"
                className="h-8 px-3 rounded border border-surface-border-strong bg-surface-card hover:bg-surface-subtle inline-flex items-center text-xs font-medium text-ink-secondary"
              >
                Laboratory
              </Link>
              <Link
                to="/radiology"
                className="h-8 px-3 rounded border border-surface-border-strong bg-surface-card hover:bg-surface-subtle inline-flex items-center text-xs font-medium text-ink-secondary"
              >
                Radiology
              </Link>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(true)}
                className="h-8 px-3 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold"
              >
                + Order Tests
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

                  {ord.status === 'Published' ? (
                    <div className="p-3.5 rounded bg-surface-canvas border border-surface-border text-xs space-y-1.5">
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLINICAL NOTES & RECORD COMPLETENESS */}
      {activeTab === 'NOTES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <form
              onSubmit={handleMarkFirstAssessmentComplete}
              className="p-5 rounded border border-surface-border bg-surface-card space-y-4"
            >
              <div>
                <h2 className="text-sm font-semibold text-ink-primary">
                  Confidential Clinical Note (QAF-804-01)
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Held strictly by Kingscare under QA-P-808. Hidden from NIMASA &amp; Laboratory.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">
                  Non-Clinical Stage Summary
                </label>
                <input
                  type="text"
                  value={shortSummary}
                  onChange={(e) => setShortSummary(e.target.value)}
                  className="w-full h-9 rounded border border-surface-border-strong px-3 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">
                  Detailed Examination Findings
                </label>
                <textarea
                  rows={4}
                  value={fullNote}
                  onChange={(e) => setFullNote(e.target.value)}
                  className="w-full rounded border border-surface-border-strong px-3 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>

              <button
                type="submit"
                className="h-9 px-4 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
              >
                Save Clinical Note
              </button>
            </form>

            <form
              onSubmit={handleSaveSecondAssessment}
              className="p-5 rounded border border-surface-border bg-surface-card space-y-3"
            >
              <h2 className="text-sm font-semibold text-ink-primary">
                Post-Referral Review Note (RQP-604)
              </h2>
              <textarea
                rows={3}
                value={secondNote}
                onChange={(e) => setSecondNote(e.target.value)}
                className="w-full rounded border border-surface-border-strong px-3 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
              <button
                type="submit"
                className="h-9 px-4 rounded border border-surface-border-strong bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-ink-primary transition-colors"
              >
                Save Post-Referral Review
              </button>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="p-5 rounded border border-surface-border bg-surface-card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  Record Completeness (RQC-801-01)
                </h2>
                <span className="text-[11px] font-mono text-ink-muted">RQP-801</span>
              </div>
              <p className="text-xs text-ink-muted">
                Checked independently within 1 working day for Not Fit / Limited cases (5 days for Fit).
              </p>
              <ul className="divide-y divide-surface-border text-xs">
                {[
                  {
                    label: '1. ID copy & live day photograph (RQF-601-01)',
                    done: Boolean(rmp?.idVerifiedOriginal && rmp?.photoCaptured),
                  },
                  {
                    label: '2. Signed health declaration (RQF-601-02)',
                    done: Boolean(rmp?.healthDeclarationSigned),
                  },
                  {
                    label: '3. Duties & department statement (RQF-503-01)',
                    done: Boolean(rmp?.category),
                  },
                  {
                    label: '4. Examination declarations (QAF-804-01 / RQF-602-01)',
                    done: Boolean(rmp?.statutoryCriteria),
                  },
                  {
                    label: '5. Vision, colour & audiometry signed (RQF-603-01)',
                    done: Boolean(rmp?.visionHearing),
                  },
                  {
                    label: '6. Investigation / specialist reports filed',
                    done: patient.orders.every((o) => o.status === 'Published'),
                  },
                  {
                    label: '7. Determination check complete (RQC-605-01)',
                    done: rmp?.determination !== 'Pending',
                  },
                  {
                    label: '8. Right of review notice (QAF-804-02)',
                    done: rmp?.determination === 'Fit' || Boolean(rmp?.rightOfReview),
                  },
                  {
                    label: '9. Certificate & supplement copies (QAF-805-01)',
                    done:
                      rmp?.determination === 'Not fit' || Boolean(rmp?.issuedCertificate),
                  },
                ].map((row) => (
                  <li key={row.label} className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-ink-secondary">{row.label}</span>
                    <span
                      className={`text-[11px] font-semibold shrink-0 ${
                        row.done ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {row.done ? 'Complete' : 'Pending'}
                    </span>
                  </li>
                ))}
              </ul>
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
