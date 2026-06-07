// routes/reportRoutes.js
import express from 'express';
import Transaction from '../models/Transaction.js';
import Student from '../models/Student.js';
import InventoryItem from '../models/InventoryItem.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import StaffAttendance from '../models/StaffAttendance.js';
import { protect, authorize } from '../middleware/auth.js';
import { startOfDay, endOfDay } from '../utils/mealPeriod.js';
import { estimateStockUsageForRange } from '../utils/mealInventory.js';
import QualityInspection from '../models/QualityInspection.js';

const router = express.Router();

router.use(protect);
router.use(authorize('administrator', 'cafeteria_manager'));

function getRange(period, refDate = new Date()) {
  const end = endOfDay(refDate);
  const start = startOfDay(refDate);
  if (period === 'daily') return { start, end, label: 'Daily' };
  if (period === 'weekly') {
    const s = new Date(start);
    s.setDate(s.getDate() - 6);
    return { start: startOfDay(s), end, label: 'Weekly' };
  }
  if (period === 'monthly') {
    const s = new Date(start);
    s.setMonth(s.getMonth() - 1);
    return { start: startOfDay(s), end, label: 'Monthly' };
  }
  return { start, end, label: 'Daily' };
}

router.get('/meals', async (req, res) => {
  const period = req.query.period || 'daily';
  const ref = req.query.date ? new Date(req.query.date) : new Date();
  const { start, end, label } = getRange(period, ref);

  const transactions = await Transaction.find({
    transaction_date: { $gte: start, $lte: end },
  });

  const byMeal = { breakfast: 0, lunch: 0, dinner: 0 };
  const byDepartment = {};
  const byDay = {};

  transactions.forEach((t) => {
    byMeal[t.meal_type] = (byMeal[t.meal_type] || 0) + 1;
    byDepartment[t.department || 'Unknown'] =
      (byDepartment[t.department || 'Unknown'] || 0) + 1;
    const dayKey = t.transaction_date.toISOString().slice(0, 10);
    byDay[dayKey] = (byDay[dayKey] || 0) + 1;
  });

  res.json({
    period: label,
    dateRange: { start, end },
    totalMeals: transactions.length,
    byMealType: byMeal,
    byDepartment,
    byDay,
    transactions: transactions.slice(0, 100),
  });
});

router.get('/inventory-usage', async (req, res) => {
  const period = req.query.period || 'daily';
  const ref = req.query.date ? new Date(req.query.date) : new Date();
  const { start, end, label } = getRange(period, ref);
  const usage = await estimateStockUsageForRange(start, end);
  const items = await InventoryItem.find().sort({ item_name: 1 });
  res.json({ period: label, dateRange: { start, end }, ...usage, currentStock: items });
});

router.get('/dashboard', async (req, res) => {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const [
    todayMeals,
    totalStudents,
    activeStudents,
    inventory,
    pendingComplaints,
    todayInspections,
    failedInspectionsToday,
    stockUsage,
  ] = await Promise.all([
    Transaction.countDocuments({
      transaction_date: { $gte: todayStart, $lte: todayEnd },
    }),
    Student.countDocuments(),
    Student.countDocuments({ eligibility_status: true }),
    InventoryItem.find(),
    Complaint.countDocuments({ status: 'pending' }),
    QualityInspection.countDocuments({
      delivery_date: { $gte: todayStart, $lte: todayEnd },
    }),
    QualityInspection.countDocuments({
      delivery_date: { $gte: todayStart, $lte: todayEnd },
      passed: false,
    }),
    estimateStockUsageForRange(todayStart, todayEnd),
  ]);

  const lowStock = inventory.filter((i) => i.closing_balance <= i.reorder_level);

  const todayByMeal = await Transaction.aggregate([
    { $match: { transaction_date: { $gte: todayStart, $lte: todayEnd } } },
    { $group: { _id: '$meal_type', count: { $sum: 1 } } },
  ]);

  const recentTransactions = await Transaction.find({
    transaction_date: { $gte: todayStart, $lte: todayEnd },
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .select('student_id student_name meal_type transaction_time verification_method');

  res.json({
    todayMeals,
    todayByMeal: Object.fromEntries(todayByMeal.map((r) => [r._id, r.count])),
    totalStudents,
    activeStudents,
    inventoryCount: inventory.length,
    lowStockCount: lowStock.length,
    lowStock: lowStock.slice(0, 5),
    pendingComplaints,
    todayInspections,
    failedInspectionsToday,
    estimatedStockUsage: stockUsage.estimatedUsage,
    mealCountsToday: stockUsage.mealCounts,
    recentTransactions,
  });
});

// Staff report endpoint
router.get('/staff', authorize('administrator', 'cafeteria_manager'), async (req, res) => {
  try {
    const period = req.query.period || 'monthly';
    const now = new Date();
    let startDate;

    if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    }
    startDate.setHours(0, 0, 0, 0);

    const allStaff = await User.find({ role: { $in: ['ticker'] } });
    const leftWorkStaff = allStaff.filter(s => s.status === 'Left Work');
    const activeStaff = allStaff.filter(s => s.status === 'Active');
    const onLeaveStaff = allStaff.filter(s => s.status === 'On Leave');

    const attendance = await StaffAttendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: now } } },
      {
        $group: {
          _id: '$userId',
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          totalDays: { $sum: 1 }
        }
      }
    ]);

    const avgAttendance = attendance.length > 0
      ? (attendance.reduce((sum, a) => sum + (a.presentCount / a.totalDays * 100), 0) / attendance.length).toFixed(1)
      : 0;

    const shiftABreakdown = allStaff.filter(s => s.assignedShift === 'Shift A');
    const shiftBBreakdown = allStaff.filter(s => s.assignedShift === 'Shift B');

    const positionBreakdown = {
      Cashier: allStaff.filter(s => s.position === 'Cashier').length,
      'Food Server': allStaff.filter(s => s.position === 'Food Server').length,
      Cleaner: allStaff.filter(s => s.position === 'Cleaner').length,
      'Kitchen Staff': allStaff.filter(s => s.position === 'Kitchen Staff').length,
      Supervisor: allStaff.filter(s => s.position === 'Supervisor').length,
    };

    res.json({
      totalStaff: allStaff.length,
      activeStaff: activeStaff.length,
      onLeaveStaff: onLeaveStaff.length,
      leftWorkCount: leftWorkStaff.length,
      averageAttendance: avgAttendance,
      shiftABreakdown: { count: shiftABreakdown.length, staff: shiftABreakdown.map(s => ({ name: s.fullName, role: s.assignedRole, position: s.position })) },
      shiftBBreakdown: { count: shiftBBreakdown.length, staff: shiftBBreakdown.map(s => ({ name: s.fullName, role: s.assignedRole, position: s.position })) },
      positionBreakdown,
      leftWorkList: leftWorkStaff.map(s => ({ _id: s._id, fullName: s.fullName, assignedRole: s.assignedRole, leftWorkNotes: s.leftWorkNotes, updatedAt: s.updatedAt })),
      attendanceSummary: attendance,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;