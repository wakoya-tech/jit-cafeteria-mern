import { useEffect, useState } from 'react';
import { api } from '../api/client';

const ROLES = ['administrator', 'cafeteria_manager', 'cashier'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => api('/users').then(setUsers);

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (form._id) {
        const body = { role: form.role, fullName: form.fullName };
        if (form.password) body.password = form.password;
        await api(`/users/${form._id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/users', { method: 'POST', body: JSON.stringify(form) });
      }
      setForm(null);
      setMsg('User saved.');
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <p>Register and manage system accounts</p>
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}
      <button
        type="button"
        className="btn btn-primary"
        style={{ marginBottom: '1rem' }}
        onClick={() => setForm({ username: '', password: '', role: 'cashier', fullName: '' })}
      >
        + Add User
      </button>

      {form && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <form onSubmit={save}>
            {!form._id && (
              <div className="form-group">
                <label>Username</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>{form._id ? 'New Password (optional)' : 'Password'}</label>
              <input
                type="password"
                value={form.password || ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!form._id}
              />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-row">
              <button type="submit" className="btn btn-primary">
                Save
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.fullName}</td>
                <td>{u.role}</td>
                <td>
                  <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...u, password: '' })}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
