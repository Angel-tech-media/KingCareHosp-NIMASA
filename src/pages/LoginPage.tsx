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
      <div className="lg:col-span-5 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 text-white p-8 sm:p-12 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center p-1.5 shrink-0">
              <img
                src="/kingscare-logo.png"
                alt="Kingscare Hospitals"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-white">
                Kingscare Hospitals Limited
              </div>
              <div className="text-xs text-primary-200/80">
                Plot 2181, Ibrahim Babangida Way · Wuse Zone 4, Abuja
              </div>
            </div>
          </div>

          <div className="mt-14 space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-primary-300">
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

          <dl className="mt-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 grid grid-cols-2 gap-4 text-xs">
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
          <span>Kingscare × NIMASA</span>
        </div>
      </div>

      {/* Right Sign-In Panel */}
      <div className="lg:col-span-7 bg-surface-canvas flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-md border border-white shadow-card-hover p-8">
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
            className="grid grid-cols-2 p-1 rounded-xl bg-surface-subtle border border-surface-border mb-6"
          >
            <button
              type="button"
              role="tab"
              aria-selected={portalTab === 'STAFF'}
              onClick={() => handleTabChange('STAFF')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                portalTab === 'STAFF'
                  ? 'bg-white text-navy-800 shadow-sm'
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
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                portalTab === 'NIMASA'
                  ? 'bg-white text-navy-800 shadow-sm'
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
                  className="w-full rounded-xl border border-surface-border-strong bg-white px-3.5 py-2.5 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.path} value={r.path}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-primary-50/60 border border-primary-100 text-xs text-ink-secondary flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-navy-800 shrink-0 mt-0.5" aria-hidden="true" />
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
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2.5 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
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
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2.5 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-sm font-semibold shadow-sm transition-colors"
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
