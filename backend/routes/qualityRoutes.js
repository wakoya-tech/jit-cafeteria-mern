import express from 'express';
import QualityInspection from '../models/QualityInspection.js';
import { protect, authorize } from '../middleware/auth.js';
import { evaluateInspection } from '../utils/qualityCheck.js';
import { receiveDeliveryToInventory } from '../utils/receiveToInventory.js';

const router = express.Router();

router.use(protect);
router.use(authorize('administrator', 'cafeteria_manager'));

router.get('/guide', (_req, res) => {
  res.json({
    steps: [
      'Check delivery note quantity vs physical count (for injera — count every piece).',
      'Measure temperature: hot injera/shiro ≥50°C; cold items ≤8°C.',
      'Weigh or verify weight if supplier invoice is in kg.',
      'Inspect for mold, damage, discoloration, and smell.',
      'If ANY check fails — reject and do not add to stock (return to supplier).',
      'If all pass — stock is added automatically to inventory.',
    ],
    categories: [
      { id: 'injera', label: 'Injera', tip: 'Count pieces; stack must be fresh and warm.' },
      { id: 'shiro_flour', label: 'Shiro / sauce raw material', tip: 'Flour, berbere, oil for sauce preparation.' },
      { id: 'bakery', label: 'Bread / buns', tip: 'From Jimma Bakery — visual + smell.' },
      { id: 'lentils', label: 'Lentils (misir)', tip: 'Check for stones and moisture.' },
    ],
  });
});

router.get('/', async (req, res) => {
  const { from, to, supplier } = req.query;
  const filter = {};
  if (supplier) filter.supplier_name = new RegExp(supplier, 'i');
  if (from || to) {
    filter.delivery_date = {};
    if (from) filter.delivery_date.$gte = new Date(from);
    if (to) filter.delivery_date.$lte = new Date(to);
  }
  const inspections = await QualityInspection.find(filter).sort({ delivery_date: -1 }).limit(200);
  res.json(inspections);
});

router.get('/:id', async (req, res) => {
  const doc = await QualityInspection.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Inspection not found.' });
  res.json(doc);
});

router.post('/', async (req, res) => {
  try {
    const evaluation = evaluateInspection(req.body);
    const inspection = await QualityInspection.create({
      ...req.body,
      visual_defects: evaluation.visual_defects,
      passed: evaluation.passed,
      fail_reasons: evaluation.reasons,
      inspector_name: req.body.inspector_name || req.user.fullName || req.user.username,
      quantity_counted:
        req.body.quantity_counted ??
        (req.body.item_category === 'injera' ? req.body.injera_count : req.body.quantity),
    });

    let stockResult = null;
    if (inspection.passed) {
      stockResult = await receiveDeliveryToInventory(inspection);
      inspection.stock_received = stockResult.received;
      await inspection.save();
    }

    res.status(201).json({
      inspection,
      evaluation,
      stockResult,
      message: inspection.passed
        ? 'Delivery accepted — added to inventory.'
        : `Delivery REJECTED: ${evaluation.reasons.join('; ')}`,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const evaluation = evaluateInspection(req.body);
    const inspection = await QualityInspection.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        visual_defects: evaluation.visual_defects,
        passed: evaluation.passed,
        fail_reasons: evaluation.reasons,
      },
      { new: true, runValidators: true }
    );
    if (!inspection) return res.status(404).json({ message: 'Inspection not found.' });
    res.json({ inspection, evaluation });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('administrator'), async (req, res) => {
  const inspection = await QualityInspection.findByIdAndDelete(req.params.id);
  if (!inspection) return res.status(404).json({ message: 'Inspection not found.' });
  res.json({ message: 'Inspection removed.' });
});

export default router;
