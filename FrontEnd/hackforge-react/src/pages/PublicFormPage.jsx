import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import * as formApi from '../services/formApi.js';

const field = { width: '100%', boxSizing: 'border-box', padding: 12, border: '1px solid #d8cfdf', borderRadius: 8, font: 'inherit' };

export default function PublicFormPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState({});
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { formApi.getPublicForm(slug).then(setForm).catch((e) => setError(e.detail || 'Form not found')); }, [slug]);
  const setAnswer = (id, value) => setAnswers((current) => ({ ...current, [id]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.status !== 'published') {
      setError('This form is closed and is not accepting responses.');
      return;
    }
    if (form.access === 'authenticated' && !isAuthenticated) {
      sessionStorage.setItem('hackforge_return_path', window.location.pathname);
      navigate('/login');
      return;
    }

    const missing = form.questions.find((question) => {
      if (!question.required) return false;
      if (question.type === 'file') return !files[question.id];
      const value = answers[question.id];
      return Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim();
    });
    if (missing) {
      setError(`Please answer "${missing.title}" before submitting.`);
      return;
    }

    const selectedFiles = Object.values(files).filter(Boolean);
    const oversized = selectedFiles.find((file) => file.size > 10 * 1024 * 1024);
    if (oversized) {
      setError(`"${oversized.name}" is larger than the 10 MB limit.`);
      return;
    }
    if (selectedFiles.reduce((total, file) => total + file.size, 0) > 50 * 1024 * 1024) {
      setError('Combined uploads exceed the 50 MB response limit.');
      return;
    }

    const data = new FormData();
    data.append('answers', JSON.stringify(answers));
    Object.entries(files).forEach(([questionId, file]) => { if (file) data.append(`file_${questionId}`, file); });
    setSubmitting(true);
    try {
      await formApi.submitResponse(slug, data);
      setSent(true);
    } catch (e) {
      setError(e.detail || 'Could not submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !form) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f0f7' }}><div role="alert">{error}</div></main>;
  if (!form) return <main style={{ padding: 40 }}>Loading form...</main>;
  if (sent) return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f0f7', padding: 20 }}>
      <section role="status" aria-live="polite" style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 600, textAlign: 'center', boxShadow: '0 12px 40px rgba(43,10,90,.12)' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px', display: 'grid', placeItems: 'center', background: '#dcfce7', color: '#15803d', fontSize: 30 }}>✓</div>
        <h1>Response sent successfully</h1>
        <p>Your response has been recorded.</p>
        <button onClick={() => { setSent(false); setAnswers({}); setFiles({}); }} style={{ padding: 12, borderRadius: 8, border: 0, background: '#2b0a5a', color: '#fff', cursor: 'pointer' }}>Submit another response</button>
      </section>
    </main>
  );

  return (
    <main style={{ minHeight: '100vh', background: '#f5f0f7', padding: '48px 18px', color: '#2b193d' }}>
      <form onSubmit={submit} noValidate style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ background: '#fff', borderRadius: 14, borderTop: '10px solid #5d3fd3', padding: 28, marginBottom: 18 }}>
          <h1 style={{ fontSize: 36, margin: '0 0 12px' }}>{form.title}</h1>
          {form.description && <p style={{ whiteSpace: 'pre-wrap' }}>{form.description}</p>}
          <small>{form.purpose === 'quiz' ? 'Quiz · manually graded' : 'Submission form'} · {form.access === 'authenticated' ? 'Sign-in required' : 'Public'}</small>
          {form.status === 'closed' && <p style={{ color: '#b42318', fontWeight: 800 }}>This form is closed.</p>}
        </header>

        {form.questions.map((q) => <section key={q.id} style={{ background: '#fff', borderRadius: 14, padding: 24, marginBottom: 16 }}>
          <label style={{ fontWeight: 800, display: 'block', marginBottom: 8 }}>{q.title}{q.required && <span style={{ color: '#b42318' }}> *</span>}</label>
          {q.description && <p style={{ color: '#6f6575', marginTop: 0 }}>{q.description}</p>}
          {q.type === 'short_answer' && <input value={answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)} style={field} />}
          {q.type === 'paragraph' && <textarea value={answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)} style={{ ...field, minHeight: 120 }} />}
          {q.type === 'multiple_choice' && q.options.map((option) => <label key={option} style={{ display: 'block', padding: '8px 0' }}><input type="radio" name={q.id} checked={answers[q.id] === option} onChange={() => setAnswer(q.id, option)} /> {option}</label>)}
          {q.type === 'checkboxes' && q.options.map((option) => { const values = answers[q.id] || []; return <label key={option} style={{ display: 'block', padding: '8px 0' }}><input type="checkbox" checked={values.includes(option)} onChange={(e) => setAnswer(q.id, e.target.checked ? [...values, option] : values.filter((v) => v !== option))} /> {option}</label>; })}
          {q.type === 'file' && <><input type="file" onChange={(e) => setFiles((current) => ({ ...current, [q.id]: e.target.files[0] }))} /><small style={{ display: 'block', marginTop: 8 }}>Maximum 10 MB.</small></>}
        </section>)}
        {error && <p role="alert" aria-live="assertive" style={{ background: '#fff1f2', color: '#b42318', padding: 12, border: '1px solid #fecaca', borderRadius: 8, fontWeight: 700 }}>{error}</p>}
        <button disabled={submitting} type="submit" style={{ padding: '12px 28px', border: 0, borderRadius: 8, background: '#2b0a5a', color: '#fff', fontWeight: 800, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? .7 : 1 }}>{submitting ? 'Submitting...' : 'Submit'}</button>
      </form>
    </main>
  );
}
