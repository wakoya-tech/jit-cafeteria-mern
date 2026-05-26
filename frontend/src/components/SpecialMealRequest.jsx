// frontend/src/components/SpecialMealRequest.jsx
import { useState } from 'react';
import { api } from '../api/client';

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

export default function SpecialMealRequest({ studentId, studentName, onClose, onSubmit }) {
    const [form, setForm] = useState({
        studentId: studentId,
        medicalCondition: '',
        conditionDetails: '',
        dietaryRestrictions: [],
        allowedFoods: '',
        forbiddenFoods: '',
        mealPreferences: { breakfast: '', lunch: '', dinner: '' },
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const response = await api('/special-meals', {
                method: 'POST',
                body: JSON.stringify(form)
            });
            setMessage('Request submitted successfully! Waiting for approval.');
            if (onSubmit) onSubmit(response.request);
            setTimeout(() => {
                if (onClose) onClose();
            }, 2000);
        } catch (err) {
            setMessage(err.message);
        } finally {
            setSubmitting(false);
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3>Special Meal Request - Medical Condition</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {message && <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-info'}`}>{message}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Student Name</label>
                        <input value={studentName} disabled />
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
                        <label>Additional Notes for Cafeteria Staff</label>
                        <textarea
                            rows={2}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="Any other information for the cafeteria team..."
                        />
                    </div>

                    <div className="flex-row" style={{ gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>

                <div className="info-note" style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Note:</strong> You may need to provide a doctor's certificate. The cafeteria manager will review your request within 2-3 business days.
                </div>
            </div>
        </div>
    );
}