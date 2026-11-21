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
    <div className="py-6 sm:py-10">
      {/* Header Intro */}
      <div className="max-w-3xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Electronic Patient Journey & Clinical Audit System
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Kingscare Hospital & NIMASA Sponsor Portal
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Select an entry portal below to sign in, or use the{' '}
          <span className="font-semibold text-slate-800">
            Demo mode role switcher
          </span>{' '}
          in the top right bar at any time.
        </p>
      </div>

      {/* Two Entry Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Hospital Staff */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                Internal Clinical Portal
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">Hospital staff</h2>
            <p className="text-sm text-slate-500 mt-1">
              For Kingscare Front Desk, Doctors, Laboratory, Radiology, and
              Hospital Administration.
            </p>

            <form onSubmit={handleStaffSignIn} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Staff Department / Role (Demo Selector)
                </label>
                <select
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
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  {staffRoleChoices.map((c) => (
                    <option key={c.path} value={c.path}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Hospital Staff Email
                </label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="staff@kingscarehospital.ng"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors"
              >
                <span>Sign in as Hospital Staff</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Kingscare Abuja Network
            </span>
            <span>Every action stamps user + timestamp</span>
          </div>
        </div>

        {/* Card 2: NIMASA Sponsor Portal */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Sponsor Body (Read-Only)
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">NIMASA</h2>
            <p className="text-sm text-slate-500 mt-1">
              Nigerian Maritime Administration and Safety Agency — live tracking
              of referred staff from reception to discharge.
            </p>

            <form onSubmit={handleNimasaSignIn} className="mt-6 space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">
                  Sponsor Oversight Access
                </p>
                <p className="mt-0.5">
                  View live stage progress, hospital locations, daily quota
                  utilization, and turnaround reports. Confidential clinical notes
                  remain restricted to Kingscare clinicians.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  NIMASA Official Email
                </label>
                <input
                  type="email"
                  value={nimasaEmail}
                  onChange={(e) => setNimasaEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="medical.liaison@nimasa.gov.ng"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={nimasaPassword}
                  onChange={(e) => setNimasaPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition-colors"
              >
                <span>Sign in to NIMASA Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              NDPR & Clinical Privacy Compliant
            </span>
            <span>Read-only electronic trail</span>
          </div>
        </div>
      </div>
    </div>
  );
};
