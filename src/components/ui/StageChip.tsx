import React from 'react';
import { PatientStage, PatientStatus } from '../../types';

export const StatusChip: React.FC<{ status: PatientStatus }> = ({ status }) => {
  const isActive = status === 'Active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive ? 'bg-emerald-500' : 'bg-slate-400'
        }`}
      />
      {status}
    </span>
  );
};

export const StageChip: React.FC<{ stage: PatientStage }> = ({ stage }) => {
  // Status chips with colour: Active (green), Inactive (grey), Awaiting (amber), Tests requested (blue), Admitted (purple), Discharged (grey).
  const getStyles = (s: PatientStage) => {
    switch (s) {
      case 'Registered':
      case 'Awaiting doctor':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'In assessment':
      case 'First assessment complete':
      case 'Second assessment':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Tests requested':
      case 'Results ready':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Admitted':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Discharged':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getDot = (s: PatientStage) => {
    switch (s) {
      case 'Registered':
      case 'Awaiting doctor':
        return 'bg-amber-500';
      case 'In assessment':
      case 'First assessment complete':
      case 'Second assessment':
        return 'bg-emerald-500';
      case 'Tests requested':
      case 'Results ready':
        return 'bg-blue-600';
      case 'Admitted':
        return 'bg-purple-600';
      case 'Discharged':
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStyles(
        stage
      )}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDot(stage)}`} />
      {stage}
    </span>
  );
};

export const CertificateBadge: React.FC<{
  status: 'Valid' | 'Expiring' | 'Expired';
}> = ({ status }) => {
  const styles =
    status === 'Valid'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'Expiring'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-red-50 text-red-700 border-red-200';

  const dot =
    status === 'Valid'
      ? 'bg-emerald-500'
      : status === 'Expiring'
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${styles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
};
