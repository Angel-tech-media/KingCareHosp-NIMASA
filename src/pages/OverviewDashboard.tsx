import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  FileBadge,
  Clock3,
  Archive,
  ArrowUpRight,
  ShieldCheck,
  UserPlus,
  Wrench,
  CalendarDays,
  ChevronRight,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { FitnessDetermination } from '../types';

type TimeRange = '7D' | '30D' | '6M';

interface OutcomePoint {
  label: string;
  fit: number;
  reviewOrPending: number;
  turnaroundMin: number;
}

const buildSmoothLine = (pts: { x: number; y: number }[]): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = ((p0.x + p1.x) / 2).toFixed(1);
    d += ` C ${cx} ${p0.y.toFixed(1)}, ${cx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
};

const OutcomeBadge: React.FC<{ determination: FitnessDetermination }> = ({ determination }) => {
  const styles =
    determination === 'Fit'
      ? 'bg-emerald-50 text-emerald-700'
      : determination === 'Fit with limitation'
      ? 'bg-amber-50 text-amber-800'
      : determination === 'Not fit'
      ? 'bg-crimson-50 text-crimson-600'
      : 'bg-primary-50 text-navy-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles}`}>
      {determination}
    </span>
  );
};

const getInitials = (name: string): string => {
  const parts = name
    .replace(/^(Capt\.|Chief Eng\.|Ch\.|Eng\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '')
    .trim()
    .split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const WEEK_DAYS = [
  { day: 'Mon', date: '18' },
  { day: 'Tue', date: '19' },
  { day: 'Wed', date: '20' },
  { day: 'Thu', date: '21' },
  { day: 'Fri', date: '22' },
  { day: 'Sat', date: '23' },
  { day: 'Sun', date: '24' },
];

export const OverviewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    patients,
    practice,
    certificateStock,
    dailyEquipmentCheck,
    verificationEnquiries,
    activeRole,
  } = useHospital();

  const [range, setRange] = useState<TimeRange>('7D');
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('21');

  const isNimasa = activeRole === 'NIMASA';

  const seafarers = useMemo(() => patients.filter((p) => Boolean(p.rmp)), [patients]);
  const examinedCount = seafarers.length;
  const certsIssuedCount = useMemo(
    () => seafarers.filter((p) => Boolean(p.rmp?.issuedCertificate)).length,
    [seafarers]
  );
  const pendingCount = useMemo(
    () => seafarers.filter((p) => p.rmp?.determination === 'Pending').length,
    [seafarers]
  );
  const reviewCount = useMemo(
    () =>
      seafarers.filter(
        (p) =>
          p.rmp?.determination === 'Not fit' ||
          p.rmp?.determination === 'Fit with limitation' ||
          Boolean(p.rmp?.rightOfReview)
      ).length,
    [seafarers]
  );
  const availableStock = useMemo(
    () =>
      certificateStock.filter(
        (s) => s.status === 'In Cabinet' || s.status === 'Issued to RMP'
      ).length,
    [certificateStock]
  );

  const fitCount = useMemo(
    () => seafarers.filter((p) => p.rmp?.determination === 'Fit').length,
    [seafarers]
  );

  const passedChecks = useMemo(
    () => dailyEquipmentCheck.items.filter((i) => i.passed).length,
    [dailyEquipmentCheck]
  );

  // Build timeframe series with live tail period driven by current clinic state
  const series = useMemo<OutcomePoint[]>(() => {
    const livePendingOrReview = Math.max(1, pendingCount + reviewCount);
    const liveCertified = Math.max(2, fitCount);

    if (range === '7D') {
      return [
        { label: 'Mon', fit: 11, reviewOrPending: 3, turnaroundMin: 168 },
        { label: 'Tue', fit: 14, reviewOrPending: 4, turnaroundMin: 162 },
        { label: 'Wed', fit: 16, reviewOrPending: 5, turnaroundMin: 159 },
        { label: 'Thu', fit: 13, reviewOrPending: 3, turnaroundMin: 154 },
        { label: 'Fri', fit: 15, reviewOrPending: 4, turnaroundMin: 151 },
        { label: 'Sat', fit: 9, reviewOrPending: 2, turnaroundMin: 146 },
        { label: 'Today', fit: liveCertified, reviewOrPending: livePendingOrReview, turnaroundMin: 157 },
      ];
    }
    if (range === '30D') {
      return [
        { label: 'Wk 1', fit: 42, reviewOrPending: 11, turnaroundMin: 174 },
        { label: 'Wk 2', fit: 48, reviewOrPending: 9, turnaroundMin: 166 },
        { label: 'Wk 3', fit: 53, reviewOrPending: 12, turnaroundMin: 161 },
        { label: 'Wk 4', fit: 46, reviewOrPending: 8, turnaroundMin: 158 },
        { label: 'Wk 5', fit: 57 + liveCertified, reviewOrPending: livePendingOrReview, turnaroundMin: 157 },
      ];
    }
    return [
      { label: 'Jun', fit: 142, reviewOrPending: 28, turnaroundMin: 184 },
      { label: 'Jul', fit: 156, reviewOrPending: 31, turnaroundMin: 176 },
      { label: 'Aug', fit: 168, reviewOrPending: 25, turnaroundMin: 171 },
      { label: 'Sep', fit: 174, reviewOrPending: 29, turnaroundMin: 164 },
      { label: 'Oct', fit: 189, reviewOrPending: 24, turnaroundMin: 159 },
      { label: 'Nov', fit: 164 + liveCertified, reviewOrPending: 14 + livePendingOrReview, turnaroundMin: 157 },
    ];
  }, [range, fitCount, pendingCount, reviewCount]);

  const maxStacked = useMemo(
    () => Math.max(...series.map((d) => d.fit + d.reviewOrPending), 10),
    [series]
  );

  // Recent 5 examinations
  const recentExaminations = useMemo(() => seafarers.slice(0, 5), [seafarers]);

  // Duty category split
  const dutyCategories = useMemo(() => {
    const groups = [
      {
        label: 'Deck Officers & Lookout',
        count: seafarers.filter((p) => p.rmp?.category.startsWith('Deck')).length,
        color: 'bg-navy-800',
      },
      {
        label: 'Engine & Electro-Tech',
        count: seafarers.filter((p) => p.rmp?.category.startsWith('Engine')).length,
        color: 'bg-primary-600',
      },
      {
        label: 'GMDSS Radio',
        count: seafarers.filter((p) => p.rmp?.category.startsWith('GMDSS')).length,
        color: 'bg-primary-300',
      },
      {
        label: 'Catering & Support',
        count: seafarers.filter((p) => p.rmp?.category.startsWith('Catering')).length,
        color: 'bg-navy-200',
      },
    ];
    return groups;
  }, [seafarers]);

  // Priority Queue Items for right rail
  const attentionItems = useMemo(() => {
    const items: {
      id: string;
      title: string;
      meta: string;
      badge: string;
      accent: string;
      to: string;
    }[] = [];

    const waiting = patients.filter((p) => p.currentStage === 'Registered');
    waiting.slice(0, 2).forEach((p) => {
      items.push({
        id: `wait-${p.id}`,
        title: p.fullName,
        meta: `${p.recordNo} · Awaiting RMP assessment`,
        badge: 'Waiting',
        accent: 'border-l-primary-600',
        to: isNimasa ? `/nimasa/patients/${p.recordNo}` : `/doctor/patients/${p.recordNo}`,
      });
    });

    const flagged = seafarers.filter(
      (p) => p.rmp?.determination === 'Not fit' || p.rmp?.determination === 'Fit with limitation'
    );
    flagged.slice(0, 2).forEach((p) => {
      items.push({
        id: `rev-${p.id}`,
        title: p.fullName,
        meta: `${p.rmp?.determination} · QAF-804-02 review`,
        badge: 'Review',
        accent: p.rmp?.determination === 'Not fit' ? 'border-l-crimson-500' : 'border-l-amber-500',
        to: isNimasa ? `/nimasa/patients/${p.recordNo}` : `/doctor/patients/${p.recordNo}`,
      });
    });

    if (verificationEnquiries.length > 0 && items.length < 4) {
      const latest = verificationEnquiries[0];
      items.push({
        id: `enq-${latest.id}`,
        title: latest.certificateNo,
        meta: latest.enquirer,
        badge: latest.result,
        accent: 'border-l-navy-800',
        to: '/nimasa/compliance',
      });
    }

    return items.slice(0, 4);
  }, [patients, seafarers, verificationEnquiries, isNimasa]);

  // SVG Turnaround Curve geometry
  const curveSvg = useMemo(() => {
    const w = 320;
    const h = 152;
    const padX = 18;
    const padTop = 20;
    const padBottom = 26;
    const innerW = w - padX * 2;
    const innerH = h - padTop - padBottom;
    const vals = series.map((s) => s.turnaroundMin);
    const minVal = Math.min(...vals) - 10;
    const maxVal = Math.max(...vals) + 10;
    const span = Math.max(1, maxVal - minVal);

    const pts = series.map((s, idx) => ({
      x: padX + (series.length === 1 ? innerW / 2 : (idx / (series.length - 1)) * innerW),
      y: padTop + (1 - (s.turnaroundMin - minVal) / span) * innerH,
      label: s.label,
      value: s.turnaroundMin,
    }));

    const lineD = buildSmoothLine(pts);
    const areaD = `${lineD} L ${pts[pts.length - 1].x.toFixed(1)} ${(h - padBottom).toFixed(
      1
    )} L ${pts[0].x.toFixed(1)} ${(h - padBottom).toFixed(1)} Z`;

    return { w, h, padBottom, pts, lineD, areaD };
  }, [series]);

  return (
    <div className="space-y-6">
      {/* Top Greeting & Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-ink-primary">
            Clinic Overview
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Kingscare Hospitals Abuja · STCW Regulation I/9 Medical Fitness Summary
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented timeframe switcher */}
          <div
            role="group"
            aria-label="Chart timeframe"
            className="inline-flex items-center p-1 rounded-xl bg-white/80 backdrop-blur-sm border border-surface-border shadow-card"
          >
            {(['7D', '30D', '6M'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRange(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  range === t
                    ? 'bg-navy-800 text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <Link
            to={isNimasa ? '/nimasa/compliance' : '/front-desk'}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            {isNimasa ? (
              <>
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Verify Certificate</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                <span>+ Register Seafarer</span>
              </>
            )}
          </Link>
        </div>
      </div>

      {/* Main 12-Column WellNest Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left / Center Primary Analytics & Recent Feed (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          {/* 4 Elevated KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="surface-panel p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Users className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary-50 text-navy-800 text-[11px] font-medium">
                  Active
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-semibold text-ink-primary tabular-nums">
                  {examinedCount}
                </div>
                <div className="text-xs font-medium text-ink-muted mt-0.5">
                  Seafarers Examined
                </div>
              </div>
            </div>

            <div className="surface-panel p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileBadge className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                  A-I/9.7
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-semibold text-ink-primary tabular-nums">
                  {certsIssuedCount}
                </div>
                <div className="text-xs font-medium text-ink-muted mt-0.5">
                  Certificates Issued
                </div>
              </div>
            </div>

            <div className="surface-panel p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Clock3 className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-medium">
                  {reviewCount} reviews
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-semibold text-ink-primary tabular-nums">
                  {pendingCount + reviewCount}
                </div>
                <div className="text-xs font-medium text-ink-muted mt-0.5">
                  Pending &amp; Reviews
                </div>
              </div>
            </div>

            <div className="surface-panel p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center">
                  <Archive className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                  Balanced
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-semibold text-ink-primary tabular-nums">
                  {availableStock}{' '}
                  <span className="text-sm font-normal text-ink-muted">
                    / {certificateStock.length}
                  </span>
                </div>
                <div className="text-xs font-medium text-ink-muted mt-0.5">
                  Blank Stock Ready
                </div>
              </div>
            </div>
          </div>

          {/* 2 Visual Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Stacked Vertical Bar Chart: Examination Outcomes */}
            <section className="md:col-span-7 surface-panel p-5 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink-primary">
                    Examination Outcomes
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Certified fit vs limited or pending cases
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-ink-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-navy-800" />
                    Fit / Certified
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#60A5FA]" />
                    Limited / Pending
                  </span>
                </div>
              </div>

              <div className="relative">
                <svg
                  viewBox="0 0 420 210"
                  role="img"
                  aria-label="Examination outcomes stacked bar chart"
                  className="w-full h-52 overflow-visible"
                >
                  {[0, 0.5, 1].map((ratio) => {
                    const y = 20 + (1 - ratio) * 155;
                    const labelVal = Math.round(maxStacked * ratio);
                    return (
                      <g key={ratio}>
                        <line
                          x1={28}
                          y1={y}
                          x2={408}
                          y2={y}
                          stroke="#E4EAF1"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={20}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-[#66758C] text-[10px]"
                        >
                          {labelVal}
                        </text>
                      </g>
                    );
                  })}

                  {series.map((item, idx) => {
                    const slotWidth = 376 / series.length;
                    const barWidth = Math.min(26, slotWidth * 0.44);
                    const centerX = 32 + idx * slotWidth + slotWidth / 2;
                    const x = centerX - barWidth / 2;

                    const fitH = (item.fit / maxStacked) * 150;
                    const revH = (item.reviewOrPending / maxStacked) * 150;
                    const baseY = 175;
                    const fitY = baseY - fitH;
                    const revY = fitY - revH - (revH > 0 ? 3 : 0);
                    const isHovered = hoveredBarIdx === idx;

                    return (
                      <g
                        key={item.label}
                        onMouseEnter={() => setHoveredBarIdx(idx)}
                        onMouseLeave={() => setHoveredBarIdx(null)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={x - 6}
                          y={16}
                          width={barWidth + 12}
                          height={165}
                          rx={10}
                          fill={isHovered ? '#F3F6FA' : 'transparent'}
                        />
                        <rect
                          x={x}
                          y={fitY}
                          width={barWidth}
                          height={Math.max(4, fitH)}
                          rx={6}
                          fill="#193368"
                        />
                        {revH > 0 && (
                          <rect
                            x={x}
                            y={revY}
                            width={barWidth}
                            height={Math.max(4, revH)}
                            rx={6}
                            fill="#60A5FA"
                          />
                        )}
                        <text
                          x={centerX}
                          y={196}
                          textAnchor="middle"
                          className={`text-[11px] ${
                            isHovered ? 'fill-[#0F1C36] font-semibold' : 'fill-[#66758C]'
                          }`}
                        >
                          {item.label}
                        </text>

                        {isHovered && (
                          <g transform={`translate(${Math.min(Math.max(centerX - 46, 28), 320)}, ${Math.max(revY - 38, 2)})`}>
                            <rect
                              width={92}
                              height={28}
                              rx={8}
                              fill="#0C1A38"
                            />
                            <text
                              x={46}
                              y={18}
                              textAnchor="middle"
                              className="fill-white text-[10px] font-medium"
                            >
                              {item.fit} Fit · {item.reviewOrPending} Pending
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </section>

            {/* Curved Area Chart: Mean Turnaround Trend */}
            <section className="md:col-span-5 surface-panel p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-ink-primary">
                    Turnaround Trend
                  </h2>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-semibold text-ink-primary tabular-nums">
                      2h 37m
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                      -11% vs SLA
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-ink-muted">Target: 180m</span>
              </div>

              <div className="mt-3">
                <svg
                  viewBox={`0 0 ${curveSvg.w} ${curveSvg.h}`}
                  role="img"
                  aria-label="Average examination turnaround trend"
                  className="w-full h-44 overflow-visible"
                >
                  <defs>
                    <linearGradient id="turnaroundArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2A70ED" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2A70ED" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <path d={curveSvg.areaD} fill="url(#turnaroundArea)" />
                  <path
                    d={curveSvg.lineD}
                    fill="none"
                    stroke="#2A70ED"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />

                  {curveSvg.pts.map((pt, idx) => {
                    const active = hoveredPointIdx === idx || (hoveredPointIdx === null && idx === curveSvg.pts.length - 1);
                    return (
                      <g
                        key={pt.label}
                        onMouseEnter={() => setHoveredPointIdx(idx)}
                        onMouseLeave={() => setHoveredPointIdx(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={active ? 5 : 3}
                          fill={active ? '#193368' : '#FFFFFF'}
                          stroke="#2A70ED"
                          strokeWidth={2}
                        />
                        {active && (
                          <g transform={`translate(${Math.min(Math.max(pt.x - 24, 4), curveSvg.w - 52)}, ${Math.max(pt.y - 26, 2)})`}>
                            <rect width={48} height={20} rx={6} fill="#193368" />
                            <text
                              x={24}
                              y={13}
                              textAnchor="middle"
                              className="fill-white text-[10px] font-medium"
                            >
                              {pt.value}m
                            </text>
                          </g>
                        )}
                        <text
                          x={pt.x}
                          y={curveSvg.h - 6}
                          textAnchor="middle"
                          className={`text-[10px] ${
                            active ? 'fill-[#0F1C36] font-semibold' : 'fill-[#66758C]'
                          }`}
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </section>
          </div>

          {/* Compact Recent Examinations List */}
          <section className="surface-panel overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-border/80 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink-primary">
                  Recent Examinations
                </h2>
                <p className="text-xs text-ink-muted">
                  Latest seafarer assessments synced with the clinic register
                </p>
              </div>
              <Link
                to={isNimasa ? '/nimasa/register' : activeRole === 'DOCTOR' ? '/doctor' : '/front-desk'}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-navy-800 transition-colors"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            {recentExaminations.length === 0 ? (
              <div className="p-10 text-center space-y-2.5 text-xs text-ink-muted">
                <div className="text-sm font-medium text-ink-primary">
                  No seafarer examinations recorded yet
                </div>
                <p>
                  {isNimasa
                    ? 'Consented seafarer examinations will appear here once registered at the clinic.'
                    : 'Register an arriving seafarer at Reception to begin tracking STCW Reg. I/9 examinations.'}
                </p>
                {!isNimasa && (
                  <Link
                    to="/front-desk"
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 text-white font-semibold"
                  >
                    Open Reception →
                  </Link>
                )}
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-surface-border/80 text-[11px] font-semibold uppercase tracking-wider text-ink-muted bg-surface-canvas/50">
                    <th scope="col" className="py-3 px-6">Seafarer</th>
                    <th scope="col" className="py-3 px-4">Duty Category</th>
                    <th scope="col" className="py-3 px-4">Outcome</th>
                    <th scope="col" className="py-3 px-6 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/70">
                  {recentExaminations.map((p) => {
                    const target = isNimasa
                      ? `/nimasa/patients/${p.recordNo}`
                      : `/doctor/patients/${p.recordNo}`;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => navigate(target)}
                        className="hover:bg-primary-50/35 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-navy-50 text-navy-800 font-semibold text-[11px] flex items-center justify-center shrink-0">
                              {getInitials(p.fullName)}
                            </span>
                            <div>
                              <div className="font-semibold text-ink-primary text-sm">
                                {p.fullName}
                              </div>
                              <div className="text-[11px] font-mono text-ink-muted">
                                {p.recordNo}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-ink-secondary">
                          {p.rmp?.category ?? '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <OutcomeBadge determination={p.rmp?.determination ?? 'Pending'} />
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-ink-secondary">
                          {p.rmp?.issuedCertificate?.certificateNo ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </section>
        </div>

        {/* Right Clinic Rail (4 cols) */}
        <aside className="xl:col-span-4 space-y-5">
          {/* Card 1: Clinic Schedule & Today's Attention */}
          <section className="surface-panel p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary-600" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-ink-primary">November 2026</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-medium">
                Today
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {WEEK_DAYS.map((d) => {
                const active = selectedDay === d.date;
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setSelectedDay(d.date)}
                    className={`py-2 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
                      active
                        ? 'bg-navy-800 text-white shadow-sm'
                        : 'hover:bg-surface-canvas text-ink-muted'
                    }`}
                  >
                    <span className={`text-[10px] ${active ? 'text-primary-200' : 'text-ink-muted'}`}>
                      {d.day}
                    </span>
                    <span className={`text-xs font-semibold tabular-nums ${active ? 'text-white' : 'text-ink-primary'}`}>
                      {d.date}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-surface-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Today&apos;s Attention
                </h3>
                <span className="text-[11px] text-ink-muted">
                  {attentionItems.length} open
                </span>
              </div>

              {attentionItems.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-canvas text-xs text-ink-muted text-center">
                  All scheduled items cleared for today.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {attentionItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.to}
                      className={`block p-3 rounded-xl bg-surface-canvas/75 hover:bg-primary-50/50 border border-surface-border/80 border-l-[3px] ${item.accent} transition-colors`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-ink-primary truncate">
                          {item.title}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-ink-muted shrink-0" aria-hidden="true" />
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[11px] text-ink-muted truncate">
                          {item.meta}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white text-ink-secondary border border-surface-border shrink-0">
                          {item.badge}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Card 2: Duty Category Split & Practice Readiness (subtle frosted glass) */}
          <section className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-primary">
                Duty Category Mix
              </h2>
              <span className="text-xs text-ink-muted tabular-nums">
                {examinedCount} seafarers
              </span>
            </div>

            <div className="space-y-3">
              {dutyCategories.map((cat) => {
                const pct = examinedCount > 0 ? Math.round((cat.count / examinedCount) * 100) : 0;
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-ink-secondary font-medium">{cat.label}</span>
                      <span className="text-ink-primary font-semibold tabular-nums">
                        {cat.count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-canvas overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cat.color} transition-all`}
                        style={{ width: `${Math.max(pct, cat.count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-surface-border/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-ink-secondary">
                <Wrench className="w-3.5 h-3.5 text-primary-600" aria-hidden="true" />
                <span>
                  Equipment:{' '}
                  <strong className="text-ink-primary">
                    {passedChecks}/{dailyEquipmentCheck.items.length} passed
                  </strong>
                </span>
              </div>
              <span className="text-[11px] text-ink-muted">
                Valid to {practice.expiresOn}
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
