import express from 'express';
import InventoryItem from '../models/InventoryItem.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('administrator', 'cafeteria_manager'));

router.get('/', async (req, res) => {
  const items = await InventoryItem.find().sort({ item_name: 1 });
  const lowStock = items.filter((i) => i.closing_balance <= i.reorder_level);
  res.json({ items, lowStockCount: lowStock.length, lowStock });
});

router.post('/', async (req, res) => {
  try {
    const closing =
      (req.body.opening_balance || 0) +
      (req.body.received_qty || 0) -
      (req.body.issued_qty || 0);
    const item = await InventoryItem.create({
      ...req.body,
      closing_balance: req.body.closing_balance ?? closing,
      last_updated: new Date(),
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    if (req.body.received_qty != null) {
      item.received_qty += Number(req.body.received_qty);
    }
    if (req.body.issued_qty != null) {
      item.issued_qty += Number(req.body.issued_qty);
    }
    if (req.body.item_name) item.item_name = req.body.item_name;
    if (req.body.supplier) item.supplier = req.body.supplier;
    if (req.body.remarks) item.remarks = req.body.remarks;
    if (req.body.reorder_level != null) item.reorder_level = req.body.reorder_level;

    item.closing_balance = item.opening_balance + item.received_qty - item.issued_qty;
    item.last_updated = new Date();
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('administrator'), async (req, res) => {
  const item = await InventoryItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  res.json({ message: 'Item removed.' });
});

export default router;
