import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CashierTerminal from './pages/CashierTerminal';
import Students from './pages/Students';
import Users from './pages/Users';
import Menus from './pages/Menus';
import QualityInspections from './pages/QualityInspections';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Complaints from './pages/Complaints';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';
import StaffManagementPage from './pages/StaffManagementPage';
import UniversitySync from './pages/UniversitySync';
import WasteTracking from './pages/WasteTracking';
import SpecialMealRequests from './pages/SpecialMealRequests';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/cashier" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-page">
        <p style={{ color: '#fff' }}>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route
          index
          element={
            <PrivateRoute roles={['administrator', 'cafeteria_manager']}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="cashier" element={<CashierTerminal />} />
        <Route path="students" element={<Students />} />
        <Route
          path="users"
          element={
            <PrivateRoute roles={['administrator']}>
              <Users />
            </PrivateRoute>
          }
        />
        <Route
          path="staff"
          element={
            <PrivateRoute roles={['administrator', 'cafeteria_manager']}>
              <StaffManagementPage />
            </PrivateRoute>
          }
        />
        <Route path="menus" element={<Menus />} />
        <Route
          path="quality"
          element={
            <PrivateRoute roles={['administrator', 'cafeteria_manager']}>
              <QualityInspections />
            </PrivateRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <PrivateRoute roles={['administrator', 'cafeteria_manager']}>
              <Inventory />
            </PrivateRoute>
          }
        />
        <Route
          path="reports"
          element={
            <PrivateRoute roles={['administrator', 'cafeteria_manager']}>
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path="complaints"
          element={
            <PrivateRoute roles={['administrator', 'cafeteria_manager']}>
              <Complaints />
            </PrivateRoute>
          }
        />
        <Route
          path="university-sync"
          element={
            <PrivateRoute roles={['administrator', 'registrar']}>
              <UniversitySync />
            </PrivateRoute>
          }
        />
        <Route
          path="waste-tracking"
          element={
            <PrivateRoute roles={['administrator', 'cafeteria_manager']}>
              <WasteTracking />
            </PrivateRoute>
          }
        />
        <Route
          path="special-meals"
          element={
            <PrivateRoute roles={['administrator', 'cafeteria_manager']}>
              <SpecialMealRequests />
            </PrivateRoute>
          }
        />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}