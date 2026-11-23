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
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { CertificateBadge } from '../../components/ui/StageChip';
import { PageHeader, SlideOver, TabItem, Tabs } from '../../components/ui';
import { DepartmentEquipment, DepartmentMaster } from '../../types';

type MasterTab = 'EQUIPMENT' | 'STAFF' | 'CERTIFICATES';

export const AdminMasterFile: React.FC = () => {
  const {
    departments,
    updateDepartment,
    registerEquipment,
    updateEquipment,
    deleteEquipment,
    registerDepartmentStaff,
    deleteDepartmentStaff,
    registerDepartmentCertificate,
    deleteDepartmentCertificate,
  } = useHospital();

  const [selectedDeptId, setSelectedDeptId] = useState<DepartmentMaster['id']>('lab');
  const [activeTab, setActiveTab] = useState<MasterTab>('EQUIPMENT');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // HOD Edit Drawer
  const [hodDrawerOpen, setHodDrawerOpen] = useState(false);
  const [hodForm, setHodForm] = useState({
    floorLocation: '',
    description: '',
    hodName: '',
    hodTitle: '',
    hodQualifications: '',
    hodFellowship: '',
    hodYearsExperience: 0,
    hodEmail: '',
  });

  // Equipment Register / Edit Drawer
  const [eqDrawerOpen, setEqDrawerOpen] = useState(false);
  const [editingEqId, setEditingEqId] = useState<string | null>(null);
  const [eqForm, setEqForm] = useState({
    name: '',
    manufacturer: '',
    model: '',
    yearOfMake: new Date().getFullYear(),
    serialNo: '',
    calibrationCertNo: '',
    lastCalibrated: '',
    nextCalibrationDue: '',
    status: 'Operational' as DepartmentEquipment['status'],
  });

  // Staff Register Drawer
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: '',
    qualification: '',
    licenseNo: '',
    shift: 'Morning (07:00 - 15:00)',
  });

  // Certificate Add Drawer
  const [certDrawerOpen, setCertDrawerOpen] = useState(false);
  const [certForm, setCertForm] = useState({
    type: '',
    issuingBody: '',
    certificateNo: '',
    yearCertified: new Date().getFullYear(),
    expiryDate: '',
    status: 'Valid' as 'Valid' | 'Expiring' | 'Expired',
  });

  const [saving, setSaving] = useState(false);

  const selectedDept =
    departments.find((d) => d.id === selectedDeptId) || departments[0];

  if (!selectedDept) {
    return (
      <div className="surface-panel p-12 text-center text-sm text-ink-muted">
        Loading hospital departments...
      </div>
    );
  }

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

  const openEditHod = () => {
    setErrorMsg(null);
    setHodForm({
      floorLocation: selectedDept.floorLocation,
      description: selectedDept.description,
      hodName: selectedDept.hod.name,
      hodTitle: selectedDept.hod.title,
      hodQualifications: selectedDept.hod.qualifications,
      hodFellowship: selectedDept.hod.fellowship,
      hodYearsExperience: selectedDept.hod.yearsExperience,
      hodEmail: selectedDept.hod.email,
    });
    setHodDrawerOpen(true);
  };

  const openNewEquipment = () => {
    setErrorMsg(null);
    setEditingEqId(null);
    setEqForm({
      name: '',
      manufacturer: '',
      model: '',
      yearOfMake: new Date().getFullYear(),
      serialNo: '',
      calibrationCertNo: '',
      lastCalibrated: '',
      nextCalibrationDue: '',
      status: 'Operational',
    });
    setEqDrawerOpen(true);
  };

  const openEditEquipment = (eq: DepartmentEquipment) => {
    setErrorMsg(null);
    setEditingEqId(eq.id);
    setEqForm({
      name: eq.name,
      manufacturer: eq.manufacturer || '',
      model: eq.model,
      yearOfMake: eq.yearOfMake,
      serialNo: eq.serialNo,
      calibrationCertNo: eq.calibrationCertNo || '',
      lastCalibrated: eq.lastCalibrated || '',
      nextCalibrationDue: eq.nextCalibrationDue || '',
      status: eq.status,
    });
    setEqDrawerOpen(true);
  };

  const handleSaveHod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      await updateDepartment(selectedDept.id, hodForm);
      setHodDrawerOpen(false);
      setFeedback(`Updated HOD & department profile for ${selectedDept.name}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update department.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      if (editingEqId) {
        await updateEquipment(editingEqId, eqForm);
        setFeedback(`Updated ${eqForm.name} (${eqForm.model}).`);
      } else {
        await registerEquipment(selectedDept.id, eqForm);
        setFeedback(
          `Registered ${eqForm.name} (Model: ${eqForm.model}, Serial: ${eqForm.serialNo}) in ${selectedDept.name}.`
        );
      }
      setEqDrawerOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save equipment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEquipment = async (eq: DepartmentEquipment) => {
    setErrorMsg(null);
    try {
      await deleteEquipment(eq.id);
      setFeedback(`Removed ${eq.name} (${eq.model}) from register.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to remove equipment.');
    }
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      await registerDepartmentStaff(selectedDept.id, staffForm);
      setStaffDrawerOpen(false);
      setStaffForm({
        name: '',
        role: '',
        qualification: '',
        licenseNo: '',
        shift: 'Morning (07:00 - 15:00)',
      });
      setFeedback(`Added ${staffForm.name} to ${selectedDept.name}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to register staff.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      await registerDepartmentCertificate(selectedDept.id, certForm);
      setCertDrawerOpen(false);
      setCertForm({
        type: '',
        issuingBody: '',
        certificateNo: '',
        yearCertified: new Date().getFullYear(),
        expiryDate: '',
        status: 'Valid',
      });
      setFeedback(`Registered regulatory certificate ${certForm.certificateNo}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add certificate.');
    } finally {
      setSaving(false);
    }
  };

  const tabs: TabItem<MasterTab>[] = [
    { id: 'EQUIPMENT', label: 'Registered Equipment', count: selectedDept.equipment.length },
    { id: 'STAFF', label: 'Staff Roster', count: selectedDept.staff.length },
    { id: 'CERTIFICATES', label: 'Regulatory Certificates', count: selectedDept.certificates.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Master File"
        subtitle="Manage clinical departments, register diagnostic equipment & model numbers, licensed staff, and regulatory certificates."
        actions={
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white border border-surface-border-strong hover:bg-surface-canvas text-xs font-semibold text-ink-primary shadow-card transition-colors"
          >
            <Users className="w-4 h-4 text-primary-600" aria-hidden="true" />
            <span>Users &amp; Roles</span>
          </Link>
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

      {errorMsg && !eqDrawerOpen && !hodDrawerOpen && !staffDrawerOpen && !certDrawerOpen && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl bg-crimson-50 border border-crimson-100 text-xs text-crimson-700"
        >
          {errorMsg}
        </div>
      )}

      {/* 4 Department Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((dept) => {
          const isSelected = dept.id === selectedDept.id;
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => setSelectedDeptId(dept.id)}
              className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-navy-800 ring-2 ring-primary-100 shadow-card-hover'
                  : 'bg-white/90 border-surface-border/80 hover:border-primary-300 shadow-card'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-navy-800 text-white'
                        : 'bg-primary-50 text-primary-600'
                    }`}
                  >
                    {getDeptIcon(dept.id)}
                  </div>
                  <span className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-canvas text-ink-muted">
                    {dept.shortCode}
                  </span>
                </div>

                <h2 className="text-sm font-semibold text-ink-primary">{dept.name}</h2>
                <p className="text-xs text-ink-muted mt-1 line-clamp-2">{dept.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border/70 flex items-center justify-between text-xs">
                <span className="text-ink-secondary font-medium">
                  {dept.equipment.length} Equipment
                </span>
                <span className="text-primary-700 font-medium">
                  {dept.staff.length} Staff · {dept.certificates.length} Certs
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Department Master Panel */}
      <div className="surface-panel overflow-hidden">
        <div className="p-6 border-b border-surface-border/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-navy-800 text-white text-[11px] font-semibold">
                {selectedDept.shortCode}
              </span>
              <span className="text-xs text-ink-muted">{selectedDept.floorLocation}</span>
            </div>
            <h2 className="text-lg font-semibold text-ink-primary">{selectedDept.name}</h2>
            <p className="text-xs text-ink-secondary">{selectedDept.description}</p>
          </div>

          <div className="rounded-xl bg-surface-canvas/90 border border-surface-border/80 p-4 flex items-start justify-between gap-4 lg:min-w-[380px]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-700">
                  Head of Department
                </div>
                <div className="text-sm font-semibold text-ink-primary">{selectedDept.hod.name}</div>
                <div className="text-xs text-ink-secondary mt-0.5">
                  {selectedDept.hod.qualifications}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={openEditHod}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-surface-border hover:bg-primary-50 text-xs font-medium text-ink-primary shrink-0"
            >
              <Pencil className="w-3 h-3" aria-hidden="true" />
              <span>Edit HOD</span>
            </button>
          </div>
        </div>

        <div className="px-6 pt-5 pb-4 flex flex-wrap items-center justify-between gap-4 border-b border-surface-border/60">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            ariaLabel="Department register sections"
          />

          {activeTab === 'EQUIPMENT' && (
            <button
              type="button"
              onClick={openNewEquipment}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>+ Register Equipment</span>
            </button>
          )}
          {activeTab === 'STAFF' && (
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setStaffDrawerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>+ Register Staff</span>
            </button>
          )}
          {activeTab === 'CERTIFICATES' && (
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setCertDrawerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>+ Add Certificate</span>
            </button>
          )}
        </div>

        {/* TAB 1: REGISTERED EQUIPMENT */}
        {activeTab === 'EQUIPMENT' && (
          <div>
            {selectedDept.equipment.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Cpu className="w-8 h-8 text-ink-muted mx-auto opacity-60" aria-hidden="true" />
                <div className="text-sm font-medium text-ink-primary">
                  No diagnostic equipment registered in {selectedDept.name}
                </div>
                <p className="text-xs text-ink-muted max-w-md mx-auto">
                  Register clinical instruments with manufacturer, model number, serial number, and
                  calibration dates. Registered units automatically sync to Daily Equipment Checks.
                </p>
                <button
                  type="button"
                  onClick={openNewEquipment}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>+ Register first equipment unit</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-canvas/70 border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      <th scope="col" className="py-3 px-6">Equipment &amp; Manufacturer</th>
                      <th scope="col" className="py-3 px-4">Model No.</th>
                      <th scope="col" className="py-3 px-4">Serial &amp; Year</th>
                      <th scope="col" className="py-3 px-4">Calibration Due</th>
                      <th scope="col" className="py-3 px-4">Status</th>
                      <th scope="col" className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/70">
                    {selectedDept.equipment.map((eq) => (
                      <tr key={eq.id} className="hover:bg-primary-50/30">
                        <td className="py-3.5 px-6">
                          <div className="font-semibold text-sm text-ink-primary">{eq.name}</div>
                          {eq.manufacturer && (
                            <div className="text-xs text-ink-muted mt-0.5">{eq.manufacturer}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-navy-800">
                          {eq.model}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-ink-secondary">
                          <div>{eq.serialNo}</div>
                          <div className="text-[11px] text-ink-muted">Made {eq.yearOfMake}</div>
                        </td>
                        <td className="py-3.5 px-4 text-ink-secondary">
                          <div>{eq.nextCalibrationDue || 'Not specified'}</div>
                          {eq.calibrationCertNo && (
                            <div className="text-[11px] font-mono text-ink-muted">
                              {eq.calibrationCertNo}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              eq.status === 'Operational'
                                ? 'bg-emerald-50 text-emerald-700'
                                : eq.status === 'Out of Use'
                                ? 'bg-crimson-50 text-crimson-600'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {eq.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditEquipment(eq)}
                              aria-label={`Edit ${eq.name}`}
                              className="p-1.5 rounded-lg border border-surface-border hover:bg-surface-canvas text-ink-secondary"
                            >
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEquipment(eq)}
                              aria-label={`Remove ${eq.name}`}
                              className="p-1.5 rounded-lg border border-crimson-100 text-crimson-600 hover:bg-crimson-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STAFF ROSTER */}
        {activeTab === 'STAFF' && (
          <div>
            {selectedDept.staff.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-8 h-8 text-ink-muted mx-auto opacity-60" aria-hidden="true" />
                <div className="text-sm font-medium text-ink-primary">
                  No clinical staff assigned to {selectedDept.name} yet
                </div>
                <button
                  type="button"
                  onClick={() => setStaffDrawerOpen(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>+ Register Staff</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-canvas/70 border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      <th scope="col" className="py-3 px-6">Staff Name</th>
                      <th scope="col" className="py-3 px-4">Role / Designation</th>
                      <th scope="col" className="py-3 px-4">Qualification</th>
                      <th scope="col" className="py-3 px-4">License No.</th>
                      <th scope="col" className="py-3 px-4">Shift</th>
                      <th scope="col" className="py-3 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/70">
                    {selectedDept.staff.map((st) => (
                      <tr key={st.id} className="hover:bg-primary-50/30">
                        <td className="py-3.5 px-6 font-semibold text-ink-primary">{st.name}</td>
                        <td className="py-3.5 px-4 text-ink-secondary">{st.role}</td>
                        <td className="py-3.5 px-4 text-ink-muted">{st.qualification}</td>
                        <td className="py-3.5 px-4 font-mono text-navy-800">{st.licenseNo}</td>
                        <td className="py-3.5 px-4 text-ink-muted">{st.shift}</td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => deleteDepartmentStaff(st.id)}
                            aria-label={`Remove ${st.name}`}
                            className="p-1.5 rounded-lg border border-crimson-100 text-crimson-600 hover:bg-crimson-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REGULATORY CERTIFICATES */}
        {activeTab === 'CERTIFICATES' && (
          <div>
            {selectedDept.certificates.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileBadge className="w-8 h-8 text-ink-muted mx-auto opacity-60" aria-hidden="true" />
                <div className="text-sm font-medium text-ink-primary">
                  No regulatory certificates uploaded for {selectedDept.name}
                </div>
                <button
                  type="button"
                  onClick={() => setCertDrawerOpen(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>+ Add Certificate</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-canvas/70 border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      <th scope="col" className="py-3 px-6">Certificate</th>
                      <th scope="col" className="py-3 px-4">Issuing Body</th>
                      <th scope="col" className="py-3 px-4">Year</th>
                      <th scope="col" className="py-3 px-4">Expiry</th>
                      <th scope="col" className="py-3 px-4">Status</th>
                      <th scope="col" className="py-3 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/70">
                    {selectedDept.certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-primary-50/30">
                        <td className="py-3.5 px-6">
                          <div className="font-semibold text-ink-primary">{cert.type}</div>
                          <div className="text-[11px] font-mono text-ink-muted mt-0.5">
                            {cert.certificateNo}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-ink-secondary">{cert.issuingBody}</td>
                        <td className="py-3.5 px-4 font-mono">{cert.yearCertified}</td>
                        <td className="py-3.5 px-4 text-ink-secondary">{cert.expiryDate}</td>
                        <td className="py-3.5 px-4">
                          <CertificateBadge status={cert.status} />
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => deleteDepartmentCertificate(cert.id)}
                            aria-label={`Remove ${cert.certificateNo}`}
                            className="p-1.5 rounded-lg border border-crimson-100 text-crimson-600 hover:bg-crimson-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer 1: Register / Edit Equipment */}
      <SlideOver
        isOpen={eqDrawerOpen}
        onClose={() => setEqDrawerOpen(false)}
        title={editingEqId ? 'Update Diagnostic Equipment' : 'Register Diagnostic Equipment'}
        subtitle={`${selectedDept.name} · Track model number, serial, and calibration schedule`}
      >
        <form onSubmit={handleSaveEquipment} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-crimson-50 border border-crimson-100 text-xs text-crimson-700">
              {errorMsg}
            </div>
          )}
          <div>
            <label htmlFor="eq-name" className="block text-xs font-semibold text-ink-secondary mb-1">
              Equipment Name *
            </label>
            <input
              id="eq-name"
              type="text"
              required
              placeholder="e.g. Pure-Tone Audiometer"
              value={eqForm.name}
              onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="eq-mfg" className="block text-xs font-semibold text-ink-secondary mb-1">
                Manufacturer
              </label>
              <input
                id="eq-mfg"
                type="text"
                placeholder="e.g. Interacoustics"
                value={eqForm.manufacturer}
                onChange={(e) => setEqForm({ ...eqForm, manufacturer: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label htmlFor="eq-model" className="block text-xs font-semibold text-ink-secondary mb-1">
                Model Number *
              </label>
              <input
                id="eq-model"
                type="text"
                required
                placeholder="e.g. AD226"
                value={eqForm.model}
                onChange={(e) => setEqForm({ ...eqForm, model: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label htmlFor="eq-serial" className="block text-xs font-semibold text-ink-secondary mb-1">
                Serial Number *
              </label>
              <input
                id="eq-serial"
                type="text"
                required
                placeholder="e.g. IA-2026-4410"
                value={eqForm.serialNo}
                onChange={(e) => setEqForm({ ...eqForm, serialNo: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label htmlFor="eq-year" className="block text-xs font-semibold text-ink-secondary mb-1">
                Year of Make *
              </label>
              <input
                id="eq-year"
                type="number"
                required
                min={1980}
                max={2035}
                value={eqForm.yearOfMake}
                onChange={(e) => setEqForm({ ...eqForm, yearOfMake: Number(e.target.value) })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-surface-border/70">
            <div>
              <label htmlFor="eq-cal-cert" className="block text-xs font-semibold text-ink-secondary mb-1">
                Calibration Cert No.
              </label>
              <input
                id="eq-cal-cert"
                type="text"
                placeholder="e.g. AUD-CAL-2026-01"
                value={eqForm.calibrationCertNo}
                onChange={(e) => setEqForm({ ...eqForm, calibrationCertNo: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label htmlFor="eq-status" className="block text-xs font-semibold text-ink-secondary mb-1">
                Operational Status
              </label>
              <select
                id="eq-status"
                value={eqForm.status}
                onChange={(e) =>
                  setEqForm({
                    ...eqForm,
                    status: e.target.value as DepartmentEquipment['status'],
                  })
                }
                className="w-full rounded-xl border border-surface-border-strong bg-white px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="Operational">Operational</option>
                <option value="Calibration Due">Calibration Due</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Use">Out of Use</option>
              </select>
            </div>
            <div>
              <label htmlFor="eq-last-cal" className="block text-xs font-semibold text-ink-secondary mb-1">
                Last Calibrated Date
              </label>
              <input
                id="eq-last-cal"
                type="text"
                placeholder="e.g. 15 Nov 2026"
                value={eqForm.lastCalibrated}
                onChange={(e) => setEqForm({ ...eqForm, lastCalibrated: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label htmlFor="eq-due" className="block text-xs font-semibold text-ink-secondary mb-1">
                Next Calibration Due
              </label>
              <input
                id="eq-due"
                type="text"
                placeholder="e.g. 15 Nov 2027"
                value={eqForm.nextCalibrationDue}
                onChange={(e) => setEqForm({ ...eqForm, nextCalibrationDue: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setEqDrawerOpen(false)}
              className="h-10 px-4 rounded-xl border border-surface-border-strong text-xs font-semibold text-ink-secondary hover:bg-surface-canvas"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-navy-800 hover:bg-navy-900 disabled:opacity-60 text-white text-xs font-semibold"
            >
              {saving ? 'Saving...' : editingEqId ? 'Update Equipment' : 'Save Equipment'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Drawer 2: Edit HOD & Location */}
      <SlideOver
        isOpen={hodDrawerOpen}
        onClose={() => setHodDrawerOpen(false)}
        title="Edit Department HOD & Profile"
        subtitle={selectedDept.name}
      >
        <form onSubmit={handleSaveHod} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Floor Location</label>
            <input
              type="text"
              required
              value={hodForm.floorLocation}
              onChange={(e) => setHodForm({ ...hodForm, floorLocation: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">HOD Full Name</label>
            <input
              type="text"
              required
              value={hodForm.hodName}
              onChange={(e) => setHodForm({ ...hodForm, hodName: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Title</label>
              <input
                type="text"
                required
                value={hodForm.hodTitle}
                onChange={(e) => setHodForm({ ...hodForm, hodTitle: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Email</label>
              <input
                type="email"
                required
                value={hodForm.hodEmail}
                onChange={(e) => setHodForm({ ...hodForm, hodEmail: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Qualifications</label>
            <input
              type="text"
              required
              value={hodForm.hodQualifications}
              onChange={(e) => setHodForm({ ...hodForm, hodQualifications: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setHodDrawerOpen(false)}
              className="h-10 px-4 rounded-xl border border-surface-border-strong text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold"
            >
              {saving ? 'Saving...' : 'Save Department'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Drawer 3: Register Department Staff */}
      <SlideOver
        isOpen={staffDrawerOpen}
        onClose={() => setStaffDrawerOpen(false)}
        title="Register Department Staff"
        subtitle={selectedDept.name}
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. MLS. Kelechi Nwachukwu"
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Role / Designation *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Medical Lab Scientist"
              value={staffForm.role}
              onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Qualification *</label>
            <input
              type="text"
              required
              placeholder="e.g. BMLS, AMLSCN"
              value={staffForm.qualification}
              onChange={(e) => setStaffForm({ ...staffForm, qualification: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">License No. *</label>
              <input
                type="text"
                required
                placeholder="e.g. MLSCN-RA-19402"
                value={staffForm.licenseNo}
                onChange={(e) => setStaffForm({ ...staffForm, licenseNo: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Duty Shift *</label>
              <input
                type="text"
                required
                value={staffForm.shift}
                onChange={(e) => setStaffForm({ ...staffForm, shift: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setStaffDrawerOpen(false)}
              className="h-10 px-4 rounded-xl border border-surface-border-strong text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold"
            >
              {saving ? 'Saving...' : 'Save Staff'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Drawer 4: Add Regulatory Certificate */}
      <SlideOver
        isOpen={certDrawerOpen}
        onClose={() => setCertDrawerOpen(false)}
        title="Add Regulatory Certificate"
        subtitle={selectedDept.name}
      >
        <form onSubmit={handleSaveCert} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Certificate Type *</label>
            <input
              type="text"
              required
              placeholder="e.g. MLSCN Laboratory Accreditation"
              value={certForm.type}
              onChange={(e) => setCertForm({ ...certForm, type: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Issuing Body *</label>
            <input
              type="text"
              required
              placeholder="e.g. Medical Laboratory Science Council of Nigeria"
              value={certForm.issuingBody}
              onChange={(e) => setCertForm({ ...certForm, issuingBody: e.target.value })}
              className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Certificate No. *</label>
              <input
                type="text"
                required
                value={certForm.certificateNo}
                onChange={(e) => setCertForm({ ...certForm, certificateNo: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Year Certified *</label>
              <input
                type="number"
                required
                value={certForm.yearCertified}
                onChange={(e) => setCertForm({ ...certForm, yearCertified: Number(e.target.value) })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Expiry Date *</label>
              <input
                type="text"
                required
                placeholder="e.g. 31 Dec 2027"
                value={certForm.expiryDate}
                onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })}
                className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Status</label>
              <select
                value={certForm.status}
                onChange={(e) =>
                  setCertForm({
                    ...certForm,
                    status: e.target.value as 'Valid' | 'Expiring' | 'Expired',
                  })
                }
                className="w-full rounded-xl border border-surface-border-strong bg-white px-3.5 py-2 text-sm"
              >
                <option value="Valid">Valid</option>
                <option value="Expiring">Expiring</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setCertDrawerOpen(false)}
              className="h-10 px-4 rounded-xl border border-surface-border-strong text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold"
            >
              {saving ? 'Saving...' : 'Save Certificate'}
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
};
