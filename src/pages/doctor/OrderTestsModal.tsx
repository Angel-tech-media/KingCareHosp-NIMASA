import React, { useState } from 'react';
import { FlaskConical, ScanLine, CheckSquare } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export interface SampleTestCatalogItem {
  id: string;
  category: 'Blood' | 'Stool' | 'Tissue' | 'Imaging';
  department: 'Laboratory' | 'Radiology';
  testName: string;
  referenceRange: string;
}

export const SAMPLE_TESTS_CATALOG: SampleTestCatalogItem[] = [
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
  // Stool
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
  // Tissue
  {
    id: 'tst-7',
    category: 'Tissue',
    department: 'Laboratory',
    testName: 'Tissue Biopsy Histopathology (H&E Stain)',
    referenceRange: 'Benign cellular architecture / No dysplasia',
  },
  {
    id: 'tst-8',
    category: 'Tissue',
    department: 'Laboratory',
    testName: 'Fine Needle Aspiration Cytology (FNAC)',
    referenceRange: 'Normal cytology',
  },
  // Imaging (X-ray, ultrasound)
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
  {
    id: 'tst-11',
    category: 'Imaging',
    department: 'Radiology',
    testName: 'Musculoskeletal Joint X-Ray (AP & Lateral)',
    referenceRange: 'Normal bone alignment, no cortical fracture',
  },
];

interface OrderTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  recordNo: string;
  onConfirmOrders: (selectedTests: SampleTestCatalogItem[]) => void;
}

export const OrderTestsModal: React.FC<OrderTestsModalProps> = ({
  isOpen,
  onClose,
  patientName,
  recordNo,
  onConfirmOrders,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(['tst-1']);

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = SAMPLE_TESTS_CATALOG.filter((t) =>
      selectedIds.includes(t.id)
    );
    if (chosen.length === 0) return;
    onConfirmOrders(chosen);
    onClose();
  };

  const categories: ('Blood' | 'Stool' | 'Tissue' | 'Imaging')[] = [
    'Blood',
    'Stool',
    'Tissue',
    'Imaging',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Diagnostic Tests (Laboratory & Radiology)"
      subtitle={`Patient: ${patientName} (${recordNo}) • Stamps electronic trail as "Tests requested"`}
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const items = SAMPLE_TESTS_CATALOG.filter(
              (t) => t.category === cat
            );
            const isImaging = cat === 'Imaging';
            return (
              <div
                key={cat}
                className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-2.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    {isImaging ? (
                      <ScanLine className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FlaskConical className="w-4 h-4 text-blue-600" />
                    )}
                    {cat === 'Imaging' ? 'Imaging (X-Ray & Ultrasound)' : cat}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {isImaging ? 'Radiology' : 'Laboratory'}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {items.map((item) => {
                    const checked = selectedIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-blue-50/70 border-blue-300 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleId(item.id)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-semibold">{item.testName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
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

        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">
            Selected: <strong>{selectedIds.length}</strong> test(s)
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedIds.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
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
