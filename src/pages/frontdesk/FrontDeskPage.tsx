import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Send,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { StageChip, StatusChip } from '../../components/ui/StageChip';

export const FrontDeskPage: React.FC = () => {
  const { patients, registerPatient, sendToDoctor } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1988-05-14');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [phone, setPhone] = useState('+234 803 ');
  const [nimasaMember, setNimasaMember] = useState(true);
  const [nimasaStaffId, setNimasaStaffId] = useState('NIM-MAR-5120');
  const [nimasaDepartment, setNimasaDepartment] = useState(
    'Maritime Safety & Seafarers Standards'
  );
  const [consentToShare, setConsentToShare] = useState(true);
  const [justGeneratedRecord, setJustGeneratedRecord] = useState<{
    recordNo: string;
    name: string;
  } | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const created = registerPatient({
      fullName: fullName.trim(),
      dob,
      gender,
      phone,
      nimasaMember,
      nimasaStaffId: nimasaMember ? nimasaStaffId : undefined,
      nimasaDepartment: nimasaMember ? nimasaDepartment : undefined,
      consentToShareWithNimasa: nimasaMember ? consentToShare : false,
    });

    setJustGeneratedRecord({
      recordNo: created.recordNo,
      name: created.fullName,
    });

    setFullName('');
    setPhone('+234 803 ');
  };

  // Today's arrivals & active patients filtered by search
  const filteredArrivals = useMemo(() => {
    return patients.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.recordNo.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q)
      );
    });
  }, [patients, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded mb-1.5">
            Hospital Front Desk & Records Reception
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Patient Registration & Today&apos;s Arrivals
          </h1>
          <p className="text-sm text-slate-500">
            Register arriving patients, capture NIMASA journey-sharing consent,
            and dispatch patients to the consulting physician.
          </p>
        </div>

        <Link
          to="/nimasa"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
        >
          <span>Verify Live on NIMASA Portal</span>
          <ArrowUpRight className="w-4 h-4 text-blue-600" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Register New Patient Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Register New Patient
              </h2>
              <p className="text-xs text-slate-500">
                Generates a unique Kingscare record number (e.g. KC-000117)
              </p>
            </div>
          </div>

          {justGeneratedRecord && (
            <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-emerald-900">
                  Patient Registered — Record No.{' '}
                  <span className="font-mono underline">
                    {justGeneratedRecord.recordNo}
                  </span>
                </p>
                <p className="text-emerald-700 mt-0.5">
                  {justGeneratedRecord.name} has been added to Today&apos;s
                  Arrivals and stamped in the electronic trail.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Capt. Olumide Balogun-Peters"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) =>
                    setGender(e.target.value as 'Male' | 'Female')
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 803 000 0000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* NIMASA Member Yes/No */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">
                  NIMASA Staff / Sponsored Member?
                </span>
                <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNimasaMember(true);
                      setConsentToShare(true);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      nimasaMember
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNimasaMember(false);
                      setConsentToShare(false);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      !nimasaMember
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {nimasaMember && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        NIMASA Staff ID
                      </label>
                      <input
                        type="text"
                        value={nimasaStaffId}
                        onChange={(e) => setNimasaStaffId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        NIMASA Department
                      </label>
                      <input
                        type="text"
                        value={nimasaDepartment}
                        onChange={(e) => setNimasaDepartment(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consentToShare}
                      onChange={(e) => setConsentToShare(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-700 leading-snug">
                      <strong>Consent to share with NIMASA:</strong> Patient
                      authorizes Kingscare Hospital to share live stage status
                      and location timestamps with NIMASA (excluding private
                      clinical notes).
                    </span>
                  </label>
                </>
              )}
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register & Generate Record Number</span>
            </button>
          </form>
        </div>

        {/* Right Column: Search & Today's Arrivals List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Today&apos;s Arrivals & Patient Directory
              </h2>
              <p className="text-xs text-slate-500">
                Click <strong>&quot;Send to doctor&quot;</strong> on registered
                patients to move them to the doctor&apos;s queue.
              </p>
            </div>

            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient name, KC-000..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-200 max-h-[640px] overflow-y-auto">
            {filteredArrivals.map((patient) => {
              const canSendToDoctor = patient.currentStage === 'Registered';
              return (
                <div
                  key={patient.id}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {patient.recordNo}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        {patient.fullName}
                      </span>
                      {patient.nimasaMember ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          NIMASA
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Private
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>DOB: {patient.dob}</span>
                      <span>•</span>
                      <span>{patient.phone}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Arrived: {patient.arrivedAt}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                    <StageChip stage={patient.currentStage} />
                    <StatusChip status={patient.status} />

                    {canSendToDoctor ? (
                      <button
                        type="button"
                        onClick={() => sendToDoctor(patient.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to doctor</span>
                      </button>
                    ) : (
                      <Link
                        to={`/doctor/patients/${patient.recordNo}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-600"
                      >
                        <span>Open Chart</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
