import { useState, useEffect, useCallback } from 'react';
import { Outlet, useOutletContext, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import { useAuthStore } from '../../store/authStore.js';
import * as hackathonApi from '../../services/hackathonApi.js';
import * as teamApi from '../../services/teamApi.js';
import * as registrationApi from '../../services/registrationApi.js';
import * as announcementApi from '../../services/announcementApi.js';

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Overview', to: '/participant', end: true },
  { icon: 'event', label: 'Hackathons', to: '/participant/hackathons' },
  { icon: 'groups', label: 'My team', to: '/participant/team' },
  { icon: 'campaign', label: 'Announcements', to: '/participant/announcements' },
  { icon: 'workspace_premium', label: 'Certificates', to: '/participant/certificates' },
];

/** Child pages read shared hackathon/team state from here. */
export function useParticipant() {
  return useOutletContext();
}

export default function ParticipantLayout() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelected] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wanted = searchParams.get('hackathon');
    hackathonApi.listPublishedHackathons()
      .then(data => {
        setHackathons(data);
        if (data.length > 0) setSelected(data.find(h => h.id === wanted) || data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshTeam = useCallback(() => {
    if (!selectedHackathon) return;
    teamApi.getMyTeam(selectedHackathon.id).then(setMyTeam).catch(() => setMyTeam(null));
  }, [selectedHackathon]);

  const refreshRegistration = useCallback(() => {
    if (!selectedHackathon) return;
    registrationApi.getRegistrations(selectedHackathon.id)
      .then(regs => setIsRegistered(regs.some(r => r.user_id === user?.id)))
      .catch(() => setIsRegistered(false));
  }, [selectedHackathon, user]);

  useEffect(() => {
    if (!selectedHackathon) return;
    refreshTeam();
    refreshRegistration();
    announcementApi.getAnnouncements(selectedHackathon.id)
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]));
  }, [selectedHackathon, refreshTeam, refreshRegistration]);

  // Keep the selected hackathon in the URL so links and reloads stay stable.
  const selectHackathon = (h) => {
    setSelected(h);
    const next = new URLSearchParams(searchParams);
    next.set('hackathon', h.id);
    setSearchParams(next, { replace: true });
  };

  const context = {
    hackathons, selectedHackathon, selectHackathon,
    myTeam, setMyTeam, refreshTeam,
    announcements, isRegistered, refreshRegistration,
    loading,
  };

  return (
    <DashboardLayout navItems={NAV_ITEMS}>
      <Outlet context={context} />
    </DashboardLayout>
  );
}
