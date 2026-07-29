import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as hackathonApi from '../services/hackathonApi.js';

const button = { border: 0, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 700 };

export default function OrganizerAnalyticsPage() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [hackathonId, setHackathonId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hackathonApi.listOwnedHackathons().then((items) => {
      setHackathons(items);
      if (items[0]) setHackathonId(items[0].id);
    }).catch((err) => setError(err.detail || 'Could not load hackathons'));
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: '#fbf8ff', padding: '40px max(24px, 6vw)', color: '#2b193d' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', marginBottom: 32 }}>
        <div>
          <button onClick={() => navigate('/organizer')} style={{ ...button, background: 'transparent', paddingLeft: 0, color: '#2b193d' }}>
            ← Organizer dashboard
          </button>
          <h1 style={{ fontSize: 40, margin: '8px 0', color: 'var(--color-primary, #2b193d)' }}>Analytics</h1>
          <p style={{ color: '#6f6575' }}>View engagement metrics, demographics, and submission statistics.</p>
        </div>
      </header>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 24 }}>
          {error}
        </div>
      )}

      <label style={{ display: 'block', marginBottom: 24, maxWidth: 420 }}>
        <span style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Hackathon</span>
        <select value={hackathonId} onChange={(e) => setHackathonId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d9d1de', background: '#fff' }}>
          {hackathons.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
      </label>

      {/* Analytics Charts Area */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* Registration Funnel */}
        <div className="floating-card" style={{ padding: '24px', borderRadius: 16, background: '#fff', border: '1px solid #e8e2ec', boxShadow: '0 8px 24px rgba(43,25,61,.06)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#2b193d' }}>Registration Funnel</h3>
            <span style={{ fontFamily: 'monospace', fontSize: 12, padding: '4px 12px', background: '#f8f7f9', borderRadius: 4, color: '#6f6575' }}>Last 30 Days</span>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, alignItems: 'flex-end', paddingTop: 16, minHeight: 250 }}>
            {[
              { label: 'Landing Page Visits', value: '14.2k', height: '90%', bg: '#f4f2ff', color: '#2b193d' },
              { label: 'Signups Started', value: '9.8k', height: '70%', bg: '#2b193d', color: '#fff' },
              { label: 'Teams Formed', value: '6.1k', height: '55%', bg: '#602e9a', color: '#fff' },
              { label: 'Completed Registration', value: '3.4k', height: '40%', bg: '#c5979d', color: '#fff' },
            ].map(bar => (
              <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <div style={{ width: '100%', background: '#f8f7f9', borderRadius: '8px 8px 0 0', position: 'relative', overflow: 'hidden', height: '100%', minHeight: 180 }}>
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', height: bar.height, background: bar.bg, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'height 0.5s ease' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: bar.color }}>{bar.value}</span>
                  </div>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 10, textAlign: 'center', color: '#6f6575' }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submissions by Track */}
        <div className="floating-card" style={{ padding: '24px', borderRadius: 16, background: '#fff', border: '1px solid #e8e2ec', boxShadow: '0 8px 24px rgba(43,25,61,.06)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#2b193d' }}>Submissions by Track</h3>
            <span style={{ fontFamily: 'monospace', fontSize: 12, padding: '4px 12px', background: '#f8f7f9', borderRadius: 4, color: '#6f6575' }}>Final Count</span>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, alignItems: 'flex-end', paddingTop: 16, minHeight: 250 }}>
            {[
              { label: 'AI & ML', value: '320', height: '80%', bg: '#2b193d', color: '#fff' },
              { label: 'Web3', value: '185', height: '55%', bg: '#602e9a', color: '#fff' },
              { label: 'HealthTech', value: '210', height: '65%', bg: '#865fc2', color: '#fff' },
              { label: 'FinTech', value: '140', height: '40%', bg: '#ab8ee1', color: '#fff' },
              { label: 'EdTech', value: '95', height: '25%', bg: '#d0c3f7', color: '#2b193d' },
            ].map(bar => (
              <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <div style={{ width: '100%', background: '#f8f7f9', borderRadius: '8px 8px 0 0', position: 'relative', overflow: 'hidden', height: '100%', minHeight: 180 }}>
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', height: bar.height, background: bar.bg, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'height 0.5s ease' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: bar.color }}>{bar.value}</span>
                  </div>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 10, textAlign: 'center', color: '#6f6575' }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Participant Demographics */}
        <div className="floating-card" style={{ gridColumn: 'span 2', padding: '24px', borderRadius: 16, background: '#fff', border: '1px solid #e8e2ec', boxShadow: '0 8px 24px rgba(43,25,61,.06)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#2b193d' }}>Participant Experience Levels</h3>
            <span style={{ fontFamily: 'monospace', fontSize: 12, padding: '4px 12px', background: '#f8f7f9', borderRadius: 4, color: '#6f6575' }}>Self-Reported</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
             {[
              { label: 'Beginner (0-1 yrs)', value: '35%', width: '35%', bg: '#c5979d' },
              { label: 'Intermediate (1-3 yrs)', value: '45%', width: '45%', bg: '#602e9a' },
              { label: 'Advanced (3+ yrs)', value: '20%', width: '20%', bg: '#2b193d' },
             ].map(row => (
               <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                 <div style={{ width: 140, fontSize: 12, color: '#6f6575', fontWeight: 600 }}>{row.label}</div>
                 <div style={{ flex: 1, background: '#f8f7f9', borderRadius: 8, height: 24, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: row.width, background: row.bg, borderRadius: 8, transition: 'width 0.5s ease' }}></div>
                 </div>
                 <div style={{ width: 40, fontSize: 12, fontWeight: 700, color: '#2b193d', textAlign: 'right' }}>{row.value}</div>
               </div>
             ))}
          </div>
        </div>

      </section>
    </main>
  );
}
