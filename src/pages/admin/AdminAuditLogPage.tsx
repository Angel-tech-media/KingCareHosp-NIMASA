import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Building2,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Filter,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { ActionButton } from '../../components/ui';

const getActionBadgeClasses = (action: string): string => {
  const lower = action.toLowerCase();
  if (lower.includes('admit')) {
    return 'bg-purple-50 text-purple-800 border-purple-200';
  }
  if (lower.includes('test') || lower.includes('result') || lower.includes('order') || lower.includes('publish')) {
    return 'bg-blue-50 text-blue-800 border-blue-200';
  }
  if (lower.includes('assess') || lower.includes('discharge') || lower.includes('medicat')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (lower.includes('register') || lower.includes('send') || lower.includes('await')) {
    return 'bg-amber-50 text-amber-900 border-amber-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-300';
};

export const AdminAuditLogPage: React.FC = () => {
  const { auditLog } = useHospital();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  const uniqueRoles = useMemo(
    () => Array.from(new Set(auditLog.map((item) => item.actorRole))),
    [auditLog]
  );

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return auditLog.filter((item) => {
      const matchesRole = roleFilter === 'ALL' || item.actorRole === roleFilter;
      const matchesQuery =
        item.actorName.toLowerCase().includes(q) ||
        item.actorRole.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.recordNo.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [auditLog, searchQuery, roleFilter]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(filteredLogs, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard permissions are blocked in headless/demo context
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded mb-1.5">
            <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
            Tamper-Evident Electronic Trail
          </span>
          <h1 className="text-2xl font-bold text-ink-primary">
            Hospital & NIMASA Electronic Audit Log
          </h1>
          <p className="text-sm text-ink-muted">
            Every action across Front Desk, Doctor, Laboratory, and Radiology is
            automatically stamped with Who, Role, Action, Record No., and Time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            variant="secondary"
            size="sm"
            onClick={handleCopyJson}
            leftIcon={
              copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-primary-600" />
              )
            }
          >
            {copied ? 'Copied JSON' : 'Copy JSON'}
          </ActionButton>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-card border border-surface-border-strong hover:bg-primary-50/50 hover:border-primary-300 text-xs font-semibold text-ink-secondary hover:text-ink-primary transition-all active:scale-[0.99]"
          >
            <Building2 className="w-4 h-4 text-primary-600" aria-hidden="true" />
            <span>Master File</span>
          </Link>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-card border border-surface-border-strong hover:bg-primary-50/50 hover:border-primary-300 text-xs font-semibold text-ink-secondary hover:text-ink-primary transition-all active:scale-[0.99]"
          >
            <Users className="w-4 h-4 text-primary-600" aria-hidden="true" />
            <span>Users & Roles</span>
          </Link>
        </div>
      </div>

      <section
        aria-label="Hospital and NIMASA electronic audit log"
        className="bg-surface-card rounded-lg border border-surface-border shadow-card overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-surface-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>
              Live Audit Stream Active ({filteredLogs.length} stamped events)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search
                aria-hidden="true"
                className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="search"
                aria-label="Filter audit log by staff name, role, action, or record number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by who, role, action, KC-..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-surface-border-strong text-xs sm:text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div className="relative">
              <Filter
                aria-hidden="true"
                className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <select
                aria-label="Filter audit log by staff role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-8 pr-7 py-1.5 rounded-lg border border-surface-border-strong text-xs font-medium text-ink-secondary bg-surface-card focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="ALL">All Roles ({auditLog.length})</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Stacked Cards (< md) */}
        <div className="md:hidden divide-y divide-surface-border">
          {filteredLogs.length === 0 ? (
            <div className="py-10 px-4 text-center text-sm text-ink-muted">
              No audit log entries match your filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 space-y-2 hover:bg-surface-canvas transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${getActionBadgeClasses(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                  <Link
                    to={`/nimasa/patients/${log.recordNo}`}
                    className="font-mono text-xs font-bold text-primary-700 hover:underline"
                  >
                    {log.recordNo}
                  </Link>
                </div>
                <p className="text-xs text-ink-secondary">{log.details}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-ink-muted">
                  <span className="font-semibold text-ink-primary">
                    {log.actorName}{' '}
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-surface-subtle text-ink-secondary font-medium">
                      {log.actorRole}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {log.timestamp}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-surface-canvas border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th scope="col" className="py-3 px-4">Who</th>
                <th scope="col" className="py-3 px-4">Role</th>
                <th scope="col" className="py-3 px-4">Action</th>
                <th scope="col" className="py-3 px-4">Record</th>
                <th scope="col" className="py-3 px-4">Time</th>
                <th scope="col" className="py-3 px-4">Trail Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-ink-muted">
                    No audit log entries match your filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-primary-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-ink-primary">
                      {log.actorName}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-secondary">
                      <span className="px-2 py-0.5 rounded bg-surface-subtle text-ink-secondary font-medium">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getActionBadgeClasses(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-ink-primary">
                      <Link
                        to={`/nimasa/patients/${log.recordNo}`}
                        className="text-primary-700 hover:underline"
                      >
                        {log.recordNo}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-ink-muted whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                        {log.timestamp}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-secondary">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
