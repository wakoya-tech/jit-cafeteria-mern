import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { fullName };
      if (password) body.password = password;
      await authApi.updateProfile(body);
      setMsg('Profile updated.');
      setPassword('');
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>My Profile</h2>
        <p>Update your account information</p>
      </div>
      <div className="card" style={{ maxWidth: 400 }}>
        {msg && <div className="alert alert-info">{msg}</div>}
        <form onSubmit={save}>
          <div className="form-group">
            <label>Username</label>
            <input value={user?.username || ''} disabled />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input value={user?.role || ''} disabled />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
