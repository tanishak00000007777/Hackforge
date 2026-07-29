import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as hackathonApi from '../services/hackathonApi.js';
import * as submissionApi from '../services/submissionApi.js';

const button = { border: 0, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 700 };

export default function OrganizerSubmissionsPage() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [hackathonId, setHackathonId] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hackathonApi.listOwnedHackathons().then((items) => {
      setHackathons(items);
      if (items[0]) setHackathonId(items[0].id);
    }).catch((err) => setError(err.detail || 'Could not load hackathons'));
  }, []);

  useEffect(() => {
    if (!hackathonId) return;
    setLoading(true);
    submissionApi.getHackathonSubmissions(hackathonId)
      .then(setSubmissions)
      .catch((err) => setError(err.detail || 'Could not load submissions'))
      .finally(() => setLoading(false));
  }, [hackathonId]);

  return (
    <main style={{ minHeight: '100vh', background: '#fbf8ff', padding: '40px max(24px, 6vw)', color: '#2b193d' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', marginBottom: 32 }}>
        <div>
          <button onClick={() => navigate('/organizer')} style={{ ...button, background: 'transparent', paddingLeft: 0, color: '#2b193d' }}>
            ← Organizer dashboard
          </button>
          <h1 style={{ fontSize: 40, margin: '8px 0', color: 'var(--color-primary, #2b193d)' }}>Submissions</h1>
          <p style={{ color: '#6f6575' }}>Review all submitted projects for your hackathons.</p>
        </div>
      </header>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 24 }}>
          {error}
        </div>
      )}

      <label style={{ display: 'block', marginBottom: 24, maxWidth: 420 }}>
        <span style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Hackathon</span>
        <select value={hackathonId} onChange={(e) => setHackathonId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d9d1de', background: '#fff' }}>
          {hackathons.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
      </label>

      <div style={{ background: '#fff', border: '1px solid #e8e2ec', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 24px rgba(43,25,61,.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead style={{ background: 'var(--color-surface-container-low, #f8f7f9)' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', textTransform: 'uppercase', fontSize: 12, color: '#6f6575', fontWeight: 600 }}>Team / User</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', textTransform: 'uppercase', fontSize: 12, color: '#6f6575', fontWeight: 600 }}>Project Details</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', textTransform: 'uppercase', fontSize: 12, color: '#6f6575', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', textTransform: 'uppercase', fontSize: 12, color: '#6f6575', fontWeight: 600 }}>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#6f6575' }}>
                    Loading submissions...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#6f6575' }}>
                    No submissions found for this hackathon.
                  </td>
                </tr>
              ) : submissions.map((sub) => {
                const isDraft = sub.status === 'draft';
                return (
                  <tr key={sub.id} style={{ borderTop: '1px solid #e8e2ec' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#2b193d' }}>
                      {sub.team_id ? `Team: ${sub.team_id.slice(0, 8)}...` : `User: ${sub.user_id.slice(0, 8)}...`}
                    </td>
                    <td style={{ padding: '16px 24px', color: '#6f6575' }}>
                      <div style={{ fontWeight: 600, color: '#2b193d' }}>{sub.content?.title || 'Untitled Project'}</div>
                      <div style={{ fontSize: 12 }}>{sub.content?.description?.slice(0, 50) || 'No description'}</div>
                      {sub.content?.video_url && <a href={sub.content.video_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0066cc' }}>Video Link</a>}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: 12, 
                        fontSize: 12, 
                        fontWeight: 600,
                        background: isDraft ? '#fffbeb' : '#f0fdf4',
                        color: isDraft ? '#d97706' : '#15803d',
                        border: `1px solid ${isDraft ? '#d9770633' : '#15803d33'}`
                      }}>
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#6f6575' }}>
                      {new Date(sub.updated_at || sub.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
