import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Building2,
  Users,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

export const AdminAuditLogPage: React.FC = () => {
  const { auditLog } = useHospital();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLog.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.actorName.toLowerCase().includes(q) ||
      item.actorRole.toLowerCase().includes(q) ||
      item.action.toLowerCase().includes(q) ||
      item.recordNo.toLowerCase().includes(q) ||
      item.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded mb-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            Tamper-Evident Electronic Trail
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Hospital & NIMASA Electronic Audit Log
          </h1>
          <p className="text-sm text-slate-500">
            Every action across Front Desk, Doctor, Laboratory, and Radiology is
            automatically stamped with Who, Role, Action, Record No., and Time.
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
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Users & Roles</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Live Audit Stream Active ({filteredLogs.length} stamped events)
            </span>
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by who, role, action, KC-..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Who</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Record</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Trail Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {log.actorName}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-bold text-blue-700">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                    <Link
                      to={`/nimasa/patients/${log.recordNo}`}
                      className="text-blue-600 hover:underline"
                    >
                      {log.recordNo}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {log.details}
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
