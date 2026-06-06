import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITY } from '../config/university';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/TranslationContext';
const NAV = {
  administrator: [
    { to: '/', labelKey: 'dashboard' },
    { to: '/monitoring', labelKey: 'monitoring' },
    { to: '/users', labelKey: 'users' },
    { to: '/reports', labelKey: 'reports' },
    { to: '/complaints', labelKey: 'complaints_feedback' },
    { to: '/university-sync', labelKey: 'university_sync' },
    { to: '/special-meals', labelKey: 'special_meal_requests' },
    { to: '/profile', labelKey: 'profile' },
  ],
  cafeteria_manager: [
    { to: '/', labelKey: 'dashboard' },
    { to: '/monitoring', labelKey: 'monitoring' },
    { to: '/ticker', labelKey: 'ticker' },
    { to: '/staff', labelKey: 'staff_management' },
    { to: '/students', labelKey: 'students' },
    { to: '/menus', labelKey: 'daily_program' },
    { to: '/quality', labelKey: 'quality_inspection' },
    { to: '/inventory', labelKey: 'inventory_tracking' },
    { to: '/reports', labelKey: 'reports' },
    { to: '/complaints', labelKey: 'complaints_feedback' },
    { to: '/waste-tracking', labelKey: 'waste_tracking' },
    { to: '/special-meals', labelKey: 'special_meal_requests' },
    { to: '/profile', labelKey: 'profile' },
  ],
  ticker: [
    { to: '/ticker', labelKey: 'ticker' },
    { to: '/menus', labelKey: 'daily_program' },
    { to: '/students', labelKey: 'students' },
    { to: '/profile', labelKey: 'profile' },
  ],
  registrar: [
    { to: '/students', labelKey: 'student_registry' },
    { to: '/university-sync', labelKey: 'university_sync' },
    { to: '/profile', labelKey: 'profile' },
  ],
  cashier: [
    { to: '/ticker', labelKey: 'ticker' },
    { to: '/menus', labelKey: 'daily_program' },
    { to: '/students', labelKey: 'students' },
    { to: '/profile', labelKey: 'profile' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const links = NAV[user?.role] || NAV.ticker;

  return (
    <div className="app-layout">
      <aside className="sidebar no-print">
        <div className="sidebar-brand">
          <img
            src="/jit-logo.png"
            alt="Jimma University"
            className="sidebar-logo"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/jit-logo.svg';
            }}
          />
          <h1>{UNIVERSITY.name}</h1>
          <p>{UNIVERSITY.cafeteria}</p>
          <p className="sidebar-sub">{UNIVERSITY.institute}</p>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>
              {t(l.labelKey)}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '2rem', fontSize: '0.8rem', opacity: 0.9 }}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="language-select" style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', opacity: 0.8 }}>
              {t('language')}
            </label>
            <select
              id="language-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid rgba(59,130,246,0.35)', background: 'transparent', color: 'inherit' }}
            >
              <option value="en">{t('english')}</option>
              <option value="om">{t('oromo')}</option>
              <option value="am">{t('amharic')}</option>
            </select>
          </div>
          <button
            type="button"
            className="btn btn-secondary theme-toggle"
            style={{ marginBottom: '1rem', width: '100%' }}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          </button>
          <p>{user?.fullName || user?.username}</p>
          <p style={{ textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: '0.75rem', width: '100%' }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            {t('logout')}
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
