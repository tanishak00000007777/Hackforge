import { useEffect, useState } from 'react';
import { PageHeader } from '../components/DashboardLayout.jsx';
import { useOrganizer, HackathonPicker } from './organizer/OrganizerLayout.jsx';
import * as teamApi from '../services/teamApi.js';

export default function OrganizerTeamsPage() {
  const { selectedHackathon } = useOrganizer();
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    setError('');
    teamApi.getHackathonTeams(selectedHackathon.id)
      .then(setTeams)
      .catch(err => setError(err.detail || 'Could not load teams.'))
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  if (!selectedHackathon) {
    return (
      <>
        <PageHeader title="Teams" />
        <div className="dash-card empty-state">Create a hackathon before managing teams.</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Teams"
        subtitle={`Teams formed for ${selectedHackathon.title}.`}
        actions={<HackathonPicker />}
      />

      {error && <div className="alert-error" style={{ marginBottom: 'var(--spacing-sm)' }}>{error}</div>}

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Invite code</th>
                <th>Leader</th>
                <th>Members</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="empty-state">
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 24 }}>progress_activity</span>
                </td></tr>
              ) : teams.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">No teams have been formed yet.</td></tr>
              ) : teams.map(team => (
                <tr key={team.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{team.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{team.invite_code}</td>
                  <td style={{ color: 'var(--color-on-surface-variant)' }}>{team.leader_id?.slice(0, 8)}</td>
                  <td style={{ color: 'var(--color-on-surface-variant)' }}>{team.members ? team.members.length : 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
