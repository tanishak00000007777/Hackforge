import { useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import LovableCanvasApp from '../../lovable-canvas/App';
import { useAuthStore } from '../../store/authStore.js';
import { getApiBaseUrl } from '../../config/studio.js';
import '../../lovable-canvas.css';

export default function LovableStudioHost() {
  const { hackathonId } = useParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const refreshPromiseRef = useRef(null);

  const refreshAccessToken = useCallback(() => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = Promise.resolve(restoreSession())
        .then(() => useAuthStore.getState().accessToken)
        .finally(() => { refreshPromiseRef.current = null; });
    }
    return refreshPromiseRef.current;
  }, [restoreSession]);

  const session = useMemo(() => ({
    hackathonId,
    accessToken,
    apiBaseUrl: getApiBaseUrl(),
    onSessionExpired: refreshAccessToken,
  }), [accessToken, hackathonId, refreshAccessToken]);

  return (
    <div className="lovable-canvas-root">
      <LovableCanvasApp key={hackathonId} session={session} />
    </div>
  );
}
