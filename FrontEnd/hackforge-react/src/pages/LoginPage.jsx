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

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const cursorGlowRef = useRef(null);

  // Google Login states
  const [googleIdToken, setGoogleIdToken] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('participant');
  const [orgName, setOrgName] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const returnPath = sessionStorage.getItem('hackforge_return_path');
      if (returnPath) sessionStorage.removeItem('hackforge_return_path');
      navigate(returnPath || ROLE_ROUTES[user.role] || '/', { replace: true });
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    try {
      let tokens, user;
      if (password === 'dev') {
        // Dev Mode Bypass
        tokens = {
          access_token: 'dev-access-token',
          refresh_token: 'dev-refresh-token',
        };
        let role = 'organizer';
        if (email.toLowerCase().includes('participant')) {
          role = 'participant';
        } else if (email.toLowerCase().includes('judge')) {
          role = 'judge';
        }
        user = {
          id: '00000000-0000-0000-0000-000000000000',
          email: email,
          full_name: 'Dev User (' + role.toUpperCase() + ')',
          role: role,
          org_name: 'Dev Organization',
          is_active: true,
        };
      } else {
        // 1. Authenticate
        tokens = await authApi.login(email, password);
        // 2. Fetch user profile (token is now in store after setAuth)
        // We need to set tokens first so apiClient can attach the bearer header
        // Temporarily set tokens to make getMe work
        useAuthStore.setState({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
        user = await authApi.getMe();
      }
      // 3. Persist in store
      setAuth(tokens, user);
      // 4. Route by role
      const returnPath = sessionStorage.getItem('hackforge_return_path');
      if (returnPath) sessionStorage.removeItem('hackforge_return_path');
      navigate(returnPath || ROLE_ROUTES[user.role] || '/', { replace: true });
    } catch (err) {
      setError(err.detail || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleGoogleCredentialResponse = async (response) => {
    const idToken = response.credential;
    setIsLoading(true);
    setError('');
    try {
      const tokens = await authApi.loginWithGoogle(idToken);
      useAuthStore.setState({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
      const profile = await authApi.getMe();
      setAuth(tokens, profile);
      navigate(ROLE_ROUTES[profile.role] || '/', { replace: true });
    } catch (err) {
      if (err.detail === 'USER_NOT_REGISTERED') {
        setGoogleIdToken(idToken);
        setShowRoleModal(true);
      } else {
        setError(err.detail || 'Google Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) {
      console.warn("Google Client ID not configured in VITE_GOOGLE_CLIENT_ID");
      return;
    }

    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-login-btn'),
          {
            theme: 'outline',
            size: 'large',
            width: 384,
            text: 'continue_with',
            shape: 'rectangular',
          }
        );
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initGoogle();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [googleClientId]);

  const handleRoleSubmit = async () => {
    if (!googleIdToken) return;
    setIsLoading(true);
    setError('');
    setShowRoleModal(false);
    try {
      const tokens = await authApi.loginWithGoogle(googleIdToken, selectedRole, selectedRole === 'organizer' ? orgName : null);
      useAuthStore.setState({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
      const profile = await authApi.getMe();
      setAuth(tokens, profile);
      navigate(ROLE_ROUTES[profile.role] || '/', { replace: true });
    } catch (err) {
      setError(err.detail || 'Google Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-gutter)', position: 'relative', background: '#fbf8ff', overflow: 'hidden' }}>
      {/* Atmospheric Background */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'var(--color-primary-fixed-dim)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4, zIndex: -1 }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '60%', background: 'var(--color-secondary-container)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4, zIndex: -1 }} />
        <div style={{ position: 'absolute', top: '20%', right: '15%', width: '30%', height: '30%', background: 'var(--color-surface-variant)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4, zIndex: -1 }} />

        {/* Floating Decorative Mockups */}
        <div className="float-1" style={{ position: 'absolute', top: '15%', left: '8%', width: 288, display: 'none' }}>
          <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)', padding: 16, borderRadius: 12, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 20 }}>event</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-on-surface-variant)' }}>Upcoming</span>
            </div>
            <div style={{ height: 48, background: 'var(--color-surface-container-high)', borderRadius: 8, marginBottom: 12 }} />
            <div style={{ height: 12, background: 'var(--color-surface-container-highest)', borderRadius: 9999, width: '75%', marginBottom: 8 }} />
            <div style={{ height: 12, background: 'var(--color-surface-container)', borderRadius: 9999, width: '50%' }} />
          </div>
        </div>

        <div className="float-2" style={{ position: 'absolute', bottom: '12%', left: '12%', width: 256, display: 'none' }}>
          <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)', padding: 20, borderRadius: 12, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', marginBottom: 16 }}>
              {['var(--color-primary-container)', 'var(--color-secondary-container)'].map((bg, i) => (
                <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', background: bg, marginLeft: i > 0 ? -12 : 0, overflow: 'hidden' }} />
              ))}
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', marginLeft: -12, background: 'var(--color-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--color-primary)' }}>+4</div>
            </div>
            <div style={{ height: 12, background: 'rgba(100,128,248,0.1)', borderRadius: 9999, width: '100%', marginBottom: 8 }} />
            <div style={{ height: 8, background: 'rgba(100,128,248,0.05)', borderRadius: 9999, width: '66%' }} />
          </div>
        </div>

        <div className="float-3" style={{ position: 'absolute', bottom: '15%', right: '10%', width: 288, display: 'none' }}>
          <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)', padding: 16, borderRadius: 12, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>analytics</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>Global Metrics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
              {[40, 60, 90, 50, 70].map((h, i) => (
                <div key={i} style={{ flex: 1, background: `rgba(19,2,37,${0.2 + i * 0.1})`, height: `${h}%`, borderRadius: '2px 2px 0 0' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Login Card */}
      <main style={{ width: '100%', maxWidth: 480, zIndex: 10 }}>
        <div style={{ background: '#fff', border: '1px solid rgba(43,25,61,0.05)', boxShadow: '0 20px 50px -12px rgba(43,25,61,0.12)', borderRadius: 24, padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', width: '100%' }}>
            <div
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 'var(--spacing-sm)', cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              <div style={{ width: 40, height: 40, background: 'var(--color-primary-container)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'transform 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-primary)' }}>HackForge</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 4 }}>Welcome Back</h1>
            <p style={{ fontSize: 16, color: 'var(--color-on-surface-variant)' }}>Continue building the future.</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--color-error-container)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: -8,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-error)' }}>error</span>
              <span style={{ fontSize: 14, color: 'var(--color-on-error-container)' }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <div id="google-login-btn"></div>
            </div>


            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(123,117,126,0.1)' }} />
              <span style={{ margin: '0 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-outline)', textTransform: 'uppercase' }}>Or email</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(123,117,126,0.1)' }} />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)', marginBottom: 6, marginLeft: 4 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline-variant)', fontSize: 20 }}>mail</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{ width: '100%', paddingLeft: 48, paddingRight: 16, paddingTop: 12, paddingBottom: 12, background: '#fff', border: '1px solid rgba(19,2,37,0.1)', borderRadius: 12, outline: 'none', fontSize: 16, color: 'var(--color-on-surface)', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-secondary)'; e.target.style.boxShadow = '0 0 0 4px rgba(130,72,137,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(19,2,37,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginLeft: 4 }}>
                <label htmlFor="password" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-variant)' }}>Password</label>
                <a href="#" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-secondary-container)', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-on-secondary-container)'}
                >Forgot Password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline-variant)', fontSize: 20 }}>lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', paddingLeft: 48, paddingRight: 48, paddingTop: 12, paddingBottom: 12, background: '#fff', border: '1px solid rgba(19,2,37,0.1)', borderRadius: 12, outline: 'none', fontSize: 16, color: 'var(--color-on-surface)', fontFamily: 'var(--font-inter)', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-secondary)'; e.target.style.boxShadow = '0 0 0 4px rgba(130,72,137,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(19,2,37,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-outline-variant)', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-on-surface)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-outline-variant)'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

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
                : 'Login to Forge'
              }
            </button>
          </form>

          {/* Footer */}
          <p style={{ marginTop: 'var(--spacing-lg)', fontSize: 16, color: 'var(--color-on-surface-variant)' }}>
            Don't have an account?{' '}
            <a href="/register" onClick={e => { e.preventDefault(); navigate('/register'); }} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >Create Account</a>
          </p>

          {/* Trust Footer */}
          <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid rgba(19,2,37,0.05)', width: '100%', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: '1.6', color: 'var(--color-outline-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 16px', marginBottom: 16 }}>
              Trusted by innovation labs, universities and startup communities.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, opacity: 0.3 }}>
              {[64, 80, 56].map((w, i) => (
                <div key={i} style={{ height: 16, width: w, background: 'var(--color-outline-variant)', borderRadius: 9999 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Links */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)' }}>
          <a href="#" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(74,69,77,0.6)', textDecoration: 'none' }}>Privacy Policy</a>
          <span style={{ color: 'rgba(204,196,206,0.3)' }}>•</span>
          <a href="#" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(74,69,77,0.6)', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </main>

      {/* Cursor glow */}
      <div ref={cursorGlowRef} style={{ position: 'fixed', pointerEvents: 'none', width: 600, height: 600, background: 'rgba(249,181,254,0.1)', borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(-50%, -50%)', zIndex: -1, opacity: 0, transition: 'opacity 0.3s' }} />

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 10, 25, 0.4)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid rgba(43,25,61,0.08)',
            boxShadow: '0 24px 64px -16px rgba(43,25,61,0.25)',
            borderRadius: 24,
            padding: 32,
            width: '100%',
            maxWidth: 440,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            boxSizing: 'border-box',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, background: 'var(--color-primary-container)', color: '#fff', borderRadius: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>account_circle</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 4px 0' }}>Select Your Role</h2>
              <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', margin: 0 }}>To complete your sign-up, choose how you will use HackForge.</p>
            </div>

            {/* Role Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { value: 'participant', label: 'Participant', desc: 'Register for events & submit projects', icon: 'person' },
                { value: 'organizer', label: 'Organizer', desc: 'Create organizations & host events', icon: 'groups' },
                { value: 'judge', label: 'Judge', desc: 'Evaluate project submissions', icon: 'gavel' }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedRole(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    border: selectedRole === opt.value ? '2px solid var(--color-secondary)' : '1px solid rgba(19,2,37,0.1)',
                    borderRadius: 16,
                    background: selectedRole === opt.value ? 'rgba(249,181,254,0.1)' : 'var(--color-surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <span className="material-symbols-outlined" style={{
                    fontSize: 24,
                    color: selectedRole === opt.value ? 'var(--color-secondary)' : 'var(--color-outline-variant)',
                    fontVariationSettings: selectedRole === opt.value ? "'FILL' 1" : "'FILL' 0"
                  }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {selectedRole === opt.value && (
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)', fontSize: 20 }}>check_circle</span>
                  )}
                </button>
              ))}
            </div>

            {/* Organization Input for Organizers */}
            {selectedRole === 'organizer' && (
              <div style={{ animation: 'fadeIn 0.2s ease', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="modalOrgName" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-on-surface-variant)', marginLeft: 4 }}>ORGANIZATION NAME</label>
                <input
                  id="modalOrgName"
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="e.g. Stanford Innovation Lab"
                  style={{
                    width: '100%',
                    padding: 12,
                    background: '#fff',
                    border: '1px solid rgba(19,2,37,0.1)',
                    borderRadius: 12,
                    fontSize: 15,
                    outline: 'none',
                    color: 'var(--color-on-surface)',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-secondary)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(19,2,37,0.1)'}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'none',
                  border: '1px solid rgba(19,2,37,0.1)',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--color-on-surface-variant)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleSubmit}
                disabled={selectedRole === 'organizer' && !orgName}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: (selectedRole === 'organizer' && !orgName) ? 'var(--color-outline-variant)' : 'var(--color-primary-container)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: (selectedRole === 'organizer' && !orgName) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(19,2,37,0.1)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (!(selectedRole === 'organizer' && !orgName)) e.currentTarget.style.background = 'var(--color-secondary)'; }}
                onMouseLeave={e => { if (!(selectedRole === 'organizer' && !orgName)) e.currentTarget.style.background = 'var(--color-primary-container)'; }}
              >
                Confirm & Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
