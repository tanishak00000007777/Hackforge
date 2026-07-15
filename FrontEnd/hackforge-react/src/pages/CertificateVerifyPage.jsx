import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as certificateApi from '../services/certificateApi.js';

export default function CertificateVerifyPage() {
  const { verificationId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { certificateApi.verifyCertificate(verificationId).then((item) => item ? setCertificate(item) : setError('Certificate not found or invalid.')).catch((err) => setError(err.detail || 'Certificate not found or invalid.')); }, [verificationId]);

  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'radial-gradient(circle at top, #f2e8fa, #fbf8ff 55%)', color: '#2b193d' }}><section style={{ width: 'min(560px, 100%)', background: '#fff', borderRadius: 20, padding: '36px max(24px, 6vw)', boxShadow: '0 22px 60px rgba(43,25,61,.13)', textAlign: 'center' }}><Link to="/" style={{ color: '#2b0a5a', fontWeight: 800, textDecoration: 'none' }}>HackForge</Link>{!certificate && !error && <p>Verifying certificate…</p>}{error && <><div style={{ width: 64, height: 64, margin: '24px auto', display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#fff1f2', color: '#b42318', fontSize: 30 }}>×</div><h1>Certificate not verified</h1><p role="alert" style={{ color: '#6f6575' }}>{error}</p></>}{certificate && <><div style={{ width: 64, height: 64, margin: '24px auto', display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#ecfdf3', color: '#087443', fontSize: 30 }}>✓</div><p style={{ color: '#087443', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Valid certificate</p><h1 style={{ fontSize: 32 }}>{certificate.recipient_name}</h1><p>received a <b>{certificate.type.replace('_', ' ')}</b> certificate for</p><h2 style={{ color: '#2b0a5a' }}>{certificate.event_title}</h2><p>Issued {new Date(certificate.issued_at).toLocaleDateString()}</p><p style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #eee6f1', fontFamily: 'monospace', fontSize: 12, overflowWrap: 'anywhere', color: '#6f6575' }}>{certificate.verification_id}</p></>}</section></main>;
}
