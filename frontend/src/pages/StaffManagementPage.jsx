// frontend/src/pages/StaffManagementPage.jsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const SHIFTS = ['Morning Shift', 'Afternoon Shift', 'Evening Shift', 'None'];
// POSITIONS removed - using only ASSIGNED_ROLES
const ASSIGNED_ROLES = ['Cashier', 'Food Server', 'Cleaner', 'Kitchen Staff', 'Supervisor'];

export default function StaffManagementPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('staff');
    const [staff, setStaff] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [attendance, setAttendance] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedShift, setSelectedShift] = useState('');
    const [currentShift, setCurrentShift] = useState(null);
    const [staffReport, setStaffReport] = useState(null);

    if (user?.role !== 'cafeteria_manager' && user?.role !== 'administrator') {
        return (
            <div className="alert alert-error">
                Access denied. Only cafeteria managers and administrators can access this page.
            </div>
        );
    }

    const loadCurrentShift = async () => {
        try {
            const data = await api('/users/current-shift');
            setCurrentShift(data);
            if (data.currentShift && !selectedShift) {
                setSelectedShift(data.currentShift);
            }
        } catch (err) {
            console.error(err);
        }
    };

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

    const loadAttendance = async () => {
        setLoading(true);
        try {
            const data = await api(`/users/attendance?date=${selectedDate}&shift=${selectedShift}`);
            setAttendance(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadStaffReport = async () => {
        try {
            const data = await api('/reports/staff?period=monthly');
            setStaffReport(data);
        } catch (err) {
            console.error(err);
        }
    };

    const updateStaff = async (staffId, updateData) => {
        try {
            await api(`/users/${staffId}/shift`, {
                method: 'PUT',
                body: JSON.stringify(updateData),
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
            await api(`/users/${staffId}/shift`, {
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

    const markAttendance = async (userId, status, checkInTime = null) => {
        try {
            await api('/users/attendance', {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    date: selectedDate,
                    shift: selectedShift,
                    status,
                    checkInTime: checkInTime || new Date().toLocaleTimeString(),
                }),
            });
            loadAttendance();
            setMessage(`Attendance marked as ${status} for ${selectedShift}`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            alert(err.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'badge-success';
            case 'On Leave': return 'badge-warning';
            case 'Left Work': return 'badge-danger';
            default: return 'badge';
        }
    };

    useEffect(() => {
        loadCurrentShift();
    }, []);

    useEffect(() => {
        if (activeTab === 'staff') {
            loadStaff();
        } else if (activeTab === 'attendance') {
            loadAttendance();
        } else if (activeTab === 'reports') {
            loadStaffReport();
        }
    }, [activeTab, selectedDate, selectedShift]);

    const shiftOptions = [
        { value: 'Morning Shift', label: 'Morning Shift (6:00 - 12:00)', active: currentShift?.currentShift === 'Morning Shift' },
        { value: 'Afternoon Shift', label: 'Afternoon Shift (12:00 - 17:00)', active: currentShift?.currentShift === 'Afternoon Shift' },
        { value: 'Evening Shift', label: 'Evening Shift (17:00 - 22:00)', active: currentShift?.currentShift === 'Evening Shift' }
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Staff Management & Shift Scheduling</h2>
                <p>
                    Manage cafeteria staff across 3 shifts. Current time: {new Date().toLocaleTimeString()}
                    {currentShift?.currentShift && (
                        <span className="badge badge-info" style={{ marginLeft: '1rem' }}>
                            Active: {currentShift.currentShift}
                        </span>
                    )}
                </p>
            </div>

            {message && <div className="alert alert-info">{message}</div>}

            <div className="terminal-mode-tabs" style={{ marginBottom: '1.5rem' }}>
                <button
                    className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('staff')}
                >
                    Staff & Shifts
                </button>
                <button
                    className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('attendance')}
                >
                    Attendance Log
                </button>
                <button
                    className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('reports')}
                >
                    Staff Reports
                </button>
            </div>

            {/* Staff & Shifts Tab - POSITION REMOVED */}
            {activeTab === 'staff' && (
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Cafeteria Staff Management</h3>
                    {loading ? (
                        <p>Loading staff data...</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="staff-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>🎯 Assigned Role</th>
                                        <th>⏰ Assigned Shift</th>
                                        <th>Status</th>
                                        <th>Phone</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.filter(s => s.role !== 'administrator' && s.role !== 'registrar').map((s) => (
                                        <tr key={s._id}>
                                            <td><strong>{s.fullName || s.username}</strong></td>
                                            <td>
                                                <select
                                                    value={s.assignedRole || 'Cashier'}
                                                    onChange={(e) => updateStaff(s._id, { assignedRole: e.target.value })}
                                                    className="staff-select"
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
                                                    className="staff-select"
                                                >
                                                    <option value="None">No Shift</option>
                                                    <option value="Morning Shift">Morning (6-12)</option>
                                                    <option value="Afternoon Shift">Afternoon (12-17)</option>
                                                    <option value="Evening Shift">Evening (17-22)</option>
                                                </select>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusColor(s.status)}`}>
                                                    {s.status || 'Active'}
                                                </span>
                                                {s.status === 'Left Work' && s.leftWorkNotes && (
                                                    <small style={{ display: 'block', fontSize: '0.7rem' }}>
                                                        {s.leftWorkNotes}
                                                    </small>
                                                )}
                                            </td>
                                            <td>{s.phoneNumber || '—'}</td>
                                            <td>
                                                {s.status !== 'Left Work' && (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => {
                                                            const notes = prompt('Enter reason for leaving work:');
                                                            if (notes) reportLeftWork(s._id, notes);
                                                        }}
                                                    >
                                                        Report Left
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Attendance Tab - POSITION REMOVED from display */}
            {activeTab === 'attendance' && (
                <div className="card">
                    <div className="form-group">
                        <label>Select Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{ maxWidth: '200px' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Select Shift</label>
                        <div className="shift-buttons">
                            {shiftOptions.map(shift => (
                                <button
                                    key={shift.value}
                                    className={`btn ${selectedShift === shift.value ? 'btn-primary' : 'btn-secondary'} ${shift.active ? 'active-shift' : ''}`}
                                    onClick={() => setSelectedShift(shift.value)}
                                >
                                    {shift.label}
                                    {shift.active && <span className="active-indicator"> ● Active</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {attendance && (
                        <>
                            <div className="shift-info">
                                <p><strong>Shift Timing:</strong> {attendance.shiftTiming?.start}:00 - {attendance.shiftTiming?.end}:00</p>
                                <p><strong>Status:</strong> {attendance.isActive ? '🟢 Shift Active' : '⚫ Shift Inactive'}</p>
                            </div>

                            {loading ? (
                                <p>Loading attendance...</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="attendance-table">
                                        <thead>
                                            <tr>
                                                <th>Staff Name</th>
                                                <th>🎯 Role</th>
                                                <th>Status</th>
                                                <th>Check In</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendance.staff?.map((record) => (
                                                <tr key={record._id}>
                                                    <td>{record.userName}</td>
                                                    <td>{record.assignedRole || '—'}</td>
                                                    <td>
                                                        <span className={`badge ${record.status === 'present' ? 'badge-success' :
                                                            record.status === 'absent' ? 'badge-danger' :
                                                                record.status === 'late' ? 'badge-warning' :
                                                                    'badge-secondary'
                                                            }`}>
                                                            {record.status === 'not_marked' ? 'Not Marked' : record.status}
                                                        </span>
                                                        {record.checkInTime && (
                                                            <small style={{ display: 'block' }}>in: {record.checkInTime}</small>
                                                        )}
                                                    </td>
                                                    <td>{record.checkInTime || '—'}</td>
                                                    <td>
                                                        <div className="flex-row" style={{ gap: '0.5rem' }}>
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => markAttendance(record.userId, 'present')}
                                                            >
                                                                ✓ Present
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => markAttendance(record.userId, 'absent')}
                                                            >
                                                                ✗ Absent
                                                            </button>
                                                            <button
                                                                className="btn btn-warning btn-sm"
                                                                onClick={() => markAttendance(record.userId, 'late')}
                                                            >
                                                                ⏰ Late
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Reports Tab - POSITION REMOVED */}
            {activeTab === 'reports' && staffReport && (
                <div>
                    <div className="card-grid">
                        <div className="card stat-card">
                            <div className="value">{staffReport.totalStaff}</div>
                            <div className="label">Total Staff</div>
                        </div>
                        <div className="card stat-card">
                            <div className="value">{staffReport.activeStaff}</div>
                            <div className="label">Active Staff</div>
                        </div>
                        <div className="card stat-card">
                            <div className="value">{staffReport.leftWorkCount}</div>
                            <div className="label">Left Work</div>
                        </div>
                    </div>

                    <div className="card">
                        <h3>Staff by Shift</h3>
                        <div className="stats-breakdown">
                            <div className="stat-item">
                                <strong>Morning Shift (6-12)</strong>
                                <span>{staffReport.shiftABreakdown?.count || 0} staff</span>
                            </div>
                            <div className="stat-item">
                                <strong>Afternoon Shift (12-17)</strong>
                                <span>{staffReport.shiftBBreakdown?.count || 0} staff</span>
                            </div>
                            <div className="stat-item">
                                <strong>Evening Shift (17-22)</strong>
                                <span>{staffReport.eveningShift?.count || 0} staff</span>
                            </div>
                        </div>
                    </div>

                    {staffReport.leftWorkList?.length > 0 && (
                        <div className="card">
                            <h3>Staff Who Left Work</h3>
                            <div className="table-responsive">
                                <table className="leftwork-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Previous Role</th>
                                            <th>Date Left</th>
                                            <th>Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffReport.leftWorkList.map((staff) => (
                                            <tr key={staff._id}>
                                                <td>{staff.fullName}</td>
                                                <td>{staff.assignedRole}</td>
                                                <td>{new Date(staff.updatedAt).toLocaleDateString()}</td>
                                                <td>{staff.leftWorkNotes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`
        .staff-table, .attendance-table, .leftwork-table {
          width: 100%;
          font-size: 0.9rem;
        }
        .staff-select {
          padding: 0.4rem;
          border-radius: 6px;
          background: var(--card);
          color: var(--text);
          border: 1px solid var(--border);
          font-size: 0.85rem;
        }
        .btn-sm {
          padding: 0.3rem 0.8rem;
          font-size: 0.8rem;
          margin: 0.2rem;
        }
        .btn-success {
          background: var(--success);
          color: #000;
        }
        .btn-warning {
          background: var(--warning);
          color: #000;
        }
        .shift-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .active-shift {
          border: 2px solid var(--success);
          animation: pulse 2s infinite;
        }
        .active-indicator {
          color: var(--success);
          font-size: 0.7rem;
        }
        .shift-info {
          background: rgba(32, 135, 78, 0.1);
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        @keyframes pulse {
          0% { border-color: var(--success); opacity: 1; }
          50% { border-color: transparent; opacity: 0.7; }
          100% { border-color: var(--success); opacity: 1; }
        }
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
        .table-responsive {
          overflow-x: auto;
        }
      `}</style>
        </div>
    );
}