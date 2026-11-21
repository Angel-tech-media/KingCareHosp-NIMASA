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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-ink-primary">
            Member journeys
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Live view of NIMASA staff at Kingscare, from reception to discharge.
          </p>
        </div>

        <Link
          to="/nimasa/reports"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-surface-card border border-surface-border-strong hover:bg-primary-50/50 hover:border-primary-300 text-ink-primary font-medium text-sm shadow-card transition-all active:scale-[0.99]"
        >
          <FileBarChart className="w-4 h-4 text-primary-600" aria-hidden="true" />
          <span>View reports</span>
        </Link>
      </div>

      {/* Kingscare Partner Hospital Card + Abuja Map Placeholder */}
      <div className="bg-surface-card rounded-lg border border-surface-border shadow-card p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Accredited NIMASA retainer hospital
              </span>
              <span className="text-xs text-ink-muted font-medium">
                Facility code KC-ABJ-01
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-ink-primary">
              Kingscare Specialist Hospital, Abuja
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-ink-secondary pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Plot 412 Ahmadu Bello Way, Garki II District, Abuja, FCT,
                  Nigeria
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  NIMASA desk: +234 (0) 9 291 4400 · 24/7 emergency triage
                </span>
              </div>
            </div>
          </div>

          {/* Stylised Abuja Map Placeholder */}
          <div className="relative h-32 rounded-lg border border-surface-border bg-surface-subtle overflow-hidden flex items-center justify-center">
            <svg
              aria-hidden="true"
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
        <div className="bg-surface-card rounded-lg border border-surface-border p-5 shadow-card hover:shadow-card-hover hover:border-surface-border-strong transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Total NIMASA Registered
            </span>
            <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-ink-primary mt-3">
            {totalRegistered}
          </p>
          <p className="text-xs text-ink-muted mt-1">
            Staff & members enrolled at Kingscare
          </p>
        </div>

        {/* Tile 2: In hospital now (active) */}
        <div className="bg-surface-card rounded-lg border border-surface-border p-5 shadow-card hover:shadow-card-hover hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              In Hospital Now (Active)
            </span>
            <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-3xl font-bold text-emerald-800">{activeCount}</p>
            <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Live in care
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Across consultation, labs & ward
          </p>
        </div>

        {/* Tile 3: Discharged (inactive) */}
        <div className="bg-surface-card rounded-lg border border-surface-border p-5 shadow-card hover:shadow-card-hover hover:border-surface-border-strong transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Discharged (Inactive)
            </span>
            <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-surface-subtle text-ink-secondary flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-ink-secondary mt-3">
            {dischargedCount}
          </p>
          <p className="text-xs text-ink-muted mt-1">
            Completed medical journey & cleared
          </p>
        </div>

        {/* Tile 4: Today's count vs daily quota (e.g. 14 / 20) */}
        <div className="bg-surface-card rounded-lg border border-surface-border p-5 shadow-card hover:shadow-card-hover hover:border-primary-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Today&apos;s Count vs Quota
            </span>
            <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-3xl font-bold text-ink-primary">
              {todaysCount}{' '}
              <span className="text-lg font-medium text-ink-muted">
                / {dailyQuotaMax}
              </span>
            </p>
            <span className="text-xs font-semibold text-primary-700">
              {quotaPct}% of daily quota
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Daily NIMASA quota utilization"
            aria-valuenow={todaysCount}
            aria-valuemin={0}
            aria-valuemax={dailyQuotaMax}
            className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden mt-2.5"
          >
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${quotaPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Patient Tracking Table */}
      <section
        aria-labelledby="nimasa-directory-heading"
        className="bg-surface-card rounded-lg border border-surface-border shadow-card overflow-hidden"
      >
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-surface-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 id="nimasa-directory-heading" className="text-base font-bold text-ink-primary">
              NIMASA Patient Journey Directory
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Click or press Enter on any row to open the member&apos;s horizontal stage timeline
              and timestamped electronic trail.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search
                aria-hidden="true"
                className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="search"
                aria-label="Search NIMASA patients by record number, name, or location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search record no., name, location..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-surface-border-strong text-xs sm:text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            {/* Active / Inactive Filter */}
            <div
              role="group"
              aria-label="Filter patients by active status"
              className="inline-flex rounded-lg border border-surface-border p-0.5 bg-surface-canvas"
            >
              {(['ALL', 'Active', 'Inactive'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  aria-pressed={statusFilter === st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-surface-card text-ink-primary shadow-sm'
                      : 'text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  {st === 'ALL' ? 'All Status' : st}
                </button>
              ))}
            </div>

            {/* Stage Filter */}
            <div className="relative">
              <Filter
                aria-hidden="true"
                className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <select
                aria-label="Filter patients by care stage"
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="pl-8 pr-7 py-1.5 rounded-lg border border-surface-border-strong text-xs font-medium text-ink-secondary bg-surface-card focus:outline-none focus:ring-2 focus:ring-primary-600"
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

        {/* Mobile Stacked Card List (< md) */}
        <div className="md:hidden divide-y divide-surface-border">
          {filteredPatients.length === 0 ? (
            <div className="py-10 px-4 text-center text-ink-muted text-sm">
              No NIMASA patient records match your current filter.
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => navigate(`/nimasa/patients/${patient.recordNo}`)}
                className="w-full text-left p-4 hover:bg-primary-50/40 active:bg-primary-50/70 transition-colors space-y-2.5 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-primary-700">
                    {patient.recordNo}
                  </span>
                  <StatusChip status={patient.status} />
                </div>

                <div>
                  <div className="font-semibold text-ink-primary group-hover:text-primary-700 transition-colors">
                    {patient.fullName}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {patient.nimasaStaffId} • {patient.nimasaDepartment}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <StageChip stage={patient.currentStage} />
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700">
                    Timeline
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-ink-muted pt-1 border-t border-surface-border/70">
                  <span className="font-medium text-ink-secondary">
                    {patient.currentLocation}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {patient.timeInHospital}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Desktop Responsive Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table
            aria-label="NIMASA Patient Journey Directory"
            className="w-full text-left border-collapse"
          >
            <thead>
              <tr className="bg-surface-canvas border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th scope="col" className="py-3 px-4">Record No.</th>
                <th scope="col" className="py-3 px-4">Name</th>
                <th scope="col" className="py-3 px-4">Current Stage</th>
                <th scope="col" className="py-3 px-4">Location Now</th>
                <th scope="col" className="py-3 px-4">Time in Hospital</th>
                <th scope="col" className="py-3 px-4">Active / Inactive</th>
                <th scope="col" className="py-3 px-4 text-right">Journey</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-sm">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-ink-muted text-sm"
                  >
                    No NIMASA patient records match your current filter.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    tabIndex={0}
                    role="link"
                    aria-label={`View stage timeline for ${patient.fullName}, record ${patient.recordNo}, currently ${patient.currentStage}`}
                    onClick={() =>
                      navigate(`/nimasa/patients/${patient.recordNo}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/nimasa/patients/${patient.recordNo}`);
                      }
                    }}
                    className="hover:bg-primary-50/50 focus-visible:bg-primary-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-primary-700">
                      {patient.recordNo}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-ink-primary group-hover:text-primary-700 transition-colors">
                        {patient.fullName}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {patient.nimasaStaffId} • {patient.nimasaDepartment}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StageChip stage={patient.currentStage} />
                    </td>
                    <td className="py-3.5 px-4 text-xs sm:text-sm text-ink-secondary font-medium">
                      {patient.currentLocation}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                        {patient.timeInHospital}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusChip status={patient.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 group-hover:translate-x-0.5 transition-transform">
                        Timeline
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
