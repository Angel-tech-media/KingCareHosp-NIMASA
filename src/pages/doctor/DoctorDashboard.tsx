import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Clock,
  ChevronRight,
  FlaskConical,
  BellRing,
  BedDouble,
  ShieldCheck,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { StageChip, StatusChip } from '../../components/ui/StageChip';

type DoctorQueueTab = 'AWAITING' | 'IN_ASSESSMENT' | 'RESULTS_READY' | 'ALL_ACTIVE';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { patients, startFirstAssessment } = useHospital();

  const [activeTab, setActiveTab] = useState<DoctorQueueTab>('AWAITING');

  const awaitingList = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.status === 'Active' &&
          (p.currentStage === 'Awaiting doctor' ||
            p.currentStage === 'Registered')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded mb-1.5">
            <Stethoscope className="w-3.5 h-3.5" />
            Consultant Physician Workspace • Dr. Babatunde Fashola-Cole
          </span>
          <h1 className="text-2xl font-bold text-slate-900">My Patients</h1>
          <p className="text-sm text-slate-500">
            Select a patient to record first assessment notes, order Lab /
            Radiology tests, admit to ward, or review published results.
          </p>
        </div>

        {/* Quick Queue Summary Badges */}
        <div className="flex items-center gap-2">
          {resultsReadyList.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('RESULTS_READY')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold"
            >
              <BellRing className="w-4 h-4 text-blue-600 animate-bounce" />
              <span>{resultsReadyList.length} Results Ready for Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Queue Tabs: Awaiting me | In assessment | Results ready | All Active */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-4 pt-3 flex flex-wrap items-center gap-2 bg-slate-50/60">
          <button
            type="button"
            onClick={() => setActiveTab('AWAITING')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'AWAITING'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Awaiting me</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
              {awaitingList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('IN_ASSESSMENT')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'IN_ASSESSMENT'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>In assessment</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
              {inAssessmentList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RESULTS_READY')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'RESULTS_READY'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Results ready</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
              {resultsReadyList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL_ACTIVE')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ALL_ACTIVE'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All Active in Hospital</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">
              {allActiveList.length}
            </span>
          </button>
        </div>

        {/* Patient List */}
        <div className="divide-y divide-slate-200">
          {displayedPatients.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No patients currently in this queue tab.
            </div>
          ) : (
            displayedPatients.map((patient) => {
              const publishedCount = patient.orders.filter(
                (o) => o.status === 'Published'
              ).length;

              return (
                <div
                  key={patient.id}
                  onClick={() =>
                    navigate(`/doctor/patients/${patient.recordNo}`)
                  }
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {patient.recordNo}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700">
                        {patient.fullName}
                      </h3>
                      {patient.nimasaMember && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          NIMASA ({patient.nimasaStaffId})
                        </span>
                      )}
                      {patient.isAdmitted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          <BedDouble className="w-3 h-3" />
                          {patient.wardRoom}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>
                        {patient.gender} • DOB: {patient.dob}
                      </span>
                      <span>•</span>
                      <span>BP: {patient.vitals.bp}</span>
                      <span>•</span>
                      <span>Temp: {patient.vitals.temp}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        In hospital: {patient.timeInHospital}
                      </span>
                    </div>

                    {patient.firstAssessmentSummary && (
                      <p className="text-xs text-slate-600 line-clamp-1 pt-0.5">
                        <strong className="text-slate-700">Summary:</strong>{' '}
                        {patient.firstAssessmentSummary}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {publishedCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                        <FlaskConical className="w-3.5 h-3.5" />
                        {publishedCount} Result(s) Published
                      </span>
                    )}

                    <StageChip stage={patient.currentStage} />
                    <StatusChip status={patient.status} />

                    {patient.currentStage === 'Awaiting doctor' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startFirstAssessment(patient.id);
                          navigate(`/doctor/patients/${patient.recordNo}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                      >
                        Start Assessment
                      </button>
                    )}

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 pl-1">
                      Open Chart
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
