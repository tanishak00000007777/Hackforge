import { useEffect, useState } from 'react';
import { PageHeader } from '../components/DashboardLayout.jsx';
import { useOrganizer, HackathonPicker } from './organizer/OrganizerLayout.jsx';
import * as submissionApi from '../services/submissionApi.js';

export default function OrganizerSubmissionsPage() {
  const { selectedHackathon } = useOrganizer();
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    setError('');
    submissionApi.getHackathonSubmissions(selectedHackathon.id)
      .then(setSubmissions)
      .catch(err => setError(err.detail || 'Could not load submissions.'))
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  if (!selectedHackathon) {
    return (
      <>
        <PageHeader title="Submissions" />
        <div className="dash-card empty-state">Create a hackathon before reviewing submissions.</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle={`Projects submitted to ${selectedHackathon.title}.`}
        actions={<HackathonPicker />}
      />

      {error && <div className="alert-error" style={{ marginBottom: 'var(--spacing-sm)' }}>{error}</div>}

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Submitted by</th>
                <th>Project</th>
                <th>Status</th>
                <th>Last updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="empty-state">
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 24 }}>progress_activity</span>
                </td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">No projects have been submitted yet.</td></tr>
              ) : submissions.map(sub => {
                const isDraft = sub.status === 'draft';
                return (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      {sub.team_id ? `Team ${sub.team_id.slice(0, 8)}` : `User ${sub.user_id.slice(0, 8)}`}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{sub.content?.title || 'Untitled project'}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                        {sub.content?.description?.slice(0, 60) || 'No description'}
                      </div>
                      {sub.content?.video_url && (
                        <a href={sub.content.video_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--color-on-tertiary-container)' }}>
                          Video link
                        </a>
                      )}
                    </td>
                    <td>
                      <span className="pill" style={{
                        background: isDraft ? '#fef3c7' : '#dcfce7',
                        color: isDraft ? '#b45309' : '#15803d',
                      }}>{sub.status}</span>
                    </td>
                    <td style={{ color: 'var(--color-on-surface-variant)' }}>
                      {new Date(sub.updated_at || sub.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
