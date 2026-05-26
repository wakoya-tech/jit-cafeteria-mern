import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Reports() {
  const [period, setPeriod] = useState('daily');
  const [tab, setTab] = useState('meals');
  const [report, setReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const mealsReq = api(`/reports/meals?period=${period}`).then(setReport);
    const invReq = api(`/reports/inventory-usage?period=${period}`).then(setInventoryReport);
    Promise.all([mealsReq, invReq])
      .catch((e) => alert(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [period]);

  return (
    <div>
      <div className="page-header">
        <h2>Operational Reports</h2>
        <p>Meals served and inventory usage — daily, weekly, monthly (SRS)</p>
      </div>

      <div className="flex-row no-print" style={{ marginBottom: '1rem' }}>
        {['daily', 'weekly', 'monthly'].map((p) => (
          <button
            key={p}
            type="button"
            className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
          Print report
        </button>
      </div>

      <div className="terminal-mode-tabs no-print" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className={`btn ${tab === 'meals' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('meals')}
        >
          Meals served
        </button>
        <button
          type="button"
          className={`btn ${tab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('inventory')}
        >
          Inventory usage
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {tab === 'meals' && report && (
        <>
          <div className="card-grid">
            <div className="card stat-card">
              <div className="value">{report.totalMeals}</div>
              <div className="label">Total meals ({report.period})</div>
            </div>
            <div className="card stat-card">
              <div className="value">{report.byMealType?.breakfast || 0}</div>
              <div className="label">Breakfast</div>
            </div>
            <div className="card stat-card">
              <div className="value">{report.byMealType?.lunch || 0}</div>
              <div className="label">Lunch</div>
            </div>
            <div className="card stat-card">
              <div className="value">{report.byMealType?.dinner || 0}</div>
              <div className="label">Dinner</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3>By department</h3>
            <table>
              <tbody>
                {Object.entries(report.byDepartment || {}).map(([dept, count]) => (
                  <tr key={dept}>
                    <td>{dept}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Recent transactions</h3>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Meal</th>
                  <th>Verification</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {(report.transactions || []).map((t) => (
                  <tr key={t._id}>
                    <td>
                      {t.transaction_time} — {new Date(t.transaction_date).toLocaleDateString()}
                    </td>
                    <td>
                      {t.student_name} ({t.student_id})
                    </td>
                    <td>{t.department}</td>
                    <td>{t.meal_type}</td>
                    <td>{t.verification_method || '—'}</td>
                    <td>{t.override_reason?.replace(/_/g, ' ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'inventory' && inventoryReport && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3>Estimated stock issued ({inventoryReport.period})</h3>
            <p className="qr-scanner-hint">Calculated from meals served × standard portion plan</p>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Estimated usage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(inventoryReport.estimatedUsage || {}).map(([item, qty]) => (
                  <tr key={item}>
                    <td>{item}</td>
                    <td>{qty.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Current stock levels</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Closing balance</th>
                  <th>Unit</th>
                  <th>Reorder at</th>
                </tr>
              </thead>
              <tbody>
                {(inventoryReport.currentStock || []).map((i) => (
                  <tr key={i._id}>
                    <td>{i.item_name}</td>
                    <td>{i.closing_balance}</td>
                    <td>{i.unit}</td>
                    <td>{i.reorder_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
