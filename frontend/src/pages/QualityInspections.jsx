import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'injera', label: 'Injera (count pieces)' },
  { value: 'shiro_flour', label: 'Shiro flour / sauce raw' },
  { value: 'berbere', label: 'Berbere spice' },
  { value: 'bakery', label: 'Bread / buns' },
  { value: 'lentils', label: 'Lentils (misir)' },
  { value: 'onion', label: 'Onion' },
  { value: 'garlic', label: 'Garlic' },
  { value: 'rice', label: 'Rice' },
  { value: 'oil', label: 'Cooking oil' },
  { value: 'hot_food', label: 'Other hot prepared food' },
  { value: 'other', label: 'Other' },
];

const emptyForm = () => ({
  supplier_name: 'Local Supplier',
  item_type: 'Injera delivery',
  item_category: 'injera',
  quantity: 200,
  quantity_ordered: 200,
  quantity_counted: 200,
  injera_count: 200,
  delivery_date: new Date().toISOString().slice(0, 10),
  delivery_time: new Date().toTimeString().slice(0, 5),
  temperature_celsius: 55,
  weight_verified: true,
  mold: false,
  damage: false,
  discoloration: false,
  bad_smell: false,
  defect_notes: '',
  rejection_action: 'return_supplier',
});

export default function QualityInspections() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [guide, setGuide] = useState(null);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => api('/quality').then(setList).catch((e) => setMsg(e.message));

  useEffect(() => {
    load();
    api('/quality/guide').then(setGuide).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const body = {
      ...form,
      quantity: Number(form.quantity),
      quantity_ordered: Number(form.quantity_ordered ?? form.quantity),
      quantity_counted: Number(
        form.item_category === 'injera'
          ? form.injera_count
          : (form.quantity_counted ?? form.quantity)
      ),
      injera_count: form.item_category === 'injera' ? Number(form.injera_count) : undefined,
      temperature_celsius:
        form.temperature_celsius !== '' ? Number(form.temperature_celsius) : undefined,
      inspector_name: user?.fullName || user?.username,
    };
    try {
      const res = form._id
        ? await api(`/quality/${form._id}`, { method: 'PUT', body: JSON.stringify(body) })
        : await api('/quality', { method: 'POST', body: JSON.stringify(body) });
      setForm(null);
      setMsg(res.message || 'Inspection saved.');
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Food Quality Inspection</h2>
        <p>Real delivery QA — count injera, check sauce raw materials, reject bad local supplier loads</p>
      </div>

      {msg && (
        <div className={`alert ${msg.includes('REJECTED') ? 'alert-error' : 'alert-info'}`}>{msg}</div>
      )}

      {guide && (
        <div className="card help-card" style={{ marginBottom: '1rem' }}>
          <h3>How to test food quality (real process)</h3>
          <ol className="help-list numbered">
            {guide.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        style={{ marginBottom: '1rem' }}
        onClick={() => setForm(emptyForm())}
      >
        + New delivery inspection
      </button>

      {form && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>{form._id ? 'Edit' : 'Inspect'} supplier delivery</h3>
          <form onSubmit={save}>
            <div className="flex-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Supplier</label>
                <input
                  value={form.supplier_name}
                  onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Category</label>
                <select
                  value={form.item_category}
                  onChange={(e) => setForm({ ...form, item_category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Item description</label>
              <input
                value={form.item_type}
                onChange={(e) => setForm({ ...form, item_type: e.target.value })}
                required
              />
            </div>

            {form.item_category === 'injera' && (
              <div className="form-group highlight-field">
                <label>Injera count (physical count — do not trust invoice only)</label>
                <input
                  type="number"
                  min="0"
                  value={form.injera_count}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      injera_count: e.target.value,
                      quantity_counted: e.target.value,
                    })
                  }
                  required
                />
              </div>
            )}

            <div className="flex-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Qty on invoice</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity_ordered}
                  onChange={(e) => setForm({ ...form, quantity_ordered: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Qty counted / received</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity_counted}
                  onChange={(e) => setForm({ ...form, quantity_counted: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Temperature (°C)</label>
                <input
                  type="number"
                  value={form.temperature_celsius}
                  onChange={(e) => setForm({ ...form, temperature_celsius: e.target.value })}
                  placeholder="Injera ≥50"
                />
              </div>
            </div>

            {((form.item_category === 'injera' || form.item_category === 'hot_food') && form.temperature_celsius !== '' && Number(form.temperature_celsius) < 50) && (
              <div className="temp-breach-warning">
                ⚠️ <strong>Critical Temperature Breach:</strong> Food is measured at{' '}
                {form.temperature_celsius}°C (below JiT safety threshold of 50°C). Deliveries of
                injera and hot foods must remain hot to minimize bacterial growth. Rejection is recommended!
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.weight_verified}
                  onChange={(e) => setForm({ ...form, weight_verified: e.target.checked })}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />{' '}
                Weight verified (for kg items: rice, flour, lentils)
              </label>
            </div>

            <fieldset className="inspection-defects">
              <legend>Defect Checklist (Automatic Grade F if checked)</legend>
              <div className="inspection-defects-grid">
                {['mold', 'damage', 'discoloration', 'bad_smell'].map((field) => (
                  <label key={field} style={{ textTransform: 'capitalize' }}>
                    <input
                      type="checkbox"
                      checked={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.checked })}
                    />{' '}
                    {field.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="form-group" style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ marginBottom: '0.4rem' }}>AI-Generated Food Safety Rating Preview</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span className={`food-grade-badge ${
                  (form.mold || form.bad_smell || form.damage || form.discoloration || 
                  ((form.item_category === 'injera' || form.item_category === 'hot_food') && form.temperature_celsius !== '' && Number(form.temperature_celsius) < 50))
                    ? 'f'
                    : (!form.weight_verified || Number(form.quantity_counted) < Number(form.quantity_ordered))
                    ? 'b'
                    : 'a'
                }`}>
                  {(form.mold || form.bad_smell || form.damage || form.discoloration || 
                  ((form.item_category === 'injera' || form.item_category === 'hot_food') && form.temperature_celsius !== '' && Number(form.temperature_celsius) < 50))
                    ? 'Grade F - Rejection Recommended'
                    : (!form.weight_verified || Number(form.quantity_counted) < Number(form.quantity_ordered))
                    ? 'Grade B - Acceptable with Caution'
                    : 'Grade A - Excellent Safety'}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  (Evaluated in real-time based on temperature, molds, weights, and counts)
                </span>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label>If rejected — action</label>
              <select
                value={form.rejection_action}
                onChange={(e) => setForm({ ...form, rejection_action: e.target.value })}
              >
                <option value="return_supplier">Return to supplier</option>
                <option value="discard">Discard</option>
                <option value="partial_accept">Partial accept</option>
              </select>
            </div>

            <div className="form-group">
              <label>Defect Notes</label>
              <textarea
                rows={2}
                value={form.defect_notes || ''}
                onChange={(e) => setForm({ ...form, defect_notes: e.target.value })}
                placeholder="Describe any quality issues..."
              />
            </div>

            <p className="qr-scanner-hint" style={{ marginBottom: '1rem' }}>
              Pass = stock automatically added to inventory. Fail = supplier load rejected, not added.
            </p>

            <div className="flex-row">
              <button type="submit" className="btn btn-primary">
                Complete inspection
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
              <th>Date</th>
              <th>Supplier</th>
              <th>Item</th>
              <th>Count</th>
              <th>Temp</th>
              <th>Result</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row._id}>
                <td>{new Date(row.delivery_date).toLocaleDateString()}</td>
                <td>{row.supplier_name}</td>
                <td>
                  {row.item_type}
                  <br />
                  <small>{row.item_category}</small>
                </td>
                <td>
                  {row.injera_count ? `${row.injera_count} injera` : row.quantity_counted ?? row.quantity}
                </td>
                <td>{row.temperature_celsius != null ? `${row.temperature_celsius}°C` : '—'}</td>
                <td>
                  <span className={`badge ${row.passed ? 'badge-success' : 'badge-danger'}`}>
                    {row.passed ? 'Accepted' : 'Rejected'}
                  </span>
                  {!row.passed && row.fail_reasons?.length > 0 && (
                    <small style={{ display: 'block' }}>{row.fail_reasons.join('; ')}</small>
                  )}
                </td>
                <td>{row.stock_received ? 'Added' : row.passed ? '—' : 'Not added'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
