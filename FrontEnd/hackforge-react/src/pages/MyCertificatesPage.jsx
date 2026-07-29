import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/DashboardLayout.jsx';
import * as certificateApi from '../services/certificateApi.js';

export default function MyCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    certificateApi.getMyCertificates()
      .then(setCertificates)
      .catch((err) => setError(err.detail || 'Could not load your certificates.'));
  }, []);

  const download = async (item) => {
    setDownloading(item.id);
    setError('');
    try {
      const blob = await certificateApi.downloadCertificate(item.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${item.event_title}-${item.type}-certificate.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.detail || 'Download failed.');
    } finally {
      setDownloading('');
    }
  };

  return (
    <>
      <PageHeader title="Certificates" subtitle="Certificates issued to your HackForge account." />

      {error && <div className="alert-error" style={{ marginBottom: 'var(--spacing-sm)' }} role="alert">{error}</div>}

      {!certificates.length && !error ? (
        <div className="dash-card empty-state">No certificates have been issued to you yet.</div>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {certificates.map((item) => (
            <article key={item.id} className="dash-card floating-card" style={{ borderTop: '5px solid var(--color-primary-container)' }}>
              <p className="label-mono" style={{ marginBottom: 8 }}>{item.type.replace('_', ' ')}</p>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6 }}>{item.event_title}</h2>
              <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>
                Issued to <b style={{ color: 'var(--color-on-surface)' }}>{item.recipient_name}</b>
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginBottom: 18 }}>
                {new Date(item.created_at).toLocaleDateString()}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={downloading === item.id}
                  onClick={() => download(item)}
                >
                  {downloading === item.id ? 'Preparing…' : 'Download PDF'}
                </button>
                <Link className="btn btn-ghost" to={`/certificates/verify/${item.verification_id}`} style={{ textDecoration: 'none' }}>
                  Verify
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
