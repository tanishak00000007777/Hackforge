import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/DashboardLayout.jsx';
import { useOrganizer, HackathonPicker } from './organizer/OrganizerLayout.jsx';
import * as certificateApi from '../services/certificateApi.js';
import * as teamApi from '../services/teamApi.js';

const presetNames = { classic: 'Classic', modern: 'Modern', bold: 'Bold' };
const demoTemplate = {
  preset: 'modern',
  primary_color: '#0F4C5C',
  secondary_color: '#E0A458',
  heading: 'Certificate of Innovation',
  body_text: 'This certificate recognizes outstanding creativity, collaboration, and impact.',
  signatory_name: 'Priya Sharma',
  signatory_title: 'HackForge Program Director',
  sponsor_names: ['HackForge Labs', 'Northstar Foundation'],
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: 6 };

export default function CertificatesDashboard() {
  const { selectedHackathon } = useOrganizer();
  const hackathonId = selectedHackathon?.id;
  const [template, setTemplate] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [certificateType, setCertificateType] = useState('participant');
  const [teamIds, setTeamIds] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hackathonId) return;
    setError('');
    Promise.all([
      certificateApi.getTemplate(hackathonId),
      certificateApi.getHackathonCertificates(hackathonId),
      teamApi.getHackathonTeams(hackathonId),
    ]).then(([savedTemplate, issued, eventTeams]) => {
      setTemplate(savedTemplate.id ? savedTemplate : { ...savedTemplate, ...demoTemplate });
      setCertificates(issued);
      setTeams(Array.isArray(eventTeams) ? eventTeams : []);
      setTeamIds([]);
      setMessage(savedTemplate.id ? '' : 'Demo template loaded. Save it to keep these settings.');
    }).catch((err) => setError(err.detail || 'Could not load certificate settings.'));
  }, [hackathonId]);

  const selectedMemberCount = useMemo(() => teams
    .filter((team) => teamIds.includes(team.id))
    .reduce((total, team) => total + (team.members?.length || 0), 0), [teams, teamIds]);
  const awardType = certificateType === 'winner' || certificateType === 'runner_up';

  const update = (key, value) => setTemplate((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      setTemplate(await certificateApi.saveTemplate(hackathonId, template));
      setMessage('Template saved.');
    } catch (err) {
      setError(err.detail || 'Could not save the template.');
    } finally { setBusy(false); }
  };

  const previewPdf = async () => {
    const tab = window.open('', '_blank');
    setBusy(true); setError('');
    try {
      const blob = await certificateApi.previewTemplate(hackathonId, template);
      const url = URL.createObjectURL(blob);
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if (tab) tab.close();
      setError(err.detail || 'Could not generate a preview.');
    } finally { setBusy(false); }
  };

  const issue = async () => {
    if (awardType && !teamIds.length) { setError('Select at least one team.'); return; }
    const target = awardType ? `${selectedMemberCount} team member(s)` : `all eligible ${certificateType}s`;
    if (!window.confirm(`Issue ${certificateType.replace('_', ' ')} certificates to ${target}?`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await certificateApi.issueCertificates(hackathonId, { type: certificateType, team_ids: awardType ? teamIds : [] });
      setMessage(`${result.issued} issued, ${result.skipped} already existed.`);
      setCertificates(await certificateApi.getHackathonCertificates(hackathonId));
    } catch (err) {
      setError(err.detail || 'Could not issue certificates.');
    } finally { setBusy(false); }
  };

  const download = async (item) => {
    setBusy(true); setError('');
    try {
      const blob = await certificateApi.downloadCertificate(item.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${item.event_title}-${item.type}-certificate.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.detail || 'Could not download the certificate.');
    } finally { setBusy(false); }
  };

  if (!selectedHackathon) {
    return (
      <>
        <PageHeader title="Certificates" />
        <div className="dash-card empty-state">Create a hackathon before issuing certificates.</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Certificates"
        subtitle="Design, preview and bulk-issue verified event certificates."
        actions={<HackathonPicker />}
      />

      {error && <div className="alert-error" style={{ marginBottom: 'var(--spacing-sm)' }} role="alert">{error}</div>}
      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: 14, marginBottom: 'var(--spacing-sm)' }} role="status">
          {message}
        </div>
      )}

      {!template ? (
        <div className="empty-state">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 28 }}>progress_activity</span>
        </div>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap: 24, alignItems: 'start' }}>
          <div className="dash-card" style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Template</h2>
              <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setTemplate((c) => ({ ...c, ...demoTemplate }))}>
                Load demo
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {Object.keys(presetNames).map((preset) => (
                <button
                  key={preset}
                  className={`btn ${template.preset === preset ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => update('preset', preset)}
                >
                  {presetNames[preset]}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label><span style={labelStyle}>Primary color</span>
                <input type="color" className="field" value={template.primary_color} onChange={(e) => update('primary_color', e.target.value)} style={{ height: 42, padding: 4 }} />
              </label>
              <label><span style={labelStyle}>Accent color</span>
                <input type="color" className="field" value={template.secondary_color} onChange={(e) => update('secondary_color', e.target.value)} style={{ height: 42, padding: 4 }} />
              </label>
            </div>

            <label><span style={labelStyle}>Heading</span>
              <input className="field" value={template.heading} maxLength={120} onChange={(e) => update('heading', e.target.value)} />
            </label>
            <label><span style={labelStyle}>Presentation text</span>
              <textarea className="field" value={template.body_text} maxLength={300} rows={2} onChange={(e) => update('body_text', e.target.value)} />
            </label>
            <label><span style={labelStyle}>Signatory name</span>
              <input className="field" value={template.signatory_name} maxLength={120} onChange={(e) => update('signatory_name', e.target.value)} />
            </label>
            <label><span style={labelStyle}>Signatory title</span>
              <input className="field" value={template.signatory_title} maxLength={120} onChange={(e) => update('signatory_title', e.target.value)} />
            </label>
            <label><span style={labelStyle}>Sponsors (comma separated)</span>
              <input className="field" value={template.sponsor_names.join(', ')} onChange={(e) => update('sponsor_names', e.target.value.split(',').map((n) => n.trim()).filter(Boolean))} />
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={busy} onClick={save}>Save template</button>
              <button className="btn btn-ghost" disabled={busy} onClick={previewPdf}>Preview PDF</button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 24, minWidth: 0 }}>
            <article aria-label="Certificate preview" style={{
              width: '100%', minWidth: 0, overflow: 'hidden', aspectRatio: '1.414 / 1',
              padding: 'clamp(14px, 4vw, 34px)', boxSizing: 'border-box',
              color: template.preset === 'bold' ? '#fff' : '#352c3b',
              background: template.preset === 'bold' ? template.primary_color : '#fff',
              border: template.preset === 'classic' ? `8px double ${template.primary_color}` : '1px solid var(--color-outline-variant)',
              borderLeft: template.preset === 'modern' ? `clamp(18px, 5vw, 56px) solid ${template.primary_color}` : undefined,
              borderRadius: template.preset === 'modern' ? 4 : 12,
              boxShadow: '0 18px 45px rgba(43,25,61,.13)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, letterSpacing: 2, opacity: .7 }}>HACKFORGE · {selectedHackathon.title}</div>
              <h2 style={{ fontFamily: template.preset === 'classic' ? 'Georgia, serif' : 'inherit', fontSize: 30, color: template.preset === 'bold' ? '#fff' : template.primary_color, margin: '22px 0 14px' }}>{template.heading}</h2>
              <p style={{ margin: 0 }}>{template.body_text}</p>
              <strong style={{ fontSize: 28, margin: '14px 0', color: template.preset === 'bold' ? template.secondary_color : template.primary_color }}>Alex Morgan</strong>
              <p>for successfully participating in <b>{selectedHackathon.title}</b></p>
              <div style={{ width: 180, borderTop: `2px solid ${template.secondary_color}`, marginTop: 22, paddingTop: 8 }}>
                <b>{template.signatory_name}</b><br /><small>{template.signatory_title}</small>
              </div>
              {!!template.sponsor_names.length && <small style={{ marginTop: 18 }}>Supported by: {template.sponsor_names.join(' · ')}</small>}
            </article>

            <div className="dash-card">
              <h2 className="section-title">Bulk issuance</h2>
              <label><span style={labelStyle}>Certificate type</span>
                <select className="field" value={certificateType} onChange={(e) => { setCertificateType(e.target.value); setTeamIds([]); }}>
                  <option value="participant">Participant</option>
                  <option value="judge">Judge</option>
                  <option value="winner">Winner</option>
                  <option value="runner_up">Runner-up</option>
                </select>
              </label>

              {awardType ? (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Select winning teams</p>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {teams.map((team) => (
                      <label key={team.id} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: 10, background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-md)', fontSize: 14 }}>
                        <input
                          type="checkbox"
                          checked={teamIds.includes(team.id)}
                          onChange={(e) => setTeamIds((ids) => e.target.checked ? [...ids, team.id] : ids.filter((id) => id !== team.id))}
                        />
                        <span>{team.name} <small style={{ color: 'var(--color-on-surface-variant)' }}>({team.members?.length || 0} members)</small></span>
                      </label>
                    ))}
                    {!teams.length && <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>No teams are available for this event.</p>}
                  </div>
                  <p style={{ fontSize: 14, margin: '12px 0' }}><b>{selectedMemberCount}</b> member certificate(s) will be issued.</p>
                </div>
              ) : (
                <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', margin: '12px 0' }}>
                  This issues to all {certificateType === 'participant' ? 'approved participants' : 'accepted judges'}.
                </p>
              )}

              <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy} onClick={issue}>Issue certificates</button>
            </div>
          </div>
        </section>
      )}

      <section className="dash-card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <h2 className="section-title" style={{ padding: 'var(--spacing-md) var(--spacing-md) 0' }}>
          Issued certificates ({certificates.length})
        </h2>
        {certificates.length ? (
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Recipient</th><th>Type</th><th>Issued</th><th>Verification ID</th><th />
                </tr>
              </thead>
              <tbody>
                {certificates.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.recipient_name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{item.type.replace('_', ' ')}</td>
                    <td style={{ color: 'var(--color-on-surface-variant)' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{item.verification_id.slice(0, 12)}…</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 13 }} disabled={busy} onClick={() => download(item)}>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No certificates have been issued for this event.</p>
        )}
      </section>
    </>
  );
}
