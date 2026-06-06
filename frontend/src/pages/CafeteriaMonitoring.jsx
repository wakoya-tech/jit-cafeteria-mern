import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const cameraFeeds = [
  { id: 'cam-1', label: 'Serving Hall', status: 'Online', location: 'Main hall entrance', lastSeen: '2s ago' },
  { id: 'cam-2', label: 'Kitchen Zone', status: 'Online', location: 'Prep area', lastSeen: '4s ago' },
  { id: 'cam-3', label: 'Dining Queue', status: 'Online', location: 'Student queue', lastSeen: '1s ago' },
];

const ambientSensors = [
  { label: 'Dining Hall Temperature', value: '23.6°C', status: 'Optimal', detail: 'Temperature sensors calibrated for student comfort.' },
  { label: 'Kitchen Temp & Humidity', value: '26.2°C / 58%', status: 'Stable', detail: 'Good ventilation and humidity control.' },
  { label: 'Cold Storage', value: '3.8°C', status: 'Safe', detail: 'Refrigeration within food safety range.' },
];

export default function CafeteriaMonitoring() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <h2>Cafeteria Monitoring Center</h2>
        <p>Real-time cafeteria safety, camera overview, and ambient condition tracking for Jimma University Institute of Technology.</p>
      </div>

      <div className="card-grid">
        <div className="card stat-card">
          <div className="value">{cameraFeeds.length}</div>
          <div className="label">Camera endpoints online</div>
        </div>
        <div className="card stat-card">
          <div className="value">3</div>
          <div className="label">Temperature sensors active</div>
        </div>
        <div className="card stat-card">
          <div className="value">98%</div>
          <div className="label">Operational readiness</div>
        </div>
        <div className="card stat-card">
          <div className="value">7 min</div>
          <div className="label">Average dining queue</div>
        </div>
      </div>

      <div className="monitoring-grid">
        <div className="card monitor-card">
          <div className="monitor-card-header">
            <h3>Camera system overview</h3>
            <span className="badge badge-success">Secure & live</span>
          </div>
          <p className="text-muted">A manager can review the cafeteria camera feeds for crowd flow, kitchen hygiene, and queue management.</p>
          <div className="camera-grid">
            {cameraFeeds.map((camera) => (
              <div key={camera.id} className="camera-feed-card">
                <div className="camera-avatar">📷</div>
                <div>
                  <h4>{camera.label}</h4>
                  <p>{camera.location}</p>
                </div>
                <div className="feed-meta">
                  <span className={`badge ${camera.status === 'Online' ? 'badge-success' : 'badge-danger'}`}>{camera.status}</span>
                  <small>{camera.lastSeen}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="camera-activity-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
            <div className="card stat-card">
              <div className="value">12</div>
              <div className="label">Active queue cameras</div>
            </div>
            <div className="card stat-card">
              <div className="value">4</div>
              <div className="label">Biometric gate stations</div>
            </div>
            <div className="card stat-card">
              <div className="value">2</div>
              <div className="label">High activity alerts</div>
            </div>
          </div>
        </div>

        <div className="card monitor-card">
          <div className="monitor-card-header">
            <h3>Ambient temperature & safety</h3>
            <span className="badge badge-info">Health first</span>
          </div>
          <p className="text-muted">Track kitchen and dining conditions to meet food safety standards at Jimma IT.</p>
          <div className="sensor-list">
            {ambientSensors.map((sensor) => (
              <div key={sensor.label} className="sensor-panel">
                <div>
                  <h4>{sensor.value}</h4>
                  <p>{sensor.label}</p>
                </div>
                <div className="sensor-status">
                  <span className="badge badge-success">{sensor.status}</span>
                  <small>{sensor.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="monitor-card-header" style={{ marginBottom: '1rem' }}>
          <h3>Smart campus food service features</h3>
          <span className="badge badge-warning">Feasible upgrade</span>
        </div>
        <p className="text-muted">Recommended enhancements for cafeteria operations with high feasibility in JIT campus environments.</p>
        <div className="feature-grid">
          <div className="feature-box">
            <h4>Dynamic queue management</h4>
            <p>Use camera-based occupancy and temperature sensor data to adjust service windows and reduce student waiting times.</p>
            <div className="feature-pill">Current queue: 7 minutes</div>
          </div>
          <div className="feature-box">
            <h4>Equipment readiness dashboard</h4>
            <p>Monitor kitchen appliance status and schedule maintenance tasks before rush hours.</p>
            <div className="feature-pill">Next maintenance: 3 days</div>
          </div>
          <div className="feature-box">
            <h4>Campus meal demand forecast</h4>
            <p>Combine academic calendar patterns with ambient conditions to predict peak meal demand for the day.</p>
            <div className="feature-pill">Demand increase: +15%</div>
          </div>
        </div>
        <div className="flex-row" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Link to="/reports" className="btn btn-secondary">
            View operational reports
          </Link>
          <Link to="/quality" className="btn btn-primary">
            Open food safety logs
          </Link>
        </div>
      </div>

      <div className="card">
        <h3>Recommended manager actions</h3>
        <div className="role-actions">
          {user?.role === 'administrator' ? (
            <>
              <Link className="btn btn-secondary" to="/users">Review user access</Link>
              <Link className="btn btn-secondary" to="/university-sync">Sync student registry</Link>
              <Link className="btn btn-secondary" to="/reports">Audit cafeteria reports</Link>
            </>
          ) : (
            <>
              <Link className="btn btn-secondary" to="/inventory">Replenish stocks</Link>
              <Link className="btn btn-secondary" to="/quality">Schedule inspection</Link>
              <Link className="btn btn-secondary" to="/menus">Prepare daily menu</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
