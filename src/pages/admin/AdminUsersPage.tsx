import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, ClipboardList, Shield } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

export const AdminUsersPage: React.FC = () => {
  const { users, auditLog } = useHospital();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded mb-1.5">
            <Users className="w-3.5 h-3.5" />
            Access Control & Role Permissions
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Users & Roles Directory
          </h1>
          <p className="text-sm text-slate-500">
            Authorized Kingscare clinical personnel and NIMASA sponsor liaison
            accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Master File</span>
          </Link>
          <Link
            to="/admin/audit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Audit Log ({auditLog.length})</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Official Email</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Department / Organization</th>
                <th className="py-3 px-4">Portal Scope</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Stamped Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {u.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                    {u.role}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {u.department}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                      <Shield className="w-3 h-3" />
                      {u.portalCategory}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        u.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {u.lastLogin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
