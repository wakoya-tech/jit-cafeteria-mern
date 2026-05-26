import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITY } from '../config/university';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner'];

export default function Menus() {
  const { user } = useAuth();
  const canEdit = ['administrator', 'cafeteria_manager'].includes(user?.role);
  const [weekly, setWeekly] = useState(null);
  const [today, setToday] = useState(null);

  useEffect(() => {
    api('/menus/weekly').then(setWeekly).catch(() => {});
    api('/menus/today').then(setToday).catch(() => {});
  }, []);

  const days = weekly?.days || [];

  return (
    <div>
      <div className="page-header">
        <h2>Weekly Meal Program</h2>
        <p>
          {UNIVERSITY.name} JIT cafeteria — fixed weekly menu (English)
        </p>
      </div>

      {today && (
        <div className="card today-program-card meal-program-card" style={{ marginBottom: '1rem' }}>
          <h3>Today — {today.day_en}</h3>
          <ul className="meal-program-list">
            {today.meals?.map((m) => (
              <li key={m.meal_type}>
                <span className="meal-label">{m.meal_label_am}</span>
                <span className="meal-items">{m.items?.join(' + ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!canEdit && (
        <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
          View only — managers update the weekly program when the cafeteria board changes.
        </div>
      )}

      <div className="card meal-program-card">
        <h3 style={{ marginBottom: '1rem' }}>Full week</h3>
        <div className="weekly-menu-grid">
          {days.map((day) => (
            <div key={day.day_of_week} className="weekly-menu-day">
              <h4>{day.day_en || day.day_am}</h4>
              {MEAL_ORDER.map((mealType) => {
                const meal = day.meals?.[mealType];
                if (!meal) return null;
                const items = Array.isArray(meal) ? meal : meal.items;
                const label = Array.isArray(meal) ? mealType : meal.meal_label_am;
                return (
                  <div key={mealType} className="weekly-meal-row">
                    <span className="meal-label">{label}</span>
                    <span className="meal-items">{(items || []).join(' + ')}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
