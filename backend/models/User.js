// backend/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['administrator', 'cafeteria_manager', 'cashier', 'student', 'registrar'],
      required: true,
    },
    fullName: { type: String, trim: true },
    studentId: { type: String, sparse: true },
    assignedShift: {
      type: String,
      enum: ['Morning Shift', 'Afternoon Shift', 'Evening Shift', 'None'],
      default: 'None'
    },
    assignedRole: {
      type: String,
      enum: ['Cashier', 'Food Server', 'Cleaner', 'Manager', 'Registrar', 'Admin', 'Kitchen Staff'],
      default: 'Cashier'
    },
    status: { type: String, enum: ['Active', 'On Leave', 'Left Work'], default: 'Active' },
    leftWorkReportedToAdmin: { type: Boolean, default: false },
    leftWorkNotes: { type: String, default: '' },
    position: { type: String, enum: ['Cashier', 'Food Server', 'Cleaner', 'Kitchen Staff', 'Supervisor'], default: 'Cashier' },
    phoneNumber: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    hireDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);