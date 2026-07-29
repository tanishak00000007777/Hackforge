import { useState, useEffect, useCallback } from 'react';
import { Outlet, useOutletContext, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import * as hackathonApi from '../../services/hackathonApi.js';

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Overview', to: '/organizer', end: true },
  { icon: 'event', label: 'Hackathons', to: '/organizer/hackathons' },
  { icon: 'web', label: 'Website studio', to: '/organizer/studio' },
  { icon: 'group_add', label: 'Registrations', to: '/organizer/registrations' },
  { icon: 'groups', label: 'Teams', to: '/organizer/teams' },
  { icon: 'description', label: 'Forms', to: '/organizer/forms' },
  { icon: 'send', label: 'Submissions', to: '/organizer/submissions' },
  { icon: 'gavel', label: 'Judging', to: '/judge' },
  { icon: 'workspace_premium', label: 'Certificates', to: '/organizer/certificates' },
  { icon: 'analytics', label: 'Analytics', to: '/organizer/analytics' },
];

export function useOrganizer() {
  return useOutletContext();
}

export default function OrganizerLayout() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadHackathons = useCallback(() => {
    return hackathonApi.listOwnedHackathons()
      .then(data => {
        setHackathons(data);
        setSelectedHackathon(prev => data.find(h => h.id === prev?.id) || data[0] || null);
        return data;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadHackathons(); }, [loadHackathons]);

  const context = { hackathons, selectedHackathon, setSelectedHackathon, loadHackathons, loading, navigate };

  return (
    <DashboardLayout navItems={NAV_ITEMS}>
      <Outlet context={context} />
    </DashboardLayout>
  );
}

/**
 * Dropdown for picking which of the organizer's hackathons a page acts on.
 * Rendered by pages that are scoped to a single event.
 */
export function HackathonPicker() {
  const { hackathons, selectedHackathon, setSelectedHackathon } = useOrganizer();
  if (hackathons.length < 2) return null;
  return (
    <select
      className="field"
      aria-label="Select hackathon"
      style={{ width: 'auto', minWidth: 220 }}
      value={selectedHackathon?.id || ''}
      onChange={e => setSelectedHackathon(hackathons.find(h => h.id === e.target.value))}
    >
      {hackathons.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
    </select>
  );
}
