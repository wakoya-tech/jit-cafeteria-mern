import express from 'express';
import Student from '../models/Student.js';
import Transaction from '../models/Transaction.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  getCurrentMealType,
  formatTime,
  startOfDay,
  endOfDay,
  getMealWindowLabel,
} from '../utils/mealPeriod.js';
import { parseStudentScan } from '../utils/studentQr.js';
import { deductStockForMeal } from '../utils/mealInventory.js';

const router = express.Router();

router.use(protect);

/** Verify eligibility and check duplicate for current service period */
router.post('/verify', authorize('cashier', 'cafeteria_manager', 'administrator'), async (req, res) => {
  try {
    const rawScan = req.body.scan_data || req.body.student_id || '';
    const studentId = parseStudentScan(rawScan);
    if (!studentId) return res.status(400).json({ message: 'Student ID is required.' });

    const student = await Student.findOne({
      $or: [{ student_id: studentId }, { barcode: studentId }],
    });
    if (!student) {
      return res.status(404).json({
        eligible: false,
        message: 'Student not found in Jimma University registry.',
      });
    }
    if (!student.eligibility_status) {
      return res.status(403).json({
        eligible: false,
        message: 'Student is not eligible for meals.',
        student: {
          student_id: student.student_id,
          name: student.name,
          department: student.department,
          program: student.program,
          eligibility_status: student.eligibility_status,
          is_intern: student.is_intern,
          is_non_cafe: student.is_non_cafe,
          imageUrl: student.imageUrl,
          year: student.year,
        },
      });
    }

    if (student.is_intern) {
      return res.status(403).json({
        eligible: false,
        message: 'Access Denied: Student is currently on internship and cannot access cafeteria meals.',
        student: {
          student_id: student.student_id,
          name: student.name,
          department: student.department,
          program: student.program,
          eligibility_status: student.eligibility_status,
          is_intern: student.is_intern,
          is_non_cafe: student.is_non_cafe,
          imageUrl: student.imageUrl,
          year: student.year,
        },
      });
    }

    if (student.is_non_cafe) {
      return res.status(403).json({
        eligible: false,
        message: 'Access Denied: Student is designated as Non-Cafeteria and cannot access cafeteria meals.',
        student: {
          student_id: student.student_id,
          name: student.name,
          department: student.department,
          program: student.program,
          eligibility_status: student.eligibility_status,
          is_intern: student.is_intern,
          is_non_cafe: student.is_non_cafe,
          imageUrl: student.imageUrl,
          year: student.year,
        },
      });
    }

    const mealType = req.body.meal_type || getCurrentMealType();
    if (!mealType) {
      return res.status(400).json({
        eligible: false,
        message: 'Outside official meal service hours.',
        windows: {
          breakfast: getMealWindowLabel('breakfast'),
          lunch: getMealWindowLabel('lunch'),
          dinner: getMealWindowLabel('dinner'),
        },
      });
    }

    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const existing = await Transaction.findOne({
      student_id: studentId,
      meal_type: mealType,
      transaction_date: { $gte: todayStart, $lte: todayEnd },
    });

    res.json({
      eligible: !existing,
      alreadyServed: !!existing,
      student: {
        student_id: student.student_id,
        name: student.name,
        department: student.department,
        program: student.program,
        eligibility_status: student.eligibility_status,
        is_intern: student.is_intern,
        is_non_cafe: student.is_non_cafe,
        imageUrl: student.imageUrl,
        year: student.year,
      },
      meal_type: mealType,
      service_window: getMealWindowLabel(mealType),
      message: existing
        ? `Already received ${mealType} today.`
        : 'Eligible for meal.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/** Record meal transaction (duplicate prevention enforced) */
router.post('/transaction', authorize('cashier', 'administrator'), async (req, res) => {
  try {
    const rawScan = req.body.scan_data || req.body.student_id || '';
    const studentId = parseStudentScan(rawScan);
    const mealType = req.body.meal_type || getCurrentMealType();

    if (!studentId) return res.status(400).json({ message: 'Student ID is required.' });
    if (!mealType) return res.status(400).json({ message: 'Outside meal service hours.' });

    const student = await Student.findOne({
      $or: [{ student_id: studentId }, { barcode: studentId }],
    });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    if (!student.eligibility_status) {
      return res.status(403).json({ message: 'Student not eligible.' });
    }
    if (student.is_intern) {
      return res.status(403).json({ message: 'Student is currently an intern and cannot access cafeteria food.' });
    }
    if (student.is_non_cafe) {
      return res.status(403).json({ message: 'Student is designated as non-cafeteria and cannot access cafeteria food.' });
    }

    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const duplicate = await Transaction.findOne({
      student_id: studentId,
      meal_type: mealType,
      transaction_date: { $gte: todayStart, $lte: todayEnd },
    });
    if (duplicate) {
      return res.status(409).json({
        message: `Duplicate: student already received ${mealType} today.`,
        transaction: duplicate,
      });
    }

    const now = new Date();
    const transaction = await Transaction.create({
      student_id: studentId,
      student_name: student.name,
      department: student.department,
      meal_type: mealType,
      transaction_date: now,
      transaction_time: formatTime(now),
      recorded_by: req.user._id,
      cashier_name: req.user.fullName || req.user.username,
      verification_method: req.body.verification_method || 'manual',
      override_reason: req.body.override_reason || undefined,
    });

    const stockUpdates = await deductStockForMeal(mealType);

    res.status(201).json({
      message: 'Meal recorded successfully.',
      transaction,
      stockUpdates,
      student: {
        student_id: student.student_id,
        name: student.name,
        department: student.department,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/transactions', authorize('administrator', 'cafeteria_manager', 'cashier'), async (req, res) => {
  const { date, meal_type, student_id } = req.query;
  const filter = {};
  if (date) {
    const d = new Date(date);
    filter.transaction_date = { $gte: startOfDay(d), $lte: endOfDay(d) };
  }
  if (meal_type) filter.meal_type = meal_type;
  if (student_id) filter.student_id = student_id.toUpperCase();

  const transactions = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .limit(500);
  res.json(transactions);
});

router.get('/current-period', (req, res) => {
  const mealType = getCurrentMealType();
  res.json({
    meal_type: mealType,
    service_window: mealType ? getMealWindowLabel(mealType) : null,
    is_service_hours: !!mealType,
  });
});

export default router;
