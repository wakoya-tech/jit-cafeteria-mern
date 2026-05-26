/**
 * JIT Cafeteria — weekly fixed meal program (English).
 * day_of_week: 0 = Sunday … 6 = Saturday (JavaScript Date.getDay())
 */
export const JIT_WEEKLY_MENU = [
  {
    day_of_week: 1,
    day_en: 'Monday',
    meals: {
      breakfast: ['Kitta', 'Tea'],
      lunch: ['Misir', 'Tikil Gomen'],
      dinner: ['Shiro'],
    },
  },
  {
    day_of_week: 2,
    day_en: 'Tuesday',
    meals: {
      breakfast: ['Forno', 'Bread', 'Tea'],
      lunch: ['Kik'],
      dinner: ['Shiro with Potato'],
    },
  },
  {
    day_of_week: 3,
    day_en: 'Wednesday',
    meals: {
      breakfast: ['Kitta', 'Bread', 'Tea'],
      lunch: ['Whole Brown Lentils'],
      dinner: ['Kik'],
    },
  },
  {
    day_of_week: 4,
    day_en: 'Thursday',
    meals: {
      breakfast: ['Rice', 'Bread', 'Tea'],
      lunch: ['Kik'],
      dinner: ['Shiro'],
    },
  },
  {
    day_of_week: 5,
    day_en: 'Friday',
    meals: {
      breakfast: ['Kitta', 'Bread', 'Tea'],
      lunch: ['Kik'],
      dinner: ['Misir Alicha'],
    },
  },
  {
    day_of_week: 6,
    day_en: 'Saturday',
    meals: {
      breakfast: ['Forno', 'Bread', 'Tea'],
      lunch: ['Shiro with Potato'],
      dinner: ['Kik'],
    },
  },
  {
    day_of_week: 0,
    day_en: 'Sunday',
    meals: {
      breakfast: ['Kitta', 'Bread', 'Tea'],
      lunch: ['Kik'],
      dinner: ['Kik'],
    },
  },
];

export const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

/** @deprecated use MEAL_LABELS */
export const MEAL_LABELS_AM = MEAL_LABELS;

export function buildWeeklyMenuDocs(createdBy) {
  const docs = [];
  for (const day of JIT_WEEKLY_MENU) {
    for (const [meal_type, items] of Object.entries(day.meals)) {
      docs.push({
        program_type: 'weekly',
        day_of_week: day.day_of_week,
        day_label_am: day.day_en,
        day_label_en: day.day_en,
        meal_type,
        meal_label_am: MEAL_LABELS[meal_type],
        items: [...items],
        is_active: true,
        created_by: createdBy,
      });
    }
  }
  return docs;
}
