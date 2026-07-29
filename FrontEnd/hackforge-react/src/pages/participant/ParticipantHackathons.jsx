import { useState } from 'react';
import { PageHeader } from '../../components/DashboardLayout.jsx';
import { useParticipant } from './ParticipantLayout.jsx';
import RegisterEventModal from './RegisterEventModal.jsx';

export default function ParticipantHackathons() {
  const { hackathons, selectedHackathon, selectHackathon, isRegistered, refreshRegistration, setMyTeam, loading } = useParticipant();
  const [registering, setRegistering] = useState(null);

  // The modal registers and forms the team; reflect both back into shared state.
  const handleRegistered = (team) => {
    if (registering) selectHackathon(registering);
    if (team) setMyTeam(team);
    refreshRegistration();
  };

  return (
    <>
      <PageHeader
        title="Hackathons"
        subtitle="Browse published events and register to take part."
      />

      {loading ? (
        <div className="empty-state">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 28 }}>progress_activity</span>
        </div>
      ) : hackathons.length === 0 ? (
        <div className="dash-card empty-state">No published hackathons right now. Check back soon.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {hackathons.map(h => {
            const isSelected = selectedHackathon?.id === h.id;
            return (
              <article
                key={h.id}
                onClick={() => selectHackathon(h)}
                className="dash-card floating-card"
                style={{
                  padding: 0, overflow: 'hidden', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  outline: isSelected ? '2px solid var(--color-secondary)' : 'none',
                }}
              >
                <div style={{ height: 128, position: 'relative' }}>
                  {h.banner_url ? (
                    <img src={h.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-container)', color: '#fff' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 30 }}>event</span>
                    </div>
                  )}
                  <span className="pill" style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.92)', color: 'var(--color-primary)' }}>{h.status}</span>
                </div>

                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6 }}>{h.title}</h2>
                  <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {h.tagline || h.description || 'No description provided.'}
                  </p>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span className="label-mono">{h.mode} · max {h.max_team_size}</span>
                    {isSelected && isRegistered ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#15803d' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                        Registered
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '7px 14px', fontSize: 13 }}
                        onClick={(e) => { e.stopPropagation(); setRegistering(h); }}
                      >
                        Register
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <RegisterEventModal
        hackathon={registering}
        open={!!registering}
        onClose={() => setRegistering(null)}
        onDone={handleRegistered}
      />
    </>
  );
}
