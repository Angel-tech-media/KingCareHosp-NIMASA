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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-card border border-surface-border-strong hover:bg-primary-50/50 hover:border-primary-300 text-xs font-semibold text-ink-secondary hover:text-ink-primary transition-all active:scale-[0.99]"
          >
            <Building2 className="w-4 h-4 text-primary-600" aria-hidden="true" />
            <span>Master File</span>
          </Link>
          <Link
            to="/admin/audit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.99]"
          >
            <ClipboardList className="w-4 h-4" aria-hidden="true" />
            <span>Audit Log ({auditLog.length})</span>
          </Link>
        </div>
      </div>

      <section
        aria-label="Users and roles directory"
        className="bg-surface-card rounded-lg border border-surface-border shadow-card overflow-hidden"
      >
        {/* Mobile Stacked Cards (< md) */}
        <div className="md:hidden divide-y divide-surface-border">
          {users.map((u) => (
            <div key={u.id} className="p-4 space-y-2 hover:bg-surface-canvas transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink-primary">{u.name}</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    u.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {u.status}
                </span>
              </div>
              <div className="font-mono text-xs text-ink-muted">{u.email}</div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="font-semibold text-ink-secondary">{u.role}</span>
                <span className="text-ink-muted">•</span>
                <span className="text-ink-muted">{u.department}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-surface-border/70 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-50 text-primary-800 border border-primary-200 font-semibold">
                  <Shield className="w-3 h-3" aria-hidden="true" />
                  {u.portalCategory}
                </span>
                <span className="text-ink-muted">{u.lastLogin}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-surface-canvas border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th scope="col" className="py-3 px-4">Full Name</th>
                <th scope="col" className="py-3 px-4">Official Email</th>
                <th scope="col" className="py-3 px-4">System Role</th>
                <th scope="col" className="py-3 px-4">Department / Organization</th>
                <th scope="col" className="py-3 px-4">Portal Scope</th>
                <th scope="col" className="py-3 px-4">Status</th>
                <th scope="col" className="py-3 px-4">Last Stamped Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-primary-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-ink-primary">
                    {u.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-ink-muted">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-ink-primary">
                    {u.role}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-ink-secondary">
                    {u.department}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-50 text-primary-800 border border-primary-200 text-xs font-semibold">
                      <Shield className="w-3 h-3" aria-hidden="true" />
                      {u.portalCategory}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        u.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-ink-muted">
                    {u.lastLogin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
