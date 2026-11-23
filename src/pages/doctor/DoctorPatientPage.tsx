import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
  BedDouble,
  BellRing,
  FileText,
  Pill,
  LogOut,
  ShieldCheck,
  Clock,
  MapPin,
  Plus,
  UserCheck,
  Eye,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { StageChip, StatusChip } from '../../components/ui/StageChip';
import { OrderTestsModal, SampleTestCatalogItem } from './OrderTestsModal';
import { RmpExaminationPanel } from './RmpExaminationPanel';

type PatientChartTab = 'RMP_EXAM' | 'SUMMARY' | 'NOTES' | 'ORDERS' | 'RESULTS' | 'TRAIL';

export const DoctorPatientPage: React.FC = () => {
  const { recordNo } = useParams<{ recordNo: string }>();
  const {
    patients,
    startFirstAssessment,
    completeFirstAssessment,
    orderTests,
    admitPatient,
    recordSecondAssessment,
    addMedication,
    dischargePatient,
  } = useHospital();

  const patient = patients.find((p) => p.recordNo === recordNo) || patients[0];

  const [activeTab, setActiveTab] = useState<PatientChartTab>('RMP_EXAM');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Notes form states
  const [shortSummary, setShortSummary] = useState(
    patient.firstAssessmentSummary ||
      'First assessment complete, awaiting diagnostic test results.'
  );
  const [fullNote, setFullNote] = useState(
    patient.firstAssessmentFullNote ||
      'Patient examined in consultation room. Alert, afebrile, systemic examination documented. Proceeding with targeted laboratory/imaging workup.'
  );
  const [secondNote, setSecondNote] = useState(
    patient.secondAssessmentNote ||
      'Reviewed published investigation findings with patient. Clinical response satisfactory.'
  );
  const [dischargeText, setDischargeText] = useState(
    patient.dischargeSummary ||
      'Discharged home in stable clinical condition with outpatient medication and follow-up guidance.'
  );

  // Medication form state
  const [medName, setMedName] = useState('Tab Artemether / Lumefantrine');
  const [medDosage, setMedDosage] = useState('80/480mg');
  const [medFreq, setMedFreq] = useState('Twice daily');
  const [medDuration, setMedDuration] = useState('3 days');

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    setShortSummary(
      patient.firstAssessmentSummary ||
        'First assessment complete, awaiting blood test results.'
    );
    setFullNote(
      patient.firstAssessmentFullNote ||
        'Patient examined in consultation room. Alert, oriented, cardiorespiratory examination normal. Ordering diagnostic workup.'
    );
    setSecondNote(
      patient.secondAssessmentNote ||
        'Reviewed published investigation findings with patient. Clinical picture clear; outpatient treatment prescribed.'
    );
    setDischargeText(
      patient.dischargeSummary ||
        'Discharged home in stable condition. Cleared to resume normal NIMASA duties.'
    );
  }, [patient.id]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const publishedOrders = patient.orders.filter(
    (o) => o.status === 'Published'
  );

  const handleMarkFirstAssessmentComplete = (e: React.FormEvent) => {
    e.preventDefault();
    completeFirstAssessment(patient.id, shortSummary, fullNote);
    showToast(
      'First assessment marked complete — NIMASA timeline & Audit Log updated!'
    );
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
    setActiveTab('ORDERS');
    showToast(
      `Ordered ${selectedTests.length} test(s) — Stage updated to "Tests requested".`
    );
  };

  const handleAdmit = () => {
    admitPatient(patient.id, 'Executive Ward B - Bed 06');
    showToast('Patient admitted to Executive Ward B — Stage updated to "Admitted".');
  };

  const handleSaveSecondAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    recordSecondAssessment(patient.id, secondNote);
    showToast('Second assessment recorded — Stage updated to "Second assessment".');
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;
    addMedication(patient.id, {
      name: medName,
      dosage: medDosage,
      frequency: medFreq,
      duration: medDuration,
    });
    setMedName('');
    showToast('Medication added to patient prescription list.');
  };

  const handleDischarge = (e: React.FormEvent) => {
    e.preventDefault();
    dischargePatient(patient.id, dischargeText);
    showToast('Patient discharged — Status set to Inactive / Discharged.');
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb + Quick Preview Link to NIMASA Stage Page */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/doctor"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Patients Queue</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to={`/nimasa/patients/${patient.recordNo}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Preview NIMASA Timeline for {patient.recordNo}</span>
          </Link>
        </div>
      </div>

      {/* Live Toast Notification */}
      {feedbackToast && (
        <div className="p-3.5 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-medium shadow-md flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {feedbackToast}
          </span>
          <span className="text-[11px] text-emerald-100">
            Stamped by Dr. Babatunde Fashola-Cole
          </span>
        </div>
      )}

      {/* Results Available Notification Banner */}
      {publishedOrders.length > 0 && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-950">
                Results available:{' '}
                {publishedOrders.map((o) => o.testName).join(', ')}
              </p>
              <p className="text-xs text-blue-700">
                Published by {publishedOrders[0].completedBy} at{' '}
                {publishedOrders[0].publishedAt} • Ready for Second Assessment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('RESULTS')}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
          >
            View Published Results ({publishedOrders.length})
          </button>
        </div>
      )}

      {/* Patient Identity Header + Decision Buttons */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {patient.recordNo}
              </span>
              <StageChip stage={patient.currentStage} />
              <StatusChip status={patient.status} />
              {patient.nimasaMember && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  NIMASA Member ({patient.nimasaStaffId})
                </span>
              )}
              {patient.isAdmitted && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  <BedDouble className="w-3.5 h-3.5" />
                  Admitted: {patient.wardRoom}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              {patient.fullName}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>
                {patient.gender} • DOB: {patient.dob}
              </span>
              <span>•</span>
              <span>Phone: {patient.phone}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {patient.currentLocation}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {patient.timeInHospital}
              </span>
            </div>
          </div>

          {/* Primary Clinical Decision Buttons */}
          {patient.status === 'Active' && (
            <div className="flex flex-wrap items-center gap-2.5">
              {(patient.currentStage === 'Registered' ||
                patient.currentStage === 'Awaiting doctor') && (
                <button
                  type="button"
                  onClick={() => {
                    startFirstAssessment(patient.id);
                    showToast('Started first assessment.');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  Start Assessment Now
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOrderModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Send for tests</span>
              </button>

              <button
                type="button"
                onClick={handleAdmit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 text-xs font-semibold shadow-sm transition-colors"
              >
                <BedDouble className="w-4 h-4" />
                <span>
                  {patient.isAdmitted ? 'Update Ward Admission' : 'Admit patient'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Vitals Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">
              Blood Pressure
            </span>
            <span className="text-sm font-bold text-slate-900">
              {patient.vitals.bp}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Temperature</span>
            <span className="text-sm font-bold text-slate-900">
              {patient.vitals.temp}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Pulse Rate</span>
            <span className="text-sm font-bold text-slate-900">
              {patient.vitals.pulse}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">SpO₂</span>
            <span className="text-sm font-bold text-slate-900">
              {patient.vitals.spo2}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Weight</span>
            <span className="text-sm font-bold text-slate-900">
              {patient.vitals.weight}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Tabs: Summary / Notes / Orders / Results / Trail */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 pt-3 flex flex-wrap items-center gap-2 bg-slate-50/60">
          {(
            [
              { id: 'RMP_EXAM', label: 'STCW Reg. I/9 Exam & Cert' },
              { id: 'SUMMARY', label: 'Summary' },
              { id: 'NOTES', label: 'Clinical Notes' },
              {
                id: 'ORDERS',
                label: `Orders (${patient.orders.length})`,
              },
              {
                id: 'RESULTS',
                label: `Results (${publishedOrders.length})`,
              },
              {
                id: 'TRAIL',
                label: `Trail (${patient.timeline.length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TAB 0: STCW REG. I/9 EXAMINATION & CERTIFICATION */}
          {activeTab === 'RMP_EXAM' && (
            <RmpExaminationPanel patient={patient} onFeedback={showToast} />
          )}

          {/* TAB 1: SUMMARY */}
          {activeTab === 'SUMMARY' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Clinical Overview & Sponsor Consent
                </h3>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIMASA Sponsor Member:</span>
                    <span className="font-semibold text-slate-900">
                      {patient.nimasaMember ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Consent to Share Stage Trail:
                    </span>
                    <span className="font-semibold text-emerald-700">
                      {patient.consentToShareWithNimasa
                        ? 'Granted (Stage & Timestamps Only)'
                        : 'Not Shared'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Stage:</span>
                    <span className="font-semibold text-blue-700">
                      {patient.currentStage}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Admission Status:</span>
                    <span className="font-semibold text-slate-900">
                      {patient.isAdmitted
                        ? `Inpatient (${patient.wardRoom})`
                        : 'Outpatient'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    First Assessment Public Summary (Shared on Trail Tooltip)
                  </h4>
                  <p className="text-sm text-slate-800">
                    {patient.firstAssessmentSummary ||
                      'No first assessment summary recorded yet.'}
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-amber-50/40 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Confidential Full Clinical Note (Kingscare Only — Hidden from
                    NIMASA & Lab)
                  </h4>
                  <p className="text-sm text-slate-800">
                    {patient.firstAssessmentFullNote ||
                      'No full clinical note entered yet.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Active Medications & Discharge Status
                </h3>
                {patient.medications.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    No medications prescribed yet. Open the{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('NOTES')}
                      className="text-blue-600 font-semibold underline"
                    >
                      Notes & Discharge
                    </button>{' '}
                    tab to prescribe.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patient.medications.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            {m.name} ({m.dosage})
                          </p>
                          <p className="text-slate-500">
                            {m.frequency} • Duration: {m.duration}
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {m.prescribedAt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {patient.dischargeSummary && (
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Discharge Summary
                    </h4>
                    <p className="text-sm text-emerald-950">
                      {patient.dischargeSummary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NOTES (First assessment, decisions, Second assessment, Medication, Discharge) */}
          {activeTab === 'NOTES' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: First Assessment & Decision Actions */}
              <div className="lg:col-span-7 space-y-6">
                <form
                  onSubmit={handleMarkFirstAssessmentComplete}
                  className="p-5 rounded-lg border border-slate-200 bg-slate-50/40 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h3 className="text-base font-bold text-slate-900">
                        1. First Assessment Form
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      Stamps &quot;First assessment complete&quot;
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Short Stage Summary (Shown on NIMASA Timeline Tooltip)
                    </label>
                    <input
                      type="text"
                      value={shortSummary}
                      onChange={(e) => setShortSummary(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="e.g. First assessment complete, awaiting blood test results"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Clinical Note (Confidential — Held by Kingscare Only;
                      Hidden from NIMASA & Lab)
                    </label>
                    <textarea
                      rows={4}
                      value={fullNote}
                      onChange={(e) => setFullNote(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Detailed presenting complaint, history, physical exam findings, and differential diagnosis..."
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark first assessment complete</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsOrderModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-primary-50 text-primary-700 border border-primary-300 text-xs font-semibold shadow-sm transition-colors"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Send for tests</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAdmit}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 text-xs font-semibold shadow-sm transition-colors"
                      >
                        <BedDouble className="w-3.5 h-3.5" />
                        <span>Admit patient</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Second Assessment Section */}
                <form
                  onSubmit={handleSaveSecondAssessment}
                  className="p-5 rounded-lg border border-slate-200 bg-white space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">
                      2. Second Assessment (Post-Results Review)
                    </h3>
                    <span className="text-xs text-slate-500">
                      Stamps &quot;Second assessment&quot;
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={secondNote}
                    onChange={(e) => setSecondNote(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Interpretation of Lab / Radiology findings and clinical plan..."
                  />

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Mark Second Assessment</span>
                  </button>
                </form>
              </div>

              {/* Right 5 Cols: Medication List & Discharge with Summary */}
              <div className="lg:col-span-5 space-y-6">
                {/* Medication Card */}
                <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-4">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      3. Medication Prescription
                    </h3>
                  </div>

                  <form
                    onSubmit={handleAddMedication}
                    className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Drug Name
                      </label>
                      <input
                        type="text"
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        placeholder="e.g. Tab Amoxicillin-Clavulanate"
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={medDosage}
                          onChange={(e) => setMedDosage(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Frequency
                        </label>
                        <input
                          type="text"
                          value={medFreq}
                          onChange={(e) => setMedFreq(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={medDuration}
                          onChange={(e) => setMedDuration(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Medication to List</span>
                    </button>
                  </form>

                  {/* Existing Meds */}
                  <div className="space-y-2">
                    {patient.medications.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No medications added yet.
                      </p>
                    ) : (
                      patient.medications.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">
                              {m.name}
                            </span>{' '}
                            <span className="text-blue-700 font-semibold">
                              {m.dosage}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              {m.frequency} • {m.duration}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {m.prescribedAt.split(', ')[1]}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Discharge Card */}
                <form
                  onSubmit={handleDischarge}
                  className="p-5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-slate-700" />
                      4. Discharge with Summary
                    </h3>
                    <span className="text-xs text-slate-500">
                      Sets status to Discharged (Inactive)
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={dischargeText}
                    onChange={(e) => setDischargeText(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm"
                    placeholder="Discharge summary and fitness-for-duty note..."
                  />

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Discharge Patient Now</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Diagnostic Test Orders (Laboratory & Radiology)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Admitted and outpatient orders sent to Lab or Radiology.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/lab"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    Go to Laboratory View
                  </Link>
                  <Link
                    to="/radiology"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    Go to Radiology View
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Order More Tests</span>
                  </button>
                </div>
              </div>

              {patient.orders.length === 0 ? (
                <div className="p-8 text-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                  No diagnostic tests ordered for this patient yet. Click{' '}
                  <strong>&quot;Send for tests&quot;</strong> to open the test
                  catalog modal.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Test Name</th>
                        <th className="py-3 px-4">Ordered At</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {patient.orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">
                            {ord.id}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                            {ord.department}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            {ord.category}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {ord.testName}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {ord.orderedAt}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${
                                ord.status === 'Published'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : ord.status === 'Draft'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RESULTS */}
          {activeTab === 'RESULTS' && (
            <div className="space-y-4">
              {publishedOrders.length > 0 && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                  <BellRing className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-bold text-emerald-950">
                      Results available:{' '}
                      {publishedOrders.map((o) => o.testName).join(', ')}
                    </p>
                    <p className="text-emerald-800 text-xs">
                      Verified and released by diagnostic department.
                    </p>
                  </div>
                </div>
              )}

              {publishedOrders.length === 0 ? (
                <div className="p-8 text-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                  No published results yet. Switch to{' '}
                  <Link
                    to="/lab"
                    className="text-blue-600 font-semibold underline"
                  >
                    Laboratory
                  </Link>{' '}
                  or{' '}
                  <Link
                    to="/radiology"
                    className="text-blue-600 font-semibold underline"
                  >
                    Radiology
                  </Link>{' '}
                  in the top role switcher to publish pending orders.
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                            {ord.department} • {ord.category}
                          </span>
                          <h4 className="text-base font-bold text-slate-900">
                            {ord.testName}
                          </h4>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p className="font-semibold text-slate-800">
                            Verified by: {ord.completedBy}
                          </p>
                          <p>Published: {ord.publishedAt}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div className="p-3 rounded-lg bg-white border border-slate-200">
                          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                            Published Findings / Values
                          </span>
                          <p className="font-semibold text-slate-900">
                            {ord.publishedResult}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-slate-200">
                          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                            Reference Range & Scientist Remarks
                          </span>
                          <p className="text-slate-700">
                            <strong>Ref:</strong> {ord.referenceRange || 'N/A'}
                          </p>
                          {ord.scientistRemarks && (
                            <p className="text-slate-500 text-xs mt-1">
                              <strong>Note:</strong> {ord.scientistRemarks}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TRAIL */}
          {activeTab === 'TRAIL' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                Patient Electronic Trail ({patient.recordNo})
              </h3>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {patient.timeline.map((t, i) => (
                  <div
                    key={`${t.stage}-${i}`}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StageChip stage={t.stage} />
                        <span className="text-xs font-semibold text-slate-700">
                          {t.reachedAt}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700">
                        {t.publicSummary}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 shrink-0">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>
                        <strong>{t.actorName}</strong> ({t.actorRole})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Tests Modal */}
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
