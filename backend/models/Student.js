import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    student_id: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    program: { type: String, trim: true },
    year: { type: Number, min: 1, max: 6 },
    eligibility_status: { type: Boolean, default: true },
    barcode: { type: String },
    is_intern: { type: Boolean, default: false },
    is_non_cafe: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model('Student', studentSchema);
