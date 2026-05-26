import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITY, universityTitle } from '../config/university';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.role === 'cashier') navigate('/cashier');
      else navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo">
          <h1>{UNIVERSITY.cafeteria}</h1>
          <p>{universityTitle()}</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>
          Demo: admin / admin123 · cashier1 / cashier123
        </p>
        <p style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <Link to="/feedback">Submit feedback (students)</Link>
        </p>
      </div>
    </div>
  );
}
