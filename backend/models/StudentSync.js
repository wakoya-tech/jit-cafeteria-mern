// backend/models/StudentSync.js
import mongoose from 'mongoose';

const studentSyncSchema = new mongoose.Schema(
    {
        syncDate: { type: Date, default: Date.now },
        totalProcessed: { type: Number, default: 0 },
        newStudents: { type: Number, default: 0 },
        updatedStudents: { type: Number, default: 0 },
        deactivatedStudents: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        },
        errorLog: [String],
        source: { type: String, default: 'university_api' },
        triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

const StudentSync = mongoose.model('StudentSync', studentSyncSchema);
export default StudentSync;