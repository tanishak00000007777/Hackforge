import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { getApiBaseUrl, getStudioUrl } from '../config/studio.js';

const READY_MESSAGE = 'hackforge:studio:ready';
const INIT_MESSAGE = 'hackforge:studio:init';
const SESSION_EXPIRED_MESSAGE = 'hackforge:studio:session-expired';

export default function StudioBridgePage() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [isStudioReady, setIsStudioReady] = useState(false);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const studioUrl = useMemo(() => getStudioUrl(hackathonId), [hackathonId]);

  const sendSession = useCallback(() => {
    const { accessToken, user } = useAuthStore.getState();
    if (!iframeRef.current?.contentWindow || !accessToken) return;
    iframeRef.current.contentWindow.postMessage({
      type: INIT_MESSAGE,
      version: 1,
      hackathonId,
      accessToken,
      apiBaseUrl: getApiBaseUrl(),
      returnUrl: `${window.location.origin}/organizer`,
      user: user ? {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      } : null,
    }, studioUrl.origin);
  }, [hackathonId, studioUrl.origin]);

  useEffect(() => {
    const receiveMessage = async (event) => {
      if (event.origin !== studioUrl.origin || event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.hackathonId !== hackathonId) return;

      if (event.data.type === READY_MESSAGE) {
        setIsStudioReady(true);
        sendSession();
      } else if (event.data.type === SESSION_EXPIRED_MESSAGE) {
        await restoreSession();
        sendSession();
      }
    };

    window.addEventListener('message', receiveMessage);
    return () => window.removeEventListener('message', receiveMessage);
  }, [hackathonId, restoreSession, sendSession, studioUrl.origin]);

  useEffect(() => {
    setIsStudioReady(false);
  }, [hackathonId]);

  return (
    <main style={{ height: '100vh', background: '#f8f6fb', position: 'relative' }}>
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
      {!isStudioReady && (
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
      )}
      <iframe
        ref={iframeRef}
        src={studioUrl.toString()}
        title="HackForge Website Studio"
        onLoad={sendSession}
        allow="clipboard-write"
        referrerPolicy="strict-origin"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </main>
  );
}
