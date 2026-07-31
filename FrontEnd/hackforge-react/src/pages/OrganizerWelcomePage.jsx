import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

const helpItems = [
  { icon: 'web', title: 'Build your event website', description: 'Use the drag-and-drop Website Studio to design a page for your hackathon — no code needed.' },
  { icon: 'description', title: 'Collect registrations', description: 'Create a custom application form and review, approve, or waitlist participants as they apply.' },
  { icon: 'groups', title: 'Track teams & submissions', description: 'See how participants have grouped up and what they submit as the event runs.' },
  { icon: 'gavel', title: 'Run judging', description: 'Invite judges, and let them score submissions once the event is live.' },
  { icon: 'workspace_premium', title: 'Issue certificates', description: 'Design and send completion certificates to participants when it wraps up.' },
];

export default function OrganizerWelcomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const userName = user?.full_name || 'there';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fbf8ff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-primary)' }}>HackForge</h1>
        <button
          type="button"
          onClick={handleLogout}
          style={{ border: 'none', background: 'none', color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}
        >
          Logout
        </button>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '24px 24px 64px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 12px', color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>ORGANIZER</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 36, fontWeight: 700, color: 'var(--color-primary)' }}>Welcome, {userName.split(' ')[0]}.</h1>
        <p style={{ margin: '0 0 40px', fontSize: 16, color: 'var(--color-on-surface-variant)', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          HackForge gives you everything you need to run a hackathon end to end. Here's what you can do once you create your first event.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40, textAlign: 'left' }}>
          {helpItems.map((item) => (
            <div key={item.title} className="floating-card" style={{ borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--color-primary)' }}>{item.icon}</span>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>{item.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-on-surface-variant)' }}>{item.description}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate('/organizer/setup')}
          style={{ height: 48, padding: '0 28px', border: 'none', borderRadius: 10, background: 'var(--color-primary-container)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(43,25,61,0.2)' }}
        >
          Create your hackathon
        </button>
      </main>
    </div>
  );
}
