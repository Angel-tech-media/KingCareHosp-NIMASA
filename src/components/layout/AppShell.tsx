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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Fictional Data Banner + Demo Mode Switcher */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Demo with fictional data
            </span>
            <span className="hidden md:inline text-slate-300">
              Interactive Electronic Patient Trail • Every action updates NIMASA & Audit Log live
            </span>
          </div>

          {/* Demo Mode Role Switcher (Top Right) */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-slate-400 font-medium hidden sm:inline">
              Demo mode role switcher:
            </span>
            <div className="flex flex-wrap items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = currentRoleKey === opt.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => handleRoleSwitch(opt)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/70'
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
              title="Reset fictional demo data to initial state"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Brand Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Placeholder Kingscare Wordmark Top Left */}
          <div className="flex items-center gap-6">
            <Link to="/nimasa" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
                K
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-slate-900">
                    Kingscare
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {currentRoleKey === 'NIMASA'
                      ? 'NIMASA Sponsor Portal'
                      : currentRoleKey === 'LOGIN'
                      ? 'Unified Portal'
                      : 'Hospital EHR & Trail'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Specialist Hospital Abuja • NIMASA Electronic Journey Tracker
                </p>
              </div>
            </Link>

            {/* Role-Contextual Sub-Navigation */}
            {currentRoleKey === 'NIMASA' && (
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
                <Link
                  to="/nimasa"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/nimasa' ||
                    currentPath.startsWith('/nimasa/patients')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Patient Tracker Dashboard
                </Link>
                <Link
                  to="/nimasa/reports"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/nimasa/reports'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileBarChart className="w-4 h-4" />
                  Sponsor Reports & Analytics
                </Link>
              </nav>
            )}

            {currentRoleKey === 'ADMIN' && (
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
                <Link
                  to="/admin"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/admin'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Master File (Departments)
                </Link>
                <Link
                  to="/admin/users"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/admin/users'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Users & Roles
                </Link>
                <Link
                  to="/admin/audit"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/admin/audit'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Audit Log
                  <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {auditLog.length}
                  </span>
                </Link>
              </nav>
            )}

            {(currentRoleKey === 'FRONT_DESK' ||
              currentRoleKey === 'DOCTOR' ||
              currentRoleKey === 'LAB' ||
              currentRoleKey === 'RADIOLOGY') && (
              <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-slate-200">
                <Link
                  to="/front-desk"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath.startsWith('/front-desk')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Front Desk
                </Link>
                <Link
                  to="/doctor"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath.startsWith('/doctor')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  Doctor Workspace
                </Link>
                <Link
                  to="/lab"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath.startsWith('/lab')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FlaskConical className="w-4 h-4" />
                  Laboratory
                </Link>
                <Link
                  to="/radiology"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath.startsWith('/radiology')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ScanLine className="w-4 h-4" />
                  Radiology
                </Link>
              </nav>
            )}
          </div>

          {/* Active User Stamp Info */}
          <div className="flex items-center gap-3">
            {currentRoleKey !== 'LOGIN' && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-800">
                  {currentRoleMeta.actor}
                </span>
                <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Electronic Trail Stamping Active
                </span>
              </div>
            )}
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch Login</span>
            </Link>
          </div>
        </div>

        {/* Mobile Secondary Sub-bar for NIMASA & Admin */}
        {currentRoleKey === 'NIMASA' && (
          <div className="md:hidden flex items-center gap-2 px-4 py-2 bg-slate-50 border-t border-slate-200">
            <Link
              to="/nimasa"
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                currentPath === '/nimasa' ||
                currentPath.startsWith('/nimasa/patients')
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Patient Dashboard
            </Link>
            <Link
              to="/nimasa/reports"
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                currentPath === '/nimasa/reports'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Reports & Charts
            </Link>
          </div>
        )}

        {currentRoleKey === 'ADMIN' && (
          <div className="md:hidden flex items-center gap-2 px-4 py-2 bg-slate-50 border-t border-slate-200">
            <Link
              to="/admin"
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                currentPath === '/admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Master File
            </Link>
            <Link
              to="/admin/users"
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                currentPath === '/admin/users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Users
            </Link>
            <Link
              to="/admin/audit"
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                currentPath === '/admin/audit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Audit ({auditLog.length})
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>
              <strong className="text-slate-700">Kingscare Hospital</strong> •
              Electronic Medical Record & NIMASA Sponsor Tracking System
            </span>
          </div>
          <div className="font-medium text-slate-700">
            Prepared by Angel Tech & Media Limited
          </div>
        </div>
      </footer>
    </div>
  );
};
