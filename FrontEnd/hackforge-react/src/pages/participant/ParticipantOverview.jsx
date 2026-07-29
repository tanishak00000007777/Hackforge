import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useParticipant } from './ParticipantLayout.jsx';

function StatCard({ icon, label, value, hint, to }) {
  return (
    <Link to={to} className="dash-card floating-card" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-on-tertiary-container)' }}>{icon}</span>
        <span className="label-mono">{label}</span>
      </div>
      <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>{value}</p>
      {hint && <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginTop: 4 }}>{hint}</p>}
    </Link>
  );
}

export default function ParticipantOverview() {
  const { user } = useAuthStore();
  const { selectedHackathon, myTeam, isRegistered, announcements, hackathons, loading } = useParticipant();
  const firstName = (user?.full_name || 'there').split(' ')[0];

  return (
    <>
      <header style={{
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-primary))',
        color: '#fff', padding: 'var(--spacing-md) var(--spacing-md)',
        marginBottom: 'var(--spacing-md)',
        boxShadow: '0 18px 40px -18px rgba(43,25,61,0.55)',
      }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
          Welcome back, {firstName}.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--color-primary-fixed)' }}>
          {selectedHackathon
            ? `You're viewing ${selectedHackathon.title}.`
            : 'Pick a hackathon to get started.'}
        </p>
      </header>

      {loading ? (
        <div className="empty-state">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 28 }}>progress_activity</span>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 'var(--spacing-md)' }}>
            <StatCard
              icon="event"
              label="Hackathons"
              value={hackathons.length}
              hint="Published and open to join"
              to="/participant/hackathons"
            />
            <StatCard
              icon="how_to_reg"
              label="Registration"
              value={isRegistered ? 'Registered' : 'Not registered'}
              hint={selectedHackathon ? selectedHackathon.title : 'No hackathon selected'}
              to="/participant/hackathons"
            />
            <StatCard
              icon="groups"
              label="Team"
              value={myTeam ? myTeam.name : 'No team yet'}
              hint={myTeam ? `${myTeam.members.length} member${myTeam.members.length === 1 ? '' : 's'}` : 'Create or join one'}
              to="/participant/team"
            />
            <StatCard
              icon="campaign"
              label="Announcements"
              value={announcements.length}
              hint="From the organizers"
              to="/participant/announcements"
            />
          </div>

          {selectedHackathon && !isRegistered && (
            <div className="dash-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: 4 }}>Register to take part</h2>
                <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>
                  You need an approved registration before you can form a team.
                </p>
              </div>
              <Link className="btn btn-primary" to="/participant/hackathons" style={{ textDecoration: 'none' }}>
                Register now
              </Link>
            </div>
          )}

          {isRegistered && !myTeam && (
            <div className="dash-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: 4 }}>Find your team</h2>
                <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>
                  Create a team and share the invite link, or join one with a code.
                </p>
              </div>
              <Link className="btn btn-primary" to="/participant/team" style={{ textDecoration: 'none' }}>
                Go to my team
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
