// backend/routes/universitySyncRoutes.js
import express from 'express';
import universityIDService from '../services/universityIdSync.js';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('administrator', 'registrar'));

// Manual sync with university system
router.post('/sync', async (req, res) => {
    try {
        const result = await universityIDService.syncStudents(req.user._id);
        res.json({
            message: 'Student sync completed successfully',
            ...result
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get sync history
router.get('/sync-history', async (req, res) => {
    try {
        const history = await universityIDService.getSyncHistory(parseInt(req.query.limit) || 10);
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Validate student ID against university system
router.post('/validate', async (req, res) => {
    try {
        const { studentId } = req.body;
        const result = await universityIDService.validateStudentId(studentId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get student from university system by ID
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findOne({ student_id: studentId });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(student);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;