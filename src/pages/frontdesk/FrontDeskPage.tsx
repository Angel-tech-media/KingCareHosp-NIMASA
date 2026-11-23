import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Search, Send, CheckCircle2, Clock } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { PageHeader, Tabs, TabItem } from '../../components/ui';
import { RegisterSeafarerDrawer } from './RegisterSeafarerDrawer';

type ArrivalsFilter = 'ALL' | 'WAITING' | 'DISPATCHED';

export const FrontDeskPage: React.FC = () => {
  const { patients, sendToDoctor } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<ArrivalsFilter>('ALL');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [justRegistered, setJustRegistered] = useState<{
    recordNo: string;
    name: string;
    isUnder18: boolean;
  } | null>(null);

  const waitingCount = useMemo(
    () => patients.filter((p) => p.currentStage === 'Registered').length,
    [patients]
  );

  const dispatchedCount = patients.length - waitingCount;

  const filteredArrivals = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => {
      const matchesTab =
        statusTab === 'ALL'
          ? true
          : statusTab === 'WAITING'
          ? p.currentStage === 'Registered'
          : p.currentStage !== 'Registered';
      const matchesSearch =
        p.fullName.toLowerCase().includes(q) ||
        p.recordNo.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.rmp?.category.toLowerCase().includes(q) ?? false);
      return matchesTab && matchesSearch;
    });
  }, [patients, statusTab, searchQuery]);

  const filterTabs: TabItem<ArrivalsFilter>[] = [
    { id: 'ALL', label: 'All Arrivals', count: patients.length },
    { id: 'WAITING', label: 'Waiting for RMP', count: waitingCount },
    { id: 'DISPATCHED', label: 'Dispatched', count: dispatchedCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reception"
        subtitle="Check in arriving seafarers, verify original photographic ID, and dispatch to the examining practitioner."
        actions={
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span>+ Register Seafarer</span>
          </button>
        }
      />

      {justRegistered && (
        <div
          role="status"
          className="p-4 rounded bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold text-emerald-900">
                Registered {justRegistered.name} ({justRegistered.recordNo})
              </span>
              {justRegistered.isUnder18 && (
                <span className="ml-2 text-amber-900 font-medium">
                  · Under-18 1-year validity cap flagged
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setJustRegistered(null)}
            className="text-emerald-800 font-medium hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Tabs
            tabs={filterTabs}
            activeTab={statusTab}
            onChange={setStatusTab}
            ariaLabel="Filter today's arrivals"
          />
        </div>

        <div className="relative sm:w-64 pb-1">
          <Search
            aria-hidden="true"
            className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="search"
            aria-label="Search seafarers by name, record number, or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, KC-, category..."
            className="w-full h-9 pl-8 pr-3 rounded border border-surface-border-strong bg-surface-card text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-700"
          />
        </div>
      </div>

      {/* Serene Full-Width Arrivals Directory */}
      <section
        aria-label="Today's arrivals"
        className="bg-surface-card border border-surface-border rounded divide-y divide-surface-border"
      >
        {filteredArrivals.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink-muted">
            No seafarers match your current filter.
          </div>
        ) : (
          filteredArrivals.map((patient) => {
            const canSend = patient.currentStage === 'Registered';
            const rmp = patient.rmp;

            return (
              <div
                key={patient.id}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-canvas transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-medium text-sm text-ink-primary">
                      {patient.fullName}
                    </span>
                    <span className="font-mono text-xs text-primary-700">
                      {patient.recordNo}
                    </span>
                    {rmp?.isUnder18 && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                        Under 18
                      </span>
                    )}
                    {rmp?.priorityBasis && rmp.priorityBasis !== 'None' && (
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 text-[11px] font-medium">
                        Priority
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span>{rmp?.category || 'Seafarer'}</span>
                    <span>·</span>
                    <span className="font-mono">{rmp?.idNumber || 'ID Verified'}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {patient.arrivedAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-ink-muted">
                    {canSend
                      ? 'Waiting at reception'
                      : rmp?.issuedCertificate
                      ? `Issued ${rmp.issuedCertificate.certificateNo}`
                      : patient.currentStage}
                  </span>

                  {canSend ? (
                    <button
                      type="button"
                      onClick={() => sendToDoctor(patient.id)}
                      className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Send to RMP</span>
                    </button>
                  ) : (
                    <Link
                      to={`/doctor/patients/${patient.recordNo}`}
                      className="inline-flex items-center h-8 px-3 rounded border border-surface-border-strong bg-surface-card hover:bg-surface-subtle text-xs font-medium text-ink-secondary transition-colors"
                    >
                      Open
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      <RegisterSeafarerDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onRegistered={(info) => setJustRegistered(info)}
      />
    </div>
  );
};
