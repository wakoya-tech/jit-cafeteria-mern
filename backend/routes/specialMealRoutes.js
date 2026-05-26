// backend/routes/specialMealRoutes.js
import express from 'express';
import SpecialMealRequest from '../models/SpecialMealRequest.js';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all requests (admin/manager)
router.get('/', protect, authorize('administrator', 'cafeteria_manager'), async (req, res) => {
    try {
        const { status, studentId } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (studentId) filter.studentId = studentId;

        const requests = await SpecialMealRequest.find(filter)
            .sort({ createdAt: -1 })
            .populate('approvedBy', 'fullName username');

        res.json(requests);
    } catch (err) {
        console.error('Error fetching special meals:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get requests for a student
router.get('/my-requests', protect, async (req, res) => {
    try {
        const { studentId } = req.query;
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        const requests = await SpecialMealRequest.find({ studentId })
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error('Error fetching student requests:', err);
        res.status(500).json({ message: err.message });
    }
});

// Student submits special meal request
router.post('/', protect, async (req, res) => {
    try {
        const {
            studentId,
            medicalCondition,
            conditionDetails,
            dietaryRestrictions,
            allowedFoods,
            forbiddenFoods,
            notes
        } = req.body;

        // Validate required fields
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }
        if (!medicalCondition) {
            return res.status(400).json({ message: 'Medical condition is required' });
        }
        if (!conditionDetails) {
            return res.status(400).json({ message: 'Condition details are required' });
        }

        // Find student
        const student = await Student.findOne({ student_id: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Create request
        const request = await SpecialMealRequest.create({
            studentId: student.student_id,
            studentName: student.name,
            department: student.department,
            medicalCondition,
            conditionDetails,
            dietaryRestrictions: dietaryRestrictions || [],
            allowedFoods: allowedFoods || '',
            forbiddenFoods: forbiddenFoods || '',
            notes: notes || '',
            createdBy: req.user._id,
        });

        res.status(201).json({
            message: 'Special meal request submitted successfully',
            request
        });
    } catch (err) {
        console.error('Error creating special meal request:', err);
        res.status(400).json({ message: err.message });
    }
});

// Approve/reject request (admin/manager)
router.put('/:id/approve', protect, authorize('administrator', 'cafeteria_manager'), async (req, res) => {
    try {
        const { status, rejectionReason, endDate } = req.body;
        const request = await SpecialMealRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = status;
        request.approvedBy = req.user._id;
        request.approvedDate = new Date();

        if (status === 'rejected' && rejectionReason) {
            request.rejectionReason = rejectionReason;
        }
        if (endDate) {
            request.endDate = new Date(endDate);
        }

        await request.save();

        res.json({
            message: `Request ${status} successfully`,
            request
        });
    } catch (err) {
        console.error('Error approving request:', err);
        res.status(400).json({ message: err.message });
    }
});

// Get active special meal requests for today
router.get('/active-today', protect, authorize('administrator', 'cafeteria_manager', 'cashier'), async (req, res) => {
    try {
        const today = new Date();
        const activeRequests = await SpecialMealRequest.find({
            status: 'approved',
            startDate: { $lte: today },
            $or: [
                { endDate: { $gte: today } },
                { endDate: null }
            ]
        });

        // Group by studentId for quick lookup
        const requestMap = {};
        activeRequests.forEach(req => {
            requestMap[req.studentId] = {
                dietaryRestrictions: req.dietaryRestrictions,
                allowedFoods: req.allowedFoods,
                forbiddenFoods: req.forbiddenFoods,
                notes: req.notes
            };
        });

        res.json({ count: activeRequests.length, requests: requestMap });
    } catch (err) {
        console.error('Error fetching active requests:', err);
        res.status(500).json({ message: err.message });
    }
});

export default router;