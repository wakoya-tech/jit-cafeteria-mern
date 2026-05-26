import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const MEDICAL_CONDITIONS = [
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'hypertension', label: 'Hypertension / High Blood Pressure' },
    { value: 'allergy', label: 'Food Allergy' },
    { value: 'celiac', label: 'Celiac Disease (Gluten Allergy)' },
    { value: 'kidney_disease', label: 'Kidney Disease' },
    { value: 'pregnancy', label: 'Pregnancy' },
    { value: 'post_surgery', label: 'Post-Surgery Recovery' },
    { value: 'other', label: 'Other Medical Condition' }
];

const DIETARY_RESTRICTIONS = [
    { value: 'no_sugar', label: 'No Sugar / Low Sugar' },
    { value: 'low_salt', label: 'Low Salt / Sodium Restricted' },
    { value: 'gluten_free', label: 'Gluten Free' },
    { value: 'lactose_free', label: 'Lactose Free' },
    { value: 'nut_free', label: 'Nut Free' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'low_fat', label: 'Low Fat' },
    { value: 'high_protein', label: 'High Protein' }
];

export default function SpecialMealRequests() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [form, setForm] = useState({
        studentId: '',
        medicalCondition: '',
        conditionDetails: '',
        dietaryRestrictions: [],
        allowedFoods: '',
        forbiddenFoods: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const loadRequests = async () => {
        try {
            let url = '/special-meals';
            if (user?.role === 'student') {
                url = `/special-meals/my-requests?studentId=${user?.studentId}`;
            }
            const data = await api(url);
            setRequests(data);
        } catch (err) {
            console.error('Failed to load requests:', err);
        }
    };

    const submitRequest = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api('/special-meals', {
                method: 'POST',
                body: JSON.stringify(form)
            });
            alert('✅ Special meal request submitted successfully!');
            setShowForm(false);
            setForm({
                studentId: '',
                medicalCondition: '',
                conditionDetails: '',
                dietaryRestrictions: [],
                allowedFoods: '',
                forbiddenFoods: '',
                notes: ''
            });
            loadRequests();
        } catch (err) {
            alert('Failed to submit request: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const approveRequest = async (id, status, rejectionReason = '') => {
        try {
            await api(`/special-meals/${id}/approve`, {
                method: 'PUT',
                body: JSON.stringify({ status, rejectionReason })
            });
            loadRequests();
            alert(`Request ${status} successfully`);
        } catch (err) {
            alert('Failed to update request: ' + err.message);
        }
    };

    const toggleDietaryRestriction = (value) => {
        setForm(prev => ({
            ...prev,
            dietaryRestrictions: prev.dietaryRestrictions.includes(value)
                ? prev.dietaryRestrictions.filter(r => r !== value)
                : [...prev.dietaryRestrictions, value]
        }));
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const filteredRequests = requests.filter(req => {
        if (filter === 'all') return true;
        return req.status === filter;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return 'badge-warning';
            case 'approved': return 'badge-success';
            case 'rejected': return 'badge-danger';
            case 'expired': return 'badge-secondary';
            default: return 'badge';
        }
    };

    const getMedicalConditionLabel = (value) => {
        return MEDICAL_CONDITIONS.find(c => c.value === value)?.label || value;
    };

    return (
        <div>
            <div className="page-header">
                <h2>Special Meal Requests</h2>
                <p>For students with medical conditions requiring dietary accommodations</p>
            </div>

            {/* Action Buttons */}
            <div className="flex-row" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
                <div className="flex-row" style={{ gap: '0.5rem' }}>
                    <button
                        className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={`btn ${filter === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('approved')}
                    >
                        Approved
                    </button>
                    <button
                        className={`btn ${filter === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('rejected')}
                    >
                        Rejected
                    </button>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    + New Request
                </button>
            </div>

            {/* Requests List */}
            <div className="card">
                {filteredRequests.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No special meal requests found
                    </p>
                ) : (
                    <div className="requests-list">
                        {filteredRequests.map((req) => (
                            <div key={req._id} className="request-card">
                                <div className="request-header">
                                    <div>
                                        <strong>{req.studentName}</strong>
                                        <span className="request-id">{req.studentId}</span>
                                    </div>
                                    <span className={`badge ${getStatusBadge(req.status)}`}>
                                        {req.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="request-body">
                                    <div className="request-detail">
                                        <label>Medical Condition:</label>
                                        <span>{getMedicalConditionLabel(req.medicalCondition)}</span>
                                    </div>
                                    <div className="request-detail">
                                        <label>Details:</label>
                                        <span>{req.conditionDetails}</span>
                                    </div>
                                    {req.dietaryRestrictions?.length > 0 && (
                                        <div className="request-detail">
                                            <label>Dietary Restrictions:</label>
                                            <span>{req.dietaryRestrictions.join(', ')}</span>
                                        </div>
                                    )}
                                    {req.allowedFoods && (
                                        <div className="request-detail">
                                            <label>Allowed Foods:</label>
                                            <span>{req.allowedFoods}</span>
                                        </div>
                                    )}
                                    {req.forbiddenFoods && (
                                        <div className="request-detail">
                                            <label>Forbidden Foods:</label>
                                            <span>{req.forbiddenFoods}</span>
                                        </div>
                                    )}
                                    {req.notes && (
                                        <div className="request-detail">
                                            <label>Notes:</label>
                                            <span>{req.notes}</span>
                                        </div>
                                    )}
                                    <div className="request-detail">
                                        <label>Submitted:</label>
                                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {(user?.role === 'administrator' || user?.role === 'cafeteria_manager') && req.status === 'pending' && (
                                    <div className="request-actions">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => approveRequest(req._id, 'approved')}
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => {
                                                const reason = prompt('Enter rejection reason:');
                                                if (reason) approveRequest(req._id, 'rejected', reason);
                                            }}
                                        >
                                            ✗ Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Request Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>Special Meal Request Form</h3>
                            <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={submitRequest}>
                            <div className="form-group">
                                <label>Student ID *</label>
                                <input
                                    type="text"
                                    value={form.studentId}
                                    onChange={(e) => setForm({ ...form, studentId: e.target.value.toUpperCase() })}
                                    placeholder="e.g., RU0830/16"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Medical Condition *</label>
                                <select
                                    value={form.medicalCondition}
                                    onChange={(e) => setForm({ ...form, medicalCondition: e.target.value })}
                                    required
                                >
                                    <option value="">Select condition</option>
                                    {MEDICAL_CONDITIONS.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Condition Details *</label>
                                <textarea
                                    rows={3}
                                    value={form.conditionDetails}
                                    onChange={(e) => setForm({ ...form, conditionDetails: e.target.value })}
                                    placeholder="Describe your medical condition and specific dietary needs..."
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Dietary Restrictions</label>
                                <div className="checkbox-group">
                                    {DIETARY_RESTRICTIONS.map(r => (
                                        <label key={r.value} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={form.dietaryRestrictions.includes(r.value)}
                                                onChange={() => toggleDietaryRestriction(r.value)}
                                            />
                                            {r.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Allowed Foods (comma separated)</label>
                                <input
                                    value={form.allowedFoods}
                                    onChange={(e) => setForm({ ...form, allowedFoods: e.target.value })}
                                    placeholder="e.g., Rice, Vegetables, Chicken"
                                />
                            </div>

                            <div className="form-group">
                                <label>Forbidden Foods (comma separated)</label>
                                <input
                                    value={form.forbiddenFoods}
                                    onChange={(e) => setForm({ ...form, forbiddenFoods: e.target.value })}
                                    placeholder="e.g., Spicy food, Fried food, Sugar"
                                />
                            </div>

                            <div className="form-group">
                                <label>Additional Notes</label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Any other information for the cafeteria team..."
                                />
                            </div>

                            <div className="info-note" style={{
                                marginBottom: '1rem',
                                padding: '0.75rem',
                                background: 'rgba(212, 175, 55, 0.1)',
                                borderRadius: '8px',
                                fontSize: '0.85rem'
                            }}>
                                <strong>Note:</strong> You may need to provide a doctor's certificate.
                                The cafeteria manager will review your request within 2-3 business days.
                            </div>

                            <div className="flex-row" style={{ gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Request'}
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
        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .request-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem;
        }
        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
        }
        .request-id {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-left: 0.5rem;
        }
        .request-body {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 0.75rem;
        }
        .request-detail {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .request-detail label {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--jit-gold);
          text-transform: uppercase;
        }
        .request-detail span {
          font-size: 0.9rem;
          color: var(--text);
        }
        .request-actions {
          margin-top: 1rem;
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
        .btn-sm {
          padding: 0.3rem 0.8rem;
          font-size: 0.8rem;
        }
        .btn-success {
          background: var(--success);
          color: #000;
        }
        .checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          cursor: pointer;
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