import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as formApi from '../services/formApi.js';

const TYPES = [
  ['short_answer', 'Short answer'], ['paragraph', 'Paragraph'], ['multiple_choice', 'Multiple choice'],
  ['checkboxes', 'Checkboxes'], ['file', 'File upload'],
];
const input = { width: '100%', boxSizing: 'border-box', border: '1px solid #d9d1de', borderRadius: 8, padding: 10, background: '#fff' };
const btn = { border: 0, borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontWeight: 700 };
const panel = { background: '#fff', border: '1px solid #e8e2ec', borderRadius: 14, padding: 20, marginBottom: 16 };

const blankQuestion = () => ({ title: 'Untitled question', description: '', type: 'short_answer', required: false, options: [], max_points: 0 });

export default function FormBuilderPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [tab, setTab] = useState('questions');
  const [responses, setResponses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const shareUrl = useMemo(() => form ? `${window.location.origin}/forms/${form.slug}` : '', [form]);

  useEffect(() => {
    formApi.getForm(formId)
      .then((data) => { setForm(data); setQuestions(data.questions); })
      .catch((e) => setMessage(e.detail || 'Could not load form'));
  }, [formId]);
  useEffect(() => { if (tab === 'responses') formApi.listResponses(formId).then(setResponses).catch((e) => setMessage(e.detail)); }, [tab, formId]);

  const updateQuestion = (index, changes) => setQuestions((items) => items.map((q, i) => i === index ? { ...q, ...changes } : q));
  const move = (index, offset) => setQuestions((items) => {
    const next = [...items]; const target = index + offset;
    if (target < 0 || target >= next.length) return items;
    [next[index], next[target]] = [next[target], next[index]]; return next;
  });
  const save = async () => {
    setMessage('Saving…');
    try {
      await formApi.updateForm(formId, { title: form.title, description: form.description, purpose: form.purpose, access: form.access, slug: form.slug });
      const updated = await formApi.saveQuestions(formId, questions.map(({ id, title, description, type, required, options, max_points }) => ({ id, title, description, type, required, options, max_points })));
      setForm(updated); setQuestions(updated.questions); setMessage('Saved');
    } catch (e) { setMessage(e.detail || 'Save failed'); }
  };
  const action = async (name) => {
    try { const updated = await formApi[name](formId); setForm(updated); setMessage(name === 'publishForm' ? 'Published' : 'Closed'); }
    catch (e) { setMessage(e.detail || 'Action failed'); }
  };
  const openResponse = async (id) => { try { setSelected(await formApi.getResponse(id)); } catch (e) { setMessage(e.detail); } };
  const grade = async () => {
    try {
      const updated = await formApi.gradeResponse(selected.id, {
        feedback: selected.feedback || '',
        answers: selected.answers.map((a) => ({ answer_id: a.id, awarded_points: Number(a.awarded_points || 0), feedback: a.feedback || '' })),
      });
      setSelected(updated); setMessage('Grade saved');
    } catch (e) { setMessage(e.detail || 'Grading failed'); }
  };

  if (!form) return <main style={{ padding: 40 }}>{message || 'Loading form…'}</main>;
  const locked = form.response_count > 0 || responses.length > 0;
  const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));

  return (
    <main style={{ minHeight: '100vh', background: '#f7f3fa', color: '#2b193d' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 5, background: '#fff', borderBottom: '1px solid #e8e2ec', padding: '14px max(20px, 5vw)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/organizer/forms')} style={{ ...btn, background: 'transparent' }}>← Forms</button>
        <strong style={{ flex: 1 }}>{form.title}</strong>
        <span>{message}</span>
        <button onClick={() => navigator.clipboard.writeText(shareUrl)} style={{ ...btn, background: '#eee8f3' }}>Copy link</button>
        {form.status !== 'published' ? <button onClick={() => action('publishForm')} style={{ ...btn, background: '#2b0a5a', color: '#fff' }}>Publish</button> : <button onClick={() => action('closeForm')} style={{ ...btn, background: '#7c2d12', color: '#fff' }}>Close</button>}
        <button onClick={save} style={{ ...btn, background: '#5d3fd3', color: '#fff' }}>Save</button>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 28 }}>
        <nav style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['questions', 'responses'].map((name) => <button key={name} onClick={() => setTab(name)} style={{ ...btn, background: tab === name ? '#2b0a5a' : '#fff', color: tab === name ? '#fff' : '#2b193d', textTransform: 'capitalize' }}>{name}</button>)}
          <a href={shareUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', alignSelf: 'center' }}>Preview ↗</a>
        </nav>

        {tab === 'questions' && <>
          <section style={{ ...panel, borderTop: '8px solid #5d3fd3' }}>
            <input aria-label="Form title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ ...input, fontSize: 28, fontWeight: 800, marginBottom: 12 }} />
            <textarea aria-label="Form description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" style={{ ...input, minHeight: 70 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} style={input}><option value="submission">Submission form</option><option value="quiz">Quiz</option></select>
              <select value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value })} style={input}><option value="public">Anyone with link</option><option value="authenticated">Login required</option></select>
            </div>
            <label style={{ display: 'block', marginTop: 12 }}>Share slug<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} style={{ ...input, marginTop: 6 }} /></label>
          </section>

          {locked && <p style={{ background: '#fff7ed', padding: 12, borderRadius: 8 }}>Questions are locked because this form has responses.</p>}
          {questions.map((q, index) => (
            <section key={q.id || index} style={panel}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <input value={q.title} onChange={(e) => updateQuestion(index, { title: e.target.value })} style={input} />
                <select value={q.type} onChange={(e) => updateQuestion(index, { type: e.target.value, options: ['multiple_choice', 'checkboxes'].includes(e.target.value) ? (q.options.length ? q.options : ['Option 1', 'Option 2']) : [] })} style={input} disabled={locked}>
                  {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <input value={q.description || ''} onChange={(e) => updateQuestion(index, { description: e.target.value })} placeholder="Question description (optional)" style={{ ...input, marginTop: 10 }} />
              {['multiple_choice', 'checkboxes'].includes(q.type) && <textarea value={q.options.join('\n')} onChange={(e) => updateQuestion(index, { options: e.target.value.split('\n') })} style={{ ...input, minHeight: 90, marginTop: 10 }} aria-label="One option per line" />}
              <footer style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                <label><input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(index, { required: e.target.checked })} /> Required</label>
                {form.purpose === 'quiz' && <label>Max points <input type="number" min="0" max="1000" value={q.max_points} onChange={(e) => updateQuestion(index, { max_points: Number(e.target.value) })} style={{ width: 70, marginLeft: 5 }} /></label>}
                <span style={{ flex: 1 }} />
                <button disabled={locked || index === 0} onClick={() => move(index, -1)} style={btn}>↑</button><button disabled={locked || index === questions.length - 1} onClick={() => move(index, 1)} style={btn}>↓</button>
                <button disabled={locked} onClick={() => setQuestions((items) => items.filter((_, i) => i !== index))} style={{ ...btn, color: '#b42318' }}>Delete</button>
              </footer>
            </section>
          ))}
          <button disabled={locked} onClick={() => setQuestions((items) => [...items, blankQuestion()])} style={{ ...btn, width: '100%', padding: 14, background: '#fff', border: '1px dashed #7a6885' }}>+ Add question</button>
        </>}

        {tab === 'responses' && <div style={{ display: 'grid', gridTemplateColumns: selected ? '280px 1fr' : '1fr', gap: 18 }}>
          <section>{responses.map((r) => <button key={r.id} onClick={() => openResponse(r.id)} style={{ ...panel, width: '100%', textAlign: 'left', cursor: 'pointer' }}><strong>{new Date(r.created_at).toLocaleString()}</strong><br/><small>{r.submitter_user_id || 'Anonymous'} · {r.total_score == null ? 'Not graded' : `${r.total_score} points`}</small></button>)}{!responses.length && <div style={panel}>No responses yet.</div>}</section>
          {selected && <section style={panel}>
            <h2>Response</h2>
            {selected.answers.map((answer, index) => { const q = questionById[answer.question_id]; return <div key={answer.id} style={{ borderTop: '1px solid #eee', padding: '16px 0' }}>
              <strong>{q?.title || `Question ${index + 1}`}</strong>
              <p style={{ whiteSpace: 'pre-wrap' }}>{Array.isArray(answer.value) ? answer.value.join(', ') : answer.value || (answer.attachment ? answer.attachment.original_filename : 'No answer')}</p>
              {answer.attachment && <button onClick={() => formApi.downloadAttachment(answer.attachment.id, answer.attachment.original_filename)} style={btn}>Download file</button>}
              {form.purpose === 'quiz' && <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, marginTop: 10 }}><input type="number" min="0" max={q?.max_points || 0} value={answer.awarded_points ?? 0} onChange={(e) => setSelected({ ...selected, answers: selected.answers.map((a) => a.id === answer.id ? { ...a, awarded_points: e.target.value } : a) })} style={input}/><input placeholder="Answer feedback" value={answer.feedback || ''} onChange={(e) => setSelected({ ...selected, answers: selected.answers.map((a) => a.id === answer.id ? { ...a, feedback: e.target.value } : a) })} style={input}/></div>}
            </div>; })}
            {form.purpose === 'quiz' && <><textarea placeholder="Overall feedback" value={selected.feedback || ''} onChange={(e) => setSelected({ ...selected, feedback: e.target.value })} style={{ ...input, minHeight: 80 }} /><button onClick={grade} style={{ ...btn, background: '#2b0a5a', color: '#fff', marginTop: 10 }}>Save grade</button></>}
          </section>}
        </div>}
      </div>
    </main>
  );
}
