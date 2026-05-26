import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITY } from '../config/university';

const NAV = {
  administrator: [
    { to: '/', label: 'Dashboard' },
    { to: '/cashier', label: 'Meal Terminal' },
    { to: '/staff', label: 'Staff Management' },
    { to: '/students', label: 'Students' },
    { to: '/users', label: 'Users' },
    { to: '/menus', label: 'Daily Program' },
    { to: '/quality', label: 'Quality Inspection' },
    { to: '/inventory', label: 'Inventory' },
    { to: '/reports', label: 'Reports' },
    { to: '/complaints', label: 'Complaints' },
    { to: '/university-sync', label: 'University Sync' },
    { to: '/waste-tracking', label: 'Waste Tracking' },
    { to: '/special-meals', label: 'Special Meals' },
    { to: '/profile', label: 'Profile' },
  ],
  cafeteria_manager: [
    { to: '/', label: 'Dashboard' },
    { to: '/cashier', label: 'Meal Terminal' },
    { to: '/staff', label: 'Staff Management' },
    { to: '/students', label: 'Students' },
    { to: '/menus', label: 'Daily Program' },
    { to: '/quality', label: 'Quality Inspection' },
    { to: '/inventory', label: 'Inventory' },
    { to: '/reports', label: 'Reports' },
    { to: '/complaints', label: 'Complaints' },
    { to: '/waste-tracking', label: 'Waste Tracking' },
    { to: '/special-meals', label: 'Special Meals' },
    { to: '/profile', label: 'Profile' },
  ],
  cashier: [
    { to: '/cashier', label: 'Meal Terminal' },
    { to: '/menus', label: 'Daily Program' },
    { to: '/students', label: 'Students' },
    { to: '/profile', label: 'Profile' },
  ],
  registrar: [
    { to: '/students', label: 'Student Registry' },
    { to: '/university-sync', label: 'University Sync' },
    { to: '/profile', label: 'Profile' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user?.role] || NAV.cashier;

  return (
    <div className="app-layout">
      <aside className="sidebar no-print">
        <div className="sidebar-brand">
          <h1>{UNIVERSITY.name}</h1>
          <p>{UNIVERSITY.cafeteria}</p>
          <p className="sidebar-sub">{UNIVERSITY.institute}</p>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '2rem', fontSize: '0.8rem', opacity: 0.9 }}>
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
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}