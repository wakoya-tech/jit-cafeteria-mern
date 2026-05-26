import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Complaints() {
  const [list, setList] = useState([]);

  const load = () => api('/complaints').then(setList);

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status, response) => {
    await api(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, response }),
    });
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h2>Complaints & Feedback</h2>
        <p>Digital replacement for paper complaint forms (Appendix A-3)</p>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c._id}>
                <td>{new Date(c.createdAt).toLocaleString()}</td>
                <td>{c.category}</td>
                <td>{c.description.slice(0, 80)}...</td>
                <td>
                  <span className={`badge badge-${c.status === 'resolved' ? 'success' : 'warning'}`}>
                    {c.status}
                  </span>
                </td>
                <td>
                  {c.status === 'pending' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => updateStatus(c._id, 'reviewed', 'Under review')}
                    >
                      Review
                    </button>
                  )}
                  {c.status !== 'resolved' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginLeft: 4 }}
                      onClick={() => updateStatus(c._id, 'resolved', 'Resolved by management')}
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p style={{ padding: '1rem', color: 'var(--muted)' }}>No complaints yet.</p>}
      </div>
    </div>
  );
}
