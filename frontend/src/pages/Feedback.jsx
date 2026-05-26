import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Feedback() {
  const [form, setForm] = useState({
    category: 'food_quality',
    description: '',
    is_anonymous: true,
    student_id: '',
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (done) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--success)' }}>Thank you!</h2>
          <p>Your feedback has been submitted.</p>
          <Link to="/login" className="btn btn-primary mt-1">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--jit-green-dark)' }}>Student Feedback</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          Submit anonymously — Jimma University Cafeteria
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="food_quality">Food Quality</option>
              <option value="service">Service</option>
              <option value="cleanliness">Cleanliness</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={form.is_anonymous}
                onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
              />{' '}
              Submit anonymously
            </label>
          </div>
          {!form.is_anonymous && (
            <div className="form-group">
              <label>Student ID (optional)</label>
              <input
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Submit Feedback
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/login">Staff login</Link>
        </p>
      </div>
    </div>
  );
}
