import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Database, Lock, ShieldCheck } from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { RoleType } from '../types';

function homePathForRole(role: RoleType): string {
  switch (role) {
    case 'NIMASA':
      return '/nimasa';
    case 'FRONT_DESK':
      return '/front-desk';
    case 'DOCTOR':
      return '/doctor';
    case 'LAB':
      return '/lab';
    case 'RADIOLOGY':
      return '/radiology';
    case 'ENT':
      return '/ent';
    case 'EYE':
      return '/eye';
    case 'ADMIN':
    default:
      return '/admin';
  }
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    authLoading,
    initialized,
    currentUser,
    practice,
    setupInitialAdmin,
    login,
    seedSampleData,
  } = useHospital();

  // First-Time Setup state
  const [practiceName, setPracticeName] = useState(practice.practiceName || 'Kingscare Hospitals Limited');
  const [address, setAddress] = useState(
    practice.address || 'Plot 2181, Ibrahim Babangida Way, Wuse Zone 4, Abuja'
  );
  const [certificateNo, setCertificateNo] = useState(
    practice.certificateNo || 'NIM-RMP-ABJ-2025-014'
  );
  const [stateFacilityRegNo, setStateFacilityRegNo] = useState(
    practice.stateFacilityRegNo || 'FCT-PHMC-2024-0892'
  );
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [seedInfo, setSeedInfo] = useState<{
    defaultPassword: string;
    accounts: { email: string; fullName: string; portalRole: RoleType }[];
  } | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-canvas p-6">
        <div className="surface-panel p-8 flex flex-col items-center gap-3 text-sm text-ink-muted">
          <img
            src="/kingscare-logo.png"
            alt="Kingscare Hospitals"
            className="w-12 h-12 object-contain"
          />
          <span>Loading Kingscare Portal...</span>
        </div>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to={homePathForRole(currentUser.portalRole)} replace />;
  }

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (setupPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (setupPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await setupInitialAdmin({
        practiceName,
        address,
        certificateNo,
        stateFacilityRegNo,
        fullName: adminName,
        email: adminEmail,
        licenseNo: licenseNo.trim() || undefined,
        password: setupPassword,
      });
      navigate(homePathForRole(user.portalRole), { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to initialize clinic.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(homePathForRole(user.portalRole), { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadSampleData = async () => {
    setErrorMsg(null);
    setSeeding(true);
    try {
      const info = await seedSampleData();
      setSeedInfo(info);
      setEmail('admin@kingscarehospital.ng');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load sample data.');
    } finally {
      setSeeding(false);
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
                {practice.practiceName}
              </div>
              <div className="text-xs text-primary-200/80">{practice.address}</div>
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
              Statutory seafarer medical fitness examinations, diagnostic equipment register,
              QAF-805-01 serial stock control, and role-restricted NIMASA oversight.
            </p>
          </div>

          {!initialized ? (
            <div className="mt-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-3 text-xs">
              <div className="font-semibold text-white">Clean Clinic Setup Ready</div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-300 shrink-0" />
                  <span>1. Confirm facility &amp; create Medical Director / QSS Admin</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-300 shrink-0" />
                  <span>2. Register department equipment, model numbers &amp; calibration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-300 shrink-0" />
                  <span>3. Create staff &amp; NIMASA Liaison logins with real passwords</span>
                </li>
              </ul>
            </div>
          ) : (
            <dl className="mt-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 grid grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-slate-400">Recognition Certificate</dt>
                <dd className="font-mono font-semibold text-white mt-0.5">
                  {practice.certificateNo}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Recognition Status</dt>
                <dd className="font-semibold text-emerald-300 mt-0.5">
                  {practice.status} · Valid to {practice.expiresOn}
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
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            All authentication &amp; determinations logged
          </span>
          <span>Kingscare × NIMASA</span>
        </div>
      </div>

      {/* Right Setup or Sign-In Panel */}
      <div className="lg:col-span-7 bg-surface-canvas flex items-center justify-center p-6 sm:p-10">
        {!initialized ? (
          <div className="w-full max-w-xl rounded-2xl bg-white/95 backdrop-blur-md border border-white shadow-card-hover p-7 sm:p-8 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-navy-800 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
                First-Time Installation
              </span>
              <h2 className="text-xl font-semibold text-ink-primary tracking-tight mt-2">
                Practice &amp; Administrator Setup
              </h2>
              <p className="text-xs text-ink-muted mt-1">
                Complete initial facility setup to create the primary Medical Director / QSS
                Administrator account before registering equipment, staff, and seafarers.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-crimson-50 border border-crimson-100 text-xs text-crimson-700"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label htmlFor="setup-practice" className="block text-xs font-semibold text-ink-secondary mb-1">
                    Practice / Hospital Name
                  </label>
                  <input
                    id="setup-practice"
                    type="text"
                    required
                    value={practiceName}
                    onChange={(e) => setPracticeName(e.target.value)}
                    className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="setup-address" className="block text-xs font-semibold text-ink-secondary mb-1">
                    Facility Address
                  </label>
                  <input
                    id="setup-address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label htmlFor="setup-cert" className="block text-xs font-semibold text-ink-secondary mb-1">
                    NIMASA Recognition Cert No.
                  </label>
                  <input
                    id="setup-cert"
                    type="text"
                    required
                    value={certificateNo}
                    onChange={(e) => setCertificateNo(e.target.value)}
                    className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label htmlFor="setup-statereg" className="block text-xs font-semibold text-ink-secondary mb-1">
                    State Health Reg No.
                  </label>
                  <input
                    id="setup-statereg"
                    type="text"
                    required
                    value={stateFacilityRegNo}
                    onChange={(e) => setStateFacilityRegNo(e.target.value)}
                    className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label htmlFor="setup-name" className="block text-xs font-semibold text-ink-secondary mb-1">
                    Administrator Full Name
                  </label>
                  <input
                    id="setup-name"
                    type="text"
                    required
                    placeholder="e.g. Dr. Olumide Balogun"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label htmlFor="setup-email" className="block text-xs font-semibold text-ink-secondary mb-1">
                    Official Email
                  </label>
                  <input
                    id="setup-email"
                    type="email"
                    required
                    placeholder="admin@kingscarehospital.ng"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label htmlFor="setup-license" className="block text-xs font-semibold text-ink-secondary mb-1">
                    MDCN / Licence No.
                  </label>
                  <input
                    id="setup-license"
                    type="text"
                    placeholder="e.g. MDCN/R/31402"
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                    className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label htmlFor="setup-password" className="block text-xs font-semibold text-ink-secondary mb-1">
                    Password (min 8 chars)
                  </label>
                  <input
                    id="setup-password"
                    type="password"
                    required
                    minLength={8}
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label htmlFor="setup-confirm" className="block text-xs font-semibold text-ink-secondary mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="setup-confirm"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-800 hover:bg-navy-900 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <span>{submitting ? 'Creating Practice & Admin...' : 'Complete Setup & Enter Portal'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            <div className="pt-4 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-ink-muted">
                Want to preview with sample records first instead of entering everything from scratch?
              </span>
              <button
                type="button"
                disabled={seeding}
                onClick={handleLoadSampleData}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-border-strong bg-surface-canvas hover:bg-white text-ink-primary font-semibold shrink-0 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-primary-600" aria-hidden="true" />
                <span>{seeding ? 'Loading Sample Data...' : 'Load Sample Clinic Data'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-md border border-white shadow-card-hover p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink-primary tracking-tight">Sign in</h2>
              <p className="text-xs text-ink-muted mt-1">
                Enter your registered official email and password to access your authorized workspace.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-crimson-50 border border-crimson-100 text-xs text-crimson-700"
              >
                {errorMsg}
              </div>
            )}

            {seedInfo && (
              <div className="p-3.5 rounded-xl bg-primary-50/70 border border-primary-200 text-xs space-y-1.5">
                <div className="font-semibold text-navy-800">
                  Sample data loaded (Password: <code className="font-mono">{seedInfo.defaultPassword}</code>)
                </div>
                <ul className="space-y-0.5 text-[11px] font-mono text-ink-secondary">
                  {seedInfo.accounts.map((a) => (
                    <li key={a.email}>
                      [{a.portalRole}] {a.email}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-ink-secondary mb-1.5">
                  Official Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="name@kingscarehospital.ng"
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
                disabled={submitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-800 hover:bg-navy-900 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <span>{submitting ? 'Signing in...' : 'Sign in to Workspace'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            <p className="pt-4 border-t border-surface-border text-[11px] text-ink-muted">
              Individual user accounts only (RQP-404 §5). New accounts are issued by your Medical Director / QSS Admin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
