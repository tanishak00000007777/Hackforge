import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';
import JudgesDashboard from './pages/JudgesDashboard';
import TemplateGallery from './pages/TemplateGallery';

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

        {/* Role-protected dashboards */}
        <Route path="/organizer" element={
          <RoleRoute allowedRoles={['organizer', 'admin']}>
            <OrganizerDashboard />
          </RoleRoute>
        } />
        <Route path="/participant" element={
          <RoleRoute allowedRoles={['participant']}>
            <ParticipantDashboard />
          </RoleRoute>
        } />
        <Route path="/judges" element={
          <RoleRoute allowedRoles={['judge']}>
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
