import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as certificateApi from '../services/certificateApi.js';

export default function MyCertificatesPage() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');

  useEffect(() => { certificateApi.getMyCertificates().then(setCertificates).catch((err) => setError(err.detail || 'Could not load certificates')); }, []);

  const download = async (item) => {
    setDownloading(item.id); setError('');
    try {
      const blob = await certificateApi.downloadCertificate(item.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `${item.event_title}-${item.type}-certificate.pdf`; anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.detail || 'Download failed'); }
    finally { setDownloading(''); }
  };

  return <main style={{ minHeight: '100vh', background: '#fbf8ff', padding: '40px max(24px, 7vw)', color: '#2b193d' }}>
    <button onClick={() => navigate('/participant')} style={{ border: 0, background: 'transparent', color: '#2b0a5a', fontWeight: 700, cursor: 'pointer' }}>← Participant dashboard</button>
    <h1 style={{ fontSize: 40, marginBottom: 8 }}>My certificates</h1><p style={{ color: '#6f6575', marginBottom: 28 }}>Download certificates issued to your HackForge account.</p>
    {error && <p role="alert" style={{ background: '#fff1f2', color: '#b42318', padding: 12, borderRadius: 8 }}>{error}</p>}
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 380px))', gap: 20 }}>
      {certificates.map((item) => <article key={item.id} style={{ background: '#fff', border: '1px solid #e6ddea', borderTop: '6px solid #2b0a5a', borderRadius: 14, padding: 22, boxShadow: '0 10px 30px rgba(43,25,61,.08)' }}><small style={{ textTransform: 'uppercase', color: '#775f85', fontWeight: 800 }}>{item.type.replace('_', ' ')}</small><h2>{item.event_title}</h2><p>Issued to <b>{item.recipient_name}</b></p><p style={{ color: '#6f6575' }}>{new Date(item.created_at).toLocaleDateString()}</p><div style={{ display: 'flex', gap: 10, marginTop: 20 }}><button disabled={downloading === item.id} onClick={() => download(item)} style={{ flex: 1, border: 0, borderRadius: 8, padding: 10, background: '#2b0a5a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{downloading === item.id ? 'Preparing…' : 'Download PDF'}</button><Link to={`/certificates/verify/${item.verification_id}`} style={{ padding: 10, borderRadius: 8, background: '#efe7f5', color: '#2b0a5a', fontWeight: 700, textDecoration: 'none' }}>Verify</Link></div></article>)}
      {!certificates.length && !error && <div style={{ background: '#fff', padding: 28, borderRadius: 14 }}>No certificates have been issued to you yet.</div>}
    </section>
  </main>;
}
