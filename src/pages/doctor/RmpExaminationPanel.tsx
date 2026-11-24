import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileBadge,
  Lock,
  Printer,
  Check,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { ComplianceDetails } from '../../components/ui';
import {
  CieStandard,
  FitnessDetermination,
  PatientRecord,
  StatutoryCriteriaCheck,
  VisionHearingRecord,
} from '../../types';
import { averageAudiometry, evaluateTableAI9 } from '../../data/mockRmpData';

interface Props {
  patient: PatientRecord;
  onFeedback: (msg: string) => void;
}

const DECIMAL_OPTIONS = ['0.1', '0.25', '0.33', '0.4', '0.5', '0.67', '0.7', '0.8', '1.0'];

export const RmpExaminationPanel: React.FC<Props> = ({ patient, onFeedback }) => {
  const {
    certificateStock,
    saveVisionHearing,
    saveStatutoryCriteria,
    recordFitnessDetermination,
    issueMedicalCertificate,
  } = useHospital();

  const rmp = patient.rmp;
  if (!rmp) return null;

  const initialStep: 1 | 2 | 3 | 4 =
    rmp.issuedCertificate || rmp.determination === 'Not fit'
      ? 4
      : rmp.determination !== 'Pending'
      ? 4
      : 1;

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(initialStep);
  const [vh, setVh] = useState<VisionHearingRecord>(rmp.visionHearing);
  const [criteria, setCriteria] = useState<StatutoryCriteriaCheck>(rmp.statutoryCriteria);
  const [determination, setDetermination] = useState<Exclude<FitnessDetermination, 'Pending'>>(
    rmp.determination === 'Pending' ? 'Fit' : rmp.determination
  );
  const [basis, setBasis] = useState(
    rmp.determinationBasis ||
      'Assessed against STCW Section A-I/9.2 criteria, Table A-I/9 eyesight/colour values, and ILO/IMO hearing thresholds.'
  );
  const [limitation, setLimitation] = useState(rmp.limitationText || '');
  const [reviewNoticeSigned, setReviewNoticeSigned] = useState(
    rmp.rightOfReview?.seafarerSigned ?? true
  );

  const availableBlanks = certificateStock.filter(
    (s) => s.status === 'Issued to RMP' || s.status === 'In Cabinet'
  );
  const [selectedSerial, setSelectedSerial] = useState(availableBlanks[0]?.serialNo || '');
  const [validityMonths, setValidityMonths] = useState<number>(rmp.isUnder18 ? 12 : 24);
  const [secondChecker, setSecondChecker] = useState(
    'Chidinma Okafor (Certificate Stock Custodian)'
  );
  const [seafarerSigned, setSeafarerSigned] = useState(true);
  const [issueError, setIssueError] = useState<string | null>(null);

  const liveEvaluation = evaluateTableAI9({
    ...rmp,
    visionHearing: vh,
    statutoryCriteria: criteria,
  });

  const avgRight = averageAudiometry(vh.audiometryRight);
  const avgLeft = averageAudiometry(vh.audiometryLeft);
  const pendingOrders = patient.orders.filter((o) => o.status !== 'Published');

  const criteriaCompleted = Object.values(criteria).slice(0, 5).every(Boolean);

  const steps = [
    { num: 1 as const, label: 'Vision & Hearing', done: true },
    { num: 2 as const, label: 'Fitness Checklist', done: criteriaCompleted },
    {
      num: 3 as const,
      label: 'Fitness Decision',
      done: rmp.determination !== 'Pending',
    },
    {
      num: 4 as const,
      label: 'Issue Certificate',
      done: Boolean(rmp.issuedCertificate) || rmp.determination === 'Not fit',
    },
  ];

  const handleSaveStep1 = async () => {
    try {
      await saveVisionHearing(patient.id, vh);
      onFeedback('Vision, colour vision & audiometry record saved.');
      setActiveStep(2);
    } catch (err) {
      onFeedback(err instanceof Error ? err.message : 'Failed to save vision and hearing.');
    }
  };

  const handleSaveStep2 = async () => {
    try {
      await saveStatutoryCriteria(patient.id, criteria);
      onFeedback('Section A-I/9.2 statutory fitness criteria saved.');
      setActiveStep(3);
    } catch (err) {
      onFeedback(err instanceof Error ? err.message : 'Failed to save statutory criteria.');
    }
  };

  const handleSaveStep3 = async () => {
    if (liveEvaluation.deckZeroDiscretionBlock && determination === 'Fit') {
      onFeedback(
        'Blocked (A-I/9.5): Zero discretion for Deck/Lookout vision or colour failure. Select Not fit or Fit with limitation.'
      );
      return;
    }
    try {
      await recordFitnessDetermination(
        patient.id,
        determination,
        basis,
        determination === 'Fit with limitation' ? limitation : undefined,
        reviewNoticeSigned
      );
      onFeedback(
        `Determination "${determination}" recorded${
          determination !== 'Fit' ? ' and QAF-804-02 Right of Review issued' : ''
        }.`
      );
      setActiveStep(4);
    } catch (err) {
      onFeedback(err instanceof Error ? err.message : 'Failed to record determination.');
    }
  };

  const handleIssueCertificate = async () => {
    setIssueError(null);
    const res = await issueMedicalCertificate(
      patient.id,
      selectedSerial,
      secondChecker,
      seafarerSigned,
      validityMonths
    );
    if (!res.ok) {
      setIssueError(res.error || 'Could not issue certificate.');
      return;
    }
    onFeedback(
      `Medical Certificate ${selectedSerial} + Supplement ${selectedSerial}-S issued and logged.`
    );
  };

  return (
    <div className="space-y-6">
      {/* 4-Step Horizontal Stepper */}
      <nav aria-label="Examination workflow steps">
        <ol className="grid grid-cols-2 lg:grid-cols-4 border border-surface-border rounded overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-surface-border">
          {steps.map((s) => {
            const active = activeStep === s.num;
            return (
              <li key={s.num}>
                <button
                  type="button"
                  onClick={() => setActiveStep(s.num)}
                  aria-current={active ? 'step' : undefined}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between gap-2 transition-colors ${
                    active
                      ? 'bg-navy-900 text-white'
                      : 'bg-surface-canvas hover:bg-surface-subtle text-ink-secondary'
                  }`}
                >
                  <div className="min-w-0">
                    <div
                      className={`text-xs ${
                        active ? 'text-blue-200' : 'text-ink-muted'
                      }`}
                    >
                      Step {s.num}
                    </div>
                    <div className="text-sm font-semibold truncate mt-0.5">{s.label}</div>
                  </div>
                  {s.done && !active && (
                    <Check
                      className="w-4 h-4 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Single Active Step Panel */}
      <div className="bg-surface-card border border-surface-border rounded p-6 space-y-6">
        {/* STEP 1: VISION, COLOUR VISION & HEARING */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-ink-primary">
                Vision, Colour Vision &amp; Hearing Assessment
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Category: <strong className="text-ink-secondary">{rmp.category}</strong> ·
                Snellen decimal notation · Pure-tone unaided audiometry (500–3000 Hz)
              </p>
            </div>

            <div
              className={`p-3.5 rounded border text-xs ${
                liveEvaluation.notes.length === 0
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="font-semibold flex items-center gap-1.5">
                {liveEvaluation.notes.length === 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    Meets Table A-I/9 Vision, Colour &amp; ILO/IMO Hearing Thresholds
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                    Standard Alerts ({liveEvaluation.notes.length})
                  </>
                )}
              </div>
              {liveEvaluation.notes.length > 0 && (
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  {liveEvaluation.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distance & Colour Vision */}
              <div className="space-y-4">
                <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                  Distance Vision (Snellen Decimal)
                </div>
                <div className="grid grid-cols-4 gap-2.5 text-xs items-center">
                  <span className="font-medium text-ink-muted">Unaided</span>
                  {(['right', 'left', 'both'] as const).map((eye) => (
                    <label key={`u-${eye}`} className="block">
                      <span className="text-[11px] text-ink-muted capitalize block mb-1">
                        {eye}
                      </span>
                      <select
                        value={vh.distanceUnaided[eye]}
                        onChange={(e) =>
                          setVh({
                            ...vh,
                            distanceUnaided: { ...vh.distanceUnaided, [eye]: e.target.value },
                          })
                        }
                        className="w-full h-9 rounded border border-surface-border-strong px-2 text-xs font-mono bg-surface-card"
                      >
                        {DECIMAL_OPTIONS.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}

                  <span className="font-medium text-ink-muted">Aided</span>
                  {(['right', 'left', 'both'] as const).map((eye) => (
                    <label key={`a-${eye}`} className="block">
                      <span className="text-[11px] text-ink-muted capitalize block mb-1">
                        {eye}
                      </span>
                      <select
                        value={vh.distanceAided[eye]}
                        onChange={(e) =>
                          setVh({
                            ...vh,
                            distanceAided: { ...vh.distanceAided, [eye]: e.target.value },
                          })
                        }
                        className="w-full h-9 rounded border border-surface-border-strong px-2 text-xs font-mono bg-surface-card"
                      >
                        {DECIMAL_OPTIONS.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-ink-secondary">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vh.visualAidsRequired}
                      onChange={(e) => setVh({ ...vh, visualAidsRequired: e.target.checked })}
                      className="rounded border-surface-border-strong text-primary-600"
                    />
                    Visual aids required (spare pair on board)
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vh.nearVisionMet}
                      onChange={(e) => setVh({ ...vh, nearVisionMet: e.target.checked })}
                      className="rounded border-surface-border-strong text-primary-600"
                    />
                    Near &amp; intermediate vision met
                  </label>
                </div>

                <div className="pt-3 border-t border-surface-border space-y-2.5">
                  <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                    Colour Vision (CIE 143-2001 · 6-Year Validity)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-ink-muted mb-1">
                        CIE Standard Met
                      </label>
                      <select
                        value={vh.colourVisionCie}
                        onChange={(e) =>
                          setVh({
                            ...vh,
                            colourVisionCie: e.target.value as CieStandard,
                            colourVisionReferred: e.target.value === 'Pending specialist',
                          })
                        }
                        className="w-full h-9 rounded border border-surface-border-strong px-2.5 text-xs bg-surface-card"
                      >
                        <option value="CIE 1">CIE 1 (Deck / Engine / GMDSS)</option>
                        <option value="CIE 2">CIE 2 (Deck / Engine / GMDSS)</option>
                        <option value="CIE 3">CIE 3 (Engine / GMDSS only)</option>
                        <option value="Pending specialist">
                          Screening failed → Referred to Specialist
                        </option>
                        <option value="Not met">Not met (Specialist confirmed)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-ink-muted mb-1">
                        Last Colour Test Date
                      </label>
                      <input
                        type="text"
                        value={vh.colourVisionLastDate}
                        onChange={(e) =>
                          setVh({ ...vh, colourVisionLastDate: e.target.value })
                        }
                        className="w-full h-9 rounded border border-surface-border-strong px-2.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pure-Tone Audiometry */}
              <div className="space-y-4">
                <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                  Pure-Tone Unaided Audiometry (dB · 500–3000 Hz)
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs text-center">
                  <div className="text-left font-medium text-ink-muted">Ear</div>
                  <div className="font-mono text-[11px] text-ink-muted">500</div>
                  <div className="font-mono text-[11px] text-ink-muted">1000</div>
                  <div className="font-mono text-[11px] text-ink-muted">2000</div>
                  <div className="font-mono text-[11px] text-ink-muted">3000</div>

                  <div className="text-left font-medium text-ink-primary self-center">
                    R <span className="font-mono text-primary-700">({avgRight})</span>
                  </div>
                  {(['hz500', 'hz1000', 'hz2000', 'hz3000'] as const).map((hz) => (
                    <input
                      key={`r-${hz}`}
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      value={vh.audiometryRight[hz]}
                      onChange={(e) =>
                        setVh({
                          ...vh,
                          audiometryRight: {
                            ...vh.audiometryRight,
                            [hz]: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full h-9 rounded border border-surface-border-strong px-1.5 text-center font-mono text-xs"
                    />
                  ))}

                  <div className="text-left font-medium text-ink-primary self-center">
                    L <span className="font-mono text-primary-700">({avgLeft})</span>
                  </div>
                  {(['hz500', 'hz1000', 'hz2000', 'hz3000'] as const).map((hz) => (
                    <input
                      key={`l-${hz}`}
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      value={vh.audiometryLeft[hz]}
                      onChange={(e) =>
                        setVh({
                          ...vh,
                          audiometryLeft: {
                            ...vh.audiometryLeft,
                            [hz]: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full h-9 rounded border border-surface-border-strong px-1.5 text-center font-mono text-xs"
                    />
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 pt-1 text-xs text-ink-secondary">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vh.unaidedHearingSatisfactory}
                      onChange={(e) =>
                        setVh({ ...vh, unaidedHearingSatisfactory: e.target.checked })
                      }
                      className="rounded border-surface-border-strong text-primary-600"
                    />
                    Unaided hearing satisfactory
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vh.speechClear}
                      onChange={(e) => setVh({ ...vh, speechClear: e.target.checked })}
                      className="rounded border-surface-border-strong text-primary-600"
                    />
                    Speech clear
                  </label>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Threshold: ≤ 30 dB average in better ear and ≤ 40 dB in other ear.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-border flex justify-end">
              <button
                type="button"
                onClick={handleSaveStep1}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
              >
                <span>Save &amp; Continue</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FIVE STATUTORY CRITERIA */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-ink-primary">
                Medical Fitness Checklist
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Confirm each clinical fitness requirement against the seafarer&apos;s shipboard duties.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {(
                [
                  [
                    'physicalCapabilityBasicTraining',
                    'Physically able to complete safety training and use breathing apparatus',
                  ],
                  [
                    'hearingAndSpeechAdequate',
                    'Adequate hearing and speech to communicate clearly and detect alarms',
                  ],
                  [
                    'noConditionPreventingDuties',
                    'No medical condition preventing safe routine or emergency duties at sea',
                  ],
                  [
                    'noConditionAggravatedBySea',
                    'No condition likely to worsen at sea or endanger others on board',
                  ],
                  [
                    'noImpairingMedication',
                    'Not taking medication that impairs alertness, balance, or judgement',
                  ],
                  [
                    'fitForLookout',
                    'Meets full vision and colour standards for bridge lookout duties',
                  ],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-start gap-2.5 p-3.5 rounded bg-surface-canvas border border-surface-border cursor-pointer hover:border-surface-border-strong"
                >
                  <input
                    type="checkbox"
                    checked={criteria[key]}
                    disabled={
                      key === 'fitForLookout' && liveEvaluation.deckZeroDiscretionBlock
                    }
                    onChange={(e) =>
                      setCriteria({ ...criteria, [key]: e.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600"
                  />
                  <span className="text-ink-secondary leading-snug">{label}</span>
                </label>
              ))}
            </div>

            <div className="pt-4 border-t border-surface-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-surface-border-strong text-xs font-medium text-ink-secondary hover:bg-surface-subtle"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSaveStep2}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
              >
                <span>Save &amp; Continue</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FITNESS DETERMINATION & RIGHT OF REVIEW */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-ink-primary">
                  Fitness Determination &amp; Right of Review
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Non-delegable judgement. Inform the seafarer personally before the company learns the outcome.
                </p>
              </div>
              <span className="text-xs font-medium text-ink-secondary">
                Current: <strong>{rmp.determination}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Fit', 'Fit with limitation', 'Not fit'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDetermination(opt)}
                  className={`p-3.5 rounded border text-left transition-all ${
                    determination === opt
                      ? opt === 'Fit'
                        ? 'bg-emerald-50/70 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                        : opt === 'Fit with limitation'
                        ? 'bg-amber-50/80 border-amber-600 text-amber-950 ring-1 ring-amber-600'
                        : 'bg-red-50/80 border-red-600 text-red-950 ring-1 ring-red-600'
                      : 'bg-surface-canvas border-surface-border text-ink-secondary hover:border-surface-border-strong'
                  }`}
                >
                  <div className="text-xs font-semibold">{opt}</div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {opt === 'Fit'
                      ? 'Meets standard without restriction'
                      : opt === 'Fit with limitation'
                      ? 'Specific time, duty or area limit'
                      : 'No certificate issued; review notice'}
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                Clinical Basis Against Standard (Confidential — Held by Kingscare)
              </label>
              <textarea
                rows={2}
                value={basis}
                onChange={(e) => setBasis(e.target.value)}
                className="w-full rounded border border-surface-border-strong px-3 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>

            {determination === 'Fit with limitation' && (
              <div>
                <label className="block text-xs font-medium text-amber-900 mb-1.5">
                  Specific Limitation (What, Where, How Long — NO DIAGNOSIS)
                </label>
                <input
                  type="text"
                  value={limitation}
                  onChange={(e) => setLimitation(e.target.value)}
                  placeholder='e.g. "Near-coastal voyages only; valid for 6 months; to be re-examined"'
                  className="w-full h-10 rounded border border-amber-300 bg-amber-50/30 px-3 text-xs text-ink-primary"
                />
              </div>
            )}

            {(determination === 'Fit with limitation' || determination === 'Not fit') && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs text-amber-950">
                <div className="font-semibold">
                  Right of Appeal Notice
                </div>
                <p>
                  Seafarer has <strong>21 days</strong> to request an independent medical referee
                  review (decision within 30 days).
                </p>
                <label className="inline-flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewNoticeSigned}
                    onChange={(e) => setReviewNoticeSigned(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-400 text-amber-700"
                  />
                  Appeal rights notice handed to seafarer &amp; signed receipt retained
                </label>
              </div>
            )}

            <div className="pt-4 border-t border-surface-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-surface-border-strong text-xs font-medium text-ink-secondary hover:bg-surface-subtle"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSaveStep3}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
              >
                <span>Save Determination &amp; Continue</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: MEDICAL CERTIFICATE ISSUE OR PREVIEW */}
        {activeStep === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-ink-primary">
                Issue Medical Fitness Certificate
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Requires second-person verification and the seafarer&apos;s signature before release.
              </p>
            </div>

            {rmp.issuedCertificate ? (
              <div className="p-5 rounded border border-surface-border bg-surface-canvas space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-border pb-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      NIMASA · STCW Reg. I/9 · QAF-805-01 + RQF-701-01
                    </div>
                    <h4 className="text-base font-semibold text-ink-primary mt-0.5">
                      Seafarer Medical Fitness Certificate
                    </h4>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="font-semibold text-primary-700">
                      {rmp.issuedCertificate.certificateNo}
                    </div>
                    <div className="text-ink-muted">
                      Supp. {rmp.issuedCertificate.supplementNo}
                    </div>
                  </div>
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <dt className="text-ink-muted">Seafarer</dt>
                    <dd className="font-medium text-ink-primary mt-0.5">{patient.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">DOB / Gender / Nationality</dt>
                    <dd className="font-medium text-ink-primary mt-0.5">
                      {patient.dob} · {patient.gender} · {rmp.nationality}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Determination</dt>
                    <dd className="font-semibold text-emerald-800 mt-0.5">
                      {rmp.issuedCertificate.determination}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Valid Until</dt>
                    <dd className="font-mono font-semibold text-ink-primary mt-0.5">
                      {rmp.issuedCertificate.expiryDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Fit for Lookout</dt>
                    <dd className="font-medium mt-0.5">
                      {rmp.issuedCertificate.fitForLookout ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Unaided Hearing</dt>
                    <dd className="font-medium mt-0.5">
                      {rmp.issuedCertificate.unaidedHearingSatisfactory
                        ? 'Satisfactory'
                        : 'No'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Last Colour Test</dt>
                    <dd className="font-mono font-medium mt-0.5">
                      {rmp.issuedCertificate.colourVisionDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Visual Aids</dt>
                    <dd className="font-medium mt-0.5">
                      {rmp.issuedCertificate.visualAidsRequired
                        ? 'Required (Spare pair)'
                        : 'Not required'}
                    </dd>
                  </div>
                </dl>

                {rmp.issuedCertificate.limitation && (
                  <div className="p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-950">
                    <strong>Limitation:</strong> {rmp.issuedCertificate.limitation}
                  </div>
                )}

                <div className="pt-3 border-t border-surface-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
                  <span>
                    RMP: {rmp.issuedCertificate.practitionerName} (
                    {rmp.issuedCertificate.practitionerMdcn}) · 2nd Check:{' '}
                    {rmp.issuedCertificate.secondCheckerName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                    <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                    Seafarer Signed · Logged in RQR-701-01
                  </span>
                </div>
              </div>
            ) : rmp.determination === 'Not fit' ? (
              <div className="p-4 rounded bg-red-50/70 border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong>No QAF-805-01 Certificate Issued:</strong> On a <em>Not fit</em>{' '}
                  determination, Kingscare issues Agency Notification <strong>QAF-804-02</strong>{' '}
                  and application <strong>QAF-806-01</strong> for independent referee review.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.length > 0 && (
                  <div className="p-3.5 rounded bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                    <span>
                      <strong>Pending Gate (RQP-604 §7.5):</strong> {pendingOrders.length}{' '}
                      investigation(s) still awaiting published results. Certificate issue is blocked.
                    </span>
                  </div>
                )}

                {issueError && (
                  <div
                    role="alert"
                    className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-800"
                  >
                    {issueError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-ink-secondary mb-1">
                      Certificate Serial Number
                    </label>
                    <select
                      value={selectedSerial}
                      onChange={(e) => setSelectedSerial(e.target.value)}
                      className="w-full h-10 rounded-lg border border-surface-border-strong px-2.5 font-mono text-xs bg-surface-card"
                    >
                      {availableBlanks.map((b) => (
                        <option key={b.serialNo} value={b.serialNo}>
                          {b.serialNo} ({b.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-ink-secondary mb-1">
                      Validity Period (Max {rmp.isUnder18 ? '12 mo · Under 18' : '24 mo'})
                    </label>
                    <select
                      value={validityMonths}
                      onChange={(e) => setValidityMonths(Number(e.target.value))}
                      className="w-full h-10 rounded-lg border border-surface-border-strong px-2.5 text-xs bg-surface-card"
                    >
                      <option value={6}>6 Months (Time-limited)</option>
                      <option value={12}>
                        12 Months (1 Year{rmp.isUnder18 ? ' — Max' : ''})
                      </option>
                      {!rmp.isUnder18 && (
                        <option value={24}>24 Months (2 Years — Max)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-ink-secondary mb-1">
                      Verified By (Second Staff Check)
                    </label>
                    <input
                      type="text"
                      value={secondChecker}
                      onChange={(e) => setSecondChecker(e.target.value)}
                      className="w-full h-10 rounded-lg border border-surface-border-strong px-2.5 text-xs"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-ink-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seafarerSigned}
                    onChange={(e) => setSeafarerSigned(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-border-strong text-primary-600"
                  />
                  Seafarer signed the certificate &amp; appeal rights summary
                </label>

                <ComplianceDetails
                  label="View certificate statutory form codes"
                  items={[
                    { code: 'QAF-805-01', description: 'STCW Seafarer Medical Fitness Certificate' },
                    { code: 'RQF-701-01', description: 'Signed seafarer supplement & appeal summary' },
                    { code: 'RQR-702-01', description: 'Serial stock register reconciliation' },
                  ]}
                />

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-surface-border-strong text-xs font-medium text-ink-secondary hover:bg-surface-subtle"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    disabled={
                      pendingOrders.length > 0 ||
                      !selectedSerial ||
                      rmp.determination === 'Pending'
                    }
                    onClick={handleIssueCertificate}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded bg-navy-900 hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                  >
                    <FileBadge className="w-4 h-4" aria-hidden="true" />
                    <span>Issue Certificate</span>
                  </button>
                </div>
              </div>
            )}

            {(rmp.issuedCertificate || rmp.determination === 'Not fit') && (
              <div className="pt-2 flex justify-start">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-surface-border-strong text-xs font-medium text-ink-secondary hover:bg-surface-subtle"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Back to Determination</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
