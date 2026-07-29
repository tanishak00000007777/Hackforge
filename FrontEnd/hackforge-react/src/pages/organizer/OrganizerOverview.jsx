import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useOrganizer, HackathonPicker } from './OrganizerLayout.jsx';
import * as registrationApi from '../../services/registrationApi.js';
import * as teamApi from '../../services/teamApi.js';

function StatCard({ icon, label, value, hint, to }) {
  return (
    <Link to={to} className="dash-card floating-card" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-on-tertiary-container)' }}>{icon}</span>
        <span className="label-mono">{label}</span>
      </div>
      <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-primary)' }}>{value}</p>
      {hint && <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginTop: 4 }}>{hint}</p>}
    </Link>
  );
}

export default function OrganizerOverview() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { hackathons, selectedHackathon, loading } = useOrganizer();
  const [registrations, setRegistrations] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!selectedHackathon) return;
    registrationApi.getRegistrations(selectedHackathon.id).then(setRegistrations).catch(() => setRegistrations([]));
    teamApi.getHackathonTeams(selectedHackathon.id).then(setTeams).catch(() => setTeams([]));
  }, [selectedHackathon]);

  const firstName = (user?.full_name || 'there').split(' ')[0];
  const pending = registrations.filter(r => r.status === 'pending').length;

  return (
    <>
      <header style={{
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-primary))',
        color: '#fff', padding: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-md)',
        boxShadow: '0 18px 40px -18px rgba(43,25,61,0.55)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Welcome back, {firstName}.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--color-primary-fixed)' }}>
            {selectedHackathon ? selectedHackathon.title : 'Create your first hackathon to get started.'}
          </p>
        </div>
        {selectedHackathon && (
          <button className="btn" style={{ background: '#fff', color: 'var(--color-primary)' }} onClick={() => navigate(`/organizer/hackathons/${selectedHackathon.id}/studio`)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>web</span>
            Open website studio
          </button>
        )}
      </header>

      {loading ? (
        <div className="empty-state">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 28 }}>progress_activity</span>
        </div>
      ) : hackathons.length === 0 ? (
        <div className="dash-card empty-state">
          You have not created a hackathon yet.
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => navigate('/organizer/setup')}>Create your first hackathon</button>
          </div>
        </div>
      ) : (
        <>
          {hackathons.length > 1 && (
            <div style={{ marginBottom: 'var(--spacing-sm)' }}><HackathonPicker /></div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 'var(--spacing-md)' }}>
            <StatCard icon="event" label="Hackathons" value={hackathons.length} hint="Total events" to="/organizer/hackathons" />
            <StatCard icon="group_add" label="Registrations" value={registrations.length} hint={`${pending} awaiting review`} to="/organizer/registrations" />
            <StatCard icon="groups" label="Teams" value={teams.length} hint="Formed so far" to="/organizer/teams" />
            <StatCard icon="analytics" label="Analytics" value="View" hint="Charts and exports" to="/organizer/analytics" />
          </div>

          {pending > 0 && (
            <div className="dash-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: 4 }}>
                  {pending} registration{pending === 1 ? '' : 's'} awaiting review
                </h2>
                <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>
                  Participants need an approved registration before they can form teams.
                </p>
              </div>
              <Link className="btn btn-primary" to="/organizer/registrations" style={{ textDecoration: 'none' }}>
                Review now
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
