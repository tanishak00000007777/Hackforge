import { Navigate } from 'react-router-dom';
import { useOrganizer } from './OrganizerLayout.jsx';

/**
 * "Website studio" nav item needs a hackathon id, so this route resolves the
 * selected one and forwards to its studio (or to setup when there is none).
 */
export default function OrganizerStudioRedirect() {
  const { selectedHackathon, loading } = useOrganizer();

  if (loading) {
    return (
      <div className="empty-state">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 28 }}>progress_activity</span>
      </div>
    );
  }

  return <Navigate to={selectedHackathon ? `/organizer/hackathons/${selectedHackathon.id}/studio` : '/organizer/setup'} replace />;
}
