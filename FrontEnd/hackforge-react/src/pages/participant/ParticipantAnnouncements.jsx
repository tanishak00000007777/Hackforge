import { PageHeader } from '../../components/DashboardLayout.jsx';
import { useParticipant } from './ParticipantLayout.jsx';

export default function ParticipantAnnouncements() {
  const { announcements, selectedHackathon } = useParticipant();

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle={selectedHackathon ? `Updates from the ${selectedHackathon.title} organizers.` : 'Updates from the organizers.'}
      />

      {announcements.length === 0 ? (
        <div className="dash-card empty-state">No announcements have been posted yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 }}>
          {announcements.map(a => (
            <article key={a.id} className="dash-card" style={{ borderLeft: '4px solid var(--color-on-tertiary-container)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline', marginBottom: 6 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>{a.title}</h2>
                <span className="label-mono" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>{a.content}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
