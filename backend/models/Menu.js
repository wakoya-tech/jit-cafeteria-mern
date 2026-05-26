import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema(
  {
    program_type: {
      type: String,
      enum: ['weekly', 'daily_override'],
      default: 'weekly',
    },
    day_of_week: { type: Number, min: 0, max: 6 },
    day_label_am: { type: String, trim: true },
    day_label_en: { type: String, trim: true },
    meal_type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      required: true,
    },
    meal_label_am: { type: String, trim: true },
    menu_date: { type: Date },
    items: [{ type: String, trim: true }],
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

menuSchema.index({ program_type: 1, day_of_week: 1, meal_type: 1 });
menuSchema.index({ meal_type: 1, menu_date: 1 });

export default mongoose.model('Menu', menuSchema);
