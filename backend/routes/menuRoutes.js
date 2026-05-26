import express from 'express';
import Menu from '../models/Menu.js';
import { JIT_WEEKLY_MENU, MEAL_LABELS } from '../data/jitWeeklyMenu.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/weekly', async (_req, res) => {
  const rows = await Menu.find({ program_type: 'weekly', is_active: true }).sort({
    day_of_week: 1,
    meal_type: 1,
  });
  if (rows.length === 0) {
    return res.json({ source: 'template', days: JIT_WEEKLY_MENU, mealLabels: MEAL_LABELS });
  }
  const byDay = {};
  for (const row of rows) {
    const key = row.day_of_week;
    if (!byDay[key]) {
      byDay[key] = {
        day_of_week: row.day_of_week,
        day_am: row.day_label_am,
        day_en: row.day_label_en,
        meals: {},
      };
    }
    byDay[key].meals[row.meal_type] = {
      items: row.items,
      meal_label_am: row.meal_label_am || MEAL_LABELS[row.meal_type],
    };
  }
  res.json({ source: 'database', days: Object.values(byDay).sort((a, b) => {
    const order = (d) => (d.day_of_week === 0 ? 7 : d.day_of_week);
    return order(a) - order(b);
  }) });
});

router.get('/today', async (_req, res) => {
  const dow = new Date().getDay();
  const rows = await Menu.find({
    program_type: 'weekly',
    day_of_week: dow,
    is_active: true,
  }).sort({ meal_type: 1 });

  const dayMeta = JIT_WEEKLY_MENU.find((d) => d.day_of_week === dow);

  res.json({
    day_of_week: dow,
    day_am: rows[0]?.day_label_am || dayMeta?.day_am,
    day_en: rows[0]?.day_label_en || dayMeta?.day_en,
    meals: rows.map((r) => ({
      meal_type: r.meal_type,
      meal_label_am: r.meal_label_am || MEAL_LABELS[r.meal_type],
      items: r.items,
    })),
  });
});

router.get('/', async (req, res) => {
  const { date, meal_type, today } = req.query;

  if (today === 'true' || (!date && today !== 'false')) {
    const dow = new Date().getDay();
    const filter = { program_type: 'weekly', day_of_week: dow, is_active: true };
    if (meal_type) filter.meal_type = meal_type;
    const menus = await Menu.find(filter).sort({ meal_type: 1 });
    return res.json(menus);
  }

  const filter = { is_active: true };
  if (meal_type) filter.meal_type = meal_type;
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.menu_date = { $gte: d, $lt: next };
    filter.program_type = 'daily_override';
  }
  const menus = await Menu.find(filter).sort({ menu_date: -1 });
  res.json(menus);
});

router.post('/', authorize('administrator', 'cafeteria_manager'), async (req, res) => {
  try {
    const menu = await Menu.create({ ...req.body, created_by: req.user._id });
    res.status(201).json(menu);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('administrator', 'cafeteria_manager'), async (req, res) => {
  const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!menu) return res.status(404).json({ message: 'Menu not found.' });
  res.json(menu);
});

router.delete('/:id', authorize('administrator'), async (req, res) => {
  const menu = await Menu.findByIdAndDelete(req.params.id);
  if (!menu) return res.status(404).json({ message: 'Menu not found.' });
  res.json({ message: 'Menu removed.' });
});

export default router;
