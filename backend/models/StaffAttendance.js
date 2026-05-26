// backend/models/StaffAttendance.js
import mongoose from 'mongoose';

const staffAttendanceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        shift: {
            type: String,
            enum: ['Morning Shift', 'Afternoon Shift', 'Evening Shift'],
            required: true,
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'half_day'],
            required: true,
        },
        checkInTime: {
            type: String,
        },
        checkOutTime: {
            type: String,
        },
        notes: {
            type: String,
        },
        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Ensure one attendance record per user per shift per day
staffAttendanceSchema.index({ userId: 1, date: 1, shift: 1 }, { unique: true });

const StaffAttendance = mongoose.model('StaffAttendance', staffAttendanceSchema);
export default StaffAttendance;