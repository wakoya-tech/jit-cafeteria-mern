import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Inventory() {
  const [data, setData] = useState({ items: [], lowStock: [] });
  const [issueId, setIssueId] = useState('');
  const [issueQty, setIssueQty] = useState('');

  const load = () => api('/inventory').then(setData);

  useEffect(() => {
    load();
  }, []);

  const issueStock = async () => {
    if (!issueId || !issueQty) return;
    try {
      await api(`/inventory/${issueId}`, {
        method: 'PUT',
        body: JSON.stringify({ issued_qty: Number(issueQty) }),
      });
      setIssueId('');
      setIssueQty('');
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Inventory Tracking</h2>
        <p>Monitor food stock — replaces manual ledger (Appendix A-4)</p>
      </div>

      {data.lowStockCount > 0 && (
        <div className="alert alert-info">
          {data.lowStockCount} item(s) at or below reorder level
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Issue Stock (daily usage)</h3>
        <div className="flex-row">
          <select value={issueId} onChange={(e) => setIssueId(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">Select item</option>
            {data.items.map((i) => (
              <option key={i._id} value={i._id}>
                {i.item_name} ({i.closing_balance} {i.unit})
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Qty issued"
            value={issueQty}
            onChange={(e) => setIssueQty(e.target.value)}
            style={{ maxWidth: 120 }}
          />
          <button type="button" className="btn btn-primary" onClick={issueStock}>
            Record Issue
          </button>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Opening</th>
              <th>Received</th>
              <th>Issued</th>
              <th>Closing</th>
              <th>Supplier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i._id}>
                <td>{i.item_name}</td>
                <td>{i.opening_balance}</td>
                <td>{i.received_qty}</td>
                <td>{i.issued_qty}</td>
                <td>
                  <strong>{i.closing_balance}</strong> {i.unit}
                </td>
                <td>{i.supplier}</td>
                <td>
                  {i.closing_balance <= i.reorder_level ? (
                    <span className="badge badge-warning">Low</span>
                  ) : (
                    <span className="badge badge-success">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
