import { useEffect, useState } from 'react';
import { api } from '../api/client';
import StudentQrCard from '../components/StudentQrCard';
import { UNIVERSITY } from '../config/university';
import { useAuth } from '../context/AuthContext';

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [qrStudent, setQrStudent] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () =>
    api(`/students${search ? `?search=${encodeURIComponent(search)}` : ''}`).then((results) => {
      setStudents(results);
      return results;
    });

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, [search]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (form._id) {
        await api(`/students/${form._id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/students', { method: 'POST', body: JSON.stringify(form) });
      }
      setForm(null);
      setMsg('Student saved.');
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const isRegistrar = user?.role === 'registrar';

  return (
    <div>
      <div className="page-header">
        <h2>Student Registry</h2>
        <p>
          {UNIVERSITY.name} — meal eligibility and printable QR meal cards
        </p>
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}

      {!isRegistrar && (
        <div className="registrar-notice">
          <div className="icon">🏛️</div>
          <div className="text">
            <h4>Jimma University Registrar Portal Integration</h4>
            <p>
              Student cafeteria rosters are synchronized directly from academic affairs databases.
              Cafeteria tickers, managers, and administrators have <strong>read-only access</strong> and
              cannot register new students or edit student details.
            </p>
          </div>
        </div>
      )}

      <div className="flex-row" style={{ marginBottom: '1.5rem' }}>
        <input
          placeholder="Search by ID or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        {isRegistrar && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              setForm({
                student_id: '',
                name: '',
                department: '',
                program: 'BSc',
                year: 1,
                eligibility_status: true,
                is_intern: false,
                is_non_cafe: false,
                imageUrl: '',
              })
            }
          >
            + Register Student
          </button>
        )}
      </div>

      {form && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>{form._id ? 'Edit' : 'Register'} Student</h3>
          <form onSubmit={save}>
            <div className="form-group">
              <label>Student ID</label>
              <input
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                required
                disabled={!!form._id}
              />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Student Profile Image URL</label>
              <input
                type="text"
                placeholder="e.g. https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                value={form.imageUrl || ''}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>
            <div className="form-group flex-row" style={{ gap: '2rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.eligibility_status}
                  onChange={(e) => setForm({ ...form, eligibility_status: e.target.checked })}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />{' '}
                Eligible for meals
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_intern || false}
                  onChange={(e) => setForm({ ...form, is_intern: e.target.checked })}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />{' '}
                Currently on Internship (Intern)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_non_cafe || false}
                  onChange={(e) => setForm({ ...form, is_non_cafe: e.target.checked })}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />{' '}
                Non-Cafeteria Student
              </label>
            </div>
            {form._id && (
              <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--jit-gold)' }}>
                <h3>Biometric Enrollment</h3>
                <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  Simulate enrollment of face and fingerprint templates for this student. In production this would connect to biometric hardware and secure template storage.
                </p>
                <div className="form-group">
                  <label>Face template</label>
                  <textarea
                    value={form.faceTemplate || ''}
                    onChange={(e) => setForm({ ...form, faceTemplate: e.target.value })}
                    placeholder="Paste face template data or leave blank if not enrolled"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Fingerprint template</label>
                  <textarea
                    value={form.fingerprintTemplate || ''}
                    onChange={(e) => setForm({ ...form, fingerprintTemplate: e.target.value })}
                    placeholder="Paste fingerprint template data or leave blank if not enrolled"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <div className="flex-row">
              <button type="submit" className="btn btn-primary">
                Save Student
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
              <th>ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Status Indicators</th>
              <th>QR card</th>
              {isRegistrar && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id}>
                <td>{s.student_id}</td>
                <td>{s.name}</td>
                <td>{s.department}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${s.eligibility_status && !s.is_intern && !s.is_non_cafe ? 'badge-success' : 'badge-danger'}`}>
                      {s.eligibility_status && !s.is_intern && !s.is_non_cafe ? 'Eligible' : 'Blocked'}
                    </span>
                    {s.is_intern && <span className="badge badge-warning">Intern</span>}
                    {s.is_non_cafe && <span className="badge badge-danger">Non-Cafe</span>}
                    {s.faceTemplate && <span className="badge badge-success">Face enrolled</span>}
                    {s.fingerprintTemplate && <span className="badge badge-success">Fingerprint enrolled</span>}
                  </div>
                </td>
                <td>
                  <button type="button" className="btn btn-secondary" onClick={() => setQrStudent(s)}>
                    Show QR
                  </button>
                </td>
                {isRegistrar && (
                  <td>
                    <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...s })}>
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {qrStudent && <StudentQrCard student={qrStudent} onClose={() => setQrStudent(null)} />}
    </div>
  );
}
