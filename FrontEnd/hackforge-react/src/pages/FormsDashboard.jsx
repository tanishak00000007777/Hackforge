import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as hackathonApi from '../services/hackathonApi.js';
import * as formApi from '../services/formApi.js';

const card = { background: '#fff', border: '1px solid #e8e2ec', borderRadius: 16, padding: 24, boxShadow: '0 8px 24px rgba(43,25,61,.06)' };
const button = { border: 0, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 700 };

export default function FormsDashboard() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [hackathonId, setHackathonId] = useState('');
  const [forms, setForms] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    hackathonApi.listOwnedHackathons().then((items) => {
      setHackathons(items);
      if (items[0]) setHackathonId(items[0].id);
    }).catch((err) => setError(err.detail || 'Could not load hackathons'));
  }, []);

  useEffect(() => {
    if (!hackathonId) return;
    formApi.listForms(hackathonId).then(setForms).catch((err) => setError(err.detail || 'Could not load forms'));
  }, [hackathonId]);

  const create = async () => {
    const title = window.prompt('Form title', 'Project Submission');
    if (!title) return;
    setCreating(true);
    try {
      const form = await formApi.createForm(hackathonId, { title, purpose: 'submission', access: 'public' });
      navigate(`/organizer/forms/${form.id}`);
    } catch (err) {
      setError(err.detail || 'Could not create form');
    } finally {
      setCreating(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: '#fbf8ff', padding: '40px max(24px, 6vw)', color: '#2b193d' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', marginBottom: 32 }}>
        <div>
          <button onClick={() => navigate('/organizer')} style={{ ...button, background: 'transparent', paddingLeft: 0 }}>← Organizer dashboard</button>
          <h1 style={{ fontSize: 40, margin: '8px 0' }}>Forms</h1>
          <p style={{ color: '#6f6575' }}>Create submission forms and manually graded quizzes.</p>
        </div>
        <button disabled={!hackathonId || creating} onClick={create} style={{ ...button, background: '#2b0a5a', color: '#fff' }}>+ New form</button>
      </header>

      <label style={{ display: 'block', marginBottom: 24, maxWidth: 420 }}>
        <span style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Hackathon</span>
        <select value={hackathonId} onChange={(e) => setHackathonId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d9d1de', background: '#fff' }}>
          {hackathons.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
      </label>

      {error && <p style={{ background: '#fff1f2', color: '#b42318', padding: 12, borderRadius: 8 }}>{error}</p>}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {forms.map((form) => (
          <article key={form.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: form.status === 'published' ? '#087443' : '#775f85' }}>{form.status}</span>
              <span style={{ fontSize: 12 }}>{form.purpose}</span>
            </div>
            <h2 style={{ margin: '16px 0 8px' }}>{form.title}</h2>
            <p style={{ color: '#6f6575', minHeight: 42 }}>{form.description || 'No description yet.'}</p>
            <p style={{ fontWeight: 700 }}>{form.response_count} responses</p>
            <button onClick={() => navigate(`/organizer/forms/${form.id}`)} style={{ ...button, width: '100%', background: '#f0e9f7', color: '#2b0a5a' }}>Open builder</button>
          </article>
        ))}
        {!forms.length && hackathonId && <div style={card}>No forms yet. Create the first one.</div>}
      </section>
    </main>
  );
}
