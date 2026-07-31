import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import * as hackathonApi from '../services/hackathonApi.js';
import * as teamApi from '../services/teamApi.js';
import * as registrationApi from '../services/registrationApi.js';
import * as announcementApi from '../services/announcementApi.js';
import * as submissionApi from '../services/submissionApi.js';

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', key: 'dashboard' },
  { icon: 'event', label: 'Hackathons', key: 'hackathons' },
  { icon: 'groups', label: 'Teams', key: 'teams' },
  { icon: 'send', label: 'Submissions', key: 'submissions' },
  { icon: 'workspace_premium', label: 'Certificates', key: 'certificates', path: '/participant/certificates' },
  { icon: 'analytics', label: 'Analytics', key: 'analytics' },
];

const REGISTRATION_STATUS_STYLES = {
  pending: { bg: 'rgba(222,224,255,0.4)', color: 'var(--color-on-secondary-container)', label: 'PENDING' },
  approved: { bg: '#f0fdf4', color: '#15803d', label: 'APPROVED' },
  rejected: { bg: '#fef2f2', color: '#dc2626', label: 'REJECTED' },
  waitlisted: { bg: '#fffbeb', color: '#d97706', label: 'WAITLISTED' },
};

export default function ParticipantDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  const isRegistered = myRegistrations.some((r) => r.hackathon_id === selectedHackathon?.id);

  const refreshMyRegistrations = () => registrationApi.getMyRegistrations().then(setMyRegistrations).catch(() => {});

  // Parse query params to auto-select hackathon if passed
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hackathonId = params.get('hackathon');

    setLoading(true);
    hackathonApi.listPublishedHackathons()
      .then(data => {
        setHackathons(data);
        if (data.length > 0) {
          const selected = hackathonId ? data.find(h => h.id === hackathonId) : data[0];
          setSelectedHackathon(selected || data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    refreshMyRegistrations();
  }, []);

  // Fetch hackathon-specific user data
  useEffect(() => {
    if (!selectedHackathon) return;

    teamApi.getMyTeam(selectedHackathon.id)
      .then(setMyTeam)
      .catch(() => setMyTeam(null));

    announcementApi.getAnnouncements(selectedHackathon.id)
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]));
  }, [selectedHackathon]);

  // Fetch this team's submission for the selected hackathon, once a team exists
  useEffect(() => {
    if (!selectedHackathon || !myTeam) {
      setMySubmission(null);
      return;
    }
    submissionApi.getHackathonSubmissions(selectedHackathon.id)
      .then((subs) => setMySubmission(subs.find((s) => s.team_id === myTeam.id) || null))
      .catch(() => setMySubmission(null));
  }, [selectedHackathon, myTeam]);

  // Mouse follow gradient
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.body.style.backgroundImage = `
        radial-gradient(at ${x}% ${y}%, rgba(195,205,254,0.2) 0px, transparent 50%),
        radial-gradient(at 0% 0%, rgba(195,205,254,0.15) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(214,189,235,0.15) 0px, transparent 50%)
      `;
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.backgroundImage = '';
    };
  }, []);

  const handleChat = (name) => alert(`Opening chat with ${name}...`);
  const handleViewProject = () => {
    if (myTeam) {
      alert(`Project dashboard for team: ${myTeam.name}`);
    } else {
      alert('You need to join or create a team first!');
    }
  };
  const handleRegisterNow = async (hackathonId) => {
    try {
      await registrationApi.registerForHackathon(hackathonId, { form_data: { experience: 'Intermediate' } });
      alert('Successfully registered!');
      refreshMyRegistrations();
    } catch (err) {
      alert(err.detail || 'Failed to register');
    }
  };

  const handleStartSubmission = async () => {
    const title = window.prompt('Project title:');
    if (!title) return;
    const description = window.prompt('Short description:');
    if (!description) return;
    try {
      const submission = await submissionApi.createSubmission(selectedHackathon.id, { title, description });
      setMySubmission(submission);
    } catch (err) {
      alert(err.detail || 'Failed to start submission');
    }
  };

  const handleSubmitNow = async () => {
    if (!mySubmission) return;
    if (!window.confirm('Submit your project? You can still update details until judging starts.')) return;
    try {
      const updated = await submissionApi.submitSubmission(mySubmission.id);
      setMySubmission(updated);
    } catch (err) {
      alert(err.detail || 'Failed to submit');
    }
  };


  const handleCreateTeam = async () => {
    const teamName = window.prompt("Enter team name:");
    if (!teamName) return;
    try {
      const team = await teamApi.createTeam(selectedHackathon.id, { name: teamName });
      setMyTeam(team);
      alert(`Team "${teamName}" created successfully! Invite code: ${team.invite_code}`);
    } catch (err) {
      alert(err.detail || 'Failed to create team');
    }
  };

  const handleJoinTeam = async () => {
    const inviteCode = window.prompt("Enter team invite code:");
    if (!inviteCode) return;
    try {
      const team = await teamApi.joinTeam(selectedHackathon.id, inviteCode);
      setMyTeam(team);
      alert(`Joined team "${team.name}" successfully!`);
    } catch (err) {
      alert(err.detail || 'Failed to join team');
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm("Are you sure you want to leave your team?")) return;
    try {
      await teamApi.leaveTeam(selectedHackathon.id);
      setMyTeam(null);
      alert('Left team successfully');
    } catch (err) {
      alert(err.detail || 'Failed to leave team');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleDocs = () => alert('Opening documentation...');
  const handleRepo = () => alert('Opening code repository...');

  const userName = user?.full_name || 'Participant';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleNavClick = (item) => {
    if (item.path) { navigate(item.path); return; }
    setActiveNav(item.key);
    const element = document.getElementById(item.key);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ background: 'var(--color-surface)', minHeight: '100vh', backgroundImage: 'radial-gradient(at 0% 0%, rgba(195,205,254,0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(214,189,235,0.15) 0px, transparent 50%)' }}>
      {/* Sidebar */}
      <aside style={{ height: '100vh', width: 256, position: 'fixed', left: 0, top: 0, background: 'rgba(251,248,255,0.6)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgba(14,22,71,0.05)', display: 'flex', flexDirection: 'column', padding: 16, zIndex: 50 }}>
        <div style={{ marginBottom: 'var(--spacing-xl)', padding: '0 8px' }}>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-primary)', cursor: 'pointer' }} onClick={() => navigate('/')}>HackForge</span>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => handleNavClick(item)}
              className={`sidebar-nav-item${activeNav === item.key ? ' nav-active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className="sidebar-nav-item">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Logout</span>
          </button>
          <div style={{ paddingTop: 16, marginTop: 16, borderTop: '1px solid rgba(14,22,71,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>{userInitials}</div>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface)' }}>{userName}</p>
                <p style={{ fontSize: 10, color: 'var(--color-on-surface-variant)' }}>Participant</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: 256, minHeight: '100vh', padding: 'var(--spacing-margin-safe)', maxWidth: 1440, margin: '0 auto 0 256px' }}>
        {/* Header Banner */}
        <header id="dashboard" style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, background: 'var(--color-primary-container)', color: '#fff', padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)', boxShadow: '0 20px 40px -10px rgba(43,25,61,0.3)' }}>
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
            <div>
              <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Welcome back, {userName.split(' ')[0]}.</h1>
              <p style={{ fontSize: 18, opacity: 0.9, color: 'var(--color-on-primary-container)' }}>
                {selectedHackathon ? `Active Hackathon: ${selectedHackathon.title}` : 'Select a hackathon to get started.'}
              </p>
            </div>
            {myTeam && (
              <button
                onClick={handleViewProject}
                style={{ background: 'var(--color-surface)', color: 'var(--color-primary)', padding: '16px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-on-primary-container)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                View Project
              </button>
            )}
          </div>
        </header>

        {/* Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
          {/* Active Events */}
          <section id="hackathons" style={{ gridColumn: 'span 8' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)' }}>Active Events</h2>
            </div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
              </div>
            ) : hackathons.length === 0 ? (
              <div className="glass-card" style={{ padding: 32, borderRadius: 12, textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
                No active hackathons found.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {hackathons.map(h => {
                  const isSelected = selectedHackathon?.id === h.id;
                  return (
                    <div
                      key={h.id}
                      onClick={() => setSelectedHackathon(h)}
                      className="glass-card"
                      style={{
                        borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer',
                        border: isSelected ? '2px solid var(--color-secondary)' : '1px solid rgba(14,22,71,0.05)',
                        transform: isSelected ? 'scale(1.02)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ height: 120, width: '100%', position: 'relative' }}>
                        {h.banner_url ? (
                          <img src={h.banner_url} alt={h.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-container)', color: '#fff' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>event</span>
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(100,128,248,0.9)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h.status}</div>
                      </div>
                      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>{h.title}</h3>
                        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 13, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{h.tagline || h.description || 'No description provided.'}</p>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-outline)' }}>Mode: {h.mode}</span>
                          {selectedHackathon?.id === h.id && isRegistered ? (
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#15803d', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span> Registered
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRegisterNow(h.id);
                              }}
                              style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              Register Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* My Team */}
          <section id="teams" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)' }}>My Team</h2>
            <div className="glass-card" style={{ borderRadius: 12, padding: 16, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {!isRegistered ? (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--color-on-surface-variant)' }}>
                    <p style={{ fontSize: 14, marginBottom: 12 }}>Please register for the selected hackathon to view or manage your team.</p>
                  </div>
                ) : !myTeam ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginBottom: 16 }}>You are not in a team for this hackathon yet.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <button onClick={handleCreateTeam} style={{ width: '100%', padding: '10px', background: 'var(--color-primary-container)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Create New Team</button>
                      <button onClick={handleJoinTeam} style={{ width: '100%', padding: '10px', background: 'none', border: '1px solid var(--color-outline)', color: 'var(--color-primary)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Join Existing Team</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)' }}>Invite Code: <strong>{myTeam.invite_code}</strong></span>
                      <button onClick={handleLeaveTeam} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Leave</button>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--color-primary)' }}>{myTeam.name}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {myTeam.members.map((member, idx) => {
                        const isLeader = member.user_id === myTeam.leader_id;
                        const initials = member.user_id.slice(0, 2).toUpperCase();
                        return (
                          <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, color: 'var(--color-on-secondary-container)' }}>{initials}</div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700 }}>{member.user_id.slice(0, 8)}…</p>
                              <p style={{ fontSize: 9, color: 'var(--color-outline)' }}>{isLeader ? 'Leader' : 'Member'}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid rgba(14,22,71,0.05)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16, color: 'var(--color-primary)', fontWeight: 700 }}>Quick Links</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={handleDocs} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--color-surface-container)', borderRadius: 4, fontSize: 12, color: 'var(--color-on-surface-variant)', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-high)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-container)'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>description</span> Docs
                  </button>
                  <button onClick={handleRepo} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--color-surface-container)', borderRadius: 4, fontSize: 12, color: 'var(--color-on-surface-variant)', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-high)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-container)'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>code</span> Repository
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Registrations */}
          <section id="analytics" style={{ gridColumn: 'span 4' }}>
            <div className="glass-card" style={{ borderRadius: 12, padding: 'var(--spacing-md)', height: '100%' }}>
              <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }}>Recent Registrations</h3>
              {myRegistrations.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>You haven't registered for a hackathon yet. Pick one from Active Events to get started.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {myRegistrations.slice(0, 5).map((reg) => {
                    const st = REGISTRATION_STATUS_STYLES[reg.status] || REGISTRATION_STATUS_STYLES.pending;
                    const title = hackathons.find((h) => h.id === reg.hackathon_id)?.title || 'Hackathon';
                    return (
                      <div key={reg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 0', borderBottom: '1px solid rgba(14,22,71,0.05)' }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{title}</p>
                          <p style={{ fontSize: 10, color: 'var(--color-on-surface-variant)' }}>{new Date(reg.created_at).toLocaleDateString()}</p>
                        </div>
                        <span style={{ padding: '2px 8px', background: st.bg, color: st.color, borderRadius: 9999, fontSize: 10, fontWeight: 700, border: `1px solid ${st.color}22`, flexShrink: 0 }}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Submission Status */}
          <section id="submissions" style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="glass-card" style={{ borderRadius: 12, padding: 'var(--spacing-md)' }}>
              <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }}>Submission Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-md) 0', textAlign: 'center' }}>
                {!myTeam ? (
                  <>
                    <div style={{ width: 96, height: 96, borderRadius: '50%', border: '4px solid rgba(100,128,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>group_off</span>
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>No team yet</p>
                    <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', maxWidth: 220 }}>Join or create a team for this hackathon before starting a submission.</p>
                  </>
                ) : !mySubmission ? (
                  <>
                    <div style={{ width: 96, height: 96, borderRadius: '50%', border: '4px solid rgba(100,128,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-on-tertiary-container)' }}>note_add</span>
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>No submission yet</p>
                    <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', maxWidth: 220 }}>Start one whenever your team is ready — you can keep editing until you submit.</p>
                    <button
                      onClick={handleStartSubmission}
                      style={{ marginTop: 24, background: 'var(--color-primary-container)', color: '#fff', padding: '8px 24px', borderRadius: 8, border: 'none', fontSize: 14, cursor: 'pointer', transition: 'opacity 0.2s, transform 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Start Submission
                    </button>
                  </>
                ) : mySubmission.status === 'submitted' ? (
                  <>
                    <div style={{ width: 96, height: 96, borderRadius: '50%', border: '4px solid rgba(21,128,61,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#15803d' }}>check_circle</span>
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>Submitted</p>
                    <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', maxWidth: 220 }}>{mySubmission.title}</p>
                  </>
                ) : (
                  <>
                    <div style={{ width: 96, height: 96, borderRadius: '50%', border: '4px solid rgba(100,128,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-on-tertiary-container)' }}>pending</span>
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>Draft in progress</p>
                    <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', maxWidth: 220 }}>{mySubmission.title}</p>
                    <button
                      onClick={handleSubmitNow}
                      style={{ marginTop: 24, background: 'var(--color-primary-container)', color: '#fff', padding: '8px 24px', borderRadius: 8, border: 'none', fontSize: 14, cursor: 'pointer', transition: 'opacity 0.2s, transform 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Submit Now
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ borderRadius: 12, padding: 'var(--spacing-md)' }}>
              <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }}>Announcements</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {announcements.length === 0 ? (
                  <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)' }}>No announcements yet.</p>
                ) : announcements.map(a => (
                  <div key={a.id} style={{ padding: 16, background: 'rgba(0,24,100,0.05)', borderLeft: '4px solid var(--color-on-tertiary-container)', borderRadius: '0 8px 8px 0' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>{a.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>{a.content}</p>
                    <p style={{ fontSize: 9, color: 'var(--color-outline)', marginTop: 4 }}>{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid rgba(14,22,71,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6, paddingBottom: 'var(--spacing-lg)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)' }}>© 2024 HackForge Infrastructure. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 24 }}>
              {['Privacy Policy', 'Terms of Service', 'Contact'].map(link => (
                <a key={link} href="#" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-on-tertiary-container)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-on-surface-variant)'}
                >{link}</a>
              ))}
            </div>
          </div>
        </footer>
      </main>

      {/* Chat FAB */}
      <button
        onClick={() => alert('Opening team chat...')}
        style={{ position: 'fixed', bottom: 32, right: 32, width: 56, height: 56, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '50%', boxShadow: '0 8px 24px rgba(19,2,37,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 50, transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1.1)'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>chat</span>
      </button>
    </div>
  );
}
