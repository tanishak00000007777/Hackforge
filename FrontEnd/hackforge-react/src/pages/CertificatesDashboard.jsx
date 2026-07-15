import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as certificateApi from '../services/certificateApi.js';
import * as hackathonApi from '../services/hackathonApi.js';
import * as teamApi from '../services/teamApi.js';

const field = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #d8cfdf', borderRadius: 8, background: '#fff', color: '#2b193d' };
const button = { border: 0, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 700 };
const card = { background: '#fff', border: '1px solid #e8e2ec', borderRadius: 16, padding: 22, boxShadow: '0 8px 24px rgba(43,25,61,.06)' };
const presetNames = { classic: 'Classic', modern: 'Modern', bold: 'Bold' };

export default function CertificatesDashboard() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [hackathonId, setHackathonId] = useState('');
  const [template, setTemplate] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [certificateType, setCertificateType] = useState('participant');
  const [teamIds, setTeamIds] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    hackathonApi.listOwnedHackathons().then((items) => {
      setHackathons(items);
      if (items[0]) setHackathonId(items[0].id);
    }).catch((err) => setError(err.detail || 'Could not load hackathons'));
  }, []);

  useEffect(() => {
    if (!hackathonId) return;
    setError('');
    Promise.all([
      certificateApi.getTemplate(hackathonId),
      certificateApi.getHackathonCertificates(hackathonId),
      teamApi.getHackathonTeams(hackathonId),
    ]).then(([savedTemplate, issued, eventTeams]) => {
      setTemplate(savedTemplate);
      setCertificates(issued);
      setTeams(Array.isArray(eventTeams) ? eventTeams : []);
      setTeamIds([]);
    }).catch((err) => setError(err.detail || 'Could not load certificate settings'));
  }, [hackathonId]);

  const selectedHackathon = hackathons.find((item) => item.id === hackathonId);
  const selectedMemberCount = useMemo(() => teams
    .filter((team) => teamIds.includes(team.id))
    .reduce((total, team) => total + (team.members?.length || 0), 0), [teams, teamIds]);
  const awardType = certificateType === 'winner' || certificateType === 'runner_up';

  const update = (key, value) => setTemplate((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const saved = await certificateApi.saveTemplate(hackathonId, template);
      setTemplate(saved);
      setMessage('Template saved successfully.');
    } catch (err) {
      setError(err.detail || 'Could not save template');
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
      setError(err.detail || 'Could not generate preview');
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
      setError(err.detail || 'Could not issue certificates');
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
      setError(err.detail || 'Could not download certificate');
    } finally { setBusy(false); }
  };

  if (!template && hackathonId) return <main style={{ padding: 40 }}>Loading certificate studio…</main>;

  return (
    <main style={{ minHeight: '100vh', background: '#fbf8ff', padding: '36px max(22px, 5vw)', color: '#2b193d' }}>
      <button onClick={() => navigate('/organizer')} style={{ ...button, background: 'transparent', paddingLeft: 0 }}>← Organizer dashboard</button>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, flexWrap: 'wrap', margin: '8px 0 28px' }}>
        <div><h1 style={{ fontSize: 38, margin: 0 }}>Certificates</h1><p style={{ color: '#6f6575' }}>Design, preview, and bulk-issue verified event certificates.</p></div>
        <label style={{ minWidth: 280 }}><span style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Hackathon</span><select value={hackathonId} onChange={(e) => setHackathonId(e.target.value)} style={field}>{hackathons.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}</select></label>
      </header>

      {error && <p role="alert" style={{ background: '#fff1f2', color: '#b42318', padding: 12, borderRadius: 8 }}>{error}</p>}
      {message && <p role="status" style={{ background: '#ecfdf3', color: '#087443', padding: 12, borderRadius: 8 }}>{message}</p>}

      {template && <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap: 24, alignItems: 'start' }}>
        <div style={{ ...card, display: 'grid', gap: 15 }}>
          <h2 style={{ margin: 0 }}>Template</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {Object.keys(presetNames).map((preset) => <button key={preset} onClick={() => update('preset', preset)} style={{ ...button, background: template.preset === preset ? '#2b0a5a' : '#f1ebf5', color: template.preset === preset ? '#fff' : '#2b193d' }}>{presetNames[preset]}</button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>Primary color<input type="color" value={template.primary_color} onChange={(e) => update('primary_color', e.target.value)} style={{ ...field, height: 42, padding: 4 }} /></label>
            <label>Accent color<input type="color" value={template.secondary_color} onChange={(e) => update('secondary_color', e.target.value)} style={{ ...field, height: 42, padding: 4 }} /></label>
          </div>
          <label>Heading<input value={template.heading} maxLength={120} onChange={(e) => update('heading', e.target.value)} style={field} /></label>
          <label>Presentation text<textarea value={template.body_text} maxLength={300} onChange={(e) => update('body_text', e.target.value)} rows={2} style={field} /></label>
          <label>Signatory name<input value={template.signatory_name} maxLength={120} onChange={(e) => update('signatory_name', e.target.value)} style={field} /></label>
          <label>Signatory title<input value={template.signatory_title} maxLength={120} onChange={(e) => update('signatory_title', e.target.value)} style={field} /></label>
          <label>Sponsors <small style={{ color: '#746a79' }}>(comma separated)</small><input value={template.sponsor_names.join(', ')} onChange={(e) => update('sponsor_names', e.target.value.split(',').map((name) => name.trim()).filter(Boolean))} style={field} /></label>
          <div style={{ display: 'flex', gap: 10 }}><button disabled={busy} onClick={save} style={{ ...button, background: '#2b0a5a', color: '#fff', flex: 1 }}>Save template</button><button disabled={busy} onClick={previewPdf} style={{ ...button, background: '#efe7f5', color: '#2b0a5a' }}>Preview PDF</button></div>
        </div>

        <div style={{ display: 'grid', gap: 24, minWidth: 0 }}>
          <article aria-label="Certificate preview" style={{ width: '100%', minWidth: 0, overflow: 'hidden', aspectRatio: '1.414 / 1', padding: 'clamp(14px, 4vw, 34px)', boxSizing: 'border-box', color: template.preset === 'bold' ? '#fff' : '#352c3b', background: template.preset === 'bold' ? template.primary_color : '#fff', border: template.preset === 'classic' ? `8px double ${template.primary_color}` : '1px solid #ded5e3', borderLeft: template.preset === 'modern' ? `clamp(18px, 5vw, 56px) solid ${template.primary_color}` : undefined, borderRadius: template.preset === 'modern' ? 4 : 12, boxShadow: '0 18px 45px rgba(43,25,61,.13)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 12, letterSpacing: 2, opacity: .7 }}>HACKFORGE · {selectedHackathon?.title}</div>
            <h2 style={{ fontFamily: template.preset === 'classic' ? 'Georgia, serif' : 'inherit', fontSize: 30, color: template.preset === 'bold' ? '#fff' : template.primary_color, margin: '22px 0 14px' }}>{template.heading}</h2>
            <p style={{ margin: 0 }}>{template.body_text}</p><strong style={{ fontSize: 28, margin: '14px 0', color: template.preset === 'bold' ? template.secondary_color : template.primary_color }}>Alex Morgan</strong><p>for successfully participating in <b>{selectedHackathon?.title}</b></p>
            <div style={{ width: 180, borderTop: `2px solid ${template.secondary_color}`, marginTop: 22, paddingTop: 8 }}><b>{template.signatory_name}</b><br /><small>{template.signatory_title}</small></div>
            {!!template.sponsor_names.length && <small style={{ marginTop: 18 }}>Supported by: {template.sponsor_names.join(' · ')}</small>}
          </article>

          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Bulk issuance</h2>
            <label><span style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Certificate type</span><select value={certificateType} onChange={(e) => { setCertificateType(e.target.value); setTeamIds([]); }} style={field}><option value="participant">Participant</option><option value="judge">Judge</option><option value="winner">Winner</option><option value="runner_up">Runner-up</option></select></label>
            {awardType && <div style={{ marginTop: 16 }}><b>Select winning teams</b><div style={{ display: 'grid', gap: 8, marginTop: 8 }}>{teams.map((team) => <label key={team.id} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: 10, background: '#f8f4fa', borderRadius: 8 }}><input type="checkbox" checked={teamIds.includes(team.id)} onChange={(e) => setTeamIds((ids) => e.target.checked ? [...ids, team.id] : ids.filter((id) => id !== team.id))} /> <span>{team.name} <small>({team.members?.length || 0} members)</small></span></label>)}{!teams.length && <p>No teams are available for this event.</p>}</div><p><b>{selectedMemberCount}</b> member certificate(s) will be issued.</p></div>}
            {!awardType && <p style={{ color: '#6f6575' }}>This issues to all {certificateType === 'participant' ? 'approved participants' : 'accepted judges'}.</p>}
            <button disabled={busy} onClick={issue} style={{ ...button, width: '100%', background: '#2b0a5a', color: '#fff' }}>Issue certificates</button>
          </div>
        </div>
      </section>}

      <section style={{ ...card, marginTop: 24 }}><h2 style={{ marginTop: 0 }}>Issued certificates ({certificates.length})</h2>{certificates.length ? <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Recipient', 'Type', 'Issued', 'Verification ID', ''].map((title, index) => <th key={`${title}-${index}`} style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e8e2ec' }}>{title}</th>)}</tr></thead><tbody>{certificates.map((item) => <tr key={item.id}><td style={{ padding: 10 }}>{item.recipient_name}</td><td style={{ padding: 10 }}>{item.type.replace('_', ' ')}</td><td style={{ padding: 10 }}>{new Date(item.created_at).toLocaleDateString()}</td><td style={{ padding: 10, fontFamily: 'monospace' }}>{item.verification_id.slice(0, 12)}…</td><td style={{ padding: 10 }}><button disabled={busy} onClick={() => download(item)} style={{ ...button, padding: '7px 10px', background: '#efe7f5', color: '#2b0a5a' }}>Download</button></td></tr>)}</tbody></table></div> : <p style={{ color: '#6f6575' }}>No certificates have been issued for this event.</p>}</section>
    </main>
  );
}
