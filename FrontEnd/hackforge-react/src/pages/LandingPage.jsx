import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import * as hackathonApi from '../services/hackathonApi.js';

export default function LandingPage() {
  const navigate = useNavigate();
  const floatingRefs = useRef([]);
  const [hackathons, setHackathons] = useState([]);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Fetch published hackathons
    hackathonApi.listPublishedHackathons()
      .then(setHackathons)
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Mouse parallax effect on floating cards
    const handleMouseMove = (e) => {
      const cards = floatingRefs.current.filter(Boolean);
      const mouseX = (e.clientX / window.innerWidth) - 0.5;
      const mouseY = (e.clientY / window.innerHeight) - 0.5;
      cards.forEach((card, index) => {
        const depth = (index + 1) * 20;
        const moveX = mouseX * depth;
        const moveY = mouseY * depth;
        card.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Scroll reveal for glass cards
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(32px)';
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      observer.observe(el);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)', overflowX: 'hidden' }}>
      {/* Top Nav */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        background: 'rgba(251,248,255,0.6)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(14,22,71,0.05)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--spacing-margin-safe)',
        maxWidth: 1440, margin: '0 auto', left: 0, right: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-primary)' }}>
            HackForge
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#features" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, textDecoration: 'none', fontSize: 16, borderBottom: '2px solid var(--color-on-tertiary-container)', paddingBottom: 2 }}>Features</a>
            <a href="#pricing" style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none', fontSize: 16 }}>Pricing</a>
            <a href="#resources" style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none', fontSize: 16 }}>Resources</a>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  const roleRoutes = {
                    organizer: '/organizer',
                    participant: '/participant',
                    judge: '/judges',
                    admin: '/organizer',
                  };
                  navigate(roleRoutes[user?.role] || '/');
                }}
                style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 16, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 12px rgba(19,2,37,0.3)', transition: 'background 0.2s, transform 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary)'; }}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  useAuthStore.getState().logout();
                }}
                style={{ background: 'none', border: '1px solid var(--color-outline)', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', color: 'var(--color-on-surface-variant)', fontSize: 16, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-container-high)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', fontSize: 16, padding: '8px 16px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-on-surface-variant)'}
              >
                Login
              </button>
              <button
                onClick={() => navigate('/organizer')}
                style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 16, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 12px rgba(19,2,37,0.3)', transition: 'background 0.2s, transform 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary)'; }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Create Hackathon
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{
        paddingTop: 128, paddingBottom: 96,
        background: 'radial-gradient(circle at 50% -20%, #f0dbff 0%, #fbf8ff 60%)',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 var(--spacing-margin-safe)', display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 80, alignItems: 'center' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, zIndex: 10 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 9999, background: 'rgba(249,181,254,0.3)', width: 'fit-content', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', color: 'var(--color-on-secondary-container)', textTransform: 'uppercase' }}>v2.0 Now Live</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-inter)', fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '56px', color: 'var(--color-primary-container)' }}>
              Build Exceptional <br /><span style={{ color: 'var(--color-on-primary-container)' }}>Hackathons</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: '28px', color: 'var(--color-on-surface-variant)', maxWidth: 512 }}>
              Launch branded hackathons, manage participants, evaluate projects and celebrate innovation from one powerful platform. Designed for modern tech communities.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
              <button
                onClick={() => navigate('/organizer')}
                style={{ background: 'var(--color-primary-container)', color: '#fff', border: 'none', borderRadius: 12, padding: '16px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: '0 20px 40px -10px rgba(43,25,61,0.2)', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Create Your Hackathon
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button
                style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', border: '1px solid var(--color-outline-variant)', borderRadius: 12, padding: '16px 32px', fontSize: 16, fontWeight: 600, color: 'var(--color-primary-container)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
                onClick={() => alert('Demo video coming soon!')}
              >
                <span className="material-symbols-outlined">play_circle</span>
                Watch Demo
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 32, opacity: 0.6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, letterSpacing: '0.05em' }}>Trusted by 500+ Organizations</span>
            </div>
          </div>

          {/* Right - Product Showcase */}
          <div style={{ position: 'relative', height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', width: 600, height: 600, background: 'rgba(19,2,37,0.05)', borderRadius: '50%', filter: 'blur(80px)' }} />
            {/* Main Dashboard Card */}
            <div className="glass-card glass-edge" style={{ position: 'relative', width: '100%', maxWidth: 576, borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', zIndex: 20 }}>
              <div style={{ height: 32, background: 'rgba(237,236,255,0.5)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 6, borderBottom: '1px solid rgba(14,22,71,0.05)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(248,113,113,0.5)' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(250,204,21,0.5)' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(74,222,128,0.5)' }} />
              </div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxxkasEnFrqSTq1qJVmRplRoYgOg7R1ZZgey9ppHZN5uwqCW2yM7EhGdVV5cysUvg06tqpqpmJVpzKd-DwIQGtnIT6aLEhARdk47co0DBZLeR4Dj4skFXmoLFlRw-vUEZPJthhU6fDBAPM7WaFfqfTnCkGRkPwTTTz2cPCA0cHUAdyF5wcOJqZaounD2-qDO_QcYw3XzYyR_KAzYXLNblRJzk7idFI5h7d9Jzo0rCbYwHEhi9p8TKkC_Qr1fQUXbTyka-fW5lZNA"
                alt="Main Platform UI"
                style={{ width: '100%', filter: 'grayscale(0.2) contrast(1.05)' }}
              />
            </div>

            {/* Website Builder floating card */}
            <div ref={el => floatingRefs.current[0] = el} className="glass-card floating" style={{ position: 'absolute', top: 40, right: 0, width: 224, padding: 16, borderRadius: 12, zIndex: 30, display: 'flex', flexDirection: 'column', gap: 8, animationDelay: '-1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 8, background: 'var(--color-primary-container)', color: '#fff', borderRadius: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>web</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>Website Builder</span>
              </div>
              <div style={{ height: 6, width: '100%', background: 'var(--color-surface-container)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--color-on-tertiary-container)', width: '75%' }} />
              </div>
            </div>

            {/* Analytics floating card */}
            <div ref={el => floatingRefs.current[1] = el} className="glass-card floating" style={{ position: 'absolute', bottom: 48, right: 48, width: 256, padding: 20, borderRadius: 12, zIndex: 30, animationDelay: '-3s' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--color-on-surface-variant)' }}>Live Registrations</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>2,481</span>
                <span style={{ color: '#22c55e', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 6 }}>+12%</span>
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                {[32, 48, 40, 64, 56].map((h, i) => (
                  <div key={i} style={{ height: h, flex: 1, background: i === 3 ? 'rgba(100,128,248,0.4)' : `rgba(19,2,37,${0.1 + i * 0.04})`, borderRadius: 2 }} />
                ))}
              </div>
            </div>

            {/* Judge Workspace floating card */}
            <div ref={el => floatingRefs.current[2] = el} className="glass-card floating" style={{ position: 'absolute', top: 96, left: -32, width: 192, padding: 16, borderRadius: 12, zIndex: 30, animationDelay: '-4.5s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-on-tertiary-container)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>Judging Active</span>
              </div>
              <div style={{ display: 'flex', marginLeft: -8 }}>
                {['var(--color-surface-variant)', 'var(--color-primary-fixed)', 'var(--color-secondary-fixed)'].map((bg, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #fff', background: bg, marginLeft: i > 0 ? -8 : 0 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Active Hackathons Showcase */}
      <section id="hackathons" style={{ padding: 'var(--spacing-lg) 0', background: 'var(--color-surface-container-low)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 var(--spacing-margin-safe)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-primary)' }}>Active Hackathons</h2>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 16, marginTop: 8 }}>Join these upcoming and active challenges powered by HackForge.</p>
            </div>
          </div>
          {hackathons.length === 0 ? (
            <div className="glass-card" style={{ padding: 48, borderRadius: 16, textAlign: 'center', color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)' }}>
              No active hackathons found. Create one to get started!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {hackathons.map((h) => (
                <div key={h.id} className="glass-card template-card" style={{ borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff' }}>
                  <div style={{ height: 180, background: 'var(--color-primary-container)', position: 'relative' }}>
                    {h.banner_url ? (
                      <img src={h.banner_url} alt={h.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48 }}>event</span>
                      </div>
                    )}
                    <span style={{ position: 'absolute', top: 12, right: 12, padding: '4px 12px', borderRadius: 9999, background: 'rgba(249,181,254,0.85)', color: 'var(--color-on-secondary-container)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h.status}
                    </span>
                  </div>
                  <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>{h.title}</h3>
                    {h.tagline && <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-secondary)', marginBottom: 12 }}>{h.tagline}</p>}
                    <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 14, marginBottom: 20, flexGrow: 1 }}>{h.description || 'No description provided.'}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(14,22,71,0.05)', paddingTop: 16 }}>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-on-surface-variant)' }}>
                        {h.mode.toUpperCase()} • Max Team: {h.max_team_size}
                      </span>
                      <button
                        onClick={() => navigate(`/participant?hackathon=${h.id}`)}
                        style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
                      >
                        Join Event
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bento Feature Grid */}
      <section id="features" style={{ padding: 'var(--spacing-xl) 0', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 var(--spacing-margin-safe)' }}>
          <div style={{ textAlign: 'center', maxWidth: 672, margin: '0 auto 64px' }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--color-primary)', marginBottom: 16 }}>Powerful tools for Every Stage</h2>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 16 }}>From registration to final judging, HackForge provides a seamless infrastructure to scale your innovation events.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {/* Feature 1 - spans 2 cols */}
            <div className="glass-card scroll-reveal" style={{ gridColumn: 'span 2', padding: 32, borderRadius: 16 }}>
              <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-on-tertiary-container)', fontSize: 40, display: 'block', marginBottom: 16 }}>web</span>
                  <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8 }}>Drag &amp; Drop Builder</h3>
                  <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 16, marginBottom: 24 }}>Create stunning landing pages for your hackathons with no code. Custom domains, SSL, and mobile responsive by default.</p>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['PRE-BUILT COMPONENT LIBRARY', 'CUSTOM CSS & THEMING'].map(item => (
                      <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface)' }}>
                        <span className="material-symbols-outlined" style={{ color: '#22c55e', fontSize: 18 }}>check_circle</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR-QX31-2c4SmXQn3ecPE0GuFJtsLSGzARBzMVh-OAUHeykIBOvWnStHfXCFVb3X8D2mjs8uuFBOO52-SWvFA1TNivXf8IaJ40k3QOkj960DPVdtGrcrqV6Rh2vIlt7YLpI8fLs5RH1_w_qPhJ04t7ZjHOy57VuZ7I-oOh1wX-aLML67EmcgQXaMm389DJHZxSfmH88ppHOByGZZ-lp2nPKJhQJ9Y1hxGSNnX8EX6437KHhVLiwn8buRKpYLFMD_2jA0ji3_bGUA" alt="Website Builder" style={{ width: '100%', opacity: 0.9 }} />
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="glass-card scroll-reveal" style={{ padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-on-tertiary-container)', fontSize: 40, display: 'block', marginBottom: 16 }}>gavel</span>
                <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8 }}>Automated Judging</h3>
                <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 16 }}>Streamline evaluations with weighted rubrics and blind scoring systems.</p>
              </div>
              <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid rgba(14,22,71,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 8 }}>
                  <span style={{ color: 'var(--color-on-surface-variant)' }}>SCORING PROGRESS</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>84%</span>
                </div>
                <div style={{ height: 8, background: 'var(--color-surface-container)', borderRadius: 9999 }}>
                  <div style={{ height: '100%', background: 'var(--color-on-tertiary-container)', width: '84%', borderRadius: 9999 }} />
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glass-card scroll-reveal" style={{ padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-on-tertiary-container)', fontSize: 40, display: 'block', marginBottom: 16 }}>groups</span>
              <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8 }}>Team Formation</h3>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 16, marginBottom: 24 }}>AI-powered teammate matching based on skills and interests.</p>
              <div style={{ marginTop: 'auto', display: 'flex', marginLeft: -12 }}>
                {[
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuCdovXukKwkwItACWyaBbU1b8rVwwiM9gq8NIdrSNxyGbcPRah7hIeeUW_rhKo7FuAi_8wRhHcr4NaI01mKap0QaBzT4SvNDIyqKA8urWiYZXblpk8LLE_5rozZGVSenLXr7eE_WaIZgG4cZpFvy0Ghi6F7zSpelih-BK8d9rZBhSeQHUowCQCx9uZO7s3_oLLImckq4uy46nz6tDgUTFxrQR9ncTb8PGY-b0JrdpuG6d2UHpsOzk4452JUEk39yfvdSrP4bN1MXA',
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuC0qR9QGhwevWPVlADOd3qQN0lyWDq4vfbEXxp9EpO2pxRFRXft4ddQJyB4TNZrHV5YNt8iCahtDFhi2utPKvZuTVrGAX3ePUiJ_T2xMYPykwVb7lCCQETGE5RmGNM1Za7lMOmIwgbIdkSrDGYmg1ulJWOaVVy28VP0cp0oywRcPNiEciRVPs_PzcK62oYX3BMZxNBu31uh_Hew4PAt5DqbTnXMVWQNqkU36xXQyqilPVNTgOKMmpQSoSkIqhkdODLmEhBzt-3x1Q',
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuCL-jDXcde8PphBwBzs3ipWcDHN3lw92k3vwdFdsvRqRACfp2xgXdyhBi236Pf8eTiIlMhxcxhtbdHFUJWOn9bEF4B9zVRNyr_y2KrvRGNu3Zvej6wrYKgFkKSscqwazQefxOzxmxdFnAJxzoIu4dxL5zXmNT69NPBrbqIoJdKc7XJOa9ms8zS0Dfp37Rz4l9tYkke-OkqHwflFMDJsaYSiqmzxKLHNIXFNjiUqUKcJCvC7jSQ54qweCUlSwihYZYMHgjWcuvTQ',
                ].map((src, i) => (
                  <img key={i} src={src} alt="Team member" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', marginLeft: i > 0 ? -12 : 0, objectFit: 'cover' }} />
                ))}
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', marginLeft: -12, background: 'var(--color-primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12 }}>+42</div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="glass-card scroll-reveal" style={{ padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-on-tertiary-container)', fontSize: 40, display: 'block', marginBottom: 16 }}>verified</span>
              <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8 }}>Digital Credentials</h3>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 16 }}>Issue blockchain-verified certificates and NFTs to winners automatically.</p>
              <div style={{ marginTop: 24, padding: 16, border: '1px dashed var(--color-outline)', borderRadius: 8, background: 'var(--color-surface-container-low)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary-container)' }}>description</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>CERTIFICATE_TEMPLATE.PDF</span>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="glass-card scroll-reveal" style={{ padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-on-tertiary-container)', fontSize: 40, display: 'block', marginBottom: 16 }}>account_balance</span>
              <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8 }}>Sponsor Portal</h3>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 16, marginBottom: 24 }}>Give your partners dedicated dashboards to review resumes, host workshops, and track ROI.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, opacity: 0.5 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 32, background: 'var(--color-surface-variant)', borderRadius: 4 }} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: 'var(--spacing-xl) 0', position: 'relative' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 var(--spacing-margin-safe)' }}>
          <div style={{ background: 'var(--color-primary-container)', borderRadius: 32, padding: '96px 48px', overflow: 'hidden', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 384, height: 384, background: '#fff', filter: 'blur(120px)', opacity: 0.1 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 384, height: 384, background: 'var(--color-secondary)', filter: 'blur(120px)', opacity: 0.1 }} />
            <h2 style={{ position: 'relative', zIndex: 10, fontSize: 48, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Ready to forge the future?</h2>
            <p style={{ position: 'relative', zIndex: 10, color: 'var(--color-on-primary-container)', fontSize: 18, maxWidth: 576, marginBottom: 40 }}>
              Join the world's most innovative companies and universities. Start your first hackathon in minutes.
            </p>
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
              <button
                onClick={() => navigate('/login')}
                style={{ background: '#fff', color: 'var(--color-primary-container)', border: 'none', borderRadius: 12, padding: '20px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Get Started for Free
              </button>
              <button
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '20px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onClick={() => alert('Sales team contact coming soon!')}
              >
                Talk to Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(14,22,71,0.05)', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-lg) var(--spacing-margin-safe)', maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>HackForge</span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', maxWidth: 300 }}>The end-to-end infrastructure for professional innovation events.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 24 }}>
            <div style={{ display: 'flex', gap: 32 }}>
              {['Privacy Policy', 'Terms of Service', 'Contact'].map(link => (
                <a key={link} href="#" style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-on-tertiary-container)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-on-surface-variant)'}
                >{link}</a>
              ))}
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', opacity: 0.6 }}>© 2024 HackForge Infrastructure. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
