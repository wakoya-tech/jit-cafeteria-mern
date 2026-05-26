// components/StaffManagement.jsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';

const SHIFTS = ['Shift A (6:00-14:00)', 'Shift B (12:00-20:00)', 'Off', 'None'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Only ASSIGNED_ROLES - position removed
const ASSIGNED_ROLES = ['Cashier', 'Food Server', 'Cleaner', 'Kitchen Staff', 'Supervisor'];

export default function StaffManagement({ userRole }) {
    const [staff, setStaff] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showSchedule, setShowSchedule] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        setLoading(true);
        try {
            const data = await api('/users');
            setStaff(data);
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateStaff = async (staffId, updates) => {
        try {
            await api(`/users/${staffId}`, {
                method: 'PUT',
                body: JSON.stringify(updates),
            });
            setMessage('Staff information updated successfully!');
            loadStaff();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.message);
        }
    };

    const reportLeftWork = async (staffId, notes) => {
        if (!window.confirm('Are you sure you want to report this staff member as "Left Work"? This will notify the administrator.')) {
            return;
        }
        try {
            await api(`/users/${staffId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'Left Work',
                    leftWorkReportedToAdmin: true,
                    leftWorkNotes: notes,
                }),
            });
            setMessage('Staff member reported as left work. Administrator has been notified.');
            loadStaff();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.message);
        }
    };

    const updateSchedule = async (staffId, day, shift) => {
        const staffMember = staff.find(s => s._id === staffId);
        if (!staffMember) return;

        const updatedSchedule = { ...staffMember.shiftSchedule, [day]: shift };
        await updateStaff(staffId, { shiftSchedule: updatedSchedule });
    };

    const getShiftColor = (shift) => {
        if (shift?.includes('Shift A')) return 'badge-info';
        if (shift?.includes('Shift B')) return 'badge-warning';
        if (shift === 'Off') return 'badge-secondary';
        return 'badge';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'badge-success';
            case 'On Leave': return 'badge-warning';
            case 'Left Work': return 'badge-danger';
            case 'Suspended': return 'badge-danger';
            default: return 'badge';
        }
    };

    if (loading) return <p>Loading staff data...</p>;

    return (
        <div>
            {message && <div className="alert alert-info">{message}</div>}

            {/* Staff Table */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Cafeteria Staff Management</h3>
                <div className="table-responsive">
                    <table className="staff-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>🎯 Assigned Role</th>
                                <th>⏰ Current Shift</th>
                                <th>Status</th>
                                <th>Phone</th>
                                <th>📅 Schedule</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.filter(s => s.role !== 'administrator' && s.role !== 'registrar').map((s) => (
                                <tr key={s._id}>
                                    <td>
                                        <strong>{s.fullName || s.username}</strong>
                                    </td>
                                    <td>
                                        {/* Only assignedRole - position removed */}
                                        <select
                                            value={s.assignedRole || 'Cashier'}
                                            onChange={(e) => updateStaff(s._id, { assignedRole: e.target.value })}
                                            className="role-select"
                                        >
                                            {ASSIGNED_ROLES.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            value={s.assignedShift || 'None'}
                                            onChange={(e) => updateStaff(s._id, { assignedShift: e.target.value })}
                                            className="shift-select"
                                        >
                                            <option value="None">No Shift</option>
                                            <option value="Shift A (6:00-14:00)">Shift A (6:00 - 14:00)</option>
                                            <option value="Shift B (12:00-20:00)">Shift B (12:00 - 20:00)</option>
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusColor(s.status)}`}>
                                            {s.status || 'Active'}
                                        </span>
                                        {s.status === 'Left Work' && s.leftWorkNotes && (
                                            <small style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                {s.leftWorkNotes}
                                            </small>
                                        )}
                                    </td>
                                    <td>{s.phoneNumber || '—'}</td>
                                    <td>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                setSelectedStaff(s);
                                                setShowSchedule(true);
                                            }}
                                        >
                                            📅 View Schedule
                                        </button>
                                    </td>
                                    <td>
                                        {s.status !== 'Left Work' && (
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => {
                                                    const notes = prompt('Enter reason for leaving work:');
                                                    if (notes) reportLeftWork(s._id, notes);
                                                }}
                                            >
                                                ⚠️ Report Left
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Weekly Schedule Modal */}
            {showSchedule && selectedStaff && (
                <div className="modal-overlay" onClick={() => setShowSchedule(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Weekly Schedule - {selectedStaff.fullName || selectedStaff.username}</h3>
                            <button className="btn-close" onClick={() => setShowSchedule(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="schedule-grid">
                                {DAYS.map((day) => (
                                    <div key={day} className="schedule-day">
                                        <label className="schedule-label">{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                                        <select
                                            value={selectedStaff.shiftSchedule?.[day] || 'None'}
                                            onChange={(e) => updateSchedule(selectedStaff._id, day, e.target.value)}
                                            className="schedule-select"
                                        >
                                            {SHIFTS.map(shift => (
                                                <option key={shift} value={shift}>{shift}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .staff-table {
          width: 100%;
          font-size: 0.85rem;
        }
        .staff-table th {
          background: var(--card);
          padding: 0.75rem 0.5rem;
        }
        .staff-table td {
          padding: 0.5rem;
          vertical-align: middle;
        }
        .role-select, .shift-select {
          padding: 0.4rem;
          border-radius: 6px;
          background: var(--card);
          color: var(--text);
          border: 1px solid var(--border);
          font-size: 0.8rem;
          width: 100%;
        }
        .btn-sm {
          padding: 0.3rem 0.8rem;
          font-size: 0.75rem;
          margin: 0.1rem;
          cursor: pointer;
        }
        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.8rem;
          margin-top: 1rem;
        }
        .schedule-day {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .schedule-label {
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--jit-gold);
          text-transform: capitalize;
        }
        .schedule-select {
          padding: 0.4rem;
          border-radius: 6px;
          background: var(--card);
          color: var(--text);
          border: 1px solid var(--border);
          font-size: 0.75rem;
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
          max-width: 900px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-muted);
        }
        .table-responsive {
          overflow-x: auto;
        }
        .badge {
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        .badge-success { background: #2e7d32; color: white; }
        .badge-warning { background: #f57c00; color: white; }
        .badge-danger { background: #c62828; color: white; }
        .badge-info { background: #1565c0; color: white; }
        .badge-secondary { background: #546e7a; color: white; }
      `}</style>
        </div>
    );
}