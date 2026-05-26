// backend/models/WasteTracking.js
import mongoose from 'mongoose';

const wasteTrackingSchema = new mongoose.Schema(
    {
        date: { type: Date, required: true, default: Date.now },
        mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
        itemName: { type: String, required: true },
        category: { type: String, enum: ['food', 'beverage', 'packaging'], default: 'food' },
        quantityWasted: { type: Number, required: true },
        unit: { type: String, required: true },
        estimatedCost: { type: Number, default: 0 },
        reason: {
            type: String,
            enum: ['overproduction', 'spoilage', 'quality_issue', 'student_uneaten', 'expiration', 'other'],
            required: true
        },
        reasonDetails: String,
        preventionMeasure: String,
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        mealCount: { type: Number, default: 0 }, // How many meals served that day
        wastePercentage: { type: Number, default: 0 }, // (quantity / total produced) * 100
    },
    { timestamps: true }
);

// Index for efficient queries
wasteTrackingSchema.index({ date: 1, mealType: 1 });
wasteTrackingSchema.index({ category: 1 });

const WasteTracking = mongoose.model('WasteTracking', wasteTrackingSchema);
export default WasteTracking;