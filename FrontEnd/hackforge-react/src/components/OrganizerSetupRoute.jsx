import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import * as organizationApi from '../services/organizationApi.js';
import OrganizerWelcomePage from '../pages/OrganizerWelcomePage.jsx';

function errorMessage(error) {
  return typeof error?.detail === 'string'
    ? error.detail
    : 'We could not check your organization setup. Please try again.';
}

export default function OrganizerSetupRoute({ children }) {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const userRole = user?.role;
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!userId || userRole !== 'organizer') {
      setStatus('ready');
      return;
    }

    let active = true;
    setStatus('loading');
    setError('');

    organizationApi.getMyOrganizations()
      .then((organizations) => {
        if (!active) return;
        setStatus(organizations.length === 0 ? 'needs-setup' : 'ready');
      })
      .catch((requestError) => {
        if (!active) return;
        setError(errorMessage(requestError));
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [userId, userRole, retryCount]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-surface)' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 40, color: 'var(--color-primary)' }}>progress_activity</span>
          <p style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 13 }}>Checking organizer setup…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-error)' }}>error</span>
          <h1 style={{ color: 'var(--color-primary)', margin: '16px 0 8px' }}>Unable to load organization setup</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: 20 }}>{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)} style={{ padding: '10px 16px', border: 'none', borderRadius: 8, background: 'var(--color-primary-container)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'needs-setup') {
    return <OrganizerWelcomePage />;
  }

  return children;
}
