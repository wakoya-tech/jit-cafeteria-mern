import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { UNIVERSITY, universityTitle } from '../config/university';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.role === 'ticker' || user.role === 'cashier') navigate('/ticker');
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
          <img
            src="/jit-logo.png"
            alt="Jimma University"
            style={{ width: 96, margin: '0 auto 0.6rem', display: 'block' }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/jit-logo.svg';
            }}
          />
          <h1>{UNIVERSITY.cafeteria}</h1>
          <p>{universityTitle()}</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('username')}</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('username_placeholder')}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? t('signing_in') : t('login')}
          </button>
        </form>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>
          {t('demo_credentials')}
        </p>
        <p style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <Link to="/feedback">{t('submit_feedback')}</Link>
        </p>
      </div>
    </div>
  );
}
