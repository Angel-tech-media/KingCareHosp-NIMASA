import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HospitalProvider } from './context/HospitalContext';
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

export const App: React.FC = () => {
  return (
    <HospitalProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/overview" element={<OverviewDashboard />} />

            {/* NIMASA Sponsor Portal (Read-Only) */}
            <Route path="/nimasa" element={<OverviewDashboard />} />
            <Route path="/nimasa/register" element={<NimasaDashboard />} />
            <Route
              path="/nimasa/patients/:recordNo"
              element={<NimasaPatientStage />}
            />
            <Route path="/nimasa/reports" element={<NimasaReports />} />
            <Route path="/nimasa/compliance" element={<NimasaCompliancePage />} />

            {/* Hospital: Front Desk */}
            <Route path="/front-desk" element={<FrontDeskPage />} />

            {/* Hospital: Doctor */}
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route
              path="/doctor/patients/:recordNo"
              element={<DoctorPatientPage />}
            />

            {/* Hospital: Laboratory and Radiology */}
            <Route
              path="/lab"
              element={<DiagnosticsPage department="Laboratory" />}
            />
            <Route
              path="/radiology"
              element={<DiagnosticsPage department="Radiology" />}
            />

            {/* Hospital: Admin */}
            <Route path="/admin" element={<AdminMasterFile />} />
            <Route path="/admin/qss" element={<AdminQssCompliancePage />} />
            <Route path="/admin/governance" element={<AdminGovernancePage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/audit" element={<AdminAuditLogPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </HospitalProvider>
  );
};

export default App;
