import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    item_name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['food', 'supply', 'other'], default: 'food' },
    unit: { type: String, default: 'kg' },
    opening_balance: { type: Number, default: 0 },
    received_qty: { type: Number, default: 0 },
    issued_qty: { type: Number, default: 0 },
    closing_balance: { type: Number, default: 0 },
    reorder_level: { type: Number, default: 10 },
    supplier: { type: String, trim: true },
    last_updated: { type: Date, default: Date.now },
    remarks: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('InventoryItem', inventorySchema);
