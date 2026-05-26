import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function UniversitySync() {
    const { user } = useAuth();
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [syncHistory, setSyncHistory] = useState([]);
    const [studentId, setStudentId] = useState('');
    const [validation, setValidation] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadSyncHistory = async () => {
        try {
            const history = await api('/university-sync/sync-history?limit=10');
            setSyncHistory(history);
        } catch (err) {
            console.error('Failed to load sync history:', err);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const result = await api('/university-sync/sync', { method: 'POST' });
            setSyncResult(result);
            loadSyncHistory();
        } catch (err) {
            alert('Sync failed: ' + err.message);
        } finally {
            setSyncing(false);
        }
    };

    const validateStudent = async () => {
        if (!studentId.trim()) {
            alert('Please enter a student ID');
            return;
        }
        setLoading(true);
        try {
            const result = await api('/university-sync/validate', {
                method: 'POST',
                body: JSON.stringify({ studentId: studentId.trim() })
            });
            setValidation(result);
        } catch (err) {
            alert('Validation failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSyncHistory();
    }, []);

    return (
        <div>
            <div className="page-header">
                <h2>University ID Integration</h2>
                <p>Synchronize student data with Jimma University central database</p>
            </div>

            {/* Sync Button Section */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3>Manual Student Sync</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Pull latest student data from university system. This will add new students,
                    update existing ones, and deactivate students no longer enrolled.
                </p>
                <button
                    onClick={handleSync}
                    className="btn btn-primary"
                    disabled={syncing}
                >
                    {syncing ? '🔄 Syncing...' : '🔄 Sync Students from University'}
                </button>

                {syncResult && (
                    <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                        <strong>Sync Completed!</strong>
                        <div style={{ marginTop: '0.5rem' }}>
                            📚 Total Processed: {syncResult.total}<br />
                            ✨ New Students: {syncResult.newCount}<br />
                            📝 Updated Students: {syncResult.updatedCount}<br />
                            ❌ Deactivated Students: {syncResult.deactivatedCount}
                        </div>
                    </div>
                )}
            </div>

            {/* Student ID Validation */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3>Validate Student ID</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Check if a student ID exists in the university system
                </p>
                <div className="flex-row">
                    <input
                        type="text"
                        placeholder="Enter student ID (e.g., RU0830/16)"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                        style={{ flex: 1 }}
                    />
                    <button onClick={validateStudent} className="btn btn-secondary" disabled={loading}>
                        {loading ? 'Validating...' : 'Validate'}
                    </button>
                </div>

                {validation && (
                    <div className={`alert ${validation.valid ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1rem' }}>
                        <strong>{validation.valid ? '✅ Valid' : '❌ Invalid'}</strong>
                        <p style={{ marginTop: '0.25rem' }}>{validation.message}</p>
                        {validation.student && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                📍 Name: {validation.student.name}<br />
                                📍 Department: {validation.student.department}<br />
                                📍 Status: {validation.student.eligibility_status ? 'Active' : 'Inactive'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sync History */}
            <div className="card">
                <h3>Sync History</h3>
                {syncHistory.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No sync history available</p>
                ) : (
                    <div className="table-responsive">
                        <table className="sync-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>New</th>
                                    <th>Updated</th>
                                    <th>Deactivated</th>
                                    <th>Triggered By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {syncHistory.map((sync) => (
                                    <tr key={sync._id}>
                                        <td>{new Date(sync.syncDate).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${sync.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                                                {sync.status}
                                            </span>
                                        </td>
                                        <td>{sync.newStudents || 0}</td>
                                        <td>{sync.updatedStudents || 0}</td>
                                        <td>{sync.deactivatedStudents || 0}</td>
                                        <td>{sync.triggeredBy?.fullName || sync.triggeredBy?.username || 'System'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
        .sync-table {
          width: 100%;
        }
        .table-responsive {
          overflow-x: auto;
        }
      `}</style>
        </div>
    );
}