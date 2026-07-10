import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const filterChips = ['All Templates', 'Technology', 'Web3', 'Academic', 'Design'];

const templates = [
  {
    id: 'ai',
    name: 'AI Innovation',
    badge: 'Modern',
    badgeBg: 'var(--color-tertiary-fixed)',
    badgeColor: 'var(--color-on-tertiary-fixed-variant)',
    desc: 'A tech-heavy layout designed for high-performance AI and machine learning challenges.',
    tags: ['Dark Mode', 'Live Leaderboard', 'API Docs'],
    colors: ['#130225', '#6480F8', '#f9b5fe'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKKiesQW6FFIBwIQDFXbEoCrQuYzGL49wZX4JeUPdmY-JPfDtfGhvFSpnGn84zUXkaBESAXbei_fHQeIXwyBBWo1M5kZlFl6JmgtZE-2KMRwbX-KOSNnUg42mbn6niyW5L171MLN6KrGSa3eVyDmJrIzHId29z6QOiiO0-a7YmU-T-q4chbMAzM9Z1_lrgDsg3KlFnwniQB5YEYDIBtbE1hzRCx6Oab5Bv5pLIRi6IXv7fFIv_fNEcG8_MxicAH6xaB0cWwM0ZBw',
    filter: 'Technology',
  },
  {
    id: 'web3',
    name: 'Web3 Challenge',
    badge: 'Glassmorphism',
    badgeBg: 'var(--color-secondary-fixed)',
    badgeColor: 'var(--color-on-secondary-fixed-variant)',
    desc: 'Futuristic, decentralized aesthetic with frosted glass elements and crypto-native widgets.',
    tags: ['Wallet Connect', 'Mint Page'],
    colors: ['#001864', '#ffd6fe'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaNNkyzgoTubjGXv0FclfvHjpHRTTado3Kr9ydEQMeeKKZseCKOA_5PGOBiRhObbs4LBuV-siU9PAK_Vjd7X40Da1REGJEbAHc5GWyrl2S2Oy5ihbn6dq0ds-sx1NcI9Fc_RSP6iZsG9VJmidc7iFvxxi0JaYK1rd00R4lWTnNIWmmD6o68taej1uSX0HkAEDj12PDMpcQ-wgBUCwf5Czi8YK6nTMHNOwGukvHSGvmMCQfEz18Z3sbIVFVrON8w932Irr77z_dEQ',
    filter: 'Web3',
  },
  {
    id: 'startup',
    name: 'Startup Weekend',
    badge: 'Energetic',
    badgeBg: 'var(--color-error-container)',
    badgeColor: 'var(--color-on-error-container)',
    desc: 'High-energy, bold typography and vibrant colors to drive participation and excitement.',
    tags: ['Impact Fonts', 'Sponsorship Grid'],
    colors: ['#BA1A1A', '#130225'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5Km69BuQBetHre0S_ZQkLHckmUH-MXz5Efg4RMiU_Ga3roPuwmFvB_I0X__EEMtt12cGSn5JeYOxwXlZg4z41UCod8iP8hCJ3AHl_3jAQA4eocnLypteak-WWUoyA7KEl7PePiM6Hh1NTw-ELmCrIP8WsahjcmwWOWRRXoTqKR7kZpQUHKNEaz12vrmqgfXDZ4JYMf1YKHegSsQtFGWQdTdDq4QHlyeu6VgEB37mHSdlCdgKSdXDrV5Q4alA6EMTdCavGwdIDIg',
    filter: 'Design',
  },
  {
    id: 'university',
    name: 'University Hack',
    badge: 'Academic',
    badgeBg: 'var(--color-surface-container-highest)',
    badgeColor: 'var(--color-on-surface)',
    desc: 'Approachable and informative design with a focus on schedules, maps, and FAQs.',
    tags: ['Interactive Map', 'Mentor Chat'],
    colors: ['#1339b2', '#fbf8ff'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDe2-i-h25FkLUkw_wh6X4kiqdVBDPw8BbEXMtHJQBDqbFg3ms33uAWn27uAJK1J-atwgv0eZAovl6rzXB1BOBRqcnNIy6G3dL34L4igctEyqsVI-g1MliJdFjQIG_2KyNemRjaHD2Q9lSfXvGhrTaqwGjMJEGeKRlPIZp-t152rk01iNxINW0g-Ub_NLPecBHglUPYS78GdKQePWXrPizopwA5tER7qXpe_U1B5XB6O5piNyz4a5m1WZC4yGpA2QHVXHP8Bgfcrg',
    filter: 'Academic',
  },
  {
    id: 'research',
    name: 'Research Summit',
    badge: 'Minimalist',
    badgeBg: 'var(--color-outline-variant)',
    badgeColor: 'var(--color-on-surface-variant)',
    desc: 'A sophisticated, data-focused layout for scientific and technical research symposiums.',
    tags: ['Abstract Submission', 'Whitepaper Hub'],
    colors: ['#4a454d', '#ffffff'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpPX82arA4YR3dS5dCK4fs1uDsS1h1wPCwVkodqdG-L3JC0IONbNlsfAEiaqd6DyIekeB2WO3wHSdSBYhih0jdrpf8tPc1lkXJdegu6MI4yRa4WskwIMNFfey9huk4b9YJfasftuuggEUdAUWJRfRWq_dUQ44hrOzK-T8mkY6q66rn1ZVrj9x-gKK2Wy1_c2Zb1oMfyGjlZUTwWEBTg3obmDoC7C0exY8nqA0pniO2K0ZPYh-xWX42FIHliXeHfq-fuI9gFS4Yjw',
    filter: 'Academic',
  },
];

export default function TemplateGallery() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All Templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const searchRef = useRef(null);

  const filteredTemplates = templates.filter(t => {
    const matchesFilter = activeFilter === 'All Templates' || t.filter === activeFilter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handlePreview = (name) => alert(`Opening live preview for: ${name}`);
  const handleStartBuilding = () => navigate('/organizer');
  const handleCreateHackathon = () => navigate('/organizer');

  return (
    <div style={{ background: 'var(--color-surface)', color: 'var(--color-on-surface)', overflowX: 'hidden', fontFamily: 'var(--font-inter)' }}>
      {/* Atmospheric Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -10, background: 'linear-gradient(135deg, #F4EEF1 0%, #C6CAE8 100%)' }}>
        <div style={{ position: 'absolute', width: 400, height: 400, background: '#f9b5fe', top: -100, right: -100, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, background: '#dde1ff', bottom: '10%', left: -50, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.6 }} />
      </div>

      {/* TopNavBar */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, background: 'rgba(251,248,255,0.6)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(14,22,71,0.05)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px var(--spacing-margin-safe)', maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-primary)', cursor: 'pointer' }} onClick={() => navigate('/')}>HackForge</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="#" style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: 12, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-on-tertiary-container)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-on-surface-variant)'}
                onClick={e => { e.preventDefault(); navigate('/'); }}
              >ROOT / STUDIO / TEMPLATES</a>
            </div>
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 384, margin: '0 32px', position: 'relative', transition: 'transform 0.2s' }} ref={searchRef}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 20 }}>search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(123,117,126,0.2)', borderRadius: 8, paddingLeft: 40, paddingRight: 16, paddingTop: 8, paddingBottom: 8, outline: 'none', fontSize: 16, fontFamily: 'var(--font-inter)', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-on-tertiary-fixed-variant)'; e.target.style.boxShadow = '0 0 0 2px rgba(19,57,178,0.2)'; if (searchRef.current) searchRef.current.style.transform = 'scale(1.02)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(123,117,126,0.2)'; e.target.style.boxShadow = 'none'; if (searchRef.current) searchRef.current.style.transform = 'scale(1)'; }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigate('/login')}
              style={{ padding: '8px 16px', color: 'var(--color-on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 16, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-on-surface-variant)'}
            >
              Login
            </button>
            <button
              onClick={handleCreateHackathon}
              style={{ padding: '8px 24px', background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.1s, opacity 0.2s' }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Create Hackathon
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ position: 'relative', paddingTop: 128, paddingBottom: 96, padding: '128px var(--spacing-margin-safe) 96px', maxWidth: 1440, margin: '0 auto', zIndex: 10 }}>
        {/* Header */}
        <header style={{ marginBottom: 'var(--spacing-lg)', maxWidth: 768 }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-primary)', marginBottom: 4 }}>Hackathon Website Studio</h1>
          <p style={{ fontSize: 18, color: 'var(--color-on-surface-variant)' }}>Create a fully branded hackathon website without writing code.</p>
        </header>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 48, overflowX: 'auto', paddingBottom: 16 }}>
          {filterChips.map(chip => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              style={{
                padding: '8px 24px', borderRadius: 9999, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                ...(activeFilter === chip
                  ? { background: 'var(--color-primary-container)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(43,25,61,0.2)' }
                  : { background: 'rgba(255,255,255,0.6)', color: 'var(--color-on-surface-variant)', border: '1px solid rgba(123,117,126,0.1)' }
                )
              }}
              onMouseEnter={e => { if (activeFilter !== chip) e.currentTarget.style.background = '#fff'; }}
              onMouseLeave={e => { if (activeFilter !== chip) e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {filteredTemplates.map(t => (
            <div
              key={t.id}
              className="template-card"
              style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(14,22,71,0.05)' }}
              onMouseEnter={() => setHoveredCard(t.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={{ height: 256, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={t.img}
                  alt={t.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s ease', transform: hoveredCard === t.id ? 'scale(1.1)' : 'scale(1)' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', opacity: hoveredCard === t.id ? 1 : 0, transition: 'opacity 0.3s', display: 'flex', alignItems: 'flex-end', padding: 24 }}>
                  <button
                    onClick={() => handlePreview(t.name)}
                    style={{ width: '100%', padding: 12, background: '#fff', color: 'var(--color-primary)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'transform 0.1s' }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Live Preview
                  </button>
                </div>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)' }}>{t.name}</h3>
                  <span style={{ padding: '4px 8px', background: t.badgeBg, color: t.badgeColor, borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{t.badge}</span>
                </div>
                <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 16, marginBottom: 16, flexGrow: 1 }}>{t.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {t.tags.map(tag => (
                    <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--color-surface-container-low)', padding: '4px 8px', borderRadius: 4 }}>{tag}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {t.colors.map((color, i) => (
                    <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: color, border: color === '#ffffff' ? '1px solid #ddd' : 'none' }} />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Blank Canvas */}
          <div
            className="template-card"
            onClick={handleStartBuilding}
            style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '2px dashed rgba(123,117,126,0.3)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(123,117,126,0.3)'}
          >
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary-fixed-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, transition: 'transform 0.5s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'rotate(90deg)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-primary)' }}>add</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8 }}>Blank Canvas</h3>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 16, maxWidth: 200 }}>Start from scratch and build your own unique experience.</p>
            </div>
            <div style={{ padding: 24, background: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(123,117,126,0.1)' }}>
              <button
                style={{ width: '100%', padding: 12, color: 'var(--color-primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
              >
                Start Building
              </button>
            </div>
          </div>

          {/* No results */}
          {filteredTemplates.length === 0 && (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '80px 0', color: 'var(--color-on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 64, display: 'block', marginBottom: 16, opacity: 0.4 }}>search_off</span>
              <p style={{ fontSize: 18 }}>No templates match "<strong>{searchQuery}</strong>" in {activeFilter}</p>
              <button onClick={() => { setSearchQuery(''); setActiveFilter('All Templates'); }} style={{ marginTop: 16, padding: '8px 24px', background: 'var(--color-primary-container)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Featured Section */}
        <section style={{ marginTop: 'var(--spacing-xl)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'var(--color-tertiary-fixed)', color: 'var(--color-on-tertiary-fixed-variant)', borderRadius: 9999, fontFamily: 'var(--font-mono)', fontSize: 12, width: 'fit-content' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
              POWERED BY HACKFORGE ENGINE
            </div>
            <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-primary)', lineHeight: '56px' }}>
              The world's most powerful <span style={{ color: 'var(--color-on-tertiary-container)' }}>No-Code</span> Hackathon builder.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: 'drag_indicator', title: 'Visual Drag & Drop', desc: 'Modify any element visually. See changes in real-time with our zero-latency editor.' },
                { icon: 'database', title: 'Live API Integration', desc: 'Sync your participant data, schedule, and judging metrics directly to your landing page.' },
              ].map(feat => (
                <div key={feat.title} style={{ display: 'flex', gap: 16 }}>
                  <div style={{ marginTop: 4, flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: 'var(--color-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-on-secondary-container)', fontSize: 20 }}>{feat.icon}</span>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>{feat.title}</h4>
                    <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 16 }}>{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.5)', padding: 8, borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', transform: 'rotate(2deg)', transition: 'transform 0.5s', overflow: 'hidden' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'rotate(0deg)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'rotate(2deg)'}
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQ8QOOft_Tf7qVJn_tyhmN8VE1xhyhWFjSYdruAHPa2YFqT_Lnl3bgrr9uLEtbGsPXen0KuopYF7IHaAQPQTFU7NULsS-y3oDw0bdlwHR3JBX9VlRH59CjqrolCv22zq_v-CmnbeUclUfUup9a7EU83I2SxL_cDPGNezhZo5bpPryJNccZACjo4QL4046xiCH28e5cny3yrnHNCSJbl0B8Lk6oqpSM0AZugSbDrTCaE29fehHcelsrfTAtLGIEfWXstAzfte-Vng"
                alt="Builder Interface"
                style={{ borderRadius: 12, width: '100%' }}
              />
            </div>
            <div style={{ position: 'absolute', bottom: -24, left: -24, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(100,128,248,0.2)', padding: 16, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-error)' }} />
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Editor Active</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-on-surface)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "The builder is incredibly intuitive. I launched in 10 minutes."
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(14,22,71,0.05)', background: 'var(--color-surface)', padding: 'var(--spacing-lg) 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 var(--spacing-margin-safe)', maxWidth: 1440, margin: '0 auto', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>HackForge</span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)' }}>© 2024 HackForge Infrastructure. All rights reserved.</p>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            {['Privacy Policy', 'Terms of Service', 'Contact'].map(link => (
              <a key={link} href="#" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-on-tertiary-container)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-on-surface-variant)'}
              >{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
