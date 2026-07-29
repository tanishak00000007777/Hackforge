import { useState, useEffect } from 'react';
import Modal from '../../components/Modal.jsx';
import * as registrationApi from '../../services/registrationApi.js';
import * as teamApi from '../../services/teamApi.js';

/** Registration is a prerequisite for teams, so we do it silently first. */
async function ensureRegistered(hackathonId) {
  try {
    await registrationApi.registerForHackathon(hackathonId, { form_data: {} });
  } catch (err) {
    // Already registered is the expected no-op here; anything else is real.
    if (err.detail !== 'Already registered') throw err;
  }
}

export default function RegisterEventModal({ hackathon, open, onClose, onDone }) {
  const [step, setStep] = useState('choose');   // choose | create | join | pending
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Fresh state every time the dialog opens for a different event.
  useEffect(() => {
    if (open) {
      setStep('choose');
      setTeamName('');
      setTeamCode('');
      setError('');
      setBusy(false);
    }
  }, [open, hackathon?.id]);

  if (!hackathon) return null;

  const submit = async (action) => {
    setBusy(true);
    setError('');
    try {
      await ensureRegistered(hackathon.id);
      const team = await action();
      onDone(team);
      onClose();
    } catch (err) {
      // The event needs organizer approval before teams can be formed. The
      // registration above still succeeded, so say so rather than just failing.
      if (err.detail?.includes('must be approved')) setStep('pending');
      else setError(err.detail || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const createTeam = (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    submit(() => teamApi.createTeam(hackathon.id, { name: teamName.trim() }));
  };

  const joinTeam = (e) => {
    e.preventDefault();
    if (!teamCode.trim()) return;
    submit(() => teamApi.joinTeam(hackathon.id, teamCode.trim().toUpperCase()));
  };

  const backButton = (
    <button type="button" className="btn btn-ghost" onClick={() => { setStep('choose'); setError(''); }} disabled={busy}>
      Back
    </button>
  );

  return (
    <Modal open={open} onClose={onClose} title={`Register for ${hackathon.title}`}>
      {step === 'choose' && (
        <>
          <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginBottom: 18 }}>
            Every participant takes part as a team. Create one and invite others, or join a team you already have a code for.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button type="button" className="choice-card" onClick={() => setStep('create')}>
              <span className="choice-icon" aria-hidden="true">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>group_add</span>
              </span>
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>Create a team</span>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
                  Start a new team and get an invite link to share.
                </span>
              </span>
            </button>

            <button type="button" className="choice-card" onClick={() => setStep('join')}>
              <span className="choice-icon" aria-hidden="true">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>link</span>
              </span>
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>Join a team</span>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
                  Enter the invite code a teammate shared with you.
                </span>
              </span>
            </button>
          </div>
        </>
      )}

      {step === 'create' && (
        <form onSubmit={createTeam}>
          <label htmlFor="new-team-name" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: 6 }}>
            Team name
          </label>
          <input
            id="new-team-name"
            className="field"
            autoFocus
            required
            maxLength={80}
            placeholder="e.g. Night Owls"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            aria-describedby={error ? 'register-error' : undefined}
            aria-invalid={error ? 'true' : undefined}
          />
          {error && <p id="register-error" className="alert-error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            {backButton}
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={busy || !teamName.trim()}>
              {busy && <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }} aria-hidden="true">progress_activity</span>}
              {busy ? 'Creating…' : 'Create team'}
            </button>
          </div>
        </form>
      )}

      {step === 'join' && (
        <form onSubmit={joinTeam}>
          <label htmlFor="join-team-code" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: 6 }}>
            Invite code
          </label>
          <input
            id="join-team-code"
            className="field"
            autoFocus
            required
            maxLength={16}
            placeholder="ABCD1234"
            value={teamCode}
            onChange={e => setTeamCode(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            aria-describedby={error ? 'register-error' : undefined}
            aria-invalid={error ? 'true' : undefined}
          />
          {error && <p id="register-error" className="alert-error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            {backButton}
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={busy || !teamCode.trim()}>
              {busy && <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }} aria-hidden="true">progress_activity</span>}
              {busy ? 'Joining…' : 'Join team'}
            </button>
          </div>
        </form>
      )}

      {step === 'pending' && (
        <div role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#15803d' }} aria-hidden="true">check_circle</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>You&apos;re registered</p>
          </div>
          <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', lineHeight: 1.6, marginBottom: 18 }}>
            An organizer needs to approve your registration for {hackathon.title} before you can create or join a team.
            We&apos;ll keep your spot — check back shortly.
          </p>
          <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => { onDone(null); onClose(); }}>
            Got it
          </button>
        </div>
      )}
    </Modal>
  );
}
