import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { RoleType } from '../types';
import { PRACTICE_RECOGNITION } from '../data/mockRmpData';

type PortalTab = 'STAFF' | 'NIMASA';

const STAFF_ROLES: { role: RoleType; path: string; label: string; email: string }[] = [
  {
    role: 'DOCTOR',
    path: '/doctor',
    label: 'Recognized Medical Practitioner (Dr. B. Fashola-Cole)',
    email: 'b.fashola@kingscarehospital.ng',
  },
  {
    role: 'FRONT_DESK',
    path: '/front-desk',
    label: 'Registration Officer (Chidinma Okafor)',
    email: 'reception@kingscarehospital.ng',
  },
  {
    role: 'LAB',
    path: '/lab',
    label: 'Medical Laboratory Scientist (MLS. K. Nwachukwu)',
    email: 'k.nwachukwu@kingscarehospital.ng',
  },
  {
    role: 'RADIOLOGY',
    path: '/radiology',
    label: 'Consultant Radiologist (Dr. M. Danbaba)',
    email: 'm.danbaba@kingscarehospital.ng',
  },
  {
    role: 'ADMIN',
    path: '/admin',
    label: 'Medical Director / QSS Admin (Dr. O. Balogun)',
    email: 'admin@kingscarehospital.ng',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveRole } = useHospital();

  const [portalTab, setPortalTab] = useState<PortalTab>('STAFF');
  const [selectedStaff, setSelectedStaff] = useState(STAFF_ROLES[0]);
  const [email, setEmail] = useState(STAFF_ROLES[0].email);
  const [password, setPassword] = useState('••••••••••••');

  const handleTabChange = (tab: PortalTab) => {
    setPortalTab(tab);
    if (tab === 'NIMASA') {
      setEmail('medical.liaison@nimasa.gov.ng');
    } else {
      setEmail(selectedStaff.email);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (portalTab === 'NIMASA') {
      setActiveRole('NIMASA');
      navigate('/nimasa');
    } else {
      setActiveRole(selectedStaff.role);
      navigate(selectedStaff.path);
    }
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
      {/* Left Institutional Panel */}
      <div className="lg:col-span-5 bg-navy-900 text-white p-8 sm:p-12 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-white text-navy-900 flex items-center justify-center font-bold text-lg">
              K
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-white">
                Kingscare Specialist Hospital
              </div>
              <div className="text-xs text-slate-400">Abuja, Federal Capital Territory</div>
            </div>
          </div>

          <div className="mt-14 space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-blue-300">
              STCW Regulation I/9 · NIMASA Series 800
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
              Recognized Medical Practitioner Quality Standards System
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Statutory seafarer medical fitness examinations, QAF-805-01 medical certification,
              serial stock control, and read-only NIMASA Agency oversight.
            </p>
          </div>

          <dl className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-slate-400">Recognition Certificate</dt>
              <dd className="font-mono font-semibold text-white mt-0.5">
                {PRACTICE_RECOGNITION.certificateNo}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Recognition Status</dt>
              <dd className="font-semibold text-emerald-300 mt-0.5">
                Full · Valid to {PRACTICE_RECOGNITION.expiresOn}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Statutory Basis</dt>
              <dd className="text-slate-200 mt-0.5">STCW 1978 / 2025 Regs.</dd>
            </div>
            <div>
              <dt className="text-slate-400">Data Protection</dt>
              <dd className="text-slate-200 mt-0.5">NDPA 2023 · QA-P-808</dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            All access &amp; determinations logged
          </span>
          <span>Angel Tech &amp; Media Limited</span>
        </div>
      </div>

      {/* Right Sign-In Panel */}
      <div className="lg:col-span-7 bg-surface-canvas flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-surface-card border border-surface-border rounded shadow-card p-7 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-ink-primary tracking-tight">Sign in</h2>
            <p className="text-xs text-ink-muted mt-1">
              Use your authorized Kingscare clinical account or NIMASA oversight credentials.
            </p>
          </div>

          {/* Portal Toggle */}
          <div
            role="tablist"
            aria-label="Portal selection"
            className="grid grid-cols-2 p-1 rounded bg-surface-subtle border border-surface-border mb-6"
          >
            <button
              type="button"
              role="tab"
              aria-selected={portalTab === 'STAFF'}
              onClick={() => handleTabChange('STAFF')}
              className={`py-2 text-xs font-semibold rounded transition-colors ${
                portalTab === 'STAFF'
                  ? 'bg-surface-card text-ink-primary shadow-sm'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Kingscare Practice Staff
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={portalTab === 'NIMASA'}
              onClick={() => handleTabChange('NIMASA')}
              className={`py-2 text-xs font-semibold rounded transition-colors ${
                portalTab === 'NIMASA'
                  ? 'bg-surface-card text-ink-primary shadow-sm'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              NIMASA Agency Portal
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {portalTab === 'STAFF' ? (
              <div>
                <label
                  htmlFor="login-role"
                  className="block text-xs font-semibold text-ink-secondary mb-1.5"
                >
                  Clinical Workspace
                </label>
                <select
                  id="login-role"
                  value={selectedStaff.path}
                  onChange={(e) => {
                    const found = STAFF_ROLES.find((r) => r.path === e.target.value);
                    if (found) {
                      setSelectedStaff(found);
                      setEmail(found.email);
                    }
                  }}
                  className="w-full rounded border border-surface-border-strong bg-surface-card px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.path} value={r.path}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 rounded bg-surface-canvas border border-surface-border text-xs text-ink-secondary flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-navy-900 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Read-only regulatory oversight under QA-P-807 &amp; QA-P-808. Clinical records and
                  diagnoses remain restricted to examining practitioners.
                </span>
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-ink-secondary mb-1.5">
                Official Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-surface-border-strong px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-ink-secondary mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-surface-border-strong px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold transition-colors"
            >
              <span>{portalTab === 'NIMASA' ? 'Sign in to NIMASA Oversight' : 'Sign in to Workspace'}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-6 pt-4 border-t border-surface-border text-[11px] text-ink-muted">
            Individual user accounts only (RQP-404 §5). Shared credentials are prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};
