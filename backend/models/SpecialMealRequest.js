// backend/models/SpecialMealRequest.js
import mongoose from 'mongoose';

const specialMealRequestSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: true,
        },
        studentName: {
            type: String,
            required: true,
        },
        department: String,
        medicalCondition: {
            type: String,
            required: true,
            enum: ['diabetes', 'hypertension', 'allergy', 'celiac', 'kidney_disease', 'pregnancy', 'post_surgery', 'other'],
        },
        conditionDetails: {
            type: String,
            required: true,
        },
        dietaryRestrictions: [{
            type: String,
            enum: ['no_sugar', 'low_salt', 'gluten_free', 'lactose_free', 'nut_free', 'vegetarian', 'low_fat', 'high_protein']
        }],
        allowedFoods: { type: String, default: '' },
        forbiddenFoods: { type: String, default: '' },
        mealPreferences: {
            breakfast: { type: String, default: '' },
            lunch: { type: String, default: '' },
            dinner: { type: String, default: '' }
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'expired'],
            default: 'pending'
        },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approvedDate: Date,
        rejectionReason: String,
        startDate: { type: Date, default: Date.now },
        endDate: Date,
        notes: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

const SpecialMealRequest = mongoose.model('SpecialMealRequest', specialMealRequestSchema);
export default SpecialMealRequest;