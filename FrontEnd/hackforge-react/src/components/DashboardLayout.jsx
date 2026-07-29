import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

/** Consistent page heading used by every dashboard page. */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
    </header>
  );
}

const ROLE_LABELS = {
  organizer: 'Organizer',
  admin: 'Admin',
  participant: 'Participant',
  judge: 'Judge',
};

/**
 * Shared dashboard shell: fixed sidebar (nav + user card) and a scrollable
 * content column. Nav items render as real links so every dashboard button
 * has its own route and URL.
 *
 * navItems: [{ icon, label, to, end?, onClick? }]
 */
export default function DashboardLayout({ navItems, children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const userName = user?.full_name || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const roleLabel = ROLE_LABELS[user?.role] || 'Member';

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <button className="dash-brand" onClick={() => navigate('/')}>HackForge</button>

        <nav className="dash-nav">
          {navItems.map(item => (
            item.onClick ? (
              <button key={item.label} onClick={item.onClick} className="sidebar-nav-item">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
                {item.label}
              </button>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-nav-item${isActive ? ' nav-active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            )
          ))}
        </nav>

        <div className="dash-foot">
          <button onClick={handleLogout} className="sidebar-nav-item">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            Log out
          </button>
          <div className="dash-user">
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'var(--color-primary-container)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>{userInitials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</p>
              <p className="label-mono" style={{ fontSize: 10 }}>{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-main-inner">
          {children}
        </div>
      </main>
    </div>
  );
}
