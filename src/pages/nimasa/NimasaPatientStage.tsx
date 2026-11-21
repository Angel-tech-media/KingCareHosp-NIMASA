import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  ShieldCheck,
  UserCheck,
  Info,
  Stethoscope,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { StageChip, StatusChip } from '../../components/ui/StageChip';
import { PatientStage } from '../../types';

interface TimelineStepConfig {
  id: string;
  label: string;
  matchStages: PatientStage[];
  defaultTooltip: string;
}

const TIMELINE_STEPS: TimelineStepConfig[] = [
  {
    id: 'step-1',
    label: 'Registered',
    matchStages: ['Registered'],
    defaultTooltip: 'Patient checked in at Front Desk and NIMASA ID verified.',
  },
  {
    id: 'step-2',
    label: 'Awaiting doctor',
    matchStages: ['Awaiting doctor'],
    defaultTooltip: 'Baseline vitals recorded; patient queued for physician.',
  },
  {
    id: 'step-3',
    label: 'In assessment',
    matchStages: ['In assessment'],
    defaultTooltip: 'Attending physician conducting initial clinical exam.',
  },
  {
    id: 'step-4',
    label: 'First assessment complete',
    matchStages: ['First assessment complete'],
    defaultTooltip:
      'First assessment complete; physician deciding next clinical step.',
  },
  {
    id: 'step-5',
    label: 'Tests requested / Admitted',
    matchStages: ['Tests requested', 'Admitted'],
    defaultTooltip:
      'Diagnostic tests ordered (Laboratory / Radiology) or patient admitted to ward.',
  },
  {
    id: 'step-6',
    label: 'Results ready',
    matchStages: ['Results ready'],
    defaultTooltip:
      'Diagnostic results published by Lab/Radiology for doctor review.',
  },
  {
    id: 'step-7',
    label: 'Second assessment',
    matchStages: ['Second assessment'],
    defaultTooltip:
      'Doctor reviewing published results with patient and prescribing care.',
  },
  {
    id: 'step-8',
    label: 'Discharged',
    matchStages: ['Discharged'],
    defaultTooltip: 'Medical journey complete; patient discharged from hospital.',
  },
];

export const NimasaPatientStage: React.FC = () => {
  const { recordNo } = useParams<{ recordNo: string }>();
  const { patients } = useHospital();

  const patient = patients.find((p) => p.recordNo === recordNo) || patients[0];

  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null);

  const currentStepIndex = TIMELINE_STEPS.findIndex((step) =>
    step.matchStages.includes(patient.currentStage)
  );

  const getStepHistoryEntry = (step: TimelineStepConfig) => {
    // Find latest matching timeline entry
    for (let i = patient.timeline.length - 1; i >= 0; i--) {
      if (step.matchStages.includes(patient.timeline[i].stage)) {
        return patient.timeline[i];
      }
    }
    return undefined;
  };

  return (
    <div className="space-y-6">
      {/* Back breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/nimasa"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to NIMASA Patient Table</span>
        </Link>

        <Link
          to={`/doctor/patients/${patient.recordNo}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Demo: Jump to Doctor View for {patient.recordNo}</span>
        </Link>
      </div>

      {/* Patient Identity Summary Header */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {patient.recordNo}
              </span>
              <StatusChip status={patient.status} />
              <StageChip stage={patient.currentStage} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mt-2">
              {patient.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              NIMASA ID:{' '}
              <strong className="text-slate-700">
                {patient.nimasaStaffId || 'NIM-STF-2090'}
              </strong>{' '}
              • Department:{' '}
              <strong className="text-slate-700">
                {patient.nimasaDepartment || 'Maritime Safety'}
              </strong>{' '}
              • Arrived: {patient.arrivedAt}
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold block">
                Current Location Now
              </span>
              <span className="text-slate-900 font-semibold flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {patient.currentLocation}
              </span>
            </div>
            <div className="sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-slate-400 uppercase font-semibold block">
                Time in Hospital
              </span>
              <span className="text-slate-900 font-semibold flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {patient.timeInHospital}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal 8-Stage Timeline Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Live Electronic Stage Timeline
            </h2>
            <p className="text-xs text-slate-500">
              Hover or tap any stage below to view a short clinical milestone
              summary, timestamp, and responsible hospital role.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
            <Info className="w-3.5 h-3.5" />
            Hover any stage node for tooltip summary
          </span>
        </div>

        {/* Horizontal Timeline Scroll/Grid */}
        <div className="pt-4 pb-6 overflow-x-auto">
          <div className="min-w-[920px] grid grid-cols-8 gap-2 relative">
            {TIMELINE_STEPS.map((step, index) => {
              const entry = getStepHistoryEntry(step);
              const isCurrent = index === currentStepIndex;
              const isCompleted = index < currentStepIndex || Boolean(entry);
              const isHovered = hoveredStepId === step.id;

              const displayLabel =
                step.id === 'step-5' && patient.currentStage === 'Admitted'
                  ? 'Admitted (Ward)'
                  : step.id === 'step-5' &&
                    patient.timeline.some((t) => t.stage === 'Admitted')
                  ? 'Tests / Admitted'
                  : step.label;

              const tooltipSummary =
                entry?.publicSummary || step.defaultTooltip;

              return (
                <div
                  key={step.id}
                  onMouseEnter={() => setHoveredStepId(step.id)}
                  onMouseLeave={() => setHoveredStepId(null)}
                  onClick={() =>
                    setHoveredStepId(isHovered ? null : step.id)
                  }
                  className="relative flex flex-col items-center text-center group cursor-pointer px-1"
                >
                  {/* Connector Bar */}
                  {index < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`absolute top-5 left-1/2 w-full h-1 -z-0 transition-colors ${
                        index < currentStepIndex
                          ? 'bg-blue-600'
                          : 'bg-slate-200'
                      }`}
                    />
                  )}

                  {/* Hover Tooltip Popover */}
                  {isHovered && (
                    <div className="absolute -top-28 z-30 w-56 p-3 rounded-lg bg-slate-900 text-white text-left shadow-xl border border-slate-700 pointer-events-none">
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-blue-300 mb-1">
                        <span>{displayLabel}</span>
                        <span>{entry ? entry.reachedAt.split(', ')[1] : 'Pending'}</span>
                      </div>
                      <p className="text-xs text-slate-100 leading-snug">
                        {tooltipSummary}
                      </p>
                      {entry && (
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          Stamped by: {entry.actorRole}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Node Circle */}
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100 scale-110'
                        : isCompleted
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-400 border-slate-300'
                    }`}
                  >
                    {isCompleted && !isCurrent ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Stage Title */}
                  <div className="mt-3">
                    <span
                      className={`text-xs font-bold block leading-tight ${
                        isCurrent
                          ? 'text-blue-700'
                          : isCompleted
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {displayLabel}
                    </span>

                    {isCurrent && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                        Current Stage
                      </span>
                    )}
                  </div>

                  {/* Timestamp & Staff Role */}
                  <div className="mt-2 min-h-[42px] flex flex-col justify-start">
                    {entry ? (
                      <>
                        <span className="text-[11px] font-semibold text-slate-700">
                          {entry.reachedAt}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {entry.actorRole}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Not reached yet
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical Confidentiality Notice Banner */}
        <div className="mt-2 p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Full clinical notes are held by Kingscare
              </p>
              <p className="text-xs text-slate-500">
                In line with medical confidentiality and patient consent, NIMASA
                receives real-time stage progression, department movement, and
                turnaround timestamps without raw clinical examination notes or
                private laboratory figures.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Consent Verified
          </span>
        </div>
      </div>

      {/* Detailed Chronological Electronic Trail Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">
            Stamped Electronic Trail Log ({patient.recordNo})
          </h3>
          <p className="text-xs text-slate-500">
            Every stage transition recorded for {patient.fullName} with
            timestamp and staff role.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {patient.timeline.map((item, idx) => (
            <div
              key={`${item.stage}-${idx}`}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <StageChip stage={item.stage} />
                  <span className="text-xs font-semibold text-slate-700">
                    {item.reachedAt}
                  </span>
                </div>
                <p className="text-sm text-slate-700 pt-0.5">
                  {item.publicSummary}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="font-semibold text-slate-800 block">
                    {item.actorRole}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Stamped by {item.actorName}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
