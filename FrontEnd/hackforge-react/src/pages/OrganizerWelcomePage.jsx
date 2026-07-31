import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

const helpItems = [
  { icon: 'web', title: 'Build your event website', description: 'Design a polished event page with the drag-and-drop Website Studio — no code required.' },
  { icon: 'description', title: 'Collect registrations', description: 'Create a custom application form and review, approve, or waitlist participants as they apply.' },
  { icon: 'groups', title: 'Track teams & submissions', description: 'See how participants have grouped up and what they submit as the event runs.' },
  { icon: 'gavel', title: 'Run judging', description: 'Invite judges and let them score submissions once the event is live.' },
  { icon: 'workspace_premium', title: 'Issue certificates', description: 'Design and send completion certificates to participants when it wraps up.' },
  { icon: 'analytics', title: 'Track engagement', description: 'Keep a pulse on registrations and participation as your event unfolds.' },
];

const audiences = [
  { icon: 'school', label: 'University clubs' },
  { icon: 'apartment', label: 'Corporate innovation teams' },
  { icon: 'diversity_3', label: 'Community organizers' },
  { icon: 'rocket_launch', label: 'Startup accelerators' },
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
    <div style={{ minHeight: '100vh', background: 'var(--color-surface)', overflowX: 'hidden' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', position: 'relative', zIndex: 10 }}>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-primary)' }}>HackForge</span>
        <button
          type="button"
          onClick={handleLogout}
          style={{ border: 'none', background: 'none', color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}
        >
          Logout
        </button>
      </header>

      {/* Hero */}
      <section style={{
        position: 'relative', overflow: 'hidden', borderRadius: 24, margin: '8px 24px 0',
        background: 'linear-gradient(135deg, #0e0319 0%, var(--color-primary) 45%, #2b193d 100%)',
        color: '#fff', boxShadow: '0 30px 60px -20px rgba(19,2,37,0.45)',
      }}>
        {/* subtle grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.5,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 30% 20%, black 40%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute', top: '-15%', right: '-10%', width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,181,254,0.25) 0%, transparent 70%)', animation: 'drift 10s ease-in-out infinite',
        }} />

        <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 40, alignItems: 'center', padding: '80px 56px' }}>
          <div>
            <p style={{ margin: '0 0 18px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--color-secondary-fixed)', textTransform: 'uppercase' }}>
              Organizer workspace
            </p>
            <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Welcome, {userName.split(' ')[0]}. Let's build something worth showing up for.
            </h1>
            <p style={{ margin: '0 0 36px', fontSize: 17, color: 'rgba(255,255,255,0.72)', maxWidth: 460, lineHeight: 1.6 }}>
              HackForge is the operating system for hackathons — from your event website and registrations to judging and certificates. Set up in minutes, run with confidence.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/organizer/setup')}
                style={{
                  height: 52, padding: '0 30px', border: 'none', borderRadius: 10, cursor: 'pointer',
                  background: '#fff', color: 'var(--color-primary)', fontSize: 15, fontWeight: 700,
                  boxShadow: '0 12px 30px -6px rgba(0,0,0,0.35)',
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              >
                Create your hackathon
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Product preview mock */}
          <div style={{ position: 'relative' }} aria-hidden="true">
            <div className="glass-panel" style={{ borderRadius: 16, padding: 14, boxShadow: '0 24px 50px -12px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, padding: '0 4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 18 }}>
                <div style={{ height: 10, width: '55%', borderRadius: 4, background: 'rgba(255,255,255,0.28)', marginBottom: 10 }} />
                <div style={{ height: 8, width: '80%', borderRadius: 4, background: 'rgba(255,255,255,0.14)', marginBottom: 22 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[0, 1].map((i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-tertiary-fixed-dim)' }}>{i === 0 ? 'group_add' : 'web'}</span>
                      <div style={{ height: 6, width: '70%', borderRadius: 4, background: 'rgba(255,255,255,0.2)', marginTop: 10 }} />
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-secondary-fixed-dim), var(--color-tertiary-fixed-dim))' }} />
                    <div style={{ height: 6, width: 80, borderRadius: 4, background: 'rgba(255,255,255,0.2)' }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(21,128,61,0.25)', color: '#86efac' }}>APPROVED</span>
                </div>
              </div>
            </div>
            <div className="glass-panel" style={{
              position: 'absolute', bottom: -18, left: -24, borderRadius: 12, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 16px 32px -10px rgba(0,0,0,0.4)',
              animation: 'drift 8s ease-in-out infinite', animationDelay: '-2s',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-tertiary-fixed-dim)' }}>workspace_premium</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Certificates ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <p style={{ margin: '0 0 8px', color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em' }}>WHAT YOU GET</p>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: 'var(--color-primary)' }}>Everything you need to run a hackathon, end to end.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {helpItems.map((item, idx) => (
            <div
              key={item.title}
              className="floating-card"
              style={{ borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', animation: 'fadeInUp 0.6s ease both', animationDelay: `${idx * 0.06}s` }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-tertiary-container))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{item.icon}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>{item.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.55 }}>{item.description}</p>
            </div>
          ))}
        </div>

        {/* Audience strip */}
        <div style={{ marginTop: 64, padding: '28px 32px', borderRadius: 16, background: 'var(--color-surface-container-low)', border: '1px solid rgba(14,22,71,0.05)' }}>
          <p style={{ margin: '0 0 20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-on-surface-variant)' }}>BUILT FOR TEAMS LIKE YOURS</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32 }}>
            {audiences.map((a) => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-primary)' }}>{a.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Closing CTA */}
        <div style={{
          marginTop: 56, marginBottom: 96, borderRadius: 20, padding: '44px 32px', textAlign: 'center',
          background: 'linear-gradient(135deg, var(--color-secondary-container), var(--color-tertiary-fixed))',
          boxShadow: '0 20px 40px -16px rgba(43,25,61,0.2)',
        }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>Ready to launch your first hackathon?</h3>
          <p style={{ margin: '0 0 26px', fontSize: 14, color: 'var(--color-on-surface-variant)' }}>It takes less than five minutes to get your organization set up.</p>
          <button
            type="button"
            onClick={() => navigate('/organizer/setup')}
            style={{ height: 50, padding: '0 30px', border: 'none', borderRadius: 10, background: 'var(--color-primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Create your hackathon
          </button>
        </div>
      </main>
    </div>
  );
}
