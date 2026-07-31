import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

const steps = [
  { icon: 'event', title: 'Find hackathons', description: 'Browse events that are open for registration and pick the ones that fit you.' },
  { icon: 'how_to_reg', title: 'Register in a click', description: 'Apply with a short form — no lengthy process, no waiting around.' },
  { icon: 'groups', title: 'Form or join a team', description: 'Start your own squad and invite others, or hop into one with an invite code.' },
  { icon: 'send', title: 'Build & submit', description: 'Track deadlines and ship your project right from your dashboard.' },
  { icon: 'workspace_premium', title: 'Get recognized', description: 'Earn a certificate and show off what you built once it wraps up.' },
];

const badges = [
  { icon: 'rocket_launch', label: 'Launch your idea', top: '8%', left: '4%', delay: '0s' },
  { icon: 'groups', label: 'Team up', top: '62%', left: '2%', delay: '-2s' },
  { icon: 'emoji_events', label: 'Win prizes', top: '14%', left: 'auto', right: '5%', delay: '-4s' },
  { icon: 'workspace_premium', label: 'Get certified', top: '66%', left: 'auto', right: '3%', delay: '-1.5s' },
];

export default function ParticipantWelcomePage({ onContinue }) {
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
        background: 'radial-gradient(circle at 20% 15%, #3d2455 0%, var(--color-primary) 55%, #0c0117 100%)',
        color: '#fff', padding: '88px 32px 96px', textAlign: 'center',
        boxShadow: '0 30px 60px -20px rgba(19,2,37,0.45)',
      }}>
        {/* Decorative floating badges */}
        {badges.map((b) => (
          <div
            key={b.label}
            className="glass-panel"
            style={{
              position: 'absolute', top: b.top, left: b.left, right: b.right,
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999,
              animation: `drift 7s ease-in-out infinite`, animationDelay: b.delay,
              color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-tertiary-fixed-dim)' }}>{b.icon}</span>
            {b.label}
          </div>
        ))}

        <p style={{ margin: '0 0 16px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--color-secondary-fixed)', textTransform: 'uppercase' }}>
          Welcome, {userName.split(' ')[0]}
        </p>
        <h1 style={{ margin: '0 auto 20px', fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 640 }}>
          Your next hackathon story starts here.
        </h1>
        <p style={{ margin: '0 auto 40px', fontSize: 18, color: 'rgba(255,255,255,0.75)', maxWidth: 480 }}>
          Discover events, build with a team, and ship something you're proud of — HackForge handles the rest.
        </p>
        <button
          type="button"
          onClick={onContinue}
          style={{
            height: 54, padding: '0 32px', border: 'none', borderRadius: 12, cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--color-secondary-fixed-dim), var(--color-tertiary-fixed-dim))',
            color: 'var(--color-primary)', fontSize: 16, fontWeight: 700,
            boxShadow: '0 12px 30px -6px rgba(249,181,254,0.4)',
            display: 'inline-flex', alignItems: 'center', gap: 10,
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        >
          Find hackathons
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
        </button>
      </section>

      {/* How it works */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ margin: '0 0 8px', color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em' }}>HOW IT WORKS</p>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: 'var(--color-primary)' }}>Everything you need, in one place.</h2>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 28, left: '10%', right: '10%', height: 2, background: 'linear-gradient(90deg, transparent, var(--color-outline-variant) 15%, var(--color-outline-variant) 85%, transparent)', display: window.innerWidth < 900 ? 'none' : 'block' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            {steps.map((step, idx) => (
              <div
                key={step.title}
                className="floating-card"
                style={{
                  position: 'relative', borderRadius: 16, padding: '24px 18px', textAlign: 'center',
                  animation: 'fadeInUp 0.6s ease both', animationDelay: `${idx * 0.08}s`,
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-tertiary-container))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  boxShadow: '0 8px 20px -6px rgba(43,25,61,0.4)', position: 'relative', zIndex: 2,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 26 }}>{step.icon}</span>
                </div>
                <span style={{ position: 'absolute', top: 12, right: 16, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--color-outline)' }}>0{idx + 1}</span>
                <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>{step.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing CTA */}
        <div style={{
          marginTop: 64, borderRadius: 20, padding: '40px 32px', textAlign: 'center',
          background: 'linear-gradient(135deg, var(--color-secondary-container), var(--color-tertiary-fixed))',
          boxShadow: '0 20px 40px -16px rgba(43,25,61,0.2)',
        }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>Ready to build something great?</h3>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--color-on-surface-variant)' }}>Your dashboard is one click away.</p>
          <button
            type="button"
            onClick={onContinue}
            style={{ height: 48, padding: '0 28px', border: 'none', borderRadius: 10, background: 'var(--color-primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Take me to my dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
