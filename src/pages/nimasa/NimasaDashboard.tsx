import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Users,
  Activity,
  CheckCircle2,
  Gauge,
  Search,
  Filter,
  ChevronRight,
  FileBarChart,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { StageChip, StatusChip } from '../../components/ui/StageChip';
import { PatientStage } from '../../types';

const ALL_STAGES: PatientStage[] = [
  'Registered',
  'Awaiting doctor',
  'In assessment',
  'First assessment complete',
  'Tests requested',
  'Admitted',
  'Results ready',
  'Second assessment',
  'Discharged',
];

export const NimasaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { patients } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>(
    'ALL'
  );
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  // Filter to NIMASA members with consent
  const nimasaPatients = useMemo(
    () => patients.filter((p) => p.nimasaMember && p.consentToShareWithNimasa),
    [patients]
  );

  const totalRegistered = nimasaPatients.length;
  const activeCount = nimasaPatients.filter((p) => p.status === 'Active').length;
  const dischargedCount = nimasaPatients.filter(
    (p) => p.status === 'Inactive'
  ).length;

  // Daily quota calculation (e.g. 14 / 20)
  const dailyQuotaMax = 20;
  const todaysCount = Math.min(
    dailyQuotaMax,
    nimasaPatients.filter((p) => p.arrivedAt.startsWith('21 Nov')).length + 3
  );
  const quotaPct = Math.round((todaysCount / dailyQuotaMax) * 100);

  const filteredPatients = useMemo(() => {
    return nimasaPatients.filter((p) => {
      const matchesSearch =
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.recordNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.currentLocation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ? true : p.status === statusFilter;

      const matchesStage =
        stageFilter === 'ALL' ? true : p.currentStage === stageFilter;

      return matchesSearch && matchesStatus && matchesStage;
    });
  }, [nimasaPatients, searchQuery, statusFilter, stageFilter]);

  return (
    <div className="space-y-6">
      {/* Top Page Title + Reports CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            NIMASA Sponsor Oversight Portal (Read-Only)
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Member Hospital Journey Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Real-time tracking of NIMASA staff attending Kingscare Hospital from
            reception to discharge.
          </p>
        </div>

        <Link
          to="/nimasa/reports"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium text-sm shadow-sm transition-colors"
        >
          <FileBarChart className="w-4 h-4 text-blue-600" />
          <span>View Sponsor Reports & Charts</span>
        </Link>
      </div>

      {/* Kingscare Partner Hospital Card + Abuja Map Placeholder */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                Accredited NIMASA Retainer Hospital
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Facility Code: KC-ABJ-01
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Kingscare Specialist Hospital, Abuja
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600 pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Plot 412 Ahmadu Bello Way, Garki II District, Abuja, FCT,
                  Nigeria
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  NIMASA Desk: +234 (0) 9 291 4400 • 24/7 Emergency Triage
                </span>
              </div>
            </div>
          </div>

          {/* Stylised Abuja Map Placeholder */}
          <div className="relative h-32 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
            <svg
              className="absolute inset-0 w-full h-full text-slate-200"
              viewBox="0 0 300 120"
              fill="none"
            >
              <path
                d="M0 30 H300 M0 65 H300 M0 95 H300 M60 0 V120 M145 0 V120 M230 0 V120"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10 110 Q 120 40 290 15"
                stroke="#93c5fd"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
            <div className="relative z-10 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">
                  Kingscare Garki II, Abuja
                </p>
                <p className="text-[11px] text-slate-500">
                  9.0385° N, 7.4934° E • Map Preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Dashboard KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Total NIMASA patients registered */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total NIMASA Registered
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">
            {totalRegistered}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Staff & members enrolled at Kingscare
          </p>
        </div>

        {/* Tile 2: In hospital now (active) */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              In Hospital Now (Active)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-3xl font-bold text-emerald-700">{activeCount}</p>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Live in care
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across consultation, labs & ward
          </p>
        </div>

        {/* Tile 3: Discharged (inactive) */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Discharged (Inactive)
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-700 mt-3">
            {dischargedCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Completed medical journey & cleared
          </p>
        </div>

        {/* Tile 4: Today's count vs daily quota (e.g. 14 / 20) */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today&apos;s Count vs Quota
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-3xl font-bold text-slate-900">
              {todaysCount}{' '}
              <span className="text-lg font-medium text-slate-400">
                / {dailyQuotaMax}
              </span>
            </p>
            <span className="text-xs font-semibold text-blue-700">
              {quotaPct}% of daily quota
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2.5">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${quotaPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Patient Tracking Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              NIMASA Patient Journey Directory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any row to open the member&apos;s horizontal stage timeline
              and timestamped electronic trail.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search record no., name, location..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Active / Inactive Filter */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {(['ALL', 'Active', 'Inactive'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All Status' : st}
                </button>
              ))}
            </div>

            {/* Stage Filter */}
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="pl-8 pr-7 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All Stages ({nimasaPatients.length})</option>
                {ALL_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Record No.</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Location Now</th>
                <th className="py-3 px-4">Time in Hospital</th>
                <th className="py-3 px-4">Active / Inactive</th>
                <th className="py-3 px-4 text-right">Journey</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-slate-500 text-sm"
                  >
                    No NIMASA patient records match your current filter.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() =>
                      navigate(`/nimasa/patients/${patient.recordNo}`)
                    }
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-700">
                      {patient.recordNo}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {patient.fullName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {patient.nimasaStaffId} • {patient.nimasaDepartment}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StageChip stage={patient.currentStage} />
                    </td>
                    <td className="py-3.5 px-4 text-xs sm:text-sm text-slate-700 font-medium">
                      {patient.currentLocation}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {patient.timeInHospital}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusChip status={patient.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                        Timeline
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
