import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  UserPlus,
  Stethoscope,
  FlaskConical,
  ScanLine,
  Building2,
  LogIn,
  RotateCcw,
  FileBarChart,
  Users,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { RoleType } from '../../types';

interface RoleOption {
  role: RoleType | 'LOGIN';
  label: string;
  shortLabel: string;
  path: string;
  actor: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'LOGIN',
    label: '1. Login Screen',
    shortLabel: 'Login',
    path: '/login',
    actor: 'Guest',
  },
  {
    role: 'NIMASA',
    label: '2. NIMASA Portal (Sponsor)',
    shortLabel: 'NIMASA Portal',
    path: '/nimasa',
    actor: 'Mrs. Boma Dokubo-Peterside (NIMASA)',
  },
  {
    role: 'FRONT_DESK',
    label: '3. Hospital: Front Desk',
    shortLabel: 'Front Desk',
    path: '/front-desk',
    actor: 'Chidinma Okafor (Front Desk)',
  },
  {
    role: 'DOCTOR',
    label: '4. Hospital: Doctor',
    shortLabel: 'Doctor',
    path: '/doctor',
    actor: 'Dr. Babatunde Fashola-Cole (Consultant)',
  },
  {
    role: 'LAB',
    label: '5a. Hospital: Laboratory',
    shortLabel: 'Laboratory',
    path: '/lab',
    actor: 'MLS. Kelechi Nwachukwu (Lab)',
  },
  {
    role: 'RADIOLOGY',
    label: '5b. Hospital: Radiology',
    shortLabel: 'Radiology',
    path: '/radiology',
    actor: 'Dr. Musa Danbaba (Radiology)',
  },
  {
    role: 'ADMIN',
    label: '6. Hospital: Admin',
    shortLabel: 'Admin',
    path: '/admin',
    actor: 'Dr. Olumide Balogun (Medical Director)',
  },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeRole, setActiveRole, resetDemoData, auditLog } = useHospital();

  const currentPath = location.pathname;

  const inferCurrentRoleKey = (): RoleType | 'LOGIN' => {
    if (currentPath.startsWith('/login')) return 'LOGIN';
    if (currentPath.startsWith('/nimasa')) return 'NIMASA';
    if (currentPath.startsWith('/front-desk')) return 'FRONT_DESK';
    if (currentPath.startsWith('/doctor')) return 'DOCTOR';
    if (currentPath.startsWith('/lab')) return 'LAB';
    if (currentPath.startsWith('/radiology')) return 'RADIOLOGY';
    if (currentPath.startsWith('/admin')) return 'ADMIN';
    return activeRole;
  };

  const currentRoleKey = inferCurrentRoleKey();
  const currentRoleMeta =
    ROLE_OPTIONS.find((r) => r.role === currentRoleKey) || ROLE_OPTIONS[1];

  const handleRoleSwitch = (opt: RoleOption) => {
    if (opt.role !== 'LOGIN') {
      setActiveRole(opt.role);
    }
    navigate(opt.path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas text-ink-primary">
      {/* Keyboard Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary-700 focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Top Fictional Data Banner + Demo Mode Switcher */}
      <div
        role="region"
        aria-label="Demo mode controls"
        className="bg-slate-900 text-white border-b border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/40 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              Demo with fictional data
            </span>
            <span className="hidden md:inline text-slate-200">
              Interactive Electronic Patient Trail • Every action updates NIMASA & Audit Log live
            </span>
          </div>

          {/* Demo Mode Role Switcher (Top Right) */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-slate-300 font-medium hidden sm:inline" id="demo-role-label">
              Demo mode role switcher:
            </span>
            <div
              role="group"
              aria-labelledby="demo-role-label"
              className="flex flex-wrap items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700"
            >
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = currentRoleKey === opt.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    aria-pressed={isSelected}
                    title={`Switch to ${opt.label}`}
                    onClick={() => handleRoleSwitch(opt)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-slate-200 hover:text-white hover:bg-slate-700/80'
                    }`}
                  >
                    {opt.shortLabel}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={resetDemoData}
              aria-label="Reset fictional demo data to initial state"
              title="Reset fictional demo data to initial state"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden lg:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Brand Header */}
      <header className="bg-surface-card border-b border-surface-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Placeholder Kingscare Wordmark Top Left */}
          <div className="flex items-center gap-6">
            <Link to="/nimasa" className="flex items-center gap-2.5 group rounded-lg">
              <div
                aria-hidden="true"
                className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-primary-700 transition-colors"
              >
                K
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-ink-primary">
                    Kingscare
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-50 text-primary-800 border border-primary-200">
                    {currentRoleKey === 'NIMASA'
                      ? 'NIMASA Sponsor Portal'
                      : currentRoleKey === 'LOGIN'
                      ? 'Unified Portal'
                      : 'Hospital EHR & Trail'}
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted hidden sm:block">
                  Specialist Hospital Abuja • NIMASA Electronic Journey Tracker
                </p>
              </div>
            </Link>

            {/* Role-Contextual Sub-Navigation */}
            {currentRoleKey === 'NIMASA' && (
              <nav
                aria-label="NIMASA portal navigation"
                className="hidden md:flex items-center gap-1 pl-4 border-l border-surface-border"
              >
                <Link
                  to="/nimasa"
                  aria-current={
                    currentPath === '/nimasa' ||
                    currentPath.startsWith('/nimasa/patients')
                      ? 'page'
                      : undefined
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/nimasa' ||
                    currentPath.startsWith('/nimasa/patients')
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-ink-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  Patient Tracker Dashboard
                </Link>
                <Link
                  to="/nimasa/reports"
                  aria-current={currentPath === '/nimasa/reports' ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/nimasa/reports'
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-ink-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <FileBarChart className="w-4 h-4" aria-hidden="true" />
                  Sponsor Reports & Analytics
                </Link>
              </nav>
            )}

            {currentRoleKey === 'ADMIN' && (
              <nav
                aria-label="Hospital administration navigation"
                className="hidden md:flex items-center gap-1 pl-4 border-l border-surface-border"
              >
                <Link
                  to="/admin"
                  aria-current={currentPath === '/admin' ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/admin'
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-ink-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <Building2 className="w-4 h-4" aria-hidden="true" />
                  Master File (Departments)
                </Link>
                <Link
                  to="/admin/users"
                  aria-current={currentPath === '/admin/users' ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/admin/users'
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-ink-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <Users className="w-4 h-4" aria-hidden="true" />
                  Users & Roles
                </Link>
                <Link
                  to="/admin/audit"
                  aria-current={currentPath === '/admin/audit' ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/admin/audit'
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-ink-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" aria-hidden="true" />
                  Audit Log
                  <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-semibold">
                    {auditLog.length}
                  </span>
                </Link>
              </nav>
            )}

            {(currentRoleKey === 'FRONT_DESK' ||
              currentRoleKey === 'DOCTOR' ||
              currentRoleKey === 'LAB' ||
              currentRoleKey === 'RADIOLOGY') && (
              <nav
                aria-label="Hospital clinical navigation"
                className="hidden lg:flex items-center gap-1 pl-4 border-l border-surface-border"
              >
                <Link
                  to="/front-desk"
                  aria-current={currentPath.startsWith('/front-desk') ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath.startsWith('/front-desk')
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-ink-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  Front Desk
                </Link>
                <Link
                  to="/doctor"
                  aria-current={currentPath.startsWith('/doctor') ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath.startsWith('/doctor')
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-ink-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" aria-hidden="true" />
                  Doctor Workspace
                </Link>
                <Link
                  to="/lab"
                  aria-current={currentPath.startsWith('/lab') ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath.startsWith('/lab')
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-ink-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <FlaskConical className="w-4 h-4" aria-hidden="true" />
                  Laboratory
                </Link>
                <Link
                  to="/radiology"
                  aria-current={currentPath.startsWith('/radiology') ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath.startsWith('/radiology')
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-ink-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <ScanLine className="w-4 h-4" aria-hidden="true" />
                  Radiology
                </Link>
              </nav>
            )}
          </div>

          {/* Active User Stamp Info */}
          <div className="flex items-center gap-3">
            {currentRoleKey !== 'LOGIN' && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-ink-primary">
                  {currentRoleMeta.actor}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"
                  />
                  Electronic Trail Stamping Active
                </span>
              </div>
            )}
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border-strong text-xs font-medium text-ink-secondary hover:bg-surface-subtle transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Switch Login</span>
            </Link>
          </div>
        </div>

        {/* Mobile Secondary Sub-bar for NIMASA & Admin */}
        {currentRoleKey === 'NIMASA' && (
          <nav
            aria-label="NIMASA mobile navigation"
            className="md:hidden flex items-center gap-2 px-4 py-2 bg-surface-canvas border-t border-surface-border"
          >
            <Link
              to="/nimasa"
              aria-current={
                currentPath === '/nimasa' ||
                currentPath.startsWith('/nimasa/patients')
                  ? 'page'
                  : undefined
              }
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                currentPath === '/nimasa' ||
                currentPath.startsWith('/nimasa/patients')
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-card text-ink-secondary border border-surface-border'
              }`}
            >
              Patient Dashboard
            </Link>
            <Link
              to="/nimasa/reports"
              aria-current={currentPath === '/nimasa/reports' ? 'page' : undefined}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                currentPath === '/nimasa/reports'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-card text-ink-secondary border border-surface-border'
              }`}
            >
              Reports & Charts
            </Link>
          </nav>
        )}

        {currentRoleKey === 'ADMIN' && (
          <nav
            aria-label="Admin mobile navigation"
            className="md:hidden flex items-center gap-2 px-4 py-2 bg-surface-canvas border-t border-surface-border"
          >
            <Link
              to="/admin"
              aria-current={currentPath === '/admin' ? 'page' : undefined}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                currentPath === '/admin'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-card text-ink-secondary border border-surface-border'
              }`}
            >
              Master File
            </Link>
            <Link
              to="/admin/users"
              aria-current={currentPath === '/admin/users' ? 'page' : undefined}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                currentPath === '/admin/users'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-card text-ink-secondary border border-surface-border'
              }`}
            >
              Users
            </Link>
            <Link
              to="/admin/audit"
              aria-current={currentPath === '/admin/audit' ? 'page' : undefined}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                currentPath === '/admin/audit'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-card text-ink-secondary border border-surface-border'
              }`}
            >
              Audit ({auditLog.length})
            </Link>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none"
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-surface-card border-t border-surface-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-600" aria-hidden="true" />
            <span>
              <strong className="text-ink-primary">Kingscare Hospital</strong> •
              Electronic Medical Record & NIMASA Sponsor Tracking System
            </span>
          </div>
          <div className="font-medium text-ink-secondary">
            Prepared by Angel Tech & Media Limited
          </div>
        </div>
      </footer>
    </div>
  );
};
