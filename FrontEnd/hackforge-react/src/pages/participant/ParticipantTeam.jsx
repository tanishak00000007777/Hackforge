import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/DashboardLayout.jsx';
import { useParticipant } from './ParticipantLayout.jsx';
import * as teamApi from '../../services/teamApi.js';

export default function ParticipantTeam() {
  const { selectedHackathon, myTeam, setMyTeam, isRegistered } = useParticipant();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteLink = myTeam && selectedHackathon
    ? `${window.location.origin}/join/${selectedHackathon.id}/${myTeam.invite_code}`
    : '';

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      setMyTeam(await fn());
    } catch (err) {
      setError(err.detail || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const createTeam = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    run(() => teamApi.createTeam(selectedHackathon.id, { name: name.trim() }));
  };

  const joinTeam = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    run(() => teamApi.joinTeam(selectedHackathon.id, code.trim().toUpperCase()));
  };

  const leaveTeam = async () => {
    if (!window.confirm('Leave this team? You can rejoin with the invite code.')) return;
    setBusy(true);
    setError('');
    try {
      await teamApi.leaveTeam(selectedHackathon.id);
      setMyTeam(null);
    } catch (err) {
      setError(err.detail || 'Could not leave the team.');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this invite link:', inviteLink);
    }
  };

  if (!selectedHackathon) {
    return (
      <>
        <PageHeader title="My team" />
        <div className="dash-card empty-state">
          Select a hackathon on the <Link to="/participant/hackathons">Hackathons</Link> page first.
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My team" subtitle={selectedHackathon.title} />

      {error && <div className="alert-error" style={{ marginBottom: 'var(--spacing-sm)' }}>{error}</div>}

      {!isRegistered ? (
        <div className="dash-card empty-state">
          Register for this hackathon before creating or joining a team.
          <div style={{ marginTop: 16 }}>
            <Link className="btn btn-primary" to="/participant/hackathons" style={{ textDecoration: 'none' }}>Go to hackathons</Link>
          </div>
        </div>
      ) : !myTeam ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 760 }}>
          <form className="dash-card" onSubmit={createTeam}>
            <h2 className="section-title">Create a team</h2>
            <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginBottom: 16 }}>
              You will be the team leader and get an invite link to share.
            </p>
            <input
              className="field"
              placeholder="Team name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy || !name.trim()}>
              Create team
            </button>
          </form>

          <form className="dash-card" onSubmit={joinTeam}>
            <h2 className="section-title">Join a team</h2>
            <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginBottom: 16 }}>
              Enter the invite code a teammate shared with you.
            </p>
            <input
              className="field"
              placeholder="Invite code"
              value={code}
              onChange={e => setCode(e.target.value)}
              style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
            />
            <button className="btn btn-ghost" style={{ width: '100%' }} disabled={busy || !code.trim()}>
              Join team
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, maxWidth: 760 }}>
          <section className="dash-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>{myTeam.name}</h2>
                <p className="label-mono" style={{ marginTop: 4 }}>{myTeam.members.length} member{myTeam.members.length === 1 ? '' : 's'}</p>
              </div>
              <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 13 }} onClick={leaveTeam} disabled={busy}>
                Leave
              </button>
            </div>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none' }}>
              {myTeam.members.map(member => {
                const isLeader = member.user_id === myTeam.leader_id;
                return (
                  <li key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-container-high)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                      {member.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{member.user_id.slice(0, 8)}</p>
                      <p className="label-mono" style={{ fontSize: 10 }}>{isLeader ? 'Leader' : 'Member'}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="dash-card">
            <h2 className="section-title">Invite teammates</h2>
            <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginBottom: 16 }}>
              Share this link — it opens straight to a join page for this team.
            </p>
            <input className="field" readOnly value={inviteLink} onFocus={e => e.target.select()} style={{ fontSize: 12, marginBottom: 12 }} />
            <button className={`btn ${copied ? 'btn-success' : 'btn-primary'}`} style={{ width: '100%' }} onClick={copyLink}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{copied ? 'check' : 'link'}</span>
              {copied ? 'Link copied' : 'Copy invite link'}
            </button>
            <p className="label-mono" style={{ marginTop: 16 }}>Or share the code: <strong style={{ color: 'var(--color-primary)' }}>{myTeam.invite_code}</strong></p>
          </section>
        </div>
      )}
    </>
  );
}
