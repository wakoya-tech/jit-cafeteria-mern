/** Jimma University (JIT) cafeteria service windows */
const WINDOWS = {
  breakfast: { start: 6, end: 11 },
  lunch: { start: 11, end: 16 },
  dinner: { start: 16, end: 20 },
};

export function getCurrentMealType(date = new Date()) {
  const hour = date.getHours();
  if (hour >= WINDOWS.breakfast.start && hour < WINDOWS.breakfast.end) return 'breakfast';
  if (hour >= WINDOWS.lunch.start && hour < WINDOWS.lunch.end) return 'lunch';
  if (hour >= WINDOWS.dinner.start && hour < WINDOWS.dinner.end) return 'dinner';
  return null;
}

export function getMealWindowLabel(mealType) {
  const w = WINDOWS[mealType];
  if (!w) return '';
  return `${w.start}:00 – ${w.end}:00`;
}

export function formatTime(date = new Date()) {
  return date.toTimeString().slice(0, 8);
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
