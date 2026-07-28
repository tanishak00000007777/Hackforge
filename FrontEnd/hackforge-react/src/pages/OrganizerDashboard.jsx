import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import * as hackathonApi from '../services/hackathonApi.js';
import * as registrationApi from '../services/registrationApi.js';

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', key: 'dashboard' },
  { icon: 'event', label: 'Hackathons', key: 'hackathons' },
  { icon: 'web', label: 'Website Builder', key: 'builder' },
  { icon: 'description', label: 'Forms', key: 'forms', path: '/organizer/forms' },
  { icon: 'workspace_premium', label: 'Certificates', key: 'certificates', path: '/organizer/certificates' },
  { icon: 'group_add', label: 'Registrations', key: 'registrations' },
  { icon: 'groups', label: 'Teams', key: 'teams', path: '/organizer/teams' },
  { icon: 'send', label: 'Submissions', key: 'submissions', path: '/organizer/submissions' },
  { icon: 'gavel', label: 'Judges', key: 'judges', path: '/judge' },
  { icon: 'analytics', label: 'Analytics', key: 'analytics', path: '/organizer/analytics' },
];

const STATUS_STYLES = {
  pending: { bg: 'rgba(222,224,255,0.4)', color: 'var(--color-on-secondary-container)', label: 'PENDING' },
  approved: { bg: '#f0fdf4', color: '#15803d', label: 'APPROVED' },
  rejected: { bg: '#fef2f2', color: '#dc2626', label: 'REJECTED' },
  waitlisted: { bg: '#fffbeb', color: '#d97706', label: 'WAITLISTED' },
};

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [hackathons, setHackathons] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Load organizer-owned hackathons on mount.
  useEffect(() => {
    hackathonApi.listOwnedHackathons()
      .then(data => {
        setHackathons(data);
        if (data.length > 0) setSelectedHackathon(data[0]);
      })
      .catch(() => {});
  }, []);

  // Scroll to hash section on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveNav(id);
        }, 100);
      }
    }
  }, []);

  // Load registrations when hackathon is selected
  useEffect(() => {
    if (!selectedHackathon) return;
    setLoadingRegs(true);
    registrationApi.getRegistrations(selectedHackathon.id)
      .then(setRegistrations)
      .catch(() => setRegistrations([]))
      .finally(() => setLoadingRegs(false));
  }, [selectedHackathon]);

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.key === 'builder') {
      navigate(selectedHackathon ? `/organizer/hackathons/${selectedHackathon.id}/studio` : '/organizer/setup');
    } else if (item.path) {
      navigate(item.path);
    } else {
      const element = document.getElementById(item.key);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNewEvent = () => {
    navigate('/organizer/setup');
  };

  const handleReview = async (reg) => {
    const action = window.prompt(`Action for ${reg.user_id}?\nType: approved, rejected, or waitlisted`);
    if (action && ['approved', 'rejected', 'waitlisted'].includes(action)) {
      try {
        await registrationApi.updateRegistrationStatus(reg.id, action);
        // Refresh registrations
        if (selectedHackathon) {
          const updated = await registrationApi.getRegistrations(selectedHackathon.id);
          setRegistrations(updated);
        }
      } catch (err) {
        alert(err.detail || 'Failed to update status');
      }
    }
  };

  const handleFilter = () => {
    alert('Opening filter options...');
  };

  const handleDownload = () => {
    alert('Downloading registrations CSV...');
  };

  const handleCommandK = () => {
    alert('Command Palette opened (Cmd+K)');
  };

  const handleNotifications = () => {
    alert('3 new notifications!');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userName = user?.full_name || 'Organizer';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fbf8ff' }}>
      {/* Sidebar */}
      <aside style={{ height: '100vh', width: 256, position: 'fixed', left: 0, top: 0, background: 'rgba(251,248,255,0.6)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgba(14,22,71,0.05)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', padding: 16, zIndex: 40 }}>
        <div style={{ marginBottom: 'var(--spacing-lg)', padding: '0 8px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-primary)', cursor: 'pointer' }} onClick={() => navigate('/')}>HackForge</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', opacity: 0.7, marginTop: 4 }}>Global Hackathon 2024</p>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => handleNavClick(item)}
              className={`sidebar-nav-item${activeNav === item.key ? ' nav-active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: activeNav === item.key ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(14,22,71,0.05)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={handleNewEvent}
            style={{ width: '100%', marginBottom: 16, padding: '12px', background: 'var(--color-primary-container)', color: '#fff', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,25,61,0.2)', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-on-primary-fixed-variant)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary-container)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            New Event
          </button>
          {[{ icon: 'settings', label: 'Settings' }, { icon: 'help', label: 'Support' }].map(item => (
            <button key={item.label} onClick={() => alert(`Opening ${item.label}...`)} className="sidebar-nav-item">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{item.label}</span>
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 8px', marginTop: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary-container)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {userInitials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</p>
              <p style={{ fontSize: 10, color: 'var(--color-on-surface-variant)', cursor: 'pointer' }} onClick={handleLogout}>Logout</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: 256, flex: 1, minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#fbf8ff' }}>
        <div style={{ position: 'relative', zIndex: 10, padding: 'var(--spacing-margin-safe)', maxWidth: 1440, margin: '0 auto' }}>
          {/* Header */}
          <header id="dashboard" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', opacity: 0.6 }}>ADMIN</span>
              <span style={{ color: 'var(--color-outline-variant)' }}>/</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-primary)', fontWeight: 700 }}>ORGANIZER DASHBOARD</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface-variant)', cursor: 'pointer', padding: 8, borderRadius: '50%', transition: 'background 0.2s' }}
                  onClick={handleNotifications}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >notifications</span>
                <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: 'var(--color-error)', borderRadius: '50%', border: '2px solid #fff' }} />
              </div>
              <button
                onClick={handleCommandK}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(14,22,71,0.05)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span>
                Command + K
              </button>
            </div>
          </header>

          {/* Welcome line */}
          <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-primary)', marginBottom: 4 }}>Welcome back, {userName.split(' ')[0]}.</h1>
              <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>
                {selectedHackathon ? `${selectedHackathon.title} — ${registrations.length} registration${registrations.length === 1 ? '' : 's'}` : 'Create your first hackathon to get started.'}
              </p>
            </div>
            {selectedHackathon && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {hackathons.length > 1 && (
                  <select
                    value={selectedHackathon.id}
                    onChange={(event) => setSelectedHackathon(hackathons.find((item) => item.id === event.target.value))}
                    aria-label="Select hackathon"
                    style={{ height: 40, border: '1px solid rgba(14,22,71,0.12)', borderRadius: 8, background: '#fff', padding: '0 12px', color: 'var(--color-primary)' }}
                  >
                    {hackathons.map((hackathon) => <option key={hackathon.id} value={hackathon.id}>{hackathon.title}</option>)}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/organizer/hackathons/${selectedHackathon.id}/studio`)}
                  style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, border: 0, borderRadius: 8, background: 'var(--color-primary-container)', color: '#fff', padding: '0 16px', cursor: 'pointer', fontWeight: 700 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>web</span>
                  Open Website Studio
                </button>
              </div>
            )}
          </div>

          {/* Registrations Table */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div id="registrations" className="floating-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid rgba(14,22,71,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)' }}>Recent Registrations</h3>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>Track new talent as they join HackForge</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleFilter} style={{ padding: 8, border: '1px solid rgba(14,22,71,0.05)', borderRadius: 8, background: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_list</span>
                  </button>
                  <button onClick={handleDownload} style={{ padding: 8, border: '1px solid rgba(14,22,71,0.05)', borderRadius: 8, background: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead style={{ background: 'var(--color-surface-container-low)' }}>
                    <tr>
                      {['Participant', 'Event', 'Status', 'Experience', 'Actions'].map((h, i) => (
                        <th key={h} style={{ padding: '16px var(--spacing-md)', textAlign: i === 4 ? 'right' : 'left', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRegs ? (
                      <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 24 }}>progress_activity</span>
                      </td></tr>
                    ) : registrations.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        No registrations yet
                      </td></tr>
                    ) : registrations.map((reg, idx) => {
                      const st = STATUS_STYLES[reg.status] || STATUS_STYLES.pending;
                      const initials = (reg.user_id || '').slice(0, 2).toUpperCase();
                      return (
                        <tr key={reg.id || idx} style={{ borderTop: '1px solid rgba(14,22,71,0.05)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,242,255,0.5)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '16px var(--spacing-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'var(--color-on-secondary-container)' }}>{initials}</div>
                              <div>
                                <p style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{reg.user_id?.slice(0, 8)}…</p>
                                <p style={{ fontSize: 10, color: 'var(--color-on-surface-variant)' }}>{new Date(reg.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px var(--spacing-md)', color: 'var(--color-on-surface-variant)' }}>{selectedHackathon?.title || '—'}</td>
                          <td style={{ padding: '16px var(--spacing-md)' }}>
                            <span style={{ padding: '2px 8px', background: st.bg, color: st.color, borderRadius: 9999, fontSize: 10, fontWeight: 700, border: `1px solid ${st.color}22` }}>{st.label}</span>
                          </td>
                          <td style={{ padding: '16px var(--spacing-md)', color: 'var(--color-on-surface-variant)' }}>{reg.form_data?.experience || '—'}</td>
                          <td style={{ padding: '16px var(--spacing-md)', textAlign: 'right' }}>
                            <button onClick={() => handleReview(reg)} style={{ color: 'var(--color-on-tertiary-container)', fontFamily: 'var(--font-mono)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', transition: 'text-decoration 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            >Review</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FAB */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          style={{ background: 'var(--color-primary-container)', color: '#fff', border: 'none', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(43,25,61,0.3)', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1.1)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>auto_awesome</span>
        </button>
      </div>
    </div>
  );
}
