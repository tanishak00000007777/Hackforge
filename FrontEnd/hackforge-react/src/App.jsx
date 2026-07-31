import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import OrganizerSetupRoute from './components/OrganizerSetupRoute.jsx';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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
import StudioPage from './pages/StudioPage';
import JoinTeamPage from './pages/JoinTeamPage';

import ParticipantLayout from './pages/participant/ParticipantLayout.jsx';
import ParticipantOverview from './pages/participant/ParticipantOverview.jsx';
import ParticipantHackathons from './pages/participant/ParticipantHackathons.jsx';
import ParticipantTeam from './pages/participant/ParticipantTeam.jsx';
import ParticipantAnnouncements from './pages/participant/ParticipantAnnouncements.jsx';

import OrganizerLayout from './pages/organizer/OrganizerLayout.jsx';
import OrganizerOverview from './pages/organizer/OrganizerOverview.jsx';
import OrganizerHackathons from './pages/organizer/OrganizerHackathons.jsx';
import OrganizerRegistrations from './pages/organizer/OrganizerRegistrations.jsx';
import OrganizerStudioRedirect from './pages/organizer/OrganizerStudioRedirect.jsx';

const PublishedCanvasPage = lazy(() => import('./pages/PublishedCanvasPage'));

const organizerOnly = (element) => (
  <RoleRoute allowedRoles={['organizer', 'admin']}>{element}</RoleRoute>
);

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
        <Route path="/sites/:hackathonId/:siteSlug" element={<Suspense fallback={null}><PublishedCanvasPage /></Suspense>} />

        {/* Organizer — nested under a shared dashboard shell */}
        <Route path="/organizer" element={organizerOnly(<OrganizerSetupRoute><OrganizerLayout /></OrganizerSetupRoute>)}>
          <Route index element={<OrganizerOverview />} />
          <Route path="hackathons" element={<OrganizerHackathons />} />
          <Route path="studio" element={<OrganizerStudioRedirect />} />
          <Route path="registrations" element={<OrganizerRegistrations />} />
          <Route path="teams" element={<OrganizerTeamsPage />} />
          <Route path="submissions" element={<OrganizerSubmissionsPage />} />
          <Route path="analytics" element={<OrganizerAnalyticsPage />} />
          <Route path="forms" element={<FormsDashboard />} />
          <Route path="certificates" element={<CertificatesDashboard />} />
        </Route>

        {/* Organizer — full-bleed routes that intentionally sit outside the shell */}
        <Route path="/organizer/setup" element={organizerOnly(<OrganizerSetupPage />)} />
        <Route path="/organizer/forms/:formId" element={organizerOnly(<OrganizerSetupRoute><FormBuilderPage /></OrganizerSetupRoute>)} />
        <Route path="/organizer/hackathons/:hackathonId/studio" element={organizerOnly(<OrganizerSetupRoute><StudioPage /></OrganizerSetupRoute>)} />

        {/* Participant — nested under a shared dashboard shell */}
        <Route path="/participant" element={<RoleRoute allowedRoles={['participant']}><ParticipantLayout /></RoleRoute>}>
          <Route index element={<ParticipantOverview />} />
          <Route path="hackathons" element={<ParticipantHackathons />} />
          <Route path="team" element={<ParticipantTeam />} />
          <Route path="announcements" element={<ParticipantAnnouncements />} />
          <Route path="certificates" element={<MyCertificatesPage />} />
        </Route>

        <Route path="/join/:hackathonId/:inviteCode" element={<RoleRoute allowedRoles={['participant']}><JoinTeamPage /></RoleRoute>} />

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
