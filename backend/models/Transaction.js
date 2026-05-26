import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    student_id: { type: String, required: true, ref: 'Student' },
    student_name: { type: String },
    department: { type: String },
    meal_type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      required: true,
    },
    transaction_date: { type: Date, required: true, default: Date.now },
    transaction_time: { type: String, required: true },
    recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cashier_name: { type: String },
    verification_method: {
      type: String,
      enum: ['qr', 'barcode', 'manual', 'manual_roster'],
      default: 'manual',
    },
    override_reason: {
      type: String,
      enum: ['forgot_id', 'barcode_failed', 'damaged_card', 'system_down'],
    },
  },
  { timestamps: true }
);

transactionSchema.index({ student_id: 1, meal_type: 1, transaction_date: 1 });

export default mongoose.model('Transaction', transactionSchema);
