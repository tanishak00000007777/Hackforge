import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/DashboardLayout.jsx';
import { useOrganizer, HackathonPicker } from './organizer/OrganizerLayout.jsx';
import * as formApi from '../services/formApi.js';

export default function FormsDashboard() {
  const navigate = useNavigate();
  const { selectedHackathon } = useOrganizer();
  const [forms, setForms] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!selectedHackathon) return;
    setError('');
    formApi.listForms(selectedHackathon.id)
      .then(setForms)
      .catch(err => setError(err.detail || 'Could not load forms.'));
  }, [selectedHackathon]);

  const create = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError('');
    try {
      const form = await formApi.createForm(selectedHackathon.id, {
        title: newTitle.trim(),
        purpose: 'submission',
        access: 'public',
      });
      navigate(`/organizer/forms/${form.id}`);
    } catch (err) {
      setError(err.detail || 'Could not create the form.');
      setCreating(false);
    }
  };

  if (!selectedHackathon) {
    return (
      <>
        <PageHeader title="Forms" />
        <div className="dash-card empty-state">Create a hackathon before building forms.</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Forms"
        subtitle="Submission forms and manually graded quizzes."
        actions={
          <>
            <HackathonPicker />
            <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              New form
            </button>
          </>
        }
      />

      {error && <div className="alert-error" style={{ marginBottom: 'var(--spacing-sm)' }}>{error}</div>}

      {showCreate && (
        <form className="dash-card" onSubmit={create} style={{ marginBottom: 'var(--spacing-sm)', maxWidth: 480 }}>
          <h2 className="section-title">Create a form</h2>
          <input
            className="field"
            autoFocus
            placeholder="Form title, e.g. Project submission"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" disabled={creating || !newTitle.trim()}>
              {creating ? 'Creating…' : 'Create and open builder'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      {forms.length === 0 ? (
        <div className="dash-card empty-state">No forms yet. Create the first one.</div>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {forms.map(form => (
            <article key={form.id} className="dash-card floating-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <span className="pill" style={{
                  background: form.status === 'published' ? '#dcfce7' : 'var(--color-surface-container-high)',
                  color: form.status === 'published' ? '#15803d' : 'var(--color-on-surface-variant)',
                }}>{form.status}</span>
                <span className="label-mono">{form.purpose}</span>
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6 }}>{form.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', flexGrow: 1, marginBottom: 12 }}>
                {form.description || 'No description yet.'}
              </p>
              <p className="label-mono" style={{ marginBottom: 14 }}>{form.response_count} responses</p>
              <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => navigate(`/organizer/forms/${form.id}`)}>
                Open builder
              </button>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
