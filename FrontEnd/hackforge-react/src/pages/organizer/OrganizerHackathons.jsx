import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/DashboardLayout.jsx';
import { useOrganizer } from './OrganizerLayout.jsx';
import * as hackathonApi from '../../services/hackathonApi.js';

export default function OrganizerHackathons() {
  const navigate = useNavigate();
  const { hackathons, loading, loadHackathons } = useOrganizer();
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const publish = async (h) => {
    setBusyId(h.id);
    setError('');
    try {
      await hackathonApi.publishHackathon(h.id);
      await loadHackathons();
    } catch (err) {
      setError(err.detail || 'Could not publish this hackathon.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <>
      <PageHeader
        title="Hackathons"
        subtitle="Every event your organization runs."
        actions={
          <button className="btn btn-primary" onClick={() => navigate('/organizer/setup')}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            New hackathon
          </button>
        }
      />

      {error && <div className="alert-error" style={{ marginBottom: 'var(--spacing-sm)' }}>{error}</div>}

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {hackathons.map(h => (
            <article key={h.id} className="dash-card floating-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-primary)' }}>{h.title}</h2>
                <span className="pill" style={{
                  background: h.status === 'published' ? '#dcfce7' : 'var(--color-surface-container-high)',
                  color: h.status === 'published' ? '#15803d' : 'var(--color-on-surface-variant)',
                }}>{h.status}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginBottom: 16, flexGrow: 1 }}>
                {h.tagline || h.description || 'No description yet.'}
              </p>
              <p className="label-mono" style={{ marginBottom: 16 }}>{h.mode} · max team {h.max_team_size}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => navigate(`/organizer/hackathons/${h.id}/studio`)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>web</span>
                  Website
                </button>
                {h.status !== 'published' && (
                  <button className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }} disabled={busyId === h.id} onClick={() => publish(h)}>
                    {busyId === h.id ? 'Publishing…' : 'Publish'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
