import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

/**
 * Wraps a route to require authentication.
 * Shows a loading spinner while the session is being restored.
 * Redirects to /login if the user is not authenticated.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <span
            className="material-symbols-outlined animate-spin"
            style={{ fontSize: 40, color: 'var(--color-primary)', marginBottom: 16, display: 'block' }}
          >
            progress_activity
          </span>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--color-on-surface-variant)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Restoring session…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
