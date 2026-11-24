import React, { useState } from 'react';
import {
  Eye,
  Ear,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileBadge,
  Scale,
  Lock,
  Printer,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
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
  const [secondChecker, setSecondChecker] = useState('Chidinma Okafor (Certificate Stock Custodian)');
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

  const handleSaveVisionHearing = () => {
    saveVisionHearing(patient.id, vh);
    onFeedback('Vision, colour vision & audiometry record (RQF-603-01) saved and stamped.');
  };

  const handleSaveCriteria = () => {
    saveStatutoryCriteria(patient.id, criteria);
    onFeedback('Section A-I/9.2 statutory fitness criteria (RQF-602-01) saved.');
  };

  const handleRecordDetermination = () => {
    if (liveEvaluation.deckZeroDiscretionBlock && determination === 'Fit') {
      onFeedback(
        'Blocked (A-I/9.5): Zero discretion for Deck/Lookout vision or colour failure. Select Not fit or Fit with limitation.'
      );
      return;
    }
    recordFitnessDetermination(
      patient.id,
      determination,
      basis,
      determination === 'Fit with limitation' ? limitation : undefined,
      reviewNoticeSigned
    );
    onFeedback(
      `Determination "${determination}" recorded${
        determination !== 'Fit' ? ' and mandatory QAF-804-02 Right of Review issued' : ''
      }.`
    );
  };

  const handleIssueCertificate = () => {
    setIssueError(null);
    const res = issueMedicalCertificate(
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
      `STCW Medical Certificate ${selectedSerial} + Supplement ${selectedSerial}-S issued and logged in RQR-701-01 & RQR-702-01.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Seafarer Duties & Gate Banner */}
      <div className="p-4 rounded-lg bg-surface-canvas border border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-ink-primary">Duties (RQF-503-01):</span>
          <span className="px-2 py-0.5 rounded bg-primary-50 text-primary-800 border border-primary-200 font-semibold">
            {rmp.category}
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-card text-ink-secondary border border-surface-border font-medium">
            Lookout: {rmp.lookoutRequired ? 'Required' : 'Not required'}
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-card text-ink-secondary border border-surface-border font-medium">
            ID: {rmp.idType} ({rmp.idNumber})
          </span>
          {rmp.isUnder18 && (
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
              UNDER 18 · 1-Year Max Validity
            </span>
          )}
        </div>
        <span className="text-emerald-800 font-semibold inline-flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          Original Photo ID &amp; Health Declaration Verified
        </span>
      </div>

      {/* SECTION 1: Vision, Colour Vision & Hearing (RQF-603-01) */}
      <section className="rounded-lg border border-surface-border bg-surface-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary-600" aria-hidden="true" />
              1. Vision, Colour Vision &amp; Hearing Assessment (RQF-603-01 · Table A-I/9)
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Snellen decimal notation (6/12 = 0.5, 6/15 = 0.4, 6/6 = 1.0) · Pure-tone unaided audiometry (500–3000 Hz)
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveVisionHearing}
            className="px-3.5 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors"
          >
            Save RQF-603-01
          </button>
        </div>

        {/* Live Table A-I/9 Validation Banner */}
        <div
          className={`p-3 rounded-lg border text-xs ${
            liveEvaluation.notes.length === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="font-bold flex items-center gap-1.5">
            {liveEvaluation.notes.length === 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                Meets Table A-I/9 Vision, CIE Colour &amp; ILO/IMO Hearing Thresholds for {rmp.category}
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                Table A-I/9 / ILO-IMO Standard Alerts ({liveEvaluation.notes.length})
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Distance & Colour Vision */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
              Distance Vision (Snellen Decimal)
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs items-center">
              <span className="font-medium text-ink-muted">Unaided</span>
              {(['right', 'left', 'both'] as const).map((eye) => (
                <label key={`u-${eye}`} className="block">
                  <span className="text-[11px] text-ink-muted capitalize block mb-0.5">{eye}</span>
                  <select
                    value={vh.distanceUnaided[eye]}
                    onChange={(e) =>
                      setVh({
                        ...vh,
                        distanceUnaided: { ...vh.distanceUnaided, [eye]: e.target.value },
                      })
                    }
                    className="w-full rounded border border-surface-border-strong px-2 py-1 text-xs font-mono bg-surface-card"
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
                  <span className="text-[11px] text-ink-muted capitalize block mb-0.5">{eye}</span>
                  <select
                    value={vh.distanceAided[eye]}
                    onChange={(e) =>
                      setVh({
                        ...vh,
                        distanceAided: { ...vh.distanceAided, [eye]: e.target.value },
                      })
                    }
                    className="w-full rounded border border-surface-border-strong px-2 py-1 text-xs font-mono bg-surface-card"
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

            <div className="flex flex-wrap gap-4 pt-1 text-xs text-ink-secondary">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vh.visualAidsRequired}
                  onChange={(e) => setVh({ ...vh, visualAidsRequired: e.target.checked })}
                  className="rounded border-surface-border-strong text-primary-600"
                />
                Visual aids required (spare pair on board, B-I/9.11)
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vh.nearVisionMet}
                  onChange={(e) => setVh({ ...vh, nearVisionMet: e.target.checked })}
                  className="rounded border-surface-border-strong text-primary-600"
                />
                Near &amp; intermediate vision met
              </label>
            </div>

            <div className="pt-2 border-t border-surface-border space-y-2">
              <div className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                Colour Vision (CIE 143-2001 · 6-Year Validity)
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] text-ink-muted mb-0.5">CIE Standard Met</label>
                  <select
                    value={vh.colourVisionCie}
                    onChange={(e) =>
                      setVh({
                        ...vh,
                        colourVisionCie: e.target.value as CieStandard,
                        colourVisionReferred: e.target.value === 'Pending specialist',
                      })
                    }
                    className="w-full rounded border border-surface-border-strong px-2 py-1.5 text-xs bg-surface-card"
                  >
                    <option value="CIE 1">CIE 1 (Deck / Engine / GMDSS)</option>
                    <option value="CIE 2">CIE 2 (Deck / Engine / GMDSS)</option>
                    <option value="CIE 3">CIE 3 (Engine / GMDSS only)</option>
                    <option value="Pending specialist">Screening failed → Referred to Vision Specialist</option>
                    <option value="Not met">Not met (Specialist confirmed)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-ink-muted mb-0.5">
                    Date of Last Colour Test (A-I/9.7.3.5.1)
                  </label>
                  <input
                    type="text"
                    value={vh.colourVisionLastDate}
                    onChange={(e) => setVh({ ...vh, colourVisionLastDate: e.target.value })}
                    className="w-full rounded border border-surface-border-strong px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-ink-muted">
                Rule (RQP-603 §7.3.2): Never fail a seafarer on Ishihara screening plates alone — refer to an approved
                Clinical Vision Specialist for confirmatory CIE testing.
              </p>
            </div>
          </div>

          {/* Pure-Tone Audiometry (RQW-006) */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-ink-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Ear className="w-3.5 h-3.5 text-primary-600" aria-hidden="true" />
              Pure-Tone Unaided Audiometry (dB · 500–3000 Hz)
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs text-center">
              <div className="text-left font-medium text-ink-muted">Ear</div>
              <div className="font-mono text-[11px] text-ink-muted">500 Hz</div>
              <div className="font-mono text-[11px] text-ink-muted">1000 Hz</div>
              <div className="font-mono text-[11px] text-ink-muted">2000 Hz</div>
              <div className="font-mono text-[11px] text-ink-muted">3000 Hz</div>

              <div className="text-left font-semibold text-ink-primary self-center">
                Right <span className="text-[11px] font-mono text-primary-700">({avgRight} dB)</span>
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
                      audiometryRight: { ...vh.audiometryRight, [hz]: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded border border-surface-border-strong px-1.5 py-1 text-center font-mono text-xs"
                />
              ))}

              <div className="text-left font-semibold text-ink-primary self-center">
                Left <span className="text-[11px] font-mono text-primary-700">({avgLeft} dB)</span>
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
                      audiometryLeft: { ...vh.audiometryLeft, [hz]: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded border border-surface-border-strong px-1.5 py-1 text-center font-mono text-xs"
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-ink-secondary">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vh.unaidedHearingSatisfactory}
                  onChange={(e) => setVh({ ...vh, unaidedHearingSatisfactory: e.target.checked })}
                  className="rounded border-surface-border-strong text-primary-600"
                />
                Unaided hearing satisfactory (A-I/9.7.3.3)
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vh.speechClear}
                  onChange={(e) => setVh({ ...vh, speechClear: e.target.checked })}
                  className="rounded border-surface-border-strong text-primary-600"
                />
                Speech clear for effective communication
              </label>
            </div>
            <p className="text-[11px] text-ink-muted">
              Standard (RQP-501 §7.4.2): Average ≤ 30 dB in better ear and ≤ 40 dB in other ear.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: Five Statutory Criteria (RQF-602-01 / Section A-I/9.2) */}
      <section className="rounded-lg border border-surface-border bg-surface-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              2. Section A-I/9.2 Statutory Fitness Criteria &amp; Declarations (RQF-602-01)
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Every record must show all five statutory criteria assessed (KPI IND-03: 100%).
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveCriteria}
            className="px-3.5 py-1.5 rounded-lg bg-surface-card hover:bg-primary-50 text-primary-700 border border-primary-300 text-xs font-semibold transition-colors"
          >
            Save RQF-602-01
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          {(
            [
              ['physicalCapabilityBasicTraining', 'A-I/9.2.1 · Physical capability for basic training & breathing apparatus (A-VI/1.2)'],
              ['hearingAndSpeechAdequate', 'A-I/9.2.2 · Adequate hearing & speech to communicate and detect audible alarms'],
              ['noConditionPreventingDuties', 'A-I/9.2.3 · No condition preventing safe routine & emergency duties during validity'],
              ['noConditionAggravatedBySea', 'A-I/9.2.4 · Free from condition likely to be aggravated by sea or endanger others'],
              ['noImpairingMedication', 'A-I/9.2.5 · Not taking medication impairing judgement, balance or safe performance'],
              ['fitForLookout', 'A-I/9.7.3.6 · Fit for lookout duties (requires Deck Table A-I/9 compliance)'],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-canvas border border-surface-border cursor-pointer hover:border-primary-300"
            >
              <input
                type="checkbox"
                checked={criteria[key]}
                disabled={key === 'fitForLookout' && liveEvaluation.deckZeroDiscretionBlock}
                onChange={(e) => setCriteria({ ...criteria, [key]: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600"
              />
              <span className="text-ink-secondary leading-snug">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* SECTION 3: Determination & Mandatory Right of Review (RQP-605 / QAF-804-02) */}
      <section className="rounded-lg border border-surface-border bg-surface-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary-600" aria-hidden="true" />
              3. Fitness Determination &amp; Right of Review (RQP-605 · RQW-007)
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Not delegable (RQP-303 §7.2). Seafarer is informed personally before the company learns the outcome.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface-subtle text-ink-secondary">
            Current: {rmp.determination}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(['Fit', 'Fit with limitation', 'Not fit'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setDetermination(opt)}
              className={`p-3 rounded-lg border text-left transition-all ${
                determination === opt
                  ? opt === 'Fit'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                    : opt === 'Fit with limitation'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-500'
                    : 'bg-red-50 border-red-500 text-red-900 ring-1 ring-red-500'
                  : 'bg-surface-canvas border-surface-border text-ink-secondary hover:border-surface-border-strong'
              }`}
            >
              <div className="text-xs font-bold">{opt}</div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {opt === 'Fit'
                  ? 'Meets standard without restriction'
                  : opt === 'Fit with limitation'
                  ? 'Specific time, duty or area restriction'
                  : 'No certificate issued; QAF-804-02 mandatory'}
              </div>
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1">
            Basis of Determination Against Standard (Confidential — Held by Kingscare, RQP-501 §7.4.3)
          </label>
          <textarea
            rows={2}
            value={basis}
            onChange={(e) => setBasis(e.target.value)}
            className="w-full rounded-lg border border-surface-border-strong px-3 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        {determination === 'Fit with limitation' && (
          <div>
            <label className="block text-xs font-semibold text-amber-900 mb-1">
              Specific Limitation (What, Where, How Long — NO DIAGNOSIS, RQP-605 §7.2.3)
            </label>
            <input
              type="text"
              value={limitation}
              onChange={(e) => setLimitation(e.target.value)}
              placeholder='e.g. "Near-coastal voyages only; valid for 6 months; to be re-examined"'
              className="w-full rounded-lg border border-amber-300 bg-amber-50/40 px-3 py-2 text-xs text-ink-primary"
            />
          </div>
        )}

        {(determination === 'Fit with limitation' || determination === 'Not fit') && (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-950">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" aria-hidden="true" />
              Mandatory Right of Review Notice (Agency Form QAF-804-02 · QA-P-804 §7.5.3)
            </div>
            <p>
              Seafarer has <strong>21 days</strong> to apply on <strong>QAF-806-01</strong> for review by an
              independent NIMASA medical referee (decision within 30 days; Kingscare releases certified records within
              3 working days).
            </p>
            <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={reviewNoticeSigned}
                onChange={(e) => setReviewNoticeSigned(e.target.checked)}
                className="h-4 w-4 rounded border-amber-400 text-amber-700"
              />
              QAF-804-02 handed to seafarer personally &amp; signed receipt copy retained on record
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={handleRecordDetermination}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          Record Determination ({determination}) &amp; Stamp RQC-605-01
        </button>
      </section>

      {/* SECTION 4: Issue Medical Certificate (QAF-805-01 + RQF-701-01 Supplement) */}
      <section className="rounded-lg border border-surface-border bg-surface-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-primary-600" aria-hidden="true" />
              4. STCW Medical Certificate Issue (QAF-805-01 + Supplement RQF-701-01)
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              2nd-person check (RQC-701-01) · Max 2 years (1 year if under 18) · Serial deducted from RQR-702-01 stock
            </p>
          </div>
        </div>

        {rmp.issuedCertificate ? (
          /* Printable Certificate + Supplement Preview */
          <div className="p-5 rounded-lg border-2 border-primary-200 bg-primary-50/20 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-primary-200 pb-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary-800">
                  Federal Republic of Nigeria · NIMASA · STCW Reg. I/9 (Form QAF-805-01 + RQF-701-01)
                </div>
                <h4 className="text-lg font-bold text-ink-primary mt-0.5">
                  Seafarer Medical Fitness Certificate
                </h4>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-bold text-primary-800">{rmp.issuedCertificate.certificateNo}</div>
                <div className="text-ink-muted">Supplement: {rmp.issuedCertificate.supplementNo}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-ink-muted block">Seafarer</span>
                <strong className="text-ink-primary">{patient.fullName}</strong>
              </div>
              <div>
                <span className="text-ink-muted block">DOB / Gender / Nationality</span>
                <strong className="text-ink-primary">
                  {patient.dob} · {patient.gender} · {rmp.nationality}
                </strong>
              </div>
              <div>
                <span className="text-ink-muted block">Determination</span>
                <strong className="text-emerald-800">{rmp.issuedCertificate.determination}</strong>
              </div>
              <div>
                <span className="text-ink-muted block">Valid Until (from Exam Date)</span>
                <strong className="text-primary-800">{rmp.issuedCertificate.expiryDate}</strong>
              </div>
              <div>
                <span className="text-ink-muted block">Fit for Lookout (A-I/9.7.3.6)</span>
                <strong>{rmp.issuedCertificate.fitForLookout ? 'Yes' : 'No'}</strong>
              </div>
              <div>
                <span className="text-ink-muted block">Unaided Hearing (A-I/9.7.3.3)</span>
                <strong>{rmp.issuedCertificate.unaidedHearingSatisfactory ? 'Satisfactory' : 'No'}</strong>
              </div>
              <div>
                <span className="text-ink-muted block">Last Colour Vision Test</span>
                <strong className="font-mono">{rmp.issuedCertificate.colourVisionDate}</strong>
              </div>
              <div>
                <span className="text-ink-muted block">Visual Aids (B-I/9.11)</span>
                <strong>
                  {rmp.issuedCertificate.visualAidsRequired ? 'Required (Spare pair)' : 'Not required'}
                </strong>
              </div>
            </div>

            {rmp.issuedCertificate.limitation && (
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-950">
                <strong>Limitation / Restriction:</strong> {rmp.issuedCertificate.limitation}
              </div>
            )}

            <div className="pt-3 border-t border-primary-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
              <span>
                RMP: <strong className="text-ink-primary">{rmp.issuedCertificate.practitionerName}</strong> (
                {rmp.issuedCertificate.practitionerMdcn}) · 2nd Check: {rmp.issuedCertificate.secondCheckerName}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                Seafarer Signed (A-I/9.7.5) · Logged in RQR-701-01
              </span>
            </div>
          </div>
        ) : rmp.determination === 'Not fit' ? (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
            <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong>No QAF-805-01 Certificate Issued (RQP-701 §7.1 / Annex B R-16):</strong> On a{' '}
              <em>Not fit</em> determination, Kingscare issues Agency Notification <strong>QAF-804-02</strong> and
              application <strong>QAF-806-01</strong> for independent referee review.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>
                  <strong>Pending Gate (RQP-604 §7.5):</strong> {pendingOrders.length} diagnostic order(s) still
                  awaiting published results. Certificate issue is blocked until all results are published.
                </span>
              </div>
            )}

            {issueError && (
              <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {issueError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-ink-secondary mb-1">
                  Blank Serial (RQR-702-01 Stock)
                </label>
                <select
                  value={selectedSerial}
                  onChange={(e) => setSelectedSerial(e.target.value)}
                  className="w-full rounded-lg border border-surface-border-strong px-2.5 py-2 font-mono text-xs bg-surface-card"
                >
                  {availableBlanks.map((b) => (
                    <option key={b.serialNo} value={b.serialNo}>
                      {b.serialNo} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink-secondary mb-1">
                  Validity Period (Max {rmp.isUnder18 ? '12 mo · Under 18' : '24 mo'})
                </label>
                <select
                  value={validityMonths}
                  onChange={(e) => setValidityMonths(Number(e.target.value))}
                  className="w-full rounded-lg border border-surface-border-strong px-2.5 py-2 text-xs bg-surface-card"
                >
                  <option value={6}>6 Months (Time-limited review)</option>
                  <option value={12}>12 Months (1 Year{rmp.isUnder18 ? ' — Statutory Max' : ''})</option>
                  {!rmp.isUnder18 && <option value={24}>24 Months (2 Years — Statutory Max)</option>}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink-secondary mb-1">
                  2nd-Person Check (RQC-701-01)
                </label>
                <input
                  type="text"
                  value={secondChecker}
                  onChange={(e) => setSecondChecker(e.target.value)}
                  className="w-full rounded-lg border border-surface-border-strong px-2.5 py-2 text-xs"
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
              Seafarer signed Supplement <strong>RQF-701-01</strong> confirming content &amp; right of review (A-I/9.7.5)
            </label>

            <div>
              <button
                type="button"
                disabled={pendingOrders.length > 0 || !selectedSerial || rmp.determination === 'Pending'}
                onClick={handleIssueCertificate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <FileBadge className="w-4 h-4" aria-hidden="true" />
                <span>Issue QAF-805-01 Certificate + RQF-701-01 Supplement</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
