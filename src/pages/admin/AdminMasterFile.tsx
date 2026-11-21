import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  ScanLine,
  Ear,
  Eye,
  Award,
  Users,
  Cpu,
  FileBadge,
  Building2,
  ClipboardList,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { CertificateBadge } from '../../components/ui/StageChip';
import { DepartmentMaster } from '../../types';

export const AdminMasterFile: React.FC = () => {
  const { departments, auditLog } = useHospital();
  const [selectedDeptId, setSelectedDeptId] = useState<DepartmentMaster['id']>(
    'lab'
  );

  const selectedDept =
    departments.find((d) => d.id === selectedDeptId) || departments[0];

  const getDeptIcon = (id: DepartmentMaster['id']) => {
    switch (id) {
      case 'lab':
        return <FlaskConical className="w-5 h-5" />;
      case 'radiology':
        return <ScanLine className="w-5 h-5" />;
      case 'ent':
        return <Ear className="w-5 h-5" />;
      case 'eye':
        return <Eye className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded mb-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Hospital Administration & Regulatory Compliance
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Hospital Master File — Clinical Departments
          </h1>
          <p className="text-sm text-slate-500">
            Click a department card below to inspect Head of Department
            qualifications, licensed staff, diagnostic equipment, and regulatory
            certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Users & Roles</span>
          </Link>
          <Link
            to="/admin/audit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Audit Log ({auditLog.length})</span>
          </Link>
        </div>
      </div>

      {/* 4 Department Cards (Laboratory, Radiology/X-ray, ENT/Audiology, Eye clinic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((dept) => {
          const isSelected = dept.id === selectedDept.id;
          const validCount = dept.certificates.filter(
            (c) => c.status === 'Valid'
          ).length;

          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => setSelectedDeptId(dept.id)}
              className={`text-left p-5 rounded-lg border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-blue-600 ring-2 ring-blue-100 shadow-md'
                  : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {getDeptIcon(dept.id)}
                  </div>
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {dept.shortCode}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900">
                  {dept.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {dept.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  {dept.staff.length} Staff • {dept.equipment.length} Units
                </span>
                <span className="font-semibold text-blue-600">
                  {validCount}/{dept.certificates.length} Certs Valid
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Department Master File Details */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* HOD & Qualifications Banner */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-blue-600 text-white text-xs font-semibold">
                  {selectedDept.shortCode}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Location: {selectedDept.floorLocation}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {selectedDept.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                {selectedDept.description}
              </p>
            </div>

            {/* Head of Department Box */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm lg:min-w-[380px]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    Head of Department (HOD)
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedDept.hod.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    Qualifications: {selectedDept.hod.qualifications}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedDept.hod.fellowship} •{' '}
                    {selectedDept.hod.yearsExperience} yrs experience
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Detail Sections: Staff List, Equipment Table, Certificates Table */}
        <div className="p-6 space-y-8">
          {/* 1. Staff List */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Department Staff Roster ({selectedDept.staff.length})
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-4">Staff Name</th>
                    <th className="py-2.5 px-4">Role / Designation</th>
                    <th className="py-2.5 px-4">Academic & Professional Qualification</th>
                    <th className="py-2.5 px-4">Practicing License No.</th>
                    <th className="py-2.5 px-4">Duty Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedDept.staff.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {st.name}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700">
                        {st.role}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {st.qualification}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-blue-700 font-semibold">
                        {st.licenseNo}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {st.shift}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Equipment Table (name, model, year of make) */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Registered Diagnostic Equipment ({selectedDept.equipment.length})
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-4">Equipment Name</th>
                    <th className="py-2.5 px-4">Model</th>
                    <th className="py-2.5 px-4">Year of Make</th>
                    <th className="py-2.5 px-4">Serial No.</th>
                    <th className="py-2.5 px-4">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedDept.equipment.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {eq.name}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                        {eq.model}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                        {eq.yearOfMake}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {eq.serialNo}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${
                            eq.status === 'Operational'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {eq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Certificates Table (type, year certified, expiry, status badge Valid/Expiring/Expired) */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-blue-600" />
              Regulatory & Quality Certificates (
              {selectedDept.certificates.length})
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-4">Certificate Type</th>
                    <th className="py-2.5 px-4">Issuing Regulatory Body</th>
                    <th className="py-2.5 px-4">Year Certified</th>
                    <th className="py-2.5 px-4">Expiry Date</th>
                    <th className="py-2.5 px-4">Status Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedDept.certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {cert.type}
                        </div>
                        <div className="font-mono text-xs text-slate-400">
                          Ref: {cert.certificateNo}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {cert.issuingBody}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                        {cert.yearCertified}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700">
                        {cert.expiryDate}
                      </td>
                      <td className="py-3 px-4">
                        <CertificateBadge status={cert.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
