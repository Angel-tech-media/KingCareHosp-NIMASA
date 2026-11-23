import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, KeyRound, Plus, Shield } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { PageHeader, SlideOver } from '../../components/ui';
import { RoleType, SystemUser } from '../../types';

const ROLE_DEFAULTS: Record<RoleType, { title: string; department: string }> = {
  ADMIN: { title: 'Medical Director & QSS Admin', department: 'Medical Administration & QSS' },
  FRONT_DESK: { title: 'Registration Officer', department: 'Front Desk & Identity Gate' },
  DOCTOR: { title: 'Recognized Medical Practitioner', department: 'Maritime Medicine (RMP Desk)' },
  LAB: { title: 'Senior Medical Lab Scientist', department: 'Laboratory & Pathology Services' },
  RADIOLOGY: { title: 'Consultant Radiologist', department: 'Radiology / X-Ray & Diagnostic Imaging' },
  NIMASA: { title: 'NIMASA Medical Liaison Officer', department: 'NIMASA Maritime Safety Oversight' },
};

export const AdminUsersPage: React.FC = () => {
  const { users, currentUser, registerUser, updateUserStatus, resetUserPassword } = useHospital();

  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<SystemUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    portalRole: 'FRONT_DESK' as RoleType,
    roleTitle: ROLE_DEFAULTS.FRONT_DESK.title,
    department: ROLE_DEFAULTS.FRONT_DESK.department,
    licenseNo: '',
  });

  const handleRoleChange = (portalRole: RoleType) => {
    setForm((prev) => ({
      ...prev,
      portalRole,
      roleTitle: ROLE_DEFAULTS[portalRole].title,
      department: ROLE_DEFAULTS[portalRole].department,
    }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      await registerUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        portalRole: form.portalRole,
        roleTitle: form.roleTitle,
        department: form.department,
        licenseNo: form.licenseNo.trim() || undefined,
      });
      setCreateOpen(false);
      setFeedback(`Registered account for ${form.fullName} (${form.email} · ${form.portalRole}).`);
      setForm({
        fullName: '',
        email: '',
        password: '',
        portalRole: 'FRONT_DESK',
        roleTitle: ROLE_DEFAULTS.FRONT_DESK.title,
        department: ROLE_DEFAULTS.FRONT_DESK.department,
        licenseNo: '',
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u: SystemUser) => {
    setErrorMsg(null);
    const nextStatus = u.status === 'Suspended' ? 'Active' : 'Suspended';
    try {
      await updateUserStatus(u.id, nextStatus);
      setFeedback(`Updated ${u.name} account status to ${nextStatus}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await resetUserPassword(resetTarget.id, newPassword);
      setFeedback(`Password reset for ${resetTarget.name}.`);
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        subtitle="Create individual password-protected accounts for clinical staff and NIMASA agency officers (RQP-404 §5)."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white border border-surface-border-strong hover:bg-surface-canvas text-xs font-semibold text-ink-primary shadow-card transition-colors"
            >
              <Building2 className="w-4 h-4 text-primary-600" aria-hidden="true" />
              <span>Master File</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>+ Register User Account</span>
            </button>
          </div>
        }
      />

      {feedback && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center justify-between gap-3"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && !createOpen && !resetTarget && (
        <div role="alert" className="px-4 py-3 rounded-xl bg-crimson-50 border border-crimson-100 text-xs text-crimson-700">
          {errorMsg}
        </div>
      )}

      <section aria-label="Users and roles directory" className="surface-panel overflow-hidden">
        {/* Mobile view */}
        <div className="md:hidden divide-y divide-surface-border">
          {users.map((u) => (
            <div key={u.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink-primary">{u.name}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    u.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-crimson-50 text-crimson-600'
                  }`}
                >
                  {u.status}
                </span>
              </div>
              <div className="font-mono text-xs text-ink-muted">{u.email}</div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="px-2 py-0.5 rounded-full bg-primary-50 text-navy-800 font-semibold">
                  {u.portalCategory}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetTarget(u);
                      setNewPassword('');
                    }}
                    className="text-primary-700 font-medium hover:underline"
                  >
                    Reset Password
                  </button>
                  {u.id !== currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u)}
                      className="text-crimson-600 font-medium hover:underline"
                    >
                      {u.status === 'Suspended' ? 'Activate' : 'Suspend'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-canvas/70 border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th scope="col" className="py-3 px-6">User &amp; Official Email</th>
                <th scope="col" className="py-3 px-4">Role &amp; Department</th>
                <th scope="col" className="py-3 px-4">Portal Scope</th>
                <th scope="col" className="py-3 px-4">Status</th>
                <th scope="col" className="py-3 px-4">Last Login</th>
                <th scope="col" className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/70">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-primary-50/30">
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-sm text-ink-primary">{u.name}</div>
                    <div className="font-mono text-[11px] text-ink-muted mt-0.5">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-ink-primary">{u.role}</div>
                    <div className="text-[11px] text-ink-muted mt-0.5">
                      {u.department}
                      {u.licenseNo ? ` · ${u.licenseNo}` : ''}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-50 text-navy-800 text-xs font-semibold">
                      <Shield className="w-3 h-3 text-primary-600" aria-hidden="true" />
                      {u.portalCategory}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : u.status === 'Suspended'
                          ? 'bg-crimson-50 text-crimson-600'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-ink-muted">{u.lastLogin}</td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setResetTarget(u);
                          setNewPassword('');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-surface-border bg-white hover:bg-surface-canvas text-ink-secondary font-medium"
                      >
                        <KeyRound className="w-3 h-3" aria-hidden="true" />
                        <span>Reset PW</span>
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${
                            u.status === 'Suspended'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-crimson-100 bg-crimson-50 text-crimson-600 hover:bg-crimson-100'
                          }`}
                        >
                          {u.status === 'Suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Drawer: Register User Account */}
      <SlideOver
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register User Account"
        subtitle="Create a real login account with role-based permissions"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-crimson-50 border border-crimson-100 text-xs text-crimson-700">
              {errorMsg}
            </div>
          )}
          <div>
            <label htmlFor="usr-name" className="block text-xs font-semibold text-ink-secondary mb-1">
              Full Name *
            </label>
            <input
              id="usr-name"
              type="text"
              required
              placeholder="e.g. Chidinma Okafor"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="usr-email" className="block text-xs font-semibold text-ink-secondary mb-1">
              Official Email *
            </label>
            <input
              id="usr-email"
              type="email"
              required
              placeholder="e.g. reception@kingscarehospital.ng"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="usr-portal" className="block text-xs font-semibold text-ink-secondary mb-1">
                Portal Role *
              </label>
              <select
                id="usr-portal"
                value={form.portalRole}
                onChange={(e) => handleRoleChange(e.target.value as RoleType)}
                className="w-full rounded-xl border border-surface-border-strong bg-white px-3.5 py-2 text-sm"
              >
                <option value="FRONT_DESK">FRONT_DESK (Reception)</option>
                <option value="DOCTOR">DOCTOR (RMP)</option>
                <option value="LAB">LAB (Laboratory)</option>
                <option value="RADIOLOGY">RADIOLOGY (Imaging)</option>
                <option value="ADMIN">ADMIN (Medical Director / QSS)</option>
                <option value="NIMASA">NIMASA (Agency Liaison · Read-Only)</option>
              </select>
            </div>
            <div>
              <label htmlFor="usr-password" className="block text-xs font-semibold text-ink-secondary mb-1">
                Initial Password (min 8 chars) *
              </label>
              <input
                id="usr-password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="usr-title" className="block text-xs font-semibold text-ink-secondary mb-1">
              System Role Title *
            </label>
            <input
              id="usr-title"
              type="text"
              required
              value={form.roleTitle}
              onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="usr-dept" className="block text-xs font-semibold text-ink-secondary mb-1">
                Department / Organization *
              </label>
              <input
                id="usr-dept"
                type="text"
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="usr-license" className="block text-xs font-semibold text-ink-secondary mb-1">
                MDCN / License No.
              </label>
              <input
                id="usr-license"
                type="text"
                placeholder="Optional"
                value={form.licenseNo}
                onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="h-10 px-4 rounded-xl border border-surface-border-strong text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-navy-800 hover:bg-navy-900 disabled:opacity-60 text-white text-xs font-semibold"
            >
              {saving ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Drawer: Reset User Password */}
      <SlideOver
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title="Reset Account Password"
        subtitle={resetTarget ? `${resetTarget.name} (${resetTarget.email})` : ''}
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-crimson-50 border border-crimson-100 text-xs text-crimson-700">
              {errorMsg}
            </div>
          )}
          <div>
            <label htmlFor="reset-pw" className="block text-xs font-semibold text-ink-secondary mb-1">
              New Password (min 8 characters) *
            </label>
            <input
              id="reset-pw"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setResetTarget(null)}
              className="h-10 px-4 rounded-xl border border-surface-border-strong text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
};
