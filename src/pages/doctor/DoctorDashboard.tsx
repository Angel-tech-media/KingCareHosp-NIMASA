import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { PageHeader, Tabs, TabItem } from '../../components/ui';

type DoctorQueueTab = 'AWAITING' | 'IN_ASSESSMENT' | 'RESULTS_READY' | 'ALL_ACTIVE';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    patients,
    startFirstAssessment,
    sessionCheck,
    dailyEquipmentCheck,
    certificateStock,
    confirmSessionCheck,
  } = useHospital();

  const eqPassedCount = dailyEquipmentCheck.items.filter((i) => i.passed).length;
  const eqTotalCount = dailyEquipmentCheck.items.length;
  const assignedBlanksCount = certificateStock.filter(
    (s) => s.status === 'Issued to RMP'
  ).length;

  const [activeTab, setActiveTab] = useState<DoctorQueueTab>('AWAITING');

  const awaitingList = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.status === 'Active' &&
          (p.currentStage === 'Awaiting doctor' || p.currentStage === 'Registered')
      ),
    [patients]
  );

  const inAssessmentList = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.status === 'Active' &&
          (p.currentStage === 'In assessment' ||
            p.currentStage === 'First assessment complete' ||
            p.currentStage === 'Second assessment')
      ),
    [patients]
  );

  const resultsReadyList = useMemo(
    () =>
      patients.filter(
        (p) => p.status === 'Active' && p.currentStage === 'Results ready'
      ),
    [patients]
  );

  const allActiveList = useMemo(
    () => patients.filter((p) => p.status === 'Active'),
    [patients]
  );

  const displayedPatients =
    activeTab === 'AWAITING'
      ? awaitingList
      : activeTab === 'IN_ASSESSMENT'
      ? inAssessmentList
      : activeTab === 'RESULTS_READY'
      ? resultsReadyList
      : allActiveList;

  const tabs: TabItem<DoctorQueueTab>[] = [
    { id: 'AWAITING', label: 'Awaiting', count: awaitingList.length },
    { id: 'IN_ASSESSMENT', label: 'In Exam', count: inAssessmentList.length },
    { id: 'RESULTS_READY', label: 'Results Ready', count: resultsReadyList.length },
    { id: 'ALL_ACTIVE', label: 'All Active', count: allActiveList.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seafarer Examinations"
        subtitle="Recognized Medical Practitioner queue · Dr. Babatunde Fashola-Cole"
      />

      {/* Single-Line Pre-Session Status Strip */}
      <div className="px-4 py-2.5 rounded bg-surface-card border border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-secondary">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Register verified ({sessionCheck.confirmedAt})</span>
          </span>
          <span className="text-surface-border-strong">·</span>
          <span className="inline-flex items-center gap-1.5">
            {eqPassedCount === eqTotalCount ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            )}
            <span>
              Equipment {eqPassedCount}/{eqTotalCount} passed
            </span>
          </span>
          <span className="text-surface-border-strong">·</span>
          <span>
            <strong className="font-mono text-ink-primary">{assignedBlanksCount}</strong>{' '}
            certificate blanks allocated
          </span>
        </div>

        <button
          type="button"
          onClick={confirmSessionCheck}
          className="text-primary-700 font-medium hover:underline shrink-0"
        >
          Re-verify
        </button>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Seafarer examination queues"
      />

      {/* Spacious Queue List */}
      <div
        role="tabpanel"
        className="bg-surface-card border border-surface-border rounded divide-y divide-surface-border"
      >
        {displayedPatients.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            No seafarers currently in this queue.
          </div>
        ) : (
          displayedPatients.map((patient) => {
            const publishedCount = patient.orders.filter(
              (o) => o.status === 'Published'
            ).length;
            const rmp = patient.rmp;

            return (
              <div
                key={patient.id}
                tabIndex={0}
                role="link"
                aria-label={`Open examination chart for ${patient.fullName}, ${patient.recordNo}`}
                onClick={() => navigate(`/doctor/patients/${patient.recordNo}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/doctor/patients/${patient.recordNo}`);
                  }
                }}
                className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-canvas focus-visible:bg-primary-50/40 focus-visible:outline-none cursor-pointer transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-medium text-sm text-ink-primary">
                      {patient.fullName}
                    </span>
                    <span className="font-mono text-xs text-primary-700">
                      {patient.recordNo}
                    </span>
                    {rmp?.isUnder18 && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                        Under 18
                      </span>
                    )}
                    {rmp?.priorityBasis && rmp.priorityBasis !== 'None' && (
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 text-[11px] font-medium">
                        Priority
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span>{rmp?.category || 'Seafarer'}</span>
                    <span>·</span>
                    <span>
                      {patient.gender} · DOB {patient.dob}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {patient.arrivedAt}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {publishedCount > 0 && (
                    <span className="text-xs font-medium text-primary-700">
                      {publishedCount} result(s) ready
                    </span>
                  )}

                  <span className="text-xs text-ink-secondary font-medium">
                    {rmp?.determination || patient.currentStage}
                  </span>

                  {patient.currentStage === 'Awaiting doctor' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startFirstAssessment(patient.id);
                        navigate(`/doctor/patients/${patient.recordNo}`);
                      }}
                      className="h-8 px-3 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
                    >
                      Start Exam
                    </button>
                  )}

                  <ChevronRight className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
