import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HospitalProvider, useHospital } from './context/HospitalContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { NimasaDashboard } from './pages/nimasa/NimasaDashboard';
import { NimasaPatientStage } from './pages/nimasa/NimasaPatientStage';
import { NimasaReports } from './pages/nimasa/NimasaReports';
import { NimasaCompliancePage } from './pages/nimasa/NimasaCompliancePage';
import { FrontDeskPage } from './pages/frontdesk/FrontDeskPage';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorPatientPage } from './pages/doctor/DoctorPatientPage';
import { DiagnosticsPage } from './pages/diagnostics/DiagnosticsPage';
import { AdminMasterFile } from './pages/admin/AdminMasterFile';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAuditLogPage } from './pages/admin/AdminAuditLogPage';
import { AdminQssCompliancePage } from './pages/admin/AdminQssCompliancePage';
import { AdminGovernancePage } from './pages/admin/AdminGovernancePage';
import { RoleType } from './types';

function homePathForRole(role: RoleType): string {
  switch (role) {
    case 'NIMASA':
      return '/nimasa';
    case 'FRONT_DESK':
      return '/front-desk';
    case 'DOCTOR':
      return '/doctor';
    case 'LAB':
      return '/lab';
    case 'RADIOLOGY':
      return '/radiology';
    case 'ENT':
      return '/ent';
    case 'EYE':
      return '/eye';
    case 'ADMIN':
    default:
      return '/admin';
  }
}

const ProtectedRoute: React.FC<{
  allowedRoles: RoleType[];
  children: React.ReactElement;
}> = ({ allowedRoles, children }) => {
  const { authLoading, currentUser } = useHospital();

  if (authLoading) {
    return (
      <div className="py-20 text-center text-sm text-ink-muted">
        Verifying session...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.portalRole)) {
    return <Navigate to={homePathForRole(currentUser.portalRole)} replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <HospitalProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/overview"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <OverviewDashboard />
                </ProtectedRoute>
              }
            />

            {/* NIMASA Sponsor Portal (Read-Only) */}
            <Route
              path="/nimasa"
              element={
                <ProtectedRoute allowedRoles={['NIMASA', 'ADMIN']}>
                  <OverviewDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nimasa/register"
              element={
                <ProtectedRoute allowedRoles={['NIMASA', 'ADMIN']}>
                  <NimasaDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nimasa/patients/:recordNo"
              element={
                <ProtectedRoute allowedRoles={['NIMASA', 'ADMIN']}>
                  <NimasaPatientStage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nimasa/reports"
              element={
                <ProtectedRoute allowedRoles={['NIMASA', 'ADMIN']}>
                  <NimasaReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nimasa/compliance"
              element={
                <ProtectedRoute allowedRoles={['NIMASA', 'ADMIN']}>
                  <NimasaCompliancePage />
                </ProtectedRoute>
              }
            />

            {/* Hospital: Front Desk */}
            <Route
              path="/front-desk"
              element={
                <ProtectedRoute allowedRoles={['FRONT_DESK', 'ADMIN']}>
                  <FrontDeskPage />
                </ProtectedRoute>
              }
            />

            {/* Hospital: Doctor */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients/:recordNo"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <DoctorPatientPage />
                </ProtectedRoute>
              }
            />

            {/* Hospital: Laboratory, Radiology, ENT & Eye Clinic */}
            <Route
              path="/lab"
              element={
                <ProtectedRoute allowedRoles={['LAB', 'ADMIN']}>
                  <DiagnosticsPage department="Laboratory" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/radiology"
              element={
                <ProtectedRoute allowedRoles={['RADIOLOGY', 'ADMIN']}>
                  <DiagnosticsPage department="Radiology" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ent"
              element={
                <ProtectedRoute allowedRoles={['ENT', 'ADMIN']}>
                  <DiagnosticsPage department="ENT & Audiology" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eye"
              element={
                <ProtectedRoute allowedRoles={['EYE', 'ADMIN']}>
                  <DiagnosticsPage department="Eye Clinic" />
                </ProtectedRoute>
              }
            />

            {/* Hospital: Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminMasterFile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/qss"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminQssCompliancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/governance"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminGovernancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAuditLogPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </HospitalProvider>
  );
};

export default App;
