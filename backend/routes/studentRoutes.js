import express from 'express';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';
import { buildStudentQrPayload } from '../utils/studentQr.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('administrator', 'cafeteria_manager', 'ticker'), async (req, res) => {
  const { search, department } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { student_id: new RegExp(search, 'i') },
      { name: new RegExp(search, 'i') },
    ];
  }
  if (department) filter.department = department;
  const students = await Student.find(filter).sort({ name: 1 });
  res.json(students);
});

router.get('/qr/:studentId', authorize('administrator', 'cafeteria_manager', 'ticker'), async (req, res) => {
  const student = await Student.findOne({
    student_id: req.params.studentId.toUpperCase(),
  });
  if (!student) return res.status(404).json({ message: 'Student not found.' });
  res.json({
    student_id: student.student_id,
    name: student.name,
    department: student.department,
    qr_payload: buildStudentQrPayload(student.student_id),
    university: 'Jimma University',
  });
});

router.get('/:studentId', authorize('administrator', 'cafeteria_manager', 'ticker', 'student'), async (req, res) => {
  const student = await Student.findOne({
    student_id: req.params.studentId.toUpperCase(),
  });
  if (!student) return res.status(404).json({ message: 'Student not found.' });
  res.json({
    ...student.toObject(),
    qr_payload: buildStudentQrPayload(student.student_id),
  });
});

router.post('/', authorize('registrar'), async (req, res) => {
  try {
    const data = { ...req.body, student_id: req.body.student_id?.toUpperCase() };
    const student = await Student.create(data);
    res.status(201).json({
      ...student.toObject(),
      qr_payload: buildStudentQrPayload(student.student_id),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('registrar'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('registrar'), async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });
  res.json({ message: 'Student removed.' });
});

export default router;
