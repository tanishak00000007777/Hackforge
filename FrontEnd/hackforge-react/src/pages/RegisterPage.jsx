import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../services/authApi.js';
import { useAuthStore } from '../store/authStore.js';

const ROLE_ROUTES = {
  organizer: '/organizer',
  participant: '/participant',
  judge: '/judge',
  admin: '/organizer',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('participant');
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const cursorGlowRef = useRef(null);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_ROUTES[user.role] || '/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorGlowRef.current) {
        cursorGlowRef.current.style.left = e.clientX + 'px';
        cursorGlowRef.current.style.top = e.clientY + 'px';
        cursorGlowRef.current.style.opacity = '1';
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (role === 'organizer' && !orgName) {
      setError('Organization name is required for organizers.');
      return;
    }
    setIsLoading(true);
    try {
      // 1. Register
      await authApi.register({
        email,
        full_name: fullName,
        password,
        role,
        org_name: role === 'organizer' ? orgName : null,
      });
      // 2. Auto-login
      const tokens = await authApi.login(email, password);
      useAuthStore.setState({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
      const userData = await authApi.getMe();
      setAuth(tokens, userData);
      navigate(ROLE_ROUTES[userData.role] || '/', { replace: true });
    } catch (err) {
      setError(err.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', paddingLeft: 48, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
    background: '#fff', border: '1px solid rgba(19,2,37,0.1)', borderRadius: 12, outline: 'none',
    fontSize: 16, color: 'var(--color-on-surface)', fontFamily: 'var(--font-inter)',
    boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const handleFocus = (e) => { e.target.style.borderColor = 'var(--color-secondary)'; e.target.style.boxShadow = '0 0 0 4px rgba(130,72,137,0.1)'; };
  const handleBlur = (e) => { e.target.style.borderColor = 'rgba(19,2,37,0.1)'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-gutter)', position: 'relative', background: '#fbf8ff', overflow: 'hidden' }}>
      {/* Atmospheric Background */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'var(--color-secondary-container)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4, zIndex: -1 }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '60%', height: '60%', background: 'var(--color-primary-fixed-dim)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4, zIndex: -1 }} />
      </div>

      {/* Register Card */}
      <main style={{ width: '100%', maxWidth: 480, zIndex: 10 }}>
        <div style={{ background: '#fff', border: '1px solid rgba(43,25,61,0.05)', boxShadow: '0 20px 50px -12px rgba(43,25,61,0.12)', borderRadius: 24, padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', width: '100%' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <div style={{ width: 40, height: 40, background: 'var(--color-primary-container)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'transform 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-primary)' }}>HackForge</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 4 }}>Create Account</h1>
            <p style={{ fontSize: 16, color: 'var(--color-on-surface-variant)' }}>Join the forging community.</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ width: '100%', padding: '12px 16px', background: 'var(--color-error-container)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-error)' }}>error</span>
              <span style={{ fontSize: 14, color: 'var(--color-on-error-container)' }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Role Selector */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ value: 'participant', label: 'Participant', icon: 'person' }, { value: 'organizer', label: 'Organizer', icon: 'groups' }].map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 16px', border: role === r.value ? '2px solid var(--color-secondary)' : '1px solid rgba(19,2,37,0.1)',
                    borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                    background: role === r.value ? 'rgba(249,181,254,0.15)' : 'var(--color-surface)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: role === r.value ? 'var(--color-secondary)' : 'var(--color-outline-variant)', fontVariationSettings: role === r.value ? "'FILL' 1" : "'FILL' 0" }}>{r.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: role === r.value ? 600 : 400, color: role === r.value ? 'var(--color-on-secondary-container)' : 'var(--color-on-surface-variant)' }}>{r.label}</span>
                </button>
              ))}
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', marginBottom: 6, marginLeft: 4 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline-variant)', fontSize: 20 }}>badge</span>
                <input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="regEmail" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', marginBottom: 6, marginLeft: 4 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline-variant)', fontSize: 20 }}>mail</span>
                <input id="regEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="regPassword" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', marginBottom: 6, marginLeft: 4 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline-variant)', fontSize: 20 }}>lock</span>
                <input id="regPassword" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: 48 }} onFocus={handleFocus} onBlur={handleBlur} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-outline-variant)', transition: 'color 0.2s' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Org Name — visible only for organizers */}
            {role === 'organizer' && (
              <div style={{ animation: 'fadeIn 0.25s ease' }}>
                <label htmlFor="orgName" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', marginBottom: 6, marginLeft: 4 }}>Organization Name</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline-variant)', fontSize: 20 }}>business</span>
                  <input id="orgName" type="text" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Example University" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{ width: '100%', padding: '14px', background: 'var(--color-primary-container)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(19,2,37,0.1)', transition: 'background 0.3s, transform 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = 'var(--color-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary-container)'; }}
              onMouseDown={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isLoading
                ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>progress_activity</span>
                : 'Create Account'
              }
            </button>
          </form>

          {/* Footer */}
          <p style={{ marginTop: 'var(--spacing-lg)', fontSize: 16, color: 'var(--color-on-surface-variant)' }}>
            Already have an account?{' '}
            <a href="/login" onClick={e => { e.preventDefault(); navigate('/login'); }} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >Sign In</a>
          </p>
        </div>
      </main>

      {/* Cursor glow */}
      <div ref={cursorGlowRef} style={{ position: 'fixed', pointerEvents: 'none', width: 600, height: 600, background: 'rgba(249,181,254,0.1)', borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(-50%, -50%)', zIndex: -1, opacity: 0, transition: 'opacity 0.3s' }} />
    </div>
  );
}
