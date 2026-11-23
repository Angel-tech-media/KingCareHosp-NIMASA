import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  ChevronDown,
  Check,
  Menu,
  X,
  LayoutDashboard,
  ShieldAlert,
  Search,
  Bell,
  FileCheck2,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { RoleType } from '../../types';
import { SlideOver } from '../ui';

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

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeRole, setActiveRole, auditLog, patients } = useHospital();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const currentPath = location.pathname;
  const currentRoleKey = inferRoleFromPath(currentPath, activeRole);
  const isLogin = currentRoleKey === 'LOGIN';
  const currentWorkspace =
    WORKSPACES.find((w) => w.role === (currentRoleKey === 'LOGIN' ? 'NIMASA' : currentRoleKey)) ||
    WORKSPACES[0];

  useEffect(() => {
    setDrawerOpen(false);
    setAccountMenuOpen(false);
    setSearchFocused(false);
  }, [currentPath]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAccountMenuOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return patients
      .filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.recordNo.toLowerCase().includes(q) ||
          (p.rmp?.issuedCertificate?.certificateNo.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 5);
  }, [patients, searchQuery]);

  const hasAttentionDot = useMemo(
    () =>
      patients.some(
        (p) =>
          p.rmp?.determination === 'Pending' ||
          p.rmp?.determination === 'Not fit' ||
          p.rmp?.determination === 'Fit with limitation'
      ),
    [patients]
  );

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
              label: 'Overview',
              icon: LayoutDashboard,
              isActive: (p) => p === '/nimasa',
            },
            {
              to: '/nimasa/register',
              label: 'Seafarer Register',
              icon: FileCheck2,
              isActive: (p) => p.startsWith('/nimasa/register') || p.startsWith('/nimasa/patients'),
            },
            {
              to: '/nimasa/compliance',
              label: 'Verify & Returns',
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
            {
              to: '/overview',
              label: 'Overview',
              icon: LayoutDashboard,
              isActive: (p) => p === '/overview',
            },
            {
              to: '/admin',
              label: 'Master File',
              icon: Building2,
              isActive: (p) => p === '/admin',
            },
            {
              to: '/admin/qss',
              label: 'Recognition & Stock',
              icon: ShieldCheck,
              isActive: (p) => p.startsWith('/admin/qss'),
            },
            {
              to: '/admin/governance',
              label: 'Audit & CAPA',
              icon: ShieldAlert,
              isActive: (p) => p.startsWith('/admin/governance'),
            },
          ],
        },
        {
          title: 'Access & Records',
          items: [
            {
              to: '/admin/users',
              label: 'Users & Roles',
              icon: Users,
              isActive: (p) => p.startsWith('/admin/users'),
            },
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
        title: 'Clinic Operations',
        items: [
          {
            to: '/overview',
            label: 'Overview',
            icon: LayoutDashboard,
            isActive: (p) => p === '/overview',
          },
          {
            to: '/front-desk',
            label: 'Reception',
            icon: UserPlus,
            isActive: (p) => p.startsWith('/front-desk'),
          },
          {
            to: '/doctor',
            label: 'RMP Examinations',
            icon: Stethoscope,
            isActive: (p) => p.startsWith('/doctor'),
          },
          {
            to: '/lab',
            label: 'Laboratory',
            icon: FlaskConical,
            isActive: (p) => p.startsWith('/lab'),
          },
          {
            to: '/radiology',
            label: 'Radiology',
            icon: ScanLine,
            isActive: (p) => p.startsWith('/radiology'),
          },
        ],
      },
    ];
  })();

  /* -------------------- Login layout (full-bleed) -------------------- */
  if (isLogin) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-canvas text-ink-primary">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl bg-navy-800 text-white text-sm font-semibold"
        >
          Skip to main content
        </a>
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
          {children}
        </main>
      </div>
    );
  }

  /* -------------------- WellNest × Kingscare Light Sidebar -------------------- */
  const sidebarContent = (
    <div className="h-full flex flex-col bg-white/90 backdrop-blur-md text-ink-primary select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-surface-border/70">
        <Link to={currentWorkspace.path} className="flex items-center gap-3 min-w-0">
          <img
            src="/kingscare-logo.png"
            alt="Kingscare Hospitals"
            className="w-9 h-9 object-contain shrink-0"
          />
          <div className="leading-tight min-w-0">
            <div className="text-[15px] font-bold tracking-tight text-navy-800 truncate">
              Kingscare
            </div>
            <div className="text-[11px] text-ink-muted truncate">
              STCW Reg. I/9 · Abuja
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted/80">
              {section.title}
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = item.isActive(currentPath);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-center gap-3 h-10 px-3 rounded-xl text-[13px] transition-all ${
                        active
                          ? 'bg-primary-50 text-navy-800 font-semibold'
                          : 'text-ink-muted font-medium hover:bg-surface-canvas hover:text-ink-primary'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active
                            ? 'text-primary-600'
                            : 'text-ink-muted/80 group-hover:text-ink-primary'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {typeof item.badge === 'number' && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums ${
                            active
                              ? 'bg-white text-navy-800 font-semibold'
                              : 'bg-surface-canvas text-ink-muted'
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
      </nav>

      {/* Quiet Practice Status Pill */}
      <div className="p-3.5 border-t border-surface-border/70">
        <div className="rounded-xl bg-surface-canvas/90 border border-surface-border/70 px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-primary">
            <span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Practice Active</span>
          </div>
          <div className="text-[11px] font-mono text-ink-muted mt-0.5">
            NIM-RMP-ABJ-2025-014
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-surface-canvas text-ink-primary overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl bg-navy-800 text-white text-sm font-semibold"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen border-r border-surface-border/80">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 bg-navy-950/25 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 max-w-[85%] shadow-2xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute top-3.5 right-3 w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-canvas z-10"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Minimalist Frosted Glass Topbar */}
        <header className="sticky top-0 z-30 h-16 glass-bar">
          <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation"
                className="lg:hidden -ml-1 w-9 h-9 rounded-full flex items-center justify-center text-ink-secondary hover:bg-surface-subtle"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Quick Search Pill */}
              <div ref={searchBoxRef} className="relative max-w-md w-full">
                <div className="flex items-center h-10 px-3.5 rounded-full bg-surface-canvas/85 border border-surface-border/80 focus-within:bg-white focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                  <Search className="w-4 h-4 text-ink-muted shrink-0 mr-2" aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Quick search seafarer, KC record, or certificate serial"
                    value={searchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchFocused(true);
                    }}
                    placeholder="Search seafarer, KC- record, or certificate..."
                    className="w-full bg-transparent text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none"
                  />
                </div>

                {searchFocused && searchQuery.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-surface-border shadow-card-hover py-2 z-50">
                    {searchMatches.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-ink-muted">
                        No matching seafarer or certificate found.
                      </div>
                    ) : (
                      searchMatches.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSearchFocused(false);
                            setSearchQuery('');
                            navigate(
                              currentRoleKey === 'NIMASA'
                                ? `/nimasa/patients/${p.recordNo}`
                                : `/doctor/patients/${p.recordNo}`
                            );
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-primary-50/50 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-ink-primary truncate">
                              {p.fullName}
                            </div>
                            <div className="text-[11px] font-mono text-ink-muted truncate">
                              {p.recordNo}
                              {p.rmp?.issuedCertificate
                                ? ` · ${p.rmp.issuedCertificate.certificateNo}`
                                : ''}
                            </div>
                          </div>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-canvas text-ink-secondary shrink-0">
                            {p.rmp?.determination ?? 'Registered'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Utility Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Activity Feed Button */}
              <button
                type="button"
                onClick={() => setActivityOpen(true)}
                aria-label="Open recent clinic activity"
                className="relative w-9 h-9 rounded-full bg-white border border-surface-border/80 hover:bg-surface-canvas flex items-center justify-center text-ink-secondary transition-colors"
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                {hasAttentionDot && (
                  <span
                    aria-hidden="true"
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-crimson-500 ring-2 ring-white"
                  />
                )}
              </button>

              {/* Top-Right Profile & Workspace Switcher */}
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white border border-surface-border/80 hover:bg-surface-canvas transition-colors text-left"
                >
                  <span
                    aria-hidden="true"
                    className="w-7 h-7 rounded-full bg-navy-800 text-white flex items-center justify-center text-[11px] font-semibold shrink-0"
                  >
                    {currentWorkspace.initials}
                  </span>
                  <div className="hidden sm:block leading-tight">
                    <div className="text-xs font-semibold text-ink-primary max-w-[150px] truncate">
                      {currentWorkspace.actor}
                    </div>
                    <div className="text-[10px] text-ink-muted max-w-[150px] truncate">
                      {currentWorkspace.actorTitle}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-ink-muted transition-transform ${
                      accountMenuOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {accountMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Switch active workspace"
                    className="absolute top-full right-0 mt-2 w-72 rounded-2xl bg-white/95 backdrop-blur-xl text-ink-primary border border-surface-border shadow-xl py-2 z-50"
                  >
                    {(['NIMASA Oversight', 'Kingscare Practice'] as const).map((group) => (
                      <div key={group} className="py-1">
                        <div className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
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
                              className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-left text-xs transition-colors ${
                                selected
                                  ? 'bg-primary-50/70 font-semibold text-navy-800'
                                  : 'text-ink-secondary hover:bg-surface-canvas'
                              }`}
                            >
                              <span className="truncate">{ws.label}</span>
                              {selected && (
                                <Check className="w-3.5 h-3.5 text-primary-600 shrink-0" aria-hidden="true" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                    <div className="border-t border-surface-border mt-1 pt-1 px-2">
                      <Link
                        to="/login"
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-crimson-600 hover:bg-crimson-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Sign out</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none"
        >
          {children}
        </main>

        <footer className="border-t border-surface-border/70 bg-white/60 backdrop-blur-sm">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 text-[11px] text-ink-muted text-center sm:text-left">
            Kingscare Hospitals Limited · Plot 2181, Ibrahim Babangida Way, Wuse Zone 4, Abuja · STCW Reg. I/9 Recognized Practice
          </div>
        </footer>
      </div>

      {/* Recent Clinic Activity SlideOver */}
      <SlideOver
        isOpen={activityOpen}
        onClose={() => setActivityOpen(false)}
        title="Recent Clinic Activity"
        subtitle="Latest 12 live updates logged across Reception, RMP Assessment, and NIMASA Verification"
      >
        <div className="space-y-3">
          {auditLog.slice(0, 12).map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-xl bg-surface-canvas/80 border border-surface-border/80 space-y-1"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-ink-primary">{entry.action}</span>
                <span className="font-mono text-[11px] text-ink-muted shrink-0">
                  {entry.timestamp}
                </span>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">{entry.details}</p>
              <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                <span>
                  {entry.actorName} ({entry.actorRole})
                </span>
                <span className="font-mono">{entry.recordNo}</span>
              </div>
            </div>
          ))}
        </div>
      </SlideOver>
    </div>
  );
};
