import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  
  // AI Predictor Simulation States
  const [weather, setWeather] = useState('clear');
  const [schedule, setSchedule] = useState('classes');
  const [dayType, setDayType] = useState('weekday');
  const { user } = useAuth();
  const { t } = useTranslation();

  const load = () =>
    api('/reports/dashboard')
      .then(setStats)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateForecast = () => {
    const baseBreakfast = 180;
    const baseLunch = 420;
    const baseDinner = 350;

    let weatherFactor = 1.0;
    if (weather === 'rainy') weatherFactor = 1.15;
    if (weather === 'cold') weatherFactor = 1.08;

    let scheduleFactor = 1.0;
    if (schedule === 'midterms') scheduleFactor = 1.22;
    if (schedule === 'finals') scheduleFactor = 1.38;
    if (schedule === 'holiday') scheduleFactor = 0.18;

    let dayFactor = 1.0;
    if (dayType === 'weekend') dayFactor = 0.68;

    const b = Math.round(baseBreakfast * weatherFactor * scheduleFactor * dayFactor);
    const l = Math.round(baseLunch * weatherFactor * scheduleFactor * dayFactor);
    const d = Math.round(baseDinner * weatherFactor * scheduleFactor * dayFactor);
    const total = b + l + d;

    let reliability = 98;
    if (total > 900) {
      reliability = Math.max(30, 98 - Math.round((total - 900) * 0.15));
    } else if (schedule === 'holiday') {
      reliability = 100;
    } else {
      reliability = Math.min(100, 98 + Math.round((900 - total) * 0.02));
    }

    let suggestion = "Cafeteria stock levels are fully optimized. Standard preparations are highly stable.";
    if (reliability < 70) {
      suggestion = "⚠️ Critical shortage risk: Extremely high demand predicted! Shiro Flour and Injera stocks will deplete by Lunch. Pre-order 250 extra Injera immediately.";
    } else if (reliability < 85) {
      suggestion = "⚡ High Turnout Warning: Above-average turnout expected due to JIT Midterm exams. Prepare an extra 80 pieces of Bread and 10kg Shiro.";
    } else if (schedule === 'holiday') {
      suggestion = "💤 Holiday schedule: Demand is very low. Reduce preparation quantities by 80% to avoid extreme food waste.";
    } else if (weather === 'rainy') {
      suggestion = "🌧️ Rainy weather in Jimma: More students will dine on campus instead of going to town. Prep 10% more hot sauce.";
    }

    return { breakfast: b, lunch: l, dinner: d, total, reliability, suggestion };
  };

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <p>{t('loading_dashboard')}</p>;

  const forecast = calculateForecast();

  return (
    <div>
      <div className="page-header">
        <h2>{t('management_dashboard')}</h2>
        <p>{t('dashboard_subtitle')}</p>
      </div>

      <div className="card-grid">
        <div className="card stat-card">
          <div className="value">{stats.todayMeals}</div>
          <div className="label">{t('meals_served_today')}</div>
        </div>
        <div className="card stat-card">
          <div className="value">{stats.activeStudents}</div>
          <div className="label">{t('eligible_students')}</div>
        </div>
        <div className="card stat-card">
          <div className="value">{stats.lowStockCount}</div>
          <div className="label">{t('low_stock_items')}</div>
        </div>
        <div className="card stat-card">
          <div className="value">{stats.pendingComplaints}</div>
          <div className="label">{t('pending_complaints')}</div>
        </div>
        <div className="card stat-card">
          <div className="value">{stats.todayInspections}</div>
          <div className="label">{t('deliveries_inspected_today')}</div>
        </div>
        <div className="card stat-card">
          <div className="value">{stats.failedInspectionsToday}</div>
          <div className="label">{t('failed_inspections_today')}</div>
        </div>
      </div>

      {/* AI Cafeteria Predictor Section */}
      <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--jit-gold)' }}>
        <h3 style={{ color: 'var(--jit-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          🤖 JiT Cafeteria AI Predictor ({t('food_availability_reliability')})
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          {t('prediction_subtitle')}
        </p>

        <div className="ai-forecast-container">
          <div className="ai-controls-box">
            <h4 style={{ marginBottom: '1rem', color: '#fff', fontSize: '1rem' }}>{t('simulation_parameters')}</h4>
            
            <div className="form-group">
              <label>{t('academic_calendar_period')}</label>
              <select value={schedule} onChange={(e) => setSchedule(e.target.value)}>
                <option value="classes">{t('regular_lecture_classes')}</option>
                <option value="midterms">{t('midterm_exam_week')}</option>
                <option value="finals">{t('final_exam_week')}</option>
                <option value="holiday">{t('holiday_period')}</option>
              </select>
            </div>

            <div className="flex-row" style={{ gap: '1.25rem', marginTop: '1rem' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                <label>{t('weather_in_jimma')}</label>
                <select value={weather} onChange={(e) => setWeather(e.target.value)}>
                  <option value="clear">☀️ Clear / Warm (Baseline)</option>
                  <option value="rainy">🌧️ Rainy / Wet (+15% Demand)</option>
                  <option value="cold">💨 Cold / Windy (+8% Demand)</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                <label>{t('day_pattern')}</label>
                <select value={dayType} onChange={(e) => setDayType(e.target.value)}>
                  <option value="weekday">📅 {t('weekday_full_operations')}</option>
                  <option value="weekend">🏖️ {t('weekend_reduced_occupancy')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="ai-status-box">
            <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>{t('cafeteria_reliability_score')}</h4>
            <div className={`ai-status-dial ${forecast.reliability >= 85 ? 'high' : forecast.reliability >= 70 ? 'medium' : 'low'}`}>
              <span className="score">{forecast.reliability}%</span>
              <span className="lbl">{t('reliable')}</span>
            </div>
            <div className="ai-grid" style={{ width: '100%' }}>
              <div className="ai-grid-box">
                <div className="val">{forecast.breakfast}</div>
                <div className="lbl">Breakfast</div>
              </div>
              <div className="ai-grid-box">
                <div className="val">{forecast.lunch}</div>
                <div className="lbl">Lunch</div>
              </div>
              <div className="ai-grid-box">
                <div className="val">{forecast.dinner}</div>
                <div className="lbl">Dinner</div>
              </div>
            </div>
          </div>
        </div>

        <div className="ai-recommendation-alert">
          <span className="icon">💡</span>
          <p>
            <strong>AI Forecast Recommendation:</strong> {forecast.suggestion} Total simulated meals: <strong>{forecast.total} plates</strong>.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>{t('today_by_meal_type')}</h3>
        <div className="flex-row">
          {['breakfast', 'lunch', 'dinner'].map((m) => (
            <span key={m} className="badge badge-success" style={{ padding: '0.5rem 1rem' }}>
              {m}: {stats.todayByMeal?.[m] || 0}
            </span>
          ))}
        </div>
      </div>

      {stats.estimatedStockUsage && Object.keys(stats.estimatedStockUsage).length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Estimated stock used today (from meals served)</h3>
          <table>
            <tbody>
              {Object.entries(stats.estimatedStockUsage).map(([item, qty]) => (
                <tr key={item}>
                  <td>{item}</td>
                  <td>{typeof qty === 'number' ? qty.toFixed(2) : qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/reports" className="btn btn-secondary mt-1">
            {t('full_reports')}
          </Link>
        </div>
      )}

      {stats.recentTransactions?.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>{t('recent_verifications')}</h3>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Student</th>
                <th>Meal</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions.map((t) => (
                <tr key={t._id}>
                  <td>{t.transaction_time}</td>
                  <td>
                    {t.student_name} ({t.student_id})
                  </td>
                  <td>{t.meal_type}</td>
                  <td>{t.verification_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats.lowStock?.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '0.75rem', color: 'var(--warning)' }}>{t('low_stock_alert')}</h3>
          <ul>
            {stats.lowStock.map((i) => (
              <li key={i._id}>
                {i.item_name}: {i.closing_balance} {i.unit} (reorder at {i.reorder_level})
              </li>
            ))}
          </ul>
          <div className="flex-row mt-1">
            <Link to="/inventory" className="btn btn-secondary">
              {t('manage_inventory')}
            </Link>
            <Link to="/quality" className="btn btn-secondary">
              {t('quality_inspections')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
