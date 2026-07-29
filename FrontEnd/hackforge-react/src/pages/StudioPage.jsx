import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

// The studio is the heaviest screen in the app. Keeping it behind a lazy
// boundary means organizers who never open the editor never download it.
const StudioHost = lazy(() => import('./studio/StudioHost.jsx'));

export default function StudioPage() {
  const navigate = useNavigate();

  return (
    <main style={{ height: '100dvh', background: '#f8f6fb', position: 'relative', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => navigate('/organizer')}
        style={{
          position: 'fixed', left: 12, bottom: 12, zIndex: 20, border: '1px solid #ded9e8',
          borderRadius: 8, background: 'rgba(255,255,255,0.94)', color: '#2b0a5a',
          padding: '8px 12px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 16px rgba(19,2,37,0.12)',
        }}
      >
        Back to dashboard
      </button>
      <Suspense fallback={<StudioLoading />}>
        <StudioHost />
      </Suspense>
    </main>
  );
}

function StudioLoading() {
  return (
    <section
      aria-live="polite"
      style={{
        position: 'absolute', inset: 0, zIndex: 10, display: 'grid', placeItems: 'center',
        background: '#f8f6fb', color: '#130225',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 34, height: 34, margin: '0 auto 16px', borderRadius: '50%',
          border: '3px solid #ded7e8', borderTopColor: '#2b0a5a', animation: 'spin 0.8s linear infinite',
        }} />
        <strong style={{ display: 'block', fontSize: 18 }}>Opening Website Studio</strong>
        <span style={{ display: 'block', marginTop: 6, color: '#6b6574' }}>Loading your event website...</span>
      </div>
    </section>
  );
}
