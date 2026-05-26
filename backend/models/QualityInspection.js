import mongoose from 'mongoose';

const inspectionSchema = new mongoose.Schema(
  {
    supplier_name: { type: String, required: true, trim: true },
    item_type: { type: String, required: true, trim: true },
    item_category: {
      type: String,
      enum: ['injera', 'bakery', 'shiro_flour', 'berbere', 'lentils', 'onion', 'garlic', 'rice', 'oil', 'hot_food', 'other'],
      default: 'other',
    },
    inventory_item_name: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    quantity_ordered: { type: Number, min: 0 },
    quantity_counted: { type: Number, min: 0 },
    injera_count: { type: Number, min: 0 },
    delivery_date: { type: Date, default: Date.now },
    delivery_time: { type: String, trim: true },
    temperature_celsius: { type: Number },
    weight_verified: { type: Boolean, default: true },
    mold: { type: Boolean, default: false },
    damage: { type: Boolean, default: false },
    discoloration: { type: Boolean, default: false },
    bad_smell: { type: Boolean, default: false },
    visual_defects: { type: Boolean, default: false },
    defect_notes: { type: String, trim: true },
    rejection_action: { type: String, enum: ['return_supplier', 'discard', 'partial_accept'], trim: true },
    inspector_name: { type: String, trim: true },
    passed: { type: Boolean, default: true },
    fail_reasons: [{ type: String }],
    stock_received: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('QualityInspection', inspectionSchema);
