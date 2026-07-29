import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import StudioApp from '@/app/App';
import { useAuthStore } from '../../store/authStore.js';
import { getApiBaseUrl } from '../../config/studio.js';
import '../../studio.css';

/**
 * Mounts the website studio inline. Everything in this module -- the studio's
 * 300+ components and its Tailwind stylesheet -- is behind the lazy import in
 * StudioPage, so it is only fetched when an organizer opens the editor.
 */
export default function StudioHost() {
  const { hackathonId } = useParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const [refreshNonce, setRefreshNonce] = useState(0);

  // A 401 inside the studio means our token aged out mid-edit. Refresh it and
  // let the new token flow back down as a fresh session object.
  useEffect(() => {
    if (refreshNonce === 0) return;
    restoreSession();
  }, [refreshNonce, restoreSession]);

  const session = useMemo(() => ({
    hackathonId,
    accessToken,
    apiBaseUrl: getApiBaseUrl(),
    user: user
      ? { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
      : null,
    onSessionExpired: () => setRefreshNonce((n) => n + 1),
  }), [hackathonId, accessToken, user]);

  return <StudioApp session={session} />;
}
