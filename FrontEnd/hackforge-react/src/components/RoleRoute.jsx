import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import ProtectedRoute from './ProtectedRoute.jsx';

const ROLE_DASHBOARD_MAP = {
  organizer: '/organizer',
  participant: '/participant',
  judge: '/judges',
  admin: '/organizer',
};

/**
 * Extends ProtectedRoute with role checking.
 * Redirects to the user's correct dashboard if their role doesn't match.
 *
 * @param {{ allowedRoles: string[], children: React.ReactNode }} props
 */
export default function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuthStore();

  return (
    <ProtectedRoute>
      {user && !allowedRoles.includes(user.role) ? (
        <Navigate to={ROLE_DASHBOARD_MAP[user.role] || '/'} replace />
      ) : (
        children
      )}
    </ProtectedRoute>
  );
}
