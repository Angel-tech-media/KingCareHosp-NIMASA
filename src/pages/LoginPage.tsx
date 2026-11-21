import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  Lock,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { RoleType } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveRole } = useHospital();

  const [staffEmail, setStaffEmail] = useState('b.fashola@kingscarehospital.ng');
  const [staffPassword, setStaffPassword] = useState('••••••••••••');
  const [staffDestination, setStaffDestination] = useState<{
    role: RoleType;
    path: string;
    label: string;
  }>({
    role: 'FRONT_DESK',
    path: '/front-desk',
    label: 'Front Desk Reception',
  });

  const [nimasaEmail, setNimasaEmail] = useState('medical.liaison@nimasa.gov.ng');
  const [nimasaPassword, setNimasaPassword] = useState('••••••••••••');

  const staffRoleChoices: { role: RoleType; path: string; label: string; email: string }[] = [
    {
      role: 'FRONT_DESK',
      path: '/front-desk',
      label: 'Front Desk Officer (Chidinma Okafor)',
      email: 'frontdesk@kingscarehospital.ng',
    },
    {
      role: 'DOCTOR',
      path: '/doctor',
      label: 'Consultant Doctor (Dr. B. Fashola-Cole)',
      email: 'b.fashola@kingscarehospital.ng',
    },
    {
      role: 'LAB',
      path: '/lab',
      label: 'Laboratory Scientist (MLS. K. Nwachukwu)',
      email: 'k.nwachukwu@kingscarehospital.ng',
    },
    {
      role: 'RADIOLOGY',
      path: '/radiology',
      label: 'Radiology / Imaging (Dr. M. Danbaba)',
      email: 'm.danbaba@kingscarehospital.ng',
    },
    {
      role: 'ADMIN',
      path: '/admin',
      label: 'Hospital Admin / Master File (Dr. O. Balogun)',
      email: 'admin@kingscarehospital.ng',
    },
  ];

  const handleStaffSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveRole(staffDestination.role);
    navigate(staffDestination.path);
  };

  const handleNimasaSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveRole('NIMASA');
    navigate('/nimasa');
  };

  return (
    <div className="py-8 sm:py-14">
      {/* Header Intro */}
      <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-card text-ink-secondary border border-surface-border text-xs font-medium mb-4 shadow-card">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          Every step stamped with who and when
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-ink-primary tracking-tight">
          Sign in to Kingscare
        </h1>
        <p className="text-base text-ink-muted mt-3">
          Follow each NIMASA member from the front desk to discharge. Choose your
          portal below, or use <span className="font-semibold text-ink-secondary">View as</span> in
          the demo bar to jump between roles.
        </p>
      </div>

      {/* Two Entry Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Hospital Staff */}
        <section
          aria-labelledby="staff-login-heading"
          className="bg-surface-card rounded-lg border border-surface-border shadow-card hover:shadow-card-hover hover:border-primary-200 transition-all p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div
                aria-hidden="true"
                className="w-11 h-11 rounded-lg bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-700"
              >
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-surface-subtle text-ink-secondary">
                Internal Clinical Portal
              </span>
            </div>

            <h2 id="staff-login-heading" className="text-xl font-bold text-ink-primary">
              Hospital staff
            </h2>
            <p className="text-sm text-ink-muted mt-1">
              For Kingscare Front Desk, Doctors, Laboratory, Radiology, and
              Hospital Administration.
            </p>

            <form onSubmit={handleStaffSignIn} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="staff-role-select"
                  className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5"
                >
                  Staff Department / Role (Demo Selector)
                </label>
                <select
                  id="staff-role-select"
                  value={staffDestination.path}
                  onChange={(e) => {
                    const found = staffRoleChoices.find(
                      (c) => c.path === e.target.value
                    );
                    if (found) {
                      setStaffDestination(found);
                      setStaffEmail(found.email);
                    }
                  }}
                  className="w-full rounded-lg border border-surface-border-strong bg-surface-canvas px-3.5 py-2.5 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white"
                >
                  {staffRoleChoices.map((c) => (
                    <option key={c.path} value={c.path}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="staff-email-input"
                  className="block text-xs font-medium text-ink-secondary mb-1"
                >
                  Hospital Staff Email
                </label>
                <input
                  id="staff-email-input"
                  type="email"
                  autoComplete="username"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full rounded-lg border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="staff@kingscarehospital.ng"
                />
              </div>

              <div>
                <label
                  htmlFor="staff-password-input"
                  className="block text-xs font-medium text-ink-secondary mb-1"
                >
                  Password
                </label>
                <input
                  id="staff-password-input"
                  type="password"
                  autoComplete="current-password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full rounded-lg border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-sm transition-colors"
              >
                <span>Sign in as Hospital Staff</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
              Kingscare Abuja Network
            </span>
            <span>Every action stamps user + timestamp</span>
          </div>
        </section>

        {/* Card 2: NIMASA Sponsor Portal */}
        <section
          aria-labelledby="nimasa-login-heading"
          className="bg-surface-card rounded-lg border border-surface-border shadow-card hover:shadow-card-hover hover:border-emerald-200 transition-all p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div
                aria-hidden="true"
                className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700"
              >
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Sponsor Body (Read-Only)
              </span>
            </div>

            <h2 id="nimasa-login-heading" className="text-xl font-bold text-ink-primary">
              NIMASA
            </h2>
            <p className="text-sm text-ink-muted mt-1">
              Nigerian Maritime Administration and Safety Agency — live tracking
              of referred staff from reception to discharge.
            </p>

            <form onSubmit={handleNimasaSignIn} className="mt-6 space-y-4">
              <div className="p-3 rounded-lg bg-surface-canvas border border-surface-border text-xs text-ink-secondary">
                <p className="font-semibold text-ink-primary">
                  Sponsor Oversight Access
                </p>
                <p className="mt-0.5 text-ink-muted">
                  View live stage progress, hospital locations, daily quota
                  utilization, and turnaround reports. Confidential clinical notes
                  remain restricted to Kingscare clinicians.
                </p>
              </div>

              <div>
                <label
                  htmlFor="nimasa-email-input"
                  className="block text-xs font-medium text-ink-secondary mb-1"
                >
                  NIMASA Official Email
                </label>
                <input
                  id="nimasa-email-input"
                  type="email"
                  autoComplete="username"
                  value={nimasaEmail}
                  onChange={(e) => setNimasaEmail(e.target.value)}
                  className="w-full rounded-lg border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="medical.liaison@nimasa.gov.ng"
                />
              </div>

              <div>
                <label
                  htmlFor="nimasa-password-input"
                  className="block text-xs font-medium text-ink-secondary mb-1"
                >
                  Password
                </label>
                <input
                  id="nimasa-password-input"
                  type="password"
                  autoComplete="current-password"
                  value={nimasaPassword}
                  onChange={(e) => setNimasaPassword(e.target.value)}
                  className="w-full rounded-lg border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition-colors"
              >
                <span>Sign in to NIMASA Portal</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
              NDPR & Clinical Privacy Compliant
            </span>
            <span>Read-only electronic trail</span>
          </div>
        </section>
      </div>
    </div>
  );
};
