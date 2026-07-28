import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import OrganizerSetupRoute from './components/OrganizerSetupRoute.jsx';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';
import JudgesDashboard from './pages/JudgesDashboard';
import TemplateGallery from './pages/TemplateGallery';
import FormsDashboard from './pages/FormsDashboard';
import FormBuilderPage from './pages/FormBuilderPage';
import PublicFormPage from './pages/PublicFormPage';
import CertificatesDashboard from './pages/CertificatesDashboard';
import MyCertificatesPage from './pages/MyCertificatesPage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';

import OrganizerTeamsPage from './pages/OrganizerTeamsPage';
import OrganizerSubmissionsPage from './pages/OrganizerSubmissionsPage';
import OrganizerAnalyticsPage from './pages/OrganizerAnalyticsPage';
import OrganizerSetupPage from './pages/OrganizerSetupPage';
import StudioBridgePage from './pages/StudioBridgePage';

export default function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forms/:slug" element={<PublicFormPage />} />
        <Route path="/certificates/verify/:verificationId" element={<CertificateVerifyPage />} />

        {/* Role-protected dashboards */}
        <Route path="/organizer" element={
          <RoleRoute allowedRoles={['organizer', 'admin']}>
            <OrganizerSetupRoute><OrganizerDashboard /></OrganizerSetupRoute>
          </RoleRoute>
        } />
        <Route path="/organizer/setup" element={<RoleRoute allowedRoles={['organizer', 'admin']}><OrganizerSetupPage /></RoleRoute>} />
        <Route path="/organizer/teams" element={<RoleRoute allowedRoles={['organizer', 'admin']}><OrganizerSetupRoute><OrganizerTeamsPage /></OrganizerSetupRoute></RoleRoute>} />
        <Route path="/organizer/submissions" element={<RoleRoute allowedRoles={['organizer', 'admin']}><OrganizerSetupRoute><OrganizerSubmissionsPage /></OrganizerSetupRoute></RoleRoute>} />
        <Route path="/organizer/analytics" element={<RoleRoute allowedRoles={['organizer', 'admin']}><OrganizerSetupRoute><OrganizerAnalyticsPage /></OrganizerSetupRoute></RoleRoute>} />
        <Route path="/organizer/forms" element={<RoleRoute allowedRoles={['organizer', 'admin']}><OrganizerSetupRoute><FormsDashboard /></OrganizerSetupRoute></RoleRoute>} />
        <Route path="/organizer/forms/:formId" element={<RoleRoute allowedRoles={['organizer', 'admin']}><OrganizerSetupRoute><FormBuilderPage /></OrganizerSetupRoute></RoleRoute>} />
        <Route path="/organizer/certificates" element={<RoleRoute allowedRoles={['organizer', 'admin']}><OrganizerSetupRoute><CertificatesDashboard /></OrganizerSetupRoute></RoleRoute>} />
        <Route path="/organizer/hackathons/:hackathonId/studio" element={<RoleRoute allowedRoles={['organizer', 'admin']}><OrganizerSetupRoute><StudioBridgePage /></OrganizerSetupRoute></RoleRoute>} />
        <Route path="/participant" element={
          <RoleRoute allowedRoles={['participant']}>
            <ParticipantDashboard />
          </RoleRoute>
        } />
        <Route path="/participant/certificates" element={<RoleRoute allowedRoles={['participant']}><MyCertificatesPage /></RoleRoute>} />
        <Route path="/judge" element={
          <RoleRoute allowedRoles={['judge', 'organizer', 'admin']}>
            <JudgesDashboard />
          </RoleRoute>
        } />

        {/* Protected but any role */}
        <Route path="/templates" element={
          <ProtectedRoute>
            <TemplateGallery />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
