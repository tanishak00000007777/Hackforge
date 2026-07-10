import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import * as organizationApi from '../services/organizationApi.js';
import * as hackathonApi from '../services/hackathonApi.js';
import * as registrationApi from '../services/registrationApi.js';
import * as analyticsApi from '../services/analyticsApi.js';

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', key: 'dashboard' },
  { icon: 'event', label: 'Hackathons', key: 'hackathons' },
  { icon: 'web', label: 'Website Builder', key: 'builder', path: '/templates' },
  { icon: 'group_add', label: 'Registrations', key: 'registrations' },
  { icon: 'groups', label: 'Teams', key: 'teams' },
  { icon: 'send', label: 'Submissions', key: 'submissions' },
  { icon: 'gavel', label: 'Judges', key: 'judges', path: '/judges' },
  { icon: 'analytics', label: 'Analytics', key: 'analytics' },
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
  const [organizations, setOrganizations] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  // Load orgs and hackathons on mount
  useEffect(() => {
    organizationApi.getMyOrganizations()
      .then(setOrganizations)
      .catch(() => {});
    hackathonApi.listPublishedHackathons()
      .then(data => {
        setHackathons(data);
        if (data.length > 0) setSelectedHackathon(data[0]);
      })
      .catch(() => {});
  }, []);

  // Load registrations when hackathon is selected
  useEffect(() => {
    if (!selectedHackathon) return;
    setLoadingRegs(true);
    registrationApi.getRegistrations(selectedHackathon.id)
      .then(setRegistrations)
      .catch(() => setRegistrations([]))
      .finally(() => setLoadingRegs(false));
    analyticsApi.getHackathonAnalytics(selectedHackathon.id)
      .then(setAnalytics)
      .catch(() => setAnalytics(null));
  }, [selectedHackathon]);

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.path) navigate(item.path);
  };

  const handleNewEvent = () => {
    alert('Creating a new hackathon event...');
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
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none', transition: 'all 0.15s', width: '100%', textAlign: 'left',
                ...(activeNav === item.key
                  ? { background: 'rgba(249,181,254,0.5)', color: 'var(--color-on-secondary-container)', borderRight: '4px solid var(--color-on-tertiary-container)' }
                  : { color: 'var(--color-on-surface-variant)' }
                )
              }}
              onMouseEnter={e => { if (activeNav !== item.key) e.currentTarget.style.background = 'rgba(222,224,255,0.3)'; }}
              onMouseLeave={e => { if (activeNav !== item.key) e.currentTarget.style.background = 'none'; }}
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
            <button key={item.label} onClick={() => alert(`Opening ${item.label}...`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none', color: 'var(--color-on-surface-variant)', width: '100%', textAlign: 'left', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(222,224,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
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
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
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

          {/* Welcome Banner + Stats */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 'var(--spacing-lg)' }}>
            {/* Welcome Banner */}
            <div style={{ gridColumn: 'span 4', background: 'var(--color-primary-container)', padding: 'var(--spacing-lg)', borderRadius: 12, position: 'relative', overflow: 'hidden', minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: '0 20px 40px -10px rgba(43,25,61,0.3)' }}>
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfZMyfjmaKlM7KKvNlVeB7e2NspP0_kcKPIQaaxV0yYqp1m7O9QWhMJjeW4azxDPQW4_e0zst79TgQxDY8JjwY_tT5dmzniKGByhaJqFpaROKFEWe19lFrH3Ktw7MNJDNCHrdxVRIs3AwNmiQG-Ix-XZXBBieHTM1WyKtgIrltE9WojSM4L8uYLcVYvfxRhdQ3GeB59jZ_xJc7trouHwj14le3kHNGE8NosVaoiQOLScCVsXgww3htTWFXP7zILGAnWwJ4Jv85-g" alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, mixBlendMode: 'overlay' }} />
              </div>
              <div style={{ position: 'relative', zIndex: 10 }}>
                <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: 8 }}>Welcome back, {userName.split(' ')[0]}.</h2>
                <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', maxWidth: 576 }}>{selectedHackathon ? `${selectedHackathon.title} — ${registrations.length} registrations` : 'Create your first hackathon to get started.'}</p>
              </div>
              <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                <span style={{ padding: '4px 12px', borderRadius: 9999, background: '#C5979D', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                  Live System
                </span>
              </div>
            </div>

            {/* Stats */}
            {[
              { label: 'Active Hackathons', value: '12', sub: '+2 this month', icon: 'rocket_launch' },
              { label: 'Total Participants', value: '8,432', sub: '4.2% growth', icon: 'person' },
              { label: 'Submissions', value: '1,209', sub: '92% verified', icon: 'folder_zip' },
              { label: 'Verified Judges', value: '45', sub: 'Global network', icon: 'verified' },
            ].map(stat => (
              <div key={stat.label} className="floating-card" style={{ padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 128 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)' }}>{stat.label}</span>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-on-primary-container)' }}>{stat.icon}</span>
                </div>
                <div>
                  <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>{stat.value}</p>
                  <p style={{ fontSize: 10, color: 'var(--color-on-tertiary-container)', fontWeight: 600, marginTop: 2 }}>{stat.sub}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Analytics + Widgets */}
          <section style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: 24, marginBottom: 'var(--spacing-lg)' }}>
            {/* Funnel */}
            <div className="floating-card" style={{ padding: 'var(--spacing-lg)', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)' }}>Registration Funnel</h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '4px 12px', background: 'var(--color-surface-container)', borderRadius: 4, color: 'var(--color-on-surface-variant)' }}>Last 30 Days</span>
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, alignItems: 'flex-end', paddingTop: 16, minHeight: 300 }}>
                {[
                  { label: 'Visits', value: '12k', height: '85%', bg: 'var(--color-secondary-container)' },
                  { label: 'Started', value: '8.4k', height: '70%', bg: 'rgba(43,25,61,0.8)', color: '#fff' },
                  { label: 'Team Formation', value: '5.2k', height: '60%', bg: 'var(--color-primary-container)', color: '#fff' },
                  { label: 'Finalized', value: '2.1k', height: '40%', bg: 'var(--color-on-tertiary-container)', color: '#fff' },
                ].map(bar => (
                  <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: '100%', background: 'rgba(249,181,254,0.2)', borderRadius: '8px 8px 0 0', position: 'relative', overflow: 'hidden', height: '100%', minHeight: 200 }}>
                      <div style={{ position: 'absolute', bottom: 0, width: '100%', height: bar.height, background: bar.bg, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'height 0.5s ease' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: bar.color || 'var(--color-on-secondary-container)' }}>{bar.value}</span>
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textAlign: 'center' }}>{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Widgets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Deadlines */}
              <div className="floating-card" style={{ padding: 24, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-error)', fontSize: 18 }}>alarm</span>
                  <h4 style={{ fontSize: 16, fontWeight: 700 }}>Upcoming Deadlines</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { month: 'OCT', day: '24', title: 'Judge Matching Ends', sub: '14:00 GMT+2', highlight: true },
                    { month: 'OCT', day: '28', title: 'Submission Portal Close', sub: 'Global Sync', highlight: false },
                  ].map(d => (
                    <div key={d.day} style={{ display: 'flex', gap: 16, padding: 12, borderRadius: 8, background: d.highlight ? 'var(--color-surface-container-low)' : 'transparent', border: '1px solid rgba(14,22,71,0.05)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 12px', background: d.highlight ? '#fff' : 'var(--color-surface)', borderRadius: 4, boxShadow: d.highlight ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-on-surface-variant)' }}>{d.month}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>{d.day}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>{d.title}</p>
                        <p style={{ fontSize: 10, color: 'var(--color-on-surface-variant)' }}>{d.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => alert('Opening calendar...')}
                  style={{ width: '100%', marginTop: 16, padding: '8px', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, border: '1px solid rgba(19,2,37,0.1)', borderRadius: 8, background: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-high)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  View Calendar
                </button>
              </div>

              {/* Growth Card */}
              <div className="floating-card" style={{ padding: 24, borderRadius: 12, background: 'var(--color-on-secondary-fixed)', color: '#fff', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>PARTICIPANT GROWTH</p>
                  <h4 style={{ fontSize: 24, fontWeight: 700 }}>+18.4%</h4>
                  <div style={{ marginTop: 16, height: 64, width: '100%', display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                    {[30, 45, 35, 60, 50, 80, 100].map((h, i) => (
                      <div key={i} style={{ flex: 1, background: `rgba(255,255,255,${0.2 + (i / 7) * 0.6})`, height: `${h}%`, borderRadius: '2px 2px 0 0' }} />
                    ))}
                  </div>
                </div>
                <div style={{ position: 'absolute', right: -16, bottom: -16, opacity: 0.1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 96 }}>trending_up</span>
                </div>
              </div>
            </div>
          </section>

          {/* Registrations Table */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div className="floating-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
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
