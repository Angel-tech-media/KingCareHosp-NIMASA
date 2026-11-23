import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserPlus,
  Stethoscope,
  FlaskConical,
  ScanLine,
  Building2,
  LogOut,
  RotateCcw,
  BarChart3,
  Users,
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  Check,
  Menu,
  X,
  Eye,
  LayoutDashboard,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { RoleType } from '../../types';

type RoleKey = RoleType | 'LOGIN';

interface RoleOption {
  role: RoleKey;
  label: string;
  group: 'Entry' | 'Sponsor' | 'Hospital';
  path: string;
  actor: string;
  actorTitle: string;
  initials: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'LOGIN',
    label: 'Login screen',
    group: 'Entry',
    path: '/login',
    actor: 'Guest',
    actorTitle: 'Not signed in',
    initials: 'G',
  },
  {
    role: 'NIMASA',
    label: 'NIMASA portal',
    group: 'Sponsor',
    path: '/nimasa',
    actor: 'Mrs. Boma Dokubo-Peterside',
    actorTitle: 'NIMASA Medical Liaison',
    initials: 'BD',
  },
  {
    role: 'FRONT_DESK',
    label: 'Front desk',
    group: 'Hospital',
    path: '/front-desk',
    actor: 'Chidinma Okafor',
    actorTitle: 'Front Desk Officer',
    initials: 'CO',
  },
  {
    role: 'DOCTOR',
    label: 'Doctor',
    group: 'Hospital',
    path: '/doctor',
    actor: 'Dr. Babatunde Fashola-Cole',
    actorTitle: 'Consultant Physician',
    initials: 'BF',
  },
  {
    role: 'LAB',
    label: 'Laboratory',
    group: 'Hospital',
    path: '/lab',
    actor: 'MLS. Kelechi Nwachukwu',
    actorTitle: 'Medical Lab Scientist',
    initials: 'KN',
  },
  {
    role: 'RADIOLOGY',
    label: 'Radiology',
    group: 'Hospital',
    path: '/radiology',
    actor: 'Dr. Musa Danbaba',
    actorTitle: 'Radiologist',
    initials: 'MD',
  },
  {
    role: 'ADMIN',
    label: 'Admin',
    group: 'Hospital',
    path: '/admin',
    actor: 'Dr. Olumide Balogun',
    actorTitle: 'Medical Director',
    initials: 'OB',
  },
];

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  isActive: (path: string) => boolean;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const inferRoleFromPath = (path: string, fallback: RoleType): RoleKey => {
  if (path.startsWith('/login')) return 'LOGIN';
  if (path.startsWith('/nimasa')) return 'NIMASA';
  if (path.startsWith('/front-desk')) return 'FRONT_DESK';
  if (path.startsWith('/doctor')) return 'DOCTOR';
  if (path.startsWith('/lab')) return 'LAB';
  if (path.startsWith('/radiology')) return 'RADIOLOGY';
  if (path.startsWith('/admin')) return 'ADMIN';
  return fallback;
};

const getPageTitle = (path: string): { section: string; title: string } => {
  if (path.startsWith('/nimasa/patients')) return { section: 'NIMASA', title: 'Seafarer journey' };
  if (path.startsWith('/nimasa/compliance')) return { section: 'NIMASA', title: 'Verification & returns' };
  if (path.startsWith('/nimasa/reports')) return { section: 'NIMASA', title: 'Reports' };
  if (path.startsWith('/nimasa')) return { section: 'NIMASA', title: 'Dashboard' };
  if (path.startsWith('/front-desk')) return { section: 'Hospital', title: 'Reception & identity gate' };
  if (path.startsWith('/doctor/patients')) return { section: 'RMP Doctor', title: 'Seafarer exam & certificate' };
  if (path.startsWith('/doctor')) return { section: 'Hospital', title: 'My seafarers' };
  if (path.startsWith('/lab')) return { section: 'Hospital', title: 'Laboratory' };
  if (path.startsWith('/radiology')) return { section: 'Hospital', title: 'Radiology' };
  if (path.startsWith('/admin/qss')) return { section: 'Admin', title: 'QSS compliance & stock' };
  if (path.startsWith('/admin/governance')) return { section: 'Admin', title: 'Audit, CAPA & risks' };
  if (path.startsWith('/admin/users')) return { section: 'Admin', title: 'Users & roles' };
  if (path.startsWith('/admin/audit')) return { section: 'Admin', title: 'Audit log' };
  if (path.startsWith('/admin')) return { section: 'Admin', title: 'Master file' };
  return { section: '', title: 'Kingscare' };
};

/* ------------------------------------------------------------------ */
/* Brand wordmark                                                      */
/* ------------------------------------------------------------------ */
const Wordmark: React.FC<{ subtitle?: string }> = ({ subtitle }) => (
  <div className="flex items-center gap-2.5">
    <div
      aria-hidden="true"
      className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-[15px] shadow-sm"
    >
      K
    </div>
    <div className="leading-tight">
      <div className="text-[15px] font-bold tracking-tight text-ink-primary">Kingscare</div>
      {subtitle && <div className="text-[11px] text-ink-muted">{subtitle}</div>}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Demo role switcher (dropdown)                                       */
/* ------------------------------------------------------------------ */
const RoleSwitcher: React.FC<{
  current: RoleOption;
  onSelect: (opt: RoleOption) => void;
}> = ({ current, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const groups: RoleOption['group'][] = ['Entry', 'Sponsor', 'Hospital'];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-lg bg-white/70 hover:bg-white border border-amber-300 text-xs font-semibold text-amber-950 transition-colors"
      >
        <Eye className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
        <span className="hidden sm:inline text-amber-800 font-medium">View as</span>
        <span>{current.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-amber-700 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Switch demo role"
          className="absolute right-0 mt-2 w-72 rounded-lg bg-surface-card border border-surface-border shadow-xl p-1.5 z-50"
        >
          {groups.map((group) => (
            <div key={group} className="py-1">
              <div className="px-2.5 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                {group}
              </div>
              {ROLE_OPTIONS.filter((o) => o.group === group).map((opt) => {
                const selected = opt.role === current.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => {
                      setOpen(false);
                      onSelect(opt);
                    }}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      selected ? 'bg-primary-50' : 'hover:bg-surface-subtle'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        selected ? 'bg-primary-600 text-white' : 'bg-surface-subtle text-ink-secondary'
                      }`}
                    >
                      {opt.initials}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-ink-primary">{opt.label}</span>
                      <span className="block text-xs text-ink-muted truncate">{opt.actor}</span>
                    </span>
                    {selected && <Check className="w-4 h-4 text-primary-600" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* App shell                                                           */
/* ------------------------------------------------------------------ */
export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeRole, setActiveRole, resetDemoData, auditLog } = useHospital();
  const [resetToast, setResetToast] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentPath = location.pathname;
  const currentRoleKey = inferRoleFromPath(currentPath, activeRole);
  const currentRole = ROLE_OPTIONS.find((r) => r.role === currentRoleKey) || ROLE_OPTIONS[1];
  const isLogin = currentRoleKey === 'LOGIN';
  const page = getPageTitle(currentPath);

  // Close mobile drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [currentPath]);

  const handleRoleSwitch = (opt: RoleOption) => {
    if (opt.role !== 'LOGIN') setActiveRole(opt.role);
    navigate(opt.path);
  };

  const handleResetDemo = () => {
    resetDemoData();
    setResetToast(true);
    window.setTimeout(() => setResetToast(false), 2600);
  };

  const sections: NavSection[] = (() => {
    if (currentRoleKey === 'NIMASA') {
      return [
        {
          title: 'Sponsor portal',
          items: [
            {
              to: '/nimasa',
              label: 'Dashboard',
              icon: LayoutDashboard,
              isActive: (p) => p === '/nimasa' || p.startsWith('/nimasa/patients'),
            },
            {
              to: '/nimasa/compliance',
              label: 'Verify & returns',
              icon: ShieldCheck,
              isActive: (p) => p.startsWith('/nimasa/compliance'),
            },
            {
              to: '/nimasa/reports',
              label: 'Reports',
              icon: BarChart3,
              isActive: (p) => p.startsWith('/nimasa/reports'),
            },
          ],
        },
      ];
    }
    if (currentRoleKey === 'ADMIN') {
      return [
        {
          title: 'Administration',
          items: [
            { to: '/admin', label: 'Master file', icon: Building2, isActive: (p) => p === '/admin' },
            { to: '/admin/qss', label: 'QSS & stock', icon: ShieldCheck, isActive: (p) => p.startsWith('/admin/qss') },
            { to: '/admin/governance', label: 'Audit, CAPA & risks', icon: ClipboardList, isActive: (p) => p.startsWith('/admin/governance') },
            { to: '/admin/users', label: 'Users & roles', icon: Users, isActive: (p) => p.startsWith('/admin/users') },
            {
              to: '/admin/audit',
              label: 'Audit log',
              icon: ClipboardList,
              isActive: (p) => p.startsWith('/admin/audit'),
              badge: auditLog.length,
            },
          ],
        },
      ];
    }
    return [
      {
        title: 'Hospital workspaces',
        items: [
          { to: '/front-desk', label: 'Front desk', icon: UserPlus, isActive: (p) => p.startsWith('/front-desk') },
          { to: '/doctor', label: 'Doctor', icon: Stethoscope, isActive: (p) => p.startsWith('/doctor') },
          { to: '/lab', label: 'Laboratory', icon: FlaskConical, isActive: (p) => p.startsWith('/lab') },
          { to: '/radiology', label: 'Radiology', icon: ScanLine, isActive: (p) => p.startsWith('/radiology') },
        ],
      },
    ];
  })();

  /* -------------------- Demo strip (always visible) -------------------- */
  const demoStrip = (
    <div
      role="region"
      aria-label="Demo mode controls"
      className="bg-amber-50 border-b border-amber-200"
    >
      <div className="px-3 sm:px-6 min-h-[2.75rem] py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-950 font-semibold shrink-0">
            Demo
          </span>
          <span className="hidden sm:inline text-amber-900 truncate">
            <span className="font-medium">Fictional data.</span>
            <span className="hidden md:inline"> Every action updates the NIMASA view and audit log live.</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <RoleSwitcher current={currentRole} onSelect={handleRoleSwitch} />
          <button
            type="button"
            onClick={handleResetDemo}
            aria-label="Reset fictional demo data to initial state"
            title="Reset demo data"
            className="inline-flex items-center justify-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-lg text-xs font-semibold text-amber-900 hover:bg-amber-100 border border-transparent hover:border-amber-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );

  const toast = resetToast && (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-xl"
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
      <span>Demo data reset to its initial state</span>
    </div>
  );

  const footer = (
    <footer className="border-t border-surface-border">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-ink-muted">
        <span>Kingscare Hospital · Patient journey & NIMASA sponsor tracking</span>
        <span className="font-medium text-ink-secondary">Prepared by Angel Tech & Media Limited</span>
      </div>
    </footer>
  );

  /* -------------------- Login layout (no sidebar) -------------------- */
  if (isLogin) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-canvas text-ink-primary">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary-700 focus:text-white focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>
        {demoStrip}
        <header className="px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Wordmark subtitle="Specialist Hospital, Abuja" />
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 focus:outline-none">
          {children}
        </main>
        {footer}
        {toast}
      </div>
    );
  }

  /* -------------------- Sidebar content -------------------- */
  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="h-16 px-5 flex items-center border-b border-surface-border">
        <Link to={currentRole.path} className="rounded-lg">
          <Wordmark subtitle={currentRoleKey === 'NIMASA' ? 'NIMASA sponsor portal' : 'Hospital workspace'} />
        </Link>
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.isActive(currentPath);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary-50 text-primary-800'
                          : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink-primary'
                      }`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] ${active ? 'text-primary-600' : 'text-ink-muted group-hover:text-ink-secondary'}`}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.label}</span>
                      {typeof item.badge === 'number' && (
                        <span
                          className={`min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                            active ? 'bg-primary-600 text-white' : 'bg-surface-subtle text-ink-secondary'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {currentRoleKey === 'NIMASA' && (
          <div className="mx-3 p-3 rounded-lg bg-surface-canvas border border-surface-border text-xs text-ink-muted leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-ink-secondary mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              Read-only access
            </div>
            Full clinical notes and raw results are held by Kingscare.
          </div>
        )}
      </nav>

      {/* Signed-in user */}
      <div className="p-3 border-t border-surface-border">
        <div className="flex items-center gap-3 p-2 rounded-lg">
          <span
            aria-hidden="true"
            className="w-9 h-9 shrink-0 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-bold"
          >
            {currentRole.initials}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink-primary truncate">{currentRole.actor}</div>
            <div className="text-xs text-ink-muted truncate">{currentRole.actorTitle}</div>
          </div>
          <Link
            to="/login"
            aria-label="Sign out"
            title="Sign out"
            className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-subtle transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );

  /* -------------------- Authenticated layout -------------------- */
  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas text-ink-primary overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary-700 focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>

      {demoStrip}

      <div className="flex-1 flex min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 bg-surface-card border-r border-surface-border sticky top-0 h-[calc(100vh-2.75rem)]">
          {sidebarContent}
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawerOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-surface-card shadow-xl">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="absolute top-3.5 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-ink-muted hover:bg-surface-subtle"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Main column */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 h-16 bg-surface-canvas/90 backdrop-blur border-b border-surface-border">
            <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation"
                className="lg:hidden -ml-1 w-10 h-10 rounded-lg flex items-center justify-center text-ink-secondary hover:bg-surface-subtle"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                {page.section && (
                  <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{page.section}</div>
                )}
                <div className="text-base font-semibold text-ink-primary truncate">{page.title}</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-800">
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Trail recording
                </span>
              </div>
            </div>
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 focus:outline-none"
          >
            {children}
          </main>

          {footer}
        </div>
      </div>

      {toast}
    </div>
  );
};
