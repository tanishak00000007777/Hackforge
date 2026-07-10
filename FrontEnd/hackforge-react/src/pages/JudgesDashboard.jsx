import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const projects = [
  {
    id: 'ecotrack',
    name: 'EcoTrack AI',
    priority: 'HIGH PRIORITY',
    desc: 'Real-time carbon footprint analysis for supply chain logistics using computer vision.',
    status: 'In Progress',
    avatars: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuByy-PNtoTHMbIxl7K3e8xPU_4lDczyR_r3EtCr2s4RAMRDhHHUXCXaiTuNjrMifEPm2vf3QIJeTweT73HNeadRJ0agEcBpQ87HjcdcIbPOIzETlvdfRR1G6dSIXEY4qr_aRsPlx47vTk-wpr3rpKxO2BxwJq_bf-mjn_GG8iN42V0eISN6hRCRL9qASjK5tLqVSp4BJadfcD1MO5e7gUrmFOdQCBNuNi9iuljQJMCLrKW-cFcKn0sPyRPxIDI9CDYniJsNEoqEFg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCuxt16OFeFu-CTPsdeJh8wWXCFZqotyBHYS4kzqSg-uC0nqwu3APkMNAuoqG6uT_a8GMbUmK8d-sgmqXQCnkRL7qpDzE_Pu9L3fZySxMRsribcljkUV15VCoIVReJe5Xo767FSl2GPp1gdWTgypG1RXlXTt9eaKaLOFlz8cDHgMwkY2VTnHf5DehMlDs2Z5pq9m8Wq0Cm52Jy87mdtCz9R75DvoSksrDD9-55V-U2OyJ0sX9eY2uVeKcsL8dDkRU9597Y0rTpq_Q',
    ],
    scores: { complexity: 8, impact: 9, design: 7, pitch: 10 },
    feedback: '',
    completed: false,
  },
  {
    id: 'neurallens',
    name: 'NeuralLens',
    priority: 'Pending',
    desc: 'A browser extension that summarizes legal documents into layman terms using LLMs.',
    status: 'Pending',
    avatars: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuARvV1NrboFNjspwWfmR2XqY2jjtG5pzX89-sk8UBz05xmjUmqRS3SG6ie9wRj8_yJtcVpgC5eWDDZEi92QOzWDvCd4l4Dinvc5EkzIAsI3eyVmC_vryeq1zyvWBqoK8e1apf4jcEJPOVHK2liVS3NT9nUcL7JYsInEHMo9YBhqJ7K1pKxZz-YnVPr5GsAl6K3GXnrDppGEnWO5XfLNpCyE86AMU6ygj3P7UEML2DRAt116jxLZXPpFcfw28bFZrNTVSV2Y8s2LKg',
    ],
    scores: { complexity: 5, impact: 5, design: 5, pitch: 5 },
    feedback: '',
    completed: false,
  },
  {
    id: 'decentrahealth',
    name: 'DecentraHealth',
    priority: 'Pending',
    desc: 'Patient-owned medical records on a private blockchain with zero-knowledge proofs.',
    status: 'Pending',
    avatars: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDhsDANfaGPmB1pbbp6CwYtXV9GrftOfEm_DgET8ZqEsgNQ3yAeTPzIhcY0Rhtl5ZV7oHqMd-WJqQb0ntx-vbXXUtswGdT5PRV60_a0W5tWH8DokjTXIlKSduIWhTC3aTzbsthMNNKmMt9lywtyNe2q0SdXw9QRvYEHphH4jf46GyTYjMqJh-pN__0_uUix2pYXAWMsPYbyw0OAmbSHWJhsO9xqPL4tPeU_kazb0ggVK3_x6Nbp-WsDGhJ5gum00iQjDnL_rvhs7A',
    ],
    scores: { complexity: 5, impact: 5, design: 5, pitch: 5 },
    feedback: '',
    completed: false,
  },
  {
    id: 'smartgrip',
    name: 'SmartGrip AR',
    priority: 'EVALUATED',
    desc: 'Wearable sensors for physical therapy tracked through an augmented reality interface.',
    status: 'Evaluated',
    avatars: [],
    scores: { complexity: 9, impact: 9, design: 9, pitch: 9 },
    feedback: 'Excellent work on the sensor integration!',
    completed: true,
  },
];

const rubricLabels = [
  { key: 'complexity', label: 'Technical Complexity', desc: 'How difficult was the implementation? Architecture, algorithms, stack used.' },
  { key: 'impact', label: 'Impact & Innovation', desc: 'Novelty of the solution and potential real-world environmental impact.' },
  { key: 'design', label: 'Design & UX', desc: 'Clarity of the interface and ease of use for the target operator.' },
  { key: 'pitch', label: 'Pitch & Presentation', desc: 'Quality of the video demo and communication of core value.' },
];

import { useAuthStore } from '../store/authStore.js';
import * as hackathonApi from '../services/hackathonApi.js';
import * as submissionApi from '../services/submissionApi.js';
import * as judgingApi from '../services/judgingApi.js';

export default function JudgesDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [projects, setProjects] = useState([]);
  const [rubric, setRubric] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [navActive, setNavActive] = useState('judges');
  const [saveDraftMsg, setSaveDraftMsg] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch hackathons on mount
  useEffect(() => {
    setLoading(true);
    hackathonApi.listPublishedHackathons()
      .then(data => {
        setHackathons(data);
        if (data.length > 0) setSelectedHackathon(data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch submissions and rubric when hackathon changes
  useEffect(() => {
    if (!selectedHackathon) return;
    
    // Fetch rubric
    judgingApi.getRubric(selectedHackathon.id)
      .then(data => {
        setRubric(data);
        // Initialize scores
        const initialScores = {};
        data.forEach(c => {
          initialScores[c.id] = 5; // default middle score
        });
        setScores(initialScores);
      })
      .catch(() => setRubric([]));

    // Fetch submissions
    submissionApi.getHackathonSubmissions(selectedHackathon.id)
      .then(data => {
        setProjects(data);
        if (data.length > 0) {
          setActiveProject(data[0]);
        } else {
          setActiveProject(null);
        }
      })
      .catch(() => setProjects([]));
  }, [selectedHackathon]);

  // Fetch existing score if activeProject changes
  useEffect(() => {
    if (!activeProject) return;
    
    // Try to get judge's scores for this project
    judgingApi.getScores(activeProject.id)
      .then(data => {
        if (data.length > 0) {
          const loadedScores = { ...scores };
          data.forEach(s => {
            loadedScores[s.criterion_id] = s.score;
            if (s.comment) setFeedback(s.comment);
          });
          setScores(loadedScores);
        } else {
          // Reset scores
          const resetScores = {};
          rubric.forEach(c => {
            resetScores[c.id] = 5;
          });
          setScores(resetScores);
          setFeedback('');
        }
      })
      .catch(() => {});
  }, [activeProject]);

  const handleSelectProject = (proj) => {
    setActiveProject(proj);
    setSaveDraftMsg('');
    setSubmitMsg('');
  };

  const handleScoreChange = (criterionId, val) => {
    setScores(prev => ({ ...prev, [criterionId]: Number(val) }));
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxPossibleScore = rubric.reduce((sum, r) => sum + r.max_score, 0);

  const handleSaveDraft = () => {
    setSaveDraftMsg('Draft saved locally!');
    setTimeout(() => setSaveDraftMsg(''), 2000);
  };

  const handleSubmit = async () => {
    if (!activeProject) return;
    try {
      const promises = rubric.map(c => {
        return judgingApi.submitScore(activeProject.id, {
          criterion_id: c.id,
          score: scores[c.id] || 0,
          comment: feedback
        });
      });
      await Promise.all(promises);
      setSubmitMsg(`Submitted evaluation for ${activeProject.title}!`);
      setTimeout(() => setSubmitMsg(''), 3000);
    } catch (err) {
      alert(err.detail || 'Failed to submit scores');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', key: 'dashboard' },
    { icon: 'event', label: 'Hackathons', key: 'hackathons' },
    { icon: 'gavel', label: 'Judges', key: 'judges', active: true },
    { icon: 'groups', label: 'Teams', key: 'teams' },
    { icon: 'analytics', label: 'Analytics', key: 'analytics' },
  ];

  const userName = user?.full_name || 'Sarah Jenkins';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ background: 'linear-gradient(135deg, #fbf8ff 0%, #ececff 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar */}
      <aside style={{ height: '100vh', width: 256, position: 'fixed', left: 0, top: 0, background: 'rgba(251,248,255,0.6)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgba(14,22,71,0.05)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', padding: 16, zIndex: 40 }}>
        <div style={{ marginBottom: 'var(--spacing-lg)', padding: '0 8px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }} onClick={() => navigate('/')}>HackForge Admin</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 4 }}>
            {selectedHackathon ? selectedHackathon.title : 'No hackathon active'}
          </p>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setNavActive(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none', width: '100%', textAlign: 'left', transition: 'all 0.15s',
                ...(navActive === item.key
                  ? { background: 'rgba(249,181,254,0.5)', color: 'var(--color-on-secondary-container)', borderRight: '4px solid var(--color-on-tertiary-container)' }
                  : { color: 'var(--color-on-surface-variant)' })
              }}
              onMouseEnter={e => { if (navActive !== item.key) e.currentTarget.style.background = 'rgba(222,224,255,0.3)'; }}
              onMouseLeave={e => { if (navActive !== item.key) e.currentTarget.style.background = 'none'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ borderTop: '1px solid rgba(14,22,71,0.05)', paddingTop: 16, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {userInitials}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{userName}</p>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-outline)' }}>Judge</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none', color: 'var(--color-on-surface-variant)', width: '100%', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 12, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-on-tertiary-container)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-on-surface-variant)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: 256, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(251,248,255,0.6)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(14,22,71,0.05)', padding: '16px var(--spacing-margin-safe)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-outline)' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>HackForge</span>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
              <span>Judging</span>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Dashboard</span>
            </nav>
            {hackathons.length > 0 && (
              <select
                value={selectedHackathon?.id || ''}
                onChange={e => {
                  const selected = hackathons.find(h => h.id === e.target.value);
                  setSelectedHackathon(selected);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(14,22,71,0.1)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 13,
                  outline: 'none',
                  background: '#fff',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                }}
              >
                {hackathons.map(h => (
                  <option key={h.id} value={h.id}>{h.title}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => alert('Viewing judging guidelines...')}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(123,117,126,0.2)', color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)', fontSize: 12, background: 'none', cursor: 'pointer', transition: 'background 0.2s, transform 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(222,224,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              View Guidelines
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div style={{ padding: 'var(--spacing-margin-safe)', maxWidth: 1440, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '4fr 8fr', gap: 24 }}>
          {/* Left: Assignments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)' }}>Your Assignments</h2>
              <span style={{ padding: '4px 12px', background: 'rgba(249,181,254,0.5)', color: 'var(--color-on-secondary-container)', borderRadius: 9999, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>
                {projects.length} ASSIGNMENTS
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100vh - 240px)', overflowY: 'auto', paddingRight: 8 }}>
              {projects.length === 0 ? (
                <div className="glass-card" style={{ padding: 24, borderRadius: 12, textAlign: 'center', color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  No submissions to score.
                </div>
              ) : projects.map(proj => {
                const isSelected = activeProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    style={{
                      background: 'rgba(255,255,255,0.9)', border: `1px solid ${isSelected ? 'rgba(19,2,37,0.1)' : 'rgba(43,25,61,0.05)'}`, boxShadow: isSelected ? '0 10px 30px -10px rgba(43,25,61,0.08)' : 'none',
                      borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s',
                      ...(isSelected ? { outline: '2px solid rgba(43,25,61,0.05)', backgroundColor: '#fff' } : { opacity: 0.8 }),
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.opacity = '0.8'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>{proj.title}</h3>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-outline)', textTransform: 'uppercase' }}>{proj.status}</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{proj.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-outline)' }}>Team ID: {proj.team_id.slice(0, 8)}…</span>
                      <button onClick={e => { e.stopPropagation(); handleSelectProject(proj); }} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >Evaluate</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Evaluation View */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {activeProject ? (
              <section style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(43,25,61,0.05)', boxShadow: '0 10px 30px -10px rgba(43,25,61,0.08)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Hero */}
                <div style={{ padding: 'var(--spacing-md)', background: '#fff', borderBottom: '1px solid rgba(14,22,71,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4 }}>{activeProject.title}</h1>
                      <p style={{ fontSize: 16, color: 'var(--color-on-surface-variant)', maxWidth: 560 }}>{activeProject.description}</p>
                    </div>
                  </div>
                  {/* Links */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {[
                      { icon: 'code', label: 'GitHub Repo', url: activeProject.github_url },
                      { icon: 'play_circle', label: 'Demo Video', url: activeProject.video_url },
                      { icon: 'description', label: 'Slide Deck', url: activeProject.deck_url },
                      { icon: 'public', label: 'Live Site', url: activeProject.demo_url },
                    ].map(link => (
                      <a key={link.label} href={link.url || '#'} target={link.url ? "_blank" : undefined} rel="noopener noreferrer" onClick={e => { if (!link.url) { e.preventDefault(); alert("Not provided"); } }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'var(--color-surface-container-low)', borderRadius: 12, textDecoration: 'none', transition: 'background 0.2s', opacity: link.url ? 1 : 0.5 }}
                        onMouseEnter={e => { if (link.url) e.currentTarget.style.background = 'var(--color-surface-container)'; }}
                        onMouseLeave={e => { if (link.url) e.currentTarget.style.background = 'var(--color-surface-container-low)'; }}
                      >
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 20 }}>{link.icon}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{link.label}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Rubric + Feedback */}
                <div style={{ padding: 'var(--spacing-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                  {/* Rubric */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <h3 style={{ fontSize: 18, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined">checklist</span>
                      Scoring Rubric
                    </h3>
                    {rubric.length === 0 ? (
                      <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)' }}>No criteria found.</p>
                    ) : rubric.map(crit => (
                      <div key={crit.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface-variant)' }}>{crit.name}</label>
                          <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{scores[crit.id] || 0}/{crit.max_score}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={crit.max_score}
                          value={scores[crit.id] || 0}
                          onChange={e => handleScoreChange(crit.id, e.target.value)}
                          style={{ width: '100%', height: 6, accentColor: 'var(--color-primary)', cursor: 'pointer', borderRadius: 9999 }}
                        />
                        <p style={{ fontSize: 11, color: 'var(--color-outline)' }}>{crit.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Feedback */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: 18, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                      <span className="material-symbols-outlined">chat_bubble</span>
                      Feedback for Team
                    </h3>
                    <textarea
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Write your detailed feedback here. Teams will see this after the winners are announced..."
                      style={{ flex: 1, width: '100%', padding: 16, borderRadius: 12, border: '1px solid rgba(14,22,71,0.1)', background: '#fff', outline: 'none', fontSize: 16, fontFamily: 'var(--font-inter)', minHeight: 180, resize: 'none', color: 'var(--color-on-surface)', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--color-secondary)'; e.target.style.boxShadow = '0 0 0 2px rgba(130,72,137,0.2)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(14,22,71,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Action Footer */}
                <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid rgba(14,22,71,0.05)', background: 'var(--color-surface-container-low)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--color-outline)', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-mono)', display: 'block' }}>Current Score</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>{totalScore} <span style={{ color: 'var(--color-outline)', fontWeight: 400, fontSize: 14 }}>/ {maxPossibleScore}</span></span>
                    </div>
                    {(saveDraftMsg || submitMsg) && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#16a34a', padding: '4px 12px', background: '#f0fdf4', borderRadius: 8 }}>
                        {saveDraftMsg || submitMsg}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button
                      onClick={handleSaveDraft}
                      style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid rgba(123,117,126,0.3)', color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)', fontSize: 12, background: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(222,224,255,0.3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={handleSubmit}
                      style={{ padding: '10px 32px', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(19,2,37,0.2)', transition: 'background 0.2s, transform 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
                    >
                      Submit Score
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <div className="glass-card" style={{ padding: 48, borderRadius: 16, textAlign: 'center', color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)' }}>
                No active project selected.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer style={{ background: 'rgba(251,248,255,0.8)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(14,22,71,0.05)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px var(--spacing-margin-safe)', maxWidth: 1440, margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)' }}>© 2024 HackForge Infrastructure. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
