import express from 'express';
import Complaint from '../models/Complaint.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const complaint = await Complaint.create(req.body);
    res.status(201).json({ message: 'Feedback submitted.', complaint });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.use(protect);

router.get('/', authorize('administrator', 'cafeteria_manager'), async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
  res.json(complaints);
});

router.put('/:id', authorize('administrator', 'cafeteria_manager'), async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!complaint) return res.status(404).json({ message: 'Not found.' });
  res.json(complaint);
});

export default router;
