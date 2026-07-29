import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as hackathonApi from '../services/hackathonApi.js';
import * as teamApi from '../services/teamApi.js';
import * as registrationApi from '../services/registrationApi.js';

export default function JoinTeamPage() {
  const { hackathonId, inviteCode } = useParams();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsRegistration, setNeedsRegistration] = useState(false);

  useEffect(() => {
    hackathonApi.listPublishedHackathons()
      .then(list => setHackathon(list.find(h => h.id === hackathonId) || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hackathonId]);

  const handleJoin = async () => {
    setBusy(true);
    setError('');
    try {
      const team = await teamApi.joinTeam(hackathonId, inviteCode);
      alert(`Joined team "${team.name}" successfully!`);
      navigate(`/participant?hackathon=${hackathonId}`, { replace: true });
    } catch (err) {
      if (err.detail === 'You must be approved to join a team') {
        setNeedsRegistration(true);
        setError('You need an approved registration for this hackathon before joining a team.');
      } else {
        setError(err.detail || 'Failed to join team.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    setBusy(true);
    setError('');
    try {
      await registrationApi.registerForHackathon(hackathonId);
      setNeedsRegistration(false);
      setError('Registration submitted. Once an organizer approves it, click "Join Team" again — or just reopen this link.');
    } catch (err) {
      setError(err.detail || 'Failed to register.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% -20%, #f0dbff 0%, #fbf8ff 60%)', padding: 24 }}>
      <div className="glass-card" style={{ maxWidth: 440, width: '100%', borderRadius: 16, padding: 40, textAlign: 'center', background: '#fff' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--color-primary-container)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>group_add</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>Team Invitation</h1>
        {loading ? (
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--color-primary)' }}>progress_activity</span>
        ) : (
          <>
            <p style={{ fontSize: 15, color: 'var(--color-on-surface-variant)', marginBottom: 8 }}>
              You&apos;ve been invited to join a team{hackathon ? <> for <strong style={{ color: 'var(--color-primary)' }}>{hackathon.title}</strong></> : ''}.
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-outline)', marginBottom: 24 }}>Invite code: {inviteCode}</p>

            {error && (
              <div style={{ padding: '12px 16px', background: 'var(--color-error-container, #fdecea)', borderRadius: 12, fontSize: 13, color: 'var(--color-on-error-container, #7f1d1d)', marginBottom: 16, textAlign: 'left' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {needsRegistration ? (
                <button onClick={handleRegister} disabled={busy}
                  style={{ padding: '12px', background: 'var(--color-primary-container)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                  {busy ? 'Registering…' : 'Register for this Hackathon'}
                </button>
              ) : (
                <button onClick={handleJoin} disabled={busy}
                  style={{ padding: '12px', background: 'var(--color-primary-container)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                  {busy ? 'Joining…' : 'Join Team'}
                </button>
              )}
              <button onClick={() => navigate(`/participant?hackathon=${hackathonId}`)}
                style={{ padding: '12px', background: 'none', border: '1px solid var(--color-outline)', color: 'var(--color-primary)', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
