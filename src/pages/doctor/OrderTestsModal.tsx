import React, { useMemo, useState } from 'react';
import { FlaskConical, ScanLine, Ear, Eye, CheckSquare } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export interface SampleTestCatalogItem {
  id: string;
  category: 'Blood' | 'Stool' | 'Tissue' | 'Imaging' | 'Audiology' | 'Vision';
  department: 'Laboratory' | 'Radiology' | 'ENT & Audiology' | 'Eye Clinic';
  testName: string;
  referenceRange: string;
}

export type OrderDepartment = SampleTestCatalogItem['department'];

export const SAMPLE_TESTS_CATALOG: SampleTestCatalogItem[] = [
  // Eye Clinic
  {
    id: 'tst-eye-1',
    category: 'Vision',
    department: 'Eye Clinic',
    testName: 'Visual Acuity (Snellen Decimal) & Ishihara Colour Screening (D65)',
    referenceRange: 'STCW Table A-I/9 by duty category (Deck aided ≥ 0.5, Engine ≥ 0.4)',
  },
  {
    id: 'tst-eye-2',
    category: 'Vision',
    department: 'Eye Clinic',
    testName: 'Clinical Vision Specialist Confirmatory CIE Colour Test (RQF-403-01)',
    referenceRange: 'CIE Standard 1 or 2 (Deck), CIE Standard 1–3 (Engine/GMDSS)',
  },
  // ENT & Audiology
  {
    id: 'tst-ent-1',
    category: 'Audiology',
    department: 'ENT & Audiology',
    testName: 'Pure-Tone Unaided Audiometry (500–3000 Hz) & Speech Assessment',
    referenceRange: '≤ 30 dB better ear, ≤ 40 dB other ear; Speech clear',
  },
  // Blood
  {
    id: 'tst-1',
    category: 'Blood',
    department: 'Laboratory',
    testName: 'Full Blood Count (FBC)',
    referenceRange: 'Hb: 13.0–17.0 g/dL | WBC: 4.0–11.0 x10^9/L',
  },
  {
    id: 'tst-2',
    category: 'Blood',
    department: 'Laboratory',
    testName: 'Malaria Parasite (Thick & Thin Blood Film)',
    referenceRange: 'Negative (No malaria parasites seen)',
  },
  {
    id: 'tst-3',
    category: 'Blood',
    department: 'Laboratory',
    testName: 'Fasting Lipid Profile',
    referenceRange: 'Total Chol < 200 mg/dL | LDL < 130 mg/dL',
  },
  {
    id: 'tst-4',
    category: 'Blood',
    department: 'Laboratory',
    testName: 'Liver Function Test (LFT Panel)',
    referenceRange: 'ALT: 7–56 U/L | AST: 8–33 U/L | Bilirubin < 1.2 mg/dL',
  },
  // Stool & Tissue
  {
    id: 'tst-5',
    category: 'Stool',
    department: 'Laboratory',
    testName: 'Stool Microscopy, Culture & Sensitivity (M/C/S)',
    referenceRange: 'No ova, cysts, or enteropathogens isolated',
  },
  {
    id: 'tst-6',
    category: 'Stool',
    department: 'Laboratory',
    testName: 'Faecal Occult Blood (FOB) Test',
    referenceRange: 'Negative',
  },
  // Imaging
  {
    id: 'tst-9',
    category: 'Imaging',
    department: 'Radiology',
    testName: 'Digital Chest X-Ray (PA View)',
    referenceRange: 'Clear lung fields, normal cardiothoracic ratio (< 0.50)',
  },
  {
    id: 'tst-10',
    category: 'Imaging',
    department: 'Radiology',
    testName: 'Abdominal & Pelvic Ultrasound Scan',
    referenceRange: 'Normal hepatobiliary and renal sonography',
  },
];

const DEFAULT_DEPT_INSTRUCTIONS: Record<OrderDepartment, string> = {
  'Eye Clinic':
    'Record unaided & aided distance vision, Ishihara colour screening, visual fields, and night vision.',
  'ENT & Audiology':
    'Perform unaided hearing test (500–3000 Hz) for both ears and check speech clarity.',
  Laboratory:
    'Collect labelled specimen after verifying photo ID and publish lab results with reference ranges.',
  Radiology:
    'Perform requested imaging study after verifying photo ID, record findings, and attach report/film.',
};

interface OrderTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  recordNo: string;
  onConfirmOrders: (
    selectedTests: SampleTestCatalogItem[],
    instructionsByDept: Record<OrderDepartment, string>
  ) => void;
}

export const OrderTestsModal: React.FC<OrderTestsModalProps> = ({
  isOpen,
  onClose,
  patientName,
  recordNo,
  onConfirmOrders,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(['tst-eye-1', 'tst-ent-1']);
  const [instructionsByDept, setInstructionsByDept] =
    useState<Record<OrderDepartment, string>>(DEFAULT_DEPT_INSTRUCTIONS);

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedTests = useMemo(
    () => SAMPLE_TESTS_CATALOG.filter((t) => selectedIds.includes(t.id)),
    [selectedIds]
  );

  const activeDepartments = useMemo(() => {
    const ordered: OrderDepartment[] = [
      'Eye Clinic',
      'ENT & Audiology',
      'Laboratory',
      'Radiology',
    ];
    return ordered.filter((dept) => selectedTests.some((t) => t.department === dept));
  }, [selectedTests]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTests.length === 0) return;
    onConfirmOrders(selectedTests, instructionsByDept);
    onClose();
  };

  const groups: {
    key: SampleTestCatalogItem['category'];
    title: string;
    deptLabel: OrderDepartment;
    icon: React.ElementType;
  }[] = [
    { key: 'Vision', title: 'Vision & Colour Screening', deptLabel: 'Eye Clinic', icon: Eye },
    { key: 'Audiology', title: 'Audiometry & Hearing', deptLabel: 'ENT & Audiology', icon: Ear },
    { key: 'Blood', title: 'Haematology & Blood Chemistry', deptLabel: 'Laboratory', icon: FlaskConical },
    { key: 'Stool', title: 'Microbiology / Stool', deptLabel: 'Laboratory', icon: FlaskConical },
    { key: 'Imaging', title: 'Radiology & Ultrasound', deptLabel: 'Radiology', icon: ScanLine },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Department Tests & Instructions"
      subtitle={`Seafarer: ${patientName} (${recordNo}) · Write specific instructions per department`}
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((grp) => {
            const items = SAMPLE_TESTS_CATALOG.filter((t) => t.category === grp.key);
            const Icon = grp.icon;
            return (
              <div
                key={grp.key}
                className="rounded-xl border border-surface-border p-4 bg-surface-canvas/70 space-y-2.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-primary flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-primary-600" aria-hidden="true" />
                    {grp.title}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-surface-border text-ink-secondary">
                    {grp.deptLabel}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {items.map((item) => {
                    const checked = selectedIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-primary-50/70 border-primary-300 text-ink-primary'
                            : 'bg-white border-surface-border text-ink-secondary hover:bg-surface-canvas'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleId(item.id)}
                          className="mt-0.5 h-4 w-4 rounded border-surface-border-strong text-primary-600 focus:ring-primary-600"
                        />
                        <div>
                          <p className="font-semibold">{item.testName}</p>
                          <p className="text-[11px] text-ink-muted mt-0.5">
                            Ref: {item.referenceRange}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-Department Instructions */}
        {activeDepartments.length > 0 && (
          <div className="rounded-xl border border-surface-border bg-white p-4 space-y-3.5">
            <div>
              <h3 className="text-sm font-semibold text-ink-primary">
                Instructions for Receiving Departments
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Each department receives only its own instruction below — keep confidential
                diagnoses private.
              </p>
            </div>

            <div className="space-y-3">
              {activeDepartments.map((dept) => (
                <div key={dept} className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-800">
                    Instruction for {dept}
                  </label>
                  <textarea
                    rows={2}
                    value={instructionsByDept[dept]}
                    onChange={(e) =>
                      setInstructionsByDept((prev) => ({
                        ...prev,
                        [dept]: e.target.value,
                      }))
                    }
                    placeholder={`Write examination instruction for ${dept}...`}
                    className="w-full rounded-xl border border-surface-border-strong px-3.5 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-surface-border flex items-center justify-between">
          <span className="text-xs font-medium text-ink-secondary">
            Selected: <strong>{selectedIds.length}</strong> test(s) across{' '}
            <strong>{activeDepartments.length}</strong> department(s)
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-surface-border-strong text-xs font-semibold text-ink-secondary hover:bg-surface-canvas"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedIds.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Dispatch Test Orders ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
