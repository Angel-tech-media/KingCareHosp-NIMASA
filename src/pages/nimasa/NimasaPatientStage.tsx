import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  ShieldCheck,
  Stethoscope,
  Info,
  FileBadge,
  Scale,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

interface RmpTimelineStep {
  id: string;
  code: string;
  label: string;
  defaultTooltip: string;
}

const RMP_TIMELINE_STEPS: RmpTimelineStep[] = [
  {
    id: 'reg',
    code: 'RQP-601',
    label: 'Reception & ID Gate',
    defaultTooltip:
      'Original photo ID verified, age ≥16 confirmed, Duties Statement (RQF-503-01) & Health Declaration (RQF-601-02) logged.',
  },
  {
    id: 'vh',
    code: 'RQF-603-01',
    label: 'Vision & Hearing',
    defaultTooltip:
      'Snellen decimal distance/near vision, CIE colour vision & 500–3000 Hz unaided audiometry recorded against Table A-I/9.',
  },
  {
    id: 'exam',
    code: 'QAF-804-01',
    label: 'RMP Examination',
    defaultTooltip:
      'Recognized Medical Practitioner assesses all five Section A-I/9.2 criteria & Table B-I/9 physical abilities.',
  },
  {
    id: 'inv',
    code: 'RQP-604',
    label: 'Investigations / Referral',
    defaultTooltip:
      'Lab, Radiology or Clinical Vision Specialist referral tracked under 30-day statutory cap.',
  },
  {
    id: 'det',
    code: 'RQP-605',
    label: 'Determination',
    defaultTooltip:
      'Fitness determination (Fit / Fit with limitation / Not fit) stamped; mandatory QAF-804-02 Right of Review issued if limited/unfit.',
  },
  {
    id: 'cert',
    code: 'RQP-701',
    label: 'Certificate / Closed',
    defaultTooltip:
      'STCW Medical Certificate (QAF-805-01) + Supplement (RQF-701-01) issued after 2nd-person check, or Not Fit closed with Referee Review.',
  },
];

export const NimasaPatientStage: React.FC = () => {
  const { recordNo } = useParams<{ recordNo: string }>();
  const { patients, activeRole } = useHospital();
  const canOpenDoctorChart = activeRole === 'ADMIN' || activeRole === 'DOCTOR';

  const patient = patients.find((p) => p.recordNo === recordNo) || patients[0];
  const rmp = patient.rmp;
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null);

  // Derive active 0..5 step index from STCW RMP state
  const currentStepIndex = (() => {
    if (!rmp) return 0;
    if (rmp.issuedCertificate || rmp.determination === 'Not fit') return 5;
    if (rmp.determination === 'Fit' || rmp.determination === 'Fit with limitation') return 4;
    if (patient.orders.length > 0 || rmp.visionHearing.colourVisionReferred) return 3;
    if (patient.currentStage === 'In assessment' || patient.currentStage === 'First assessment complete') return 2;
    if (patient.currentStage === 'Awaiting doctor') return 1;
    return 0;
  })();

  return (
    <div className="space-y-6">
      {/* Back breadcrumb + Demo jump */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/nimasa"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to NIMASA Oversight Register</span>
        </Link>

        {canOpenDoctorChart && (
          <Link
            to={`/doctor/patients/${patient.recordNo}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200 text-xs font-semibold transition-colors"
          >
            <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Open RMP Exam Workspace ({patient.recordNo})</span>
          </Link>
        )}
      </div>

      {/* Seafarer Identity & Non-Clinical Outcome Header */}
      <div className="bg-surface-card rounded-lg border border-surface-border shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-primary-50 text-primary-800 border border-primary-200">
                {patient.recordNo}
              </span>
              {rmp && (
                <span className="px-2.5 py-1 rounded bg-surface-subtle text-ink-secondary text-xs font-semibold">
                  {rmp.category}
                </span>
              )}
              {rmp && (
                <span
                  className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                    rmp.determination === 'Fit'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : rmp.determination === 'Fit with limitation'
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : rmp.determination === 'Not fit'
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  Determination: {rmp.determination}
                </span>
              )}
              {rmp?.isUnder18 && (
                <span className="px-2 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                  Under 18 · 1-Yr Max
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-ink-primary mt-2">{patient.fullName}</h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              Nationality: <strong className="text-ink-secondary">{rmp?.nationality || 'Nigerian'}</strong> · ID:{' '}
              <strong className="text-ink-secondary">
                {rmp?.idType} ({rmp?.idNumber})
              </strong>{' '}
              · Lookout: <strong className="text-ink-secondary">{rmp?.lookoutRequired ? 'Required' : 'No'}</strong>
            </p>
          </div>

          <div className="bg-surface-canvas rounded-lg border border-surface-border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
            <div>
              <span className="text-ink-muted uppercase font-semibold block">Certificate / Notice</span>
              <span className="text-ink-primary font-mono font-semibold flex items-center gap-1 mt-0.5">
                <FileBadge className="w-3.5 h-3.5 text-primary-600" aria-hidden="true" />
                {rmp?.issuedCertificate
                  ? `${rmp.issuedCertificate.certificateNo} (Exp: ${rmp.issuedCertificate.expiryDate})`
                  : rmp?.rightOfReview
                  ? 'QAF-804-02 Review Notice Issued'
                  : 'Pending RMP Determination'}
              </span>
            </div>
            <div className="sm:border-l sm:border-surface-border sm:pl-4">
              <span className="text-ink-muted uppercase font-semibold block">Exam Started</span>
              <span className="text-ink-primary font-semibold flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-primary-600" aria-hidden="true" />
                {patient.arrivedAt}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal 6-Stage STCW Reg. I/9 Electronic Trail */}
      <div className="bg-surface-card rounded-lg border border-surface-border shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-ink-primary">
              STCW Regulation I/9 Electronic Examination Trail
            </h2>
            <p className="text-xs text-ink-muted">
              Hover, focus, or tap any stage node to inspect the statutory compliance gate.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-lg">
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            Hover or focus stage node for summary
          </span>
        </div>

        <div className="pt-4 pb-6 overflow-x-auto">
          <div className="min-w-[780px] grid grid-cols-6 gap-2 relative">
            {RMP_TIMELINE_STEPS.map((step, index) => {
              const isCurrent = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isHovered = hoveredStepId === step.id;

              return (
                <div
                  key={step.id}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isHovered}
                  aria-label={`${step.label} (${step.code}): ${isCurrent ? 'Current stage' : isCompleted ? 'Completed' : 'Pending'}`}
                  onMouseEnter={() => setHoveredStepId(step.id)}
                  onMouseLeave={() => setHoveredStepId(null)}
                  onFocus={() => setHoveredStepId(step.id)}
                  onBlur={() => setHoveredStepId(null)}
                  onClick={() => setHoveredStepId(isHovered ? null : step.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setHoveredStepId(isHovered ? null : step.id);
                    } else if (e.key === 'Escape') {
                      setHoveredStepId(null);
                    }
                  }}
                  className="relative flex flex-col items-center text-center group cursor-pointer px-1 rounded-lg"
                >
                  {index < RMP_TIMELINE_STEPS.length - 1 && (
                    <div
                      aria-hidden="true"
                      className={`absolute top-5 left-1/2 w-full h-1 -z-0 transition-colors ${
                        index < currentStepIndex ? 'bg-primary-600' : 'bg-surface-border'
                      }`}
                    />
                  )}

                  {isHovered && (
                    <div
                      role="tooltip"
                      className="absolute -top-28 z-30 w-60 p-3 rounded-lg bg-slate-900 text-white text-left shadow-xl border border-slate-700 pointer-events-none"
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-blue-200 mb-1">
                        <span>{step.code}</span>
                        <span>{isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Pending'}</span>
                      </div>
                      <p className="text-xs text-slate-100 leading-snug">{step.defaultTooltip}</p>
                    </div>
                  )}

                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                      isCurrent
                        ? 'bg-primary-600 text-white border-primary-600 ring-4 ring-primary-100 scale-110'
                        : isCompleted
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-surface-card text-ink-muted border-surface-border-strong'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  <div className="mt-3 space-y-0.5">
                    <div className="font-mono text-[10px] font-semibold text-primary-700">{step.code}</div>
                    <div className="text-xs font-bold text-ink-primary">{step.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confidentiality & Outcome Details (QA-P-808) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface-card rounded-lg border border-surface-border shadow-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Non-Clinical Outcome &amp; Limitation Summary (QA-P-808 §7.3)
          </h3>

          {rmp?.limitationText ? (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950">
              <strong className="block">Stated Limitation (No Diagnosis):</strong>
              <span className="mt-1 block">{rmp.limitationText}</span>
            </div>
          ) : (
            <p className="text-xs text-ink-secondary">
              {rmp?.determination === 'Fit'
                ? 'Seafarer meets STCW Section A-I/9 medical fitness standards without restriction.'
                : rmp?.determination === 'Not fit'
                ? 'Seafarer found Not Fit under STCW Section A-I/9. No medical certificate issued; Right of Review (QAF-804-02) issued.'
                : 'Examination in progress or awaiting diagnostic/specialist result (30-day statutory cap).'}
            </p>
          )}

          {rmp?.rightOfReview && (
            <div className="p-3.5 rounded-lg bg-surface-canvas border border-surface-border text-xs space-y-1">
              <div className="font-bold text-ink-primary flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-primary-600" aria-hidden="true" />
                Right of Review Status (RQP-704 / QA-P-806)
              </div>
              <p className="text-ink-muted">
                QAF-804-02 issued: <strong>{rmp.rightOfReview.issuedAt}</strong> · Signed receipt:{' '}
                <strong>{rmp.rightOfReview.seafarerSigned ? 'Yes' : 'No'}</strong>
                {rmp.rightOfReview.reviewRequested &&
                  ` · Referee review active (Certified copy released ${rmp.rightOfReview.recordsReleasedAt})`}
              </p>
            </div>
          )}

          <div className="p-3.5 rounded-lg bg-slate-50 border border-surface-border text-xs text-ink-secondary flex items-start gap-2">
            <Lock className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Full clinical notes are held by Kingscare.</strong> Under NIMASA QA-P-808 and the Nigeria Data
              Protection Act 2023, diagnoses, audiograms, and raw lab results are restricted and are not visible in
              the sponsor portal.
            </span>
          </div>
        </section>

        {/* Timestamped Electronic Trail */}
        <section className="bg-surface-card rounded-lg border border-surface-border shadow-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-ink-primary">
            Stamped Electronic Trail ({patient.timeline.length} events)
          </h3>
          <div className="divide-y divide-surface-border">
            {patient.timeline.map((entry, i) => (
              <div key={`${entry.stage}-${i}`} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-ink-primary">{entry.stage}</span>
                  <span className="font-mono text-[11px] text-ink-muted">{entry.reachedAt}</span>
                </div>
                <p className="text-ink-secondary mt-0.5">{entry.publicSummary}</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Stamped by: {entry.actorName} ({entry.actorRole})
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
