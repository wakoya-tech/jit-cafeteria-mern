import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function WasteTracking() {
    const [analytics, setAnalytics] = useState(null);
    const [period, setPeriod] = useState('weekly');
    const [showForm, setShowForm] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [form, setForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        mealType: 'lunch',
        itemName: '',
        category: 'food',
        quantityWasted: '',
        unit: 'kg',
        estimatedCost: '',
        reason: 'overproduction',
        reasonDetails: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const loadAnalytics = async () => {
        try {
            const data = await api(`/waste/analytics?period=${period}`);
            setAnalytics(data);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        }
    };

    const loadSuggestions = async () => {
        try {
            const data = await api('/waste/suggestions');
            setSuggestions(data);
        } catch (err) {
            console.error('Failed to load suggestions:', err);
        }
    };

    const recordWaste = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api('/waste', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    quantityWasted: parseFloat(form.quantityWasted),
                    estimatedCost: parseFloat(form.estimatedCost) || 0
                })
            });
            alert('✅ Waste recorded successfully');
            setShowForm(false);
            setForm({
                date: new Date().toISOString().slice(0, 10),
                mealType: 'lunch',
                itemName: '',
                category: 'food',
                quantityWasted: '',
                unit: 'kg',
                estimatedCost: '',
                reason: 'overproduction',
                reasonDetails: ''
            });
            loadAnalytics();
        } catch (err) {
            alert('Failed to record waste: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
        loadSuggestions();
    }, [period]);

    const getReasonLabel = (reason) => {
        const labels = {
            overproduction: 'Overproduction',
            spoilage: 'Spoilage',
            quality_issue: 'Quality Issue',
            student_uneaten: 'Student Uneaten',
            expiration: 'Expiration',
            other: 'Other'
        };
        return labels[reason] || reason;
    };

    return (
        <div>
            <div className="page-header">
                <h2>Waste Tracking & Analytics</h2>
                <p>Monitor food waste and get reduction recommendations</p>
            </div>

            {/* Period Selector */}
            <div className="flex-row" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
                <button
                    className={`btn ${period === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPeriod('daily')}
                >
                    Daily
                </button>
                <button
                    className={`btn ${period === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPeriod('weekly')}
                >
                    Weekly
                </button>
                <button
                    className={`btn ${period === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPeriod('monthly')}
                >
                    Monthly
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(true)}
                    style={{ marginLeft: 'auto' }}
                >
                    + Record Waste
                </button>
            </div>

            {/* Stats Cards */}
            {analytics && (
                <div className="card-grid">
                    <div className="card stat-card">
                        <div className="value">{analytics.summary.totalWasteQuantity} {analytics.summary.totalWasteQuantity ? 'kg' : 'kg'}</div>
                        <div className="label">Total Waste</div>
                    </div>
                    <div className="card stat-card">
                        <div className="value">ETB {analytics.summary.totalCost}</div>
                        <div className="label">Total Cost</div>
                    </div>
                    <div className="card stat-card">
                        <div className="value">{analytics.summary.totalRecords}</div>
                        <div className="label">Records</div>
                    </div>
                    <div className="card stat-card">
                        <div className="value">{analytics.summary.avgWastePerMeal}</div>
                        <div className="label">Avg Waste/Meal (kg)</div>
                    </div>
                </div>
            )}

            {/* Waste by Reason */}
            {analytics && analytics.byReason && Object.keys(analytics.byReason).length > 0 && (
                <div className="card">
                    <h3>Waste by Reason</h3>
                    <div className="stats-breakdown">
                        {Object.entries(analytics.byReason).map(([reason, quantity]) => (
                            <div key={reason} className="stat-item">
                                <strong>{getReasonLabel(reason)}</strong>
                                <span>{quantity.toFixed(1)} kg</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Waste by Meal Type */}
            {analytics && analytics.byMealType && (
                <div className="card">
                    <h3>Waste by Meal Type</h3>
                    <div className="stats-breakdown">
                        {Object.entries(analytics.byMealType).map(([meal, quantity]) => (
                            <div key={meal} className="stat-item">
                                <strong>{meal.charAt(0).toUpperCase() + meal.slice(1)}</strong>
                                <span>{quantity.toFixed(1)} kg</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Wasted Items */}
            {analytics && analytics.topWastedItems && analytics.topWastedItems.length > 0 && (
                <div className="card">
                    <h3>Top Wasted Items</h3>
                    <div className="table-responsive">
                        <table className="waste-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity Wasted</th>
                                    <th>Times Wasted</th>
                                    <th>Estimated Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.topWastedItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{item.name}</strong></td>
                                        <td>{item.quantity.toFixed(1)} kg</td>
                                        <td>{item.count} times</td>
                                        <td>ETB {item.cost.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {suggestions.length > 0 && (
                <div className="card">
                    <h3>💡 Waste Reduction Recommendations</h3>
                    <ul style={{ marginTop: '1rem', listStyle: 'none', padding: 0 }}>
                        {suggestions.map((suggestion) => (
                            <li key={suggestion.id} style={{
                                marginBottom: '1rem',
                                padding: '0.75rem',
                                background: 'rgba(212, 175, 55, 0.1)',
                                borderRadius: '8px'
                            }}>
                                <strong style={{ color: 'var(--jit-gold)' }}>{suggestion.title}</strong>
                                <p style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>{suggestion.description}</p>
                                <small style={{ color: 'var(--success)' }}>Potential Savings: {suggestion.potentialSavings}</small>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Record Waste Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>Record Food Waste</h3>
                            <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={recordWaste}>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Meal Type</label>
                                <select
                                    value={form.mealType}
                                    onChange={(e) => setForm({ ...form, mealType: e.target.value })}
                                    required
                                >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Item Name</label>
                                <input
                                    type="text"
                                    value={form.itemName}
                                    onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                                    placeholder="e.g., Injera, Shiro, Rice"
                                    required
                                />
                            </div>
                            <div className="flex-row" style={{ gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Quantity Wasted</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={form.quantityWasted}
                                        onChange={(e) => setForm({ ...form, quantityWasted: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Unit</label>
                                    <select
                                        value={form.unit}
                                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                    >
                                        <option value="kg">kg</option>
                                        <option value="pieces">pieces</option>
                                        <option value="liters">liters</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex-row" style={{ gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Estimated Cost (ETB)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.estimatedCost}
                                        onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Category</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    >
                                        <option value="food">Food</option>
                                        <option value="beverage">Beverage</option>
                                        <option value="packaging">Packaging</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <select
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    required
                                >
                                    <option value="overproduction">Overproduction</option>
                                    <option value="spoilage">Spoilage</option>
                                    <option value="quality_issue">Quality Issue</option>
                                    <option value="student_uneaten">Student Uneaten</option>
                                    <option value="expiration">Expiration</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Additional Details</label>
                                <textarea
                                    rows={2}
                                    value={form.reasonDetails}
                                    onChange={(e) => setForm({ ...form, reasonDetails: e.target.value })}
                                    placeholder="Any additional information..."
                                />
                            </div>
                            <div className="flex-row" style={{ gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Recording...' : 'Record Waste'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        .stats-breakdown {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
        }
        .waste-table {
          width: 100%;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--bg-subtle);
          border-radius: 16px;
          padding: 1.5rem;
          max-width: 600px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
          border: 1px solid var(--card-border);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-muted);
        }
      `}</style>
        </div>
    );
}