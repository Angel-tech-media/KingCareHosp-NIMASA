import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { PageHeader } from '../../components/ui';

const DAILY_EXAMINATIONS = [
  { day: 'Mon 16 Nov', count: 15, capacity: 20 },
  { day: 'Tue 17 Nov', count: 18, capacity: 20 },
  { day: 'Wed 18 Nov', count: 22, capacity: 20 },
  { day: 'Thu 19 Nov', count: 19, capacity: 20 },
  { day: 'Fri 20 Nov', count: 20, capacity: 20 },
];

const STAGE_DURATION_AVERAGES = [
  { stage: '1. Reception & ID Gate', minutes: 9, benchmark: 15 },
  { stage: '2. Vision, Colour & Hearing', minutes: 18, benchmark: 25 },
  { stage: '3. RMP Physical Assessment', minutes: 21, benchmark: 25 },
  { stage: '4. Lab & Specialist Referrals', minutes: 68, benchmark: 90 },
  { stage: '5. Determination & QAF-804-02', minutes: 24, benchmark: 30 },
  { stage: '6. Certificate Check & Issue', minutes: 17, benchmark: 20 },
];

export const NimasaReports: React.FC = () => {
  const { patients } = useHospital();

  const totalWeeklyExaminations = DAILY_EXAMINATIONS.reduce((sum, d) => sum + d.count, 0);
  const completedCount = patients.filter(
    (p) => Boolean(p.rmp?.determination && p.rmp.determination !== 'Pending')
  ).length;
  const maxDailyCount = Math.max(...DAILY_EXAMINATIONS.map((d) => d.count));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Reports"
        subtitle="STCW Regulation I/9 examination volume, stage turnaround benchmarks, and QSS reporting metrics."
        actions={
          <Link
            to="/nimasa/register"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-navy-800 border border-surface-border bg-white px-3.5 py-2 rounded-xl shadow-card transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Register
          </Link>
        }
      />

      {/* Quiet 3-column elevated KPI strip */}
      <div className="surface-panel grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-surface-border">
        <div className="px-6 py-5">
          <div className="text-xs font-medium text-ink-muted">Examinations (5 Days)</div>
          <div className="text-2xl font-semibold tracking-tight text-ink-primary mt-1 tabular-nums">
            {totalWeeklyExaminations}
          </div>
          <div className="text-xs text-ink-secondary mt-1">
            {completedCount} completed in live clinic register
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="text-xs font-medium text-ink-muted">Mean Turnaround Time</div>
          <div className="text-2xl font-semibold tracking-tight text-ink-primary mt-1 tabular-nums">
            2h 37m
          </div>
          <div className="text-xs text-emerald-700 mt-1">Within 3h QSS target</div>
        </div>
        <div className="px-6 py-5">
          <div className="text-xs font-medium text-ink-muted">QSS Stage SLA Compliance</div>
          <div className="text-2xl font-semibold tracking-tight text-ink-primary mt-1 tabular-nums">
            96.4%
          </div>
          <div className="text-xs text-ink-secondary mt-1">All 6 pathway stages tracked</div>
        </div>
      </div>

      {/* Two balanced report cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="surface-panel p-6">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <h2 className="text-base font-semibold text-ink-primary">Daily Examination Volume</h2>
            <span className="text-xs text-ink-muted">Capacity: 20 / day</span>
          </div>
          <div className="space-y-4 mt-5">
            {DAILY_EXAMINATIONS.map((day) => {
              const pct = Math.round((day.count / Math.max(20, maxDailyCount)) * 100);
              return (
                <div key={day.day}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-ink-primary">{day.day}</span>
                    <span className="text-ink-muted tabular-nums">
                      <strong className="text-ink-primary font-semibold">{day.count}</strong> exams
                    </span>
                  </div>
                  <div className="h-2.5 bg-surface-canvas rounded-full overflow-hidden border border-surface-border/70">
                    <div
                      className="h-full bg-navy-800 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-panel p-6">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <h2 className="text-base font-semibold text-ink-primary">Stage Turnaround Benchmarks</h2>
            <span className="text-xs text-ink-muted">Mean vs QSS target</span>
          </div>
          <div className="space-y-4 mt-5">
            {STAGE_DURATION_AVERAGES.map((item) => {
              const pct = Math.min(100, Math.round((item.minutes / item.benchmark) * 100));
              return (
                <div key={item.stage}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-ink-primary">{item.stage}</span>
                    <span className="text-ink-muted tabular-nums">
                      <strong className="text-ink-primary font-semibold">{item.minutes} min</strong>{' '}
                      <span className="text-ink-muted">/ {item.benchmark} min</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-surface-canvas rounded-full overflow-hidden border border-surface-border/70">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
