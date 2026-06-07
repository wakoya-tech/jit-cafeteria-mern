// routes/userRoutes.js
import express from 'express';
import User from '../models/User.js';
import StaffAttendance from '../models/StaffAttendance.js';
import { protect, authorize } from '../middleware/auth.js';
import { getCurrentShift, getAllShifts, isShiftActive, getShiftTiming } from '../utils/shiftUtils.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('administrator', 'cafeteria_manager'), async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// Get current shift info (auto-detect based on time)
router.get('/current-shift', async (req, res) => {
  const currentShift = getCurrentShift();
  const allShifts = getAllShifts();

  res.json({
    currentShift,
    isActive: !!currentShift,
    allShifts,
    shiftTiming: currentShift ? getShiftTiming(currentShift) : null,
    currentTime: new Date().toLocaleTimeString(),
    currentHour: new Date().getHours()
  });
});

// Get staff attendance for a specific date and shift
router.get('/attendance', authorize('administrator', 'cafeteria_manager'), async (req, res) => {
  try {
    const { date, shift } = req.query;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // If shift not specified, use current shift
    const selectedShift = shift || getCurrentShift();

    if (!selectedShift) {
      return res.json({
        shift: null,
        shiftTiming: null,
        isActive: false,
        staff: [],
        message: 'No active shift at this time. Please select a shift manually.'
      });
    }

    // Get all active staff
    const staff = await User.find({
      role: { $in: ['ticker'] },
      status: { $ne: 'Left Work' }
    }).select('-password');

    // Get attendance records for this date and shift
    const attendance = await StaffAttendance.find({
      date: targetDate,
      shift: selectedShift
    });

    const result = staff.map(s => ({
      _id: s._id,
      userId: s._id,
      userName: s.fullName || s.username,
      assignedRole: s.assignedRole,
      assignedShift: s.assignedShift,
      position: s.position || s.assignedRole,
      shift: selectedShift,
      status: attendance.find(a => a.userId.toString() === s._id.toString())?.status || 'not_marked',
      checkInTime: attendance.find(a => a.userId.toString() === s._id.toString())?.checkInTime,
      checkOutTime: attendance.find(a => a.userId.toString() === s._id.toString())?.checkOutTime,
      notes: attendance.find(a => a.userId.toString() === s._id.toString())?.notes,
      attendanceId: attendance.find(a => a.userId.toString() === s._id.toString())?._id,
    }));

    res.json({
      shift: selectedShift,
      shiftTiming: getShiftTiming(selectedShift),
      isActive: isShiftActive(selectedShift),
      staff: result
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark attendance for a shift
router.post('/attendance', authorize('administrator', 'cafeteria_manager'), async (req, res) => {
  try {
    const { userId, date, status, shift, checkInTime, checkOutTime, notes } = req.body;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Use current shift if not specified
    const selectedShift = shift || getCurrentShift();

    if (!selectedShift) {
      return res.status(400).json({ message: 'No active shift at this time. Please select a shift manually.' });
    }

    const existing = await StaffAttendance.findOne({
      userId,
      date: targetDate,
      shift: selectedShift
    });

    const attendanceData = {
      userId,
      date: targetDate,
      shift: selectedShift,
      status,
      checkInTime: checkInTime || new Date().toLocaleTimeString(),
      checkOutTime: checkOutTime || '',
      notes: notes || '',
      markedBy: req.user._id
    };

    if (existing) {
      existing.status = status;
      existing.checkInTime = attendanceData.checkInTime;
      existing.checkOutTime = attendanceData.checkOutTime;
      existing.notes = attendanceData.notes;
      existing.markedBy = req.user._id;
      await existing.save();
      return res.json(existing);
    }

    const attendance = await StaffAttendance.create(attendanceData);
    res.status(201).json(attendance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get attendance summary for a date range
router.get('/attendance-summary', authorize('administrator', 'cafeteria_manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const attendance = await StaffAttendance.find({
      date: { $gte: start, $lte: end }
    }).populate('userId', 'fullName username assignedShift assignedRole position');

    const summary = {
      byShift: {
        'Morning Shift': { total: 0, present: 0, absent: 0, late: 0, half_day: 0 },
        'Afternoon Shift': { total: 0, present: 0, absent: 0, late: 0, half_day: 0 },
        'Evening Shift': { total: 0, present: 0, absent: 0, late: 0, half_day: 0 }
      },
      byStaff: {},
      totalRecords: attendance.length
    };

    attendance.forEach(record => {
      if (summary.byShift[record.shift]) {
        summary.byShift[record.shift].total++;
        summary.byShift[record.shift][record.status]++;
      }

      const staffName = record.userId?.fullName || record.userId?.username;
      if (!summary.byStaff[staffName]) {
        summary.byStaff[staffName] = {
          staffId: record.userId?._id,
          shift: record.userId?.assignedShift,
          position: record.userId?.position,
          attendance: []
        };
      }
      summary.byStaff[staffName].attendance.push({
        date: record.date,
        shift: record.shift,
        status: record.status,
        checkInTime: record.checkInTime
      });
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('administrator'), async (req, res) => {
  try {
    const { username, password, role, fullName, studentId, assignedShift, assignedRole, position, phoneNumber, emergencyContact } = req.body;
    const exists = await User.findOne({ username: username.trim().toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Username already exists.' });

    const user = await User.create({
      username: username.trim().toLowerCase(),
      password,
      role,
      fullName,
      studentId,
      assignedShift: assignedShift || 'None',
      assignedRole: assignedRole || 'Cashier',
      position: position || assignedRole || 'Cashier',
      phoneNumber: phoneNumber || '',
      emergencyContact: emergencyContact || '',
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      assignedShift: user.assignedShift,
      assignedRole: user.assignedRole,
      position: user.position,
      phoneNumber: user.phoneNumber,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id/shift', authorize('administrator', 'cafeteria_manager'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (req.body.assignedShift !== undefined) user.assignedShift = req.body.assignedShift;
    if (req.body.assignedRole !== undefined) user.assignedRole = req.body.assignedRole;
    if (req.body.status !== undefined) user.status = req.body.status;
    if (req.body.leftWorkReportedToAdmin !== undefined) user.leftWorkReportedToAdmin = req.body.leftWorkReportedToAdmin;
    if (req.body.leftWorkNotes !== undefined) user.leftWorkNotes = req.body.leftWorkNotes;
    if (req.body.position !== undefined) user.position = req.body.position;
    if (req.body.phoneNumber !== undefined) user.phoneNumber = req.body.phoneNumber;
    if (req.body.emergencyContact !== undefined) user.emergencyContact = req.body.emergencyContact;

    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      assignedShift: user.assignedShift,
      assignedRole: user.assignedRole,
      position: user.position,
      phoneNumber: user.phoneNumber,
      status: user.status,
      leftWorkReportedToAdmin: user.leftWorkReportedToAdmin,
      leftWorkNotes: user.leftWorkNotes,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('administrator'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (req.body.role) user.role = req.body.role;
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.password) user.password = req.body.password;
    if (req.body.assignedShift) user.assignedShift = req.body.assignedShift;
    if (req.body.assignedRole) user.assignedRole = req.body.assignedRole;
    if (req.body.position) user.position = req.body.position;
    if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      assignedShift: user.assignedShift,
      assignedRole: user.assignedRole,
      position: user.position,
      phoneNumber: user.phoneNumber,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('administrator'), async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ message: 'User removed.' });
});

export default router;