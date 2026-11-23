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
  BarChart3,
  Users,
  ClipboardList,
  ChevronUp,
  Check,
  Menu,
  X,
  LayoutDashboard,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { RoleType } from '../../types';

type RoleKey = RoleType | 'LOGIN';

interface WorkspaceOption {
  role: RoleType;
  label: string;
  group: 'NIMASA Oversight' | 'Kingscare Practice';
  path: string;
  actor: string;
  actorTitle: string;
  initials: string;
}

const WORKSPACES: WorkspaceOption[] = [
  {
    role: 'NIMASA',
    label: 'NIMASA Agency Portal',
    group: 'NIMASA Oversight',
    path: '/nimasa',
    actor: 'Mrs. Boma Dokubo-Peterside',
    actorTitle: 'NIMASA Medical Liaison',
    initials: 'BD',
  },
  {
    role: 'FRONT_DESK',
    label: 'Reception & Identity Gate',
    group: 'Kingscare Practice',
    path: '/front-desk',
    actor: 'Chidinma Okafor',
    actorTitle: 'Registration Officer',
    initials: 'CO',
  },
  {
    role: 'DOCTOR',
    label: 'RMP Examination Desk',
    group: 'Kingscare Practice',
    path: '/doctor',
    actor: 'Dr. Babatunde Fashola-Cole',
    actorTitle: 'Recognized Medical Practitioner',
    initials: 'BF',
  },
  {
    role: 'LAB',
    label: 'Clinical Laboratory',
    group: 'Kingscare Practice',
    path: '/lab',
    actor: 'MLS. Kelechi Nwachukwu',
    actorTitle: 'Medical Laboratory Scientist',
    initials: 'KN',
  },
  {
    role: 'RADIOLOGY',
    label: 'Radiology & Imaging',
    group: 'Kingscare Practice',
    path: '/radiology',
    actor: 'Dr. Musa Danbaba',
    actorTitle: 'Consultant Radiologist',
    initials: 'MD',
  },
  {
    role: 'ADMIN',
    label: 'Medical Director & QSS',
    group: 'Kingscare Practice',
    path: '/admin',
    actor: 'Dr. Olumide Balogun',
    actorTitle: 'Medical Director (RMP)',
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

const getBreadcrumb = (path: string): { section: string; title: string; docCode?: string } => {
  if (path.startsWith('/nimasa/patients')) return { section: 'NIMASA Oversight', title: 'Seafarer Examination Trail', docCode: 'QA-P-804' };
  if (path.startsWith('/nimasa/compliance')) return { section: 'NIMASA Oversight', title: 'Certificate Verification & Monthly Returns', docCode: 'RQP-202 / RQP-204' };
  if (path.startsWith('/nimasa/reports')) return { section: 'NIMASA Oversight', title: 'Compliance Reports', docCode: 'RQP-107' };
  if (path.startsWith('/nimasa')) return { section: 'NIMASA Oversight', title: 'Recognized Practice Register', docCode: 'RQD-02' };
  if (path.startsWith('/front-desk')) return { section: 'Kingscare Practice', title: 'Reception & Identity Verification', docCode: 'RQP-601' };
  if (path.startsWith('/doctor/patients')) return { section: 'RMP Examination', title: 'Seafarer Fitness Assessment', docCode: 'QAF-804-01' };
  if (path.startsWith('/doctor')) return { section: 'RMP Examination', title: 'Seafarer Queue', docCode: 'RQP-602' };
  if (path.startsWith('/lab')) return { section: 'Diagnostics', title: 'Clinical Laboratory', docCode: 'RQP-403' };
  if (path.startsWith('/radiology')) return { section: 'Diagnostics', title: 'Radiology & Imaging', docCode: 'RQP-403' };
  if (path.startsWith('/admin/qss')) return { section: 'Quality Standards', title: 'Recognition, KPIs & Certificate Stock', docCode: 'RQP-702' };
  if (path.startsWith('/admin/governance')) return { section: 'Quality Standards', title: 'Audit, CAPA & Standing Risks', docCode: 'Series 100' };
  if (path.startsWith('/admin/users')) return { section: 'Administration', title: 'Users & Access Control', docCode: 'RQR-404-01' };
  if (path.startsWith('/admin/audit')) return { section: 'Administration', title: 'Restricted Records & Audit Log', docCode: 'RQR-802-01' };
  if (path.startsWith('/admin')) return { section: 'Administration', title: 'Premises & Department Master File', docCode: 'RQP-401' };
  return { section: 'Kingscare', title: 'STCW Reg. I/9 Portal' };
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeRole, setActiveRole, auditLog } = useHospital();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const currentPath = location.pathname;
  const currentRoleKey = inferRoleFromPath(currentPath, activeRole);
  const isLogin = currentRoleKey === 'LOGIN';
  const currentWorkspace =
    WORKSPACES.find((w) => w.role === (currentRoleKey === 'LOGIN' ? 'NIMASA' : currentRoleKey)) ||
    WORKSPACES[0];
  const crumb = getBreadcrumb(currentPath);

  useEffect(() => {
    setDrawerOpen(false);
    setAccountMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [accountMenuOpen]);

  const handleWorkspaceSelect = (ws: WorkspaceOption) => {
    setActiveRole(ws.role);
    setAccountMenuOpen(false);
    navigate(ws.path);
  };

  const sections: NavSection[] = (() => {
    if (currentRoleKey === 'NIMASA') {
      return [
        {
          title: 'Oversight',
          items: [
            {
              to: '/nimasa',
              label: 'Practice Register',
              icon: LayoutDashboard,
              isActive: (p) => p === '/nimasa' || p.startsWith('/nimasa/patients'),
            },
            {
              to: '/nimasa/compliance',
              label: 'Verification & Returns',
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
          title: 'Quality System',
          items: [
            { to: '/admin', label: 'Master File', icon: Building2, isActive: (p) => p === '/admin' },
            { to: '/admin/qss', label: 'Recognition & Stock', icon: ShieldCheck, isActive: (p) => p.startsWith('/admin/qss') },
            { to: '/admin/governance', label: 'Audit, CAPA & Risks', icon: ShieldAlert, isActive: (p) => p.startsWith('/admin/governance') },
          ],
        },
        {
          title: 'Access & Records',
          items: [
            { to: '/admin/users', label: 'Users & Roles', icon: Users, isActive: (p) => p.startsWith('/admin/users') },
            {
              to: '/admin/audit',
              label: 'Audit Log',
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
        title: 'Clinical Operations',
        items: [
          { to: '/front-desk', label: 'Reception', icon: UserPlus, isActive: (p) => p.startsWith('/front-desk') },
          { to: '/doctor', label: 'RMP Examinations', icon: Stethoscope, isActive: (p) => p.startsWith('/doctor') },
          { to: '/lab', label: 'Laboratory', icon: FlaskConical, isActive: (p) => p.startsWith('/lab') },
          { to: '/radiology', label: 'Radiology', icon: ScanLine, isActive: (p) => p.startsWith('/radiology') },
        ],
      },
    ];
  })();

  /* -------------------- Login layout (full-bleed split) -------------------- */
  if (isLogin) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-canvas text-ink-primary">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded bg-primary-700 text-white text-sm font-semibold"
        >
          Skip to main content
        </a>
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
          {children}
        </main>
      </div>
    );
  }

  /* -------------------- Production Navy Sidebar -------------------- */
  const sidebarContent = (
    <div className="h-full flex flex-col bg-navy-900 text-slate-200 select-none">
      {/* Institutional Brand Header */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-white/10">
        <Link to={currentWorkspace.path} className="flex items-center gap-2.5 min-w-0">
          <div
            aria-hidden="true"
            className="w-7 h-7 rounded bg-white text-navy-900 flex items-center justify-center font-bold text-sm shrink-0"
          >
            K
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-sm font-semibold tracking-tight text-white truncate">
              Kingscare Hospital
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              STCW Reg. I/9 · RMP QSS
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {section.title}
            </div>
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const active = item.isActive(currentPath);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-center gap-2.5 h-9 px-2.5 rounded text-[13px] font-medium transition-colors ${
                        active
                          ? 'bg-navy-700 text-white border-l-2 border-blue-400 pl-2'
                          : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${active ? 'text-blue-300' : 'text-slate-400 group-hover:text-slate-200'}`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {typeof item.badge === 'number' && (
                        <span className="px-1.5 py-0.5 rounded bg-navy-950/70 text-[10px] font-mono text-slate-300">
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
          <div className="mx-3 p-3 rounded bg-navy-950/50 border border-white/10 text-[11px] text-slate-300 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
              <Lock className="w-3 h-3 text-slate-400" aria-hidden="true" />
              QA-P-808 Confidentiality
            </div>
            Agency access is restricted to fitness outcomes, certificate serials, and compliance returns.
          </div>
        )}
      </nav>

      {/* Account & Workspace Switcher Footer */}
      <div ref={accountMenuRef} className="relative p-2.5 border-t border-white/10">
        {accountMenuOpen && (
          <div
            role="menu"
            aria-label="Switch active workspace"
            className="absolute bottom-full left-2.5 right-2.5 mb-1.5 rounded bg-surface-card text-ink-primary border border-surface-border shadow-xl py-1.5 z-50"
          >
            {(['NIMASA Oversight', 'Kingscare Practice'] as const).map((group) => (
              <div key={group} className="py-1">
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  {group}
                </div>
                {WORKSPACES.filter((w) => w.group === group).map((ws) => {
                  const selected = ws.role === currentWorkspace.role;
                  return (
                    <button
                      key={ws.role}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      onClick={() => handleWorkspaceSelect(ws)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                        selected ? 'bg-surface-subtle font-semibold text-ink-primary' : 'text-ink-secondary hover:bg-surface-canvas'
                      }`}
                    >
                      <span className="truncate">{ws.label}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-primary-700 shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="border-t border-surface-border mt-1 pt-1 px-1.5">
              <Link
                to="/login"
                className="flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign out</span>
              </Link>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAccountMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={accountMenuOpen}
          className="w-full flex items-center gap-2.5 p-2 rounded hover:bg-navy-800 transition-colors text-left"
        >
          <span
            aria-hidden="true"
            className="w-8 h-8 shrink-0 rounded bg-navy-700 text-white border border-white/15 flex items-center justify-center text-xs font-semibold"
          >
            {currentWorkspace.initials}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{currentWorkspace.actor}</div>
            <div className="text-[11px] text-slate-400 truncate">{currentWorkspace.actorTitle}</div>
          </div>
          <ChevronUp
            className={`w-4 h-4 text-slate-400 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-surface-canvas text-ink-primary overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded bg-primary-700 text-white text-sm font-semibold"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-0 h-screen border-r border-navy-950">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 max-w-[85%] shadow-xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute top-3 right-3 w-8 h-8 rounded flex items-center justify-center text-slate-300 hover:bg-navy-800 z-10"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-14 bg-surface-card border-b border-surface-border">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation"
                className="lg:hidden -ml-1 w-9 h-9 rounded flex items-center justify-center text-ink-secondary hover:bg-surface-subtle"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="text-ink-muted hidden sm:inline">{crumb.section}</span>
                <span className="text-surface-border-strong hidden sm:inline">/</span>
                <span className="font-semibold text-ink-primary truncate">{crumb.title}</span>
                {crumb.docCode && (
                  <span className="hidden md:inline font-mono text-[11px] text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded">
                    {crumb.docCode}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-ink-muted shrink-0">
              <span className="hidden md:inline font-mono text-[11px]">
                NIM-RMP-ABJ-2025-014
              </span>
              <span className="inline-flex items-center gap-1.5 text-ink-secondary font-medium">
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Audit trail active
              </span>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none"
        >
          {children}
        </main>

        <footer className="border-t border-surface-border bg-surface-card">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-ink-muted">
            <span>
              Kingscare Specialist Hospital, Abuja · Recognized Medical Practitioner (STCW Reg. I/9 &amp; NIMASA Series 800)
            </span>
            <span className="font-medium text-ink-secondary">Angel Tech &amp; Media Limited</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
