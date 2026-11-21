import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Clock,
  TrendingUp,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

const DAILY_ATTENDANCE = [
  { day: 'Mon 16 Nov', count: 15, quota: 20 },
  { day: 'Tue 17 Nov', count: 18, quota: 20 },
  { day: 'Wed 18 Nov', count: 12, quota: 20 },
  { day: 'Thu 19 Nov', count: 16, quota: 20 },
  { day: 'Fri 20 Nov', count: 19, quota: 20 },
  { day: 'Sat 21 Nov (Today)', count: 14, quota: 20 },
];

const STAGE_DURATION_AVERAGES = [
  { stage: '1. Registered -> Awaiting doctor', minutes: 9, benchmark: 15 },
  { stage: '2. Awaiting doctor -> In assessment', minutes: 18, benchmark: 25 },
  { stage: '3. First assessment consultation', minutes: 21, benchmark: 25 },
  { stage: '4. Diagnostic tests (Lab & Radiology)', minutes: 68, benchmark: 90 },
  { stage: '5. Results ready -> Second assessment', minutes: 24, benchmark: 30 },
  { stage: '6. Second assessment -> Discharge', minutes: 17, benchmark: 20 },
];

export const NimasaReports: React.FC = () => {
  const { patients } = useHospital();
  const nimasaCount = patients.filter((p) => p.nimasaMember).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            to="/nimasa"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to NIMASA Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            NIMASA Sponsor Reports & Service Level Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Attendance volume and average turnaround time per clinical stage at
            Kingscare Hospital Abuja.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Reporting Period: 16 Nov – 21 Nov 2026</span>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            6-Day Total Attendance
          </span>
          <p className="text-3xl font-bold text-slate-900 mt-2">94 visits</p>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            78.3% average daily quota utilization
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Mean End-to-End Turnaround
          </span>
          <p className="text-3xl font-bold text-blue-700 mt-2">2h 37m</p>
          <p className="text-xs text-slate-500 mt-1">
            From Front Desk check-in to outpatient discharge
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            SLA Compliance Rate
          </span>
          <p className="text-3xl font-bold text-emerald-700 mt-2">96.4%</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            All {nimasaCount} active records stamped electronically
          </p>
        </div>
      </div>

      {/* Two Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Patients Per Day */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                NIMASA Patients Per Day
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily arrivals compared against the 20-patient daily quota
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Quota: 20 / day
            </span>
          </div>

          <div className="space-y-4">
            {DAILY_ATTENDANCE.map((item) => {
              const pct = Math.round((item.count / item.quota) * 100);
              return (
                <div key={item.day} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {item.day}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {item.count} / {item.quota} patients ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-lg overflow-hidden border border-slate-200/70">
                    <div
                      className="h-full bg-blue-600 rounded-l-md transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Average Time Per Stage */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Average Time Per Stage
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Measured in minutes from electronic trail timestamps vs SLA
                target
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Within SLA
            </span>
          </div>

          <div className="space-y-4">
            {STAGE_DURATION_AVERAGES.map((row) => {
              const widthPct = Math.min(100, Math.round((row.minutes / 90) * 100));
              return (
                <div key={row.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {row.stage}
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      {row.minutes} mins{' '}
                      <span className="text-slate-400 font-normal">
                        (SLA &lt; {row.benchmark}m)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-lg overflow-hidden border border-slate-200/70">
                    <div
                      className="h-full bg-emerald-600 rounded-l-md"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
