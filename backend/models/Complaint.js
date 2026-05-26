import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['food_quality', 'service', 'cleanliness', 'other'],
      required: true,
    },
    description: { type: String, required: true },
    student_id: { type: String },
    is_anonymous: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending',
    },
    response: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Complaint', complaintSchema);
