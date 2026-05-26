// backend/routes/wasteRoutes.js
import express from 'express';
import WasteTracking from '../models/WasteTracking.js';
import Transaction from '../models/Transaction.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('administrator', 'cafeteria_manager'));

// Record waste
router.post('/', async (req, res) => {
    try {
        const waste = await WasteTracking.create({
            ...req.body,
            recordedBy: req.user._id
        });
        res.status(201).json(waste);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get waste analytics
router.get('/analytics', async (req, res) => {
    try {
        const { period, fromDate, toDate } = req.query;
        let start, end;

        if (fromDate && toDate) {
            start = new Date(fromDate);
            end = new Date(toDate);
        } else {
            end = new Date();
            start = new Date();
            if (period === 'weekly') start.setDate(start.getDate() - 7);
            else if (period === 'monthly') start.setMonth(start.getMonth() - 1);
            else start.setDate(start.getDate() - 1);
        }
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const wasteRecords = await WasteTracking.find({
            date: { $gte: start, $lte: end }
        });

        // Calculate total cost
        const totalCost = wasteRecords.reduce((sum, w) => sum + (w.estimatedCost || 0), 0);

        // Waste by reason
        const byReason = {};
        wasteRecords.forEach(w => {
            byReason[w.reason] = (byReason[w.reason] || 0) + w.quantityWasted;
        });

        // Waste by meal type
        const byMealType = { breakfast: 0, lunch: 0, dinner: 0 };
        wasteRecords.forEach(w => {
            byMealType[w.mealType] += w.quantityWasted;
        });

        // Waste by category
        const byCategory = {};
        wasteRecords.forEach(w => {
            byCategory[w.category] = (byCategory[w.category] || 0) + w.quantityWasted;
        });

        // Top wasted items
        const topWastedItems = {};
        wasteRecords.forEach(w => {
            if (!topWastedItems[w.itemName]) {
                topWastedItems[w.itemName] = { quantity: 0, cost: 0, count: 0 };
            }
            topWastedItems[w.itemName].quantity += w.quantityWasted;
            topWastedItems[w.itemName].cost += w.estimatedCost || 0;
            topWastedItems[w.itemName].count++;
        });

        // Calculate waste percentage (compared to meals served)
        const mealCount = await Transaction.countDocuments({
            transaction_date: { $gte: start, $lte: end }
        });

        const totalWasteQuantity = wasteRecords.reduce((sum, w) => sum + w.quantityWasted, 0);
        const avgWastePerMeal = mealCount > 0 ? (totalWasteQuantity / mealCount).toFixed(2) : 0;

        // Recommendations based on data
        const recommendations = [];
        const topReason = Object.entries(byReason).sort((a, b) => b[1] - a[1])[0];
        if (topReason) {
            switch (topReason[0]) {
                case 'overproduction':
                    recommendations.push('Reduce production quantities based on actual attendance trends');
                    break;
                case 'spoilage':
                    recommendations.push('Check storage conditions and implement FIFO (First-In-First-Out) system');
                    break;
                case 'quality_issue':
                    recommendations.push('Increase quality inspection frequency for supplier deliveries');
                    break;
                case 'expiration':
                    recommendations.push('Implement better inventory rotation and track expiry dates');
                    break;
            }
        }

        const topWastedItem = Object.entries(topWastedItems).sort((a, b) => b[1].quantity - a[1].quantity)[0];
        if (topWastedItem) {
            recommendations.push(`Consider reducing ${topWastedItem[0]} preparation - wasted ${topWastedItem[1].quantity} units`);
        }

        res.json({
            period: { start, end, label: period || 'custom' },
            summary: {
                totalWasteQuantity,
                totalCost: totalCost.toFixed(2),
                totalRecords: wasteRecords.length,
                mealCount,
                avgWastePerMeal
            },
            byReason,
            byMealType,
            byCategory,
            topWastedItems: Object.entries(topWastedItems)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10),
            recommendations,
            recentWaste: wasteRecords.slice(-20)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get waste reduction suggestions
router.get('/suggestions', async (req, res) => {
    try {
        const suggestions = [
            {
                id: 1,
                title: 'Production Adjustment',
                description: 'Based on data analysis, adjust meal portions based on actual attendance patterns',
                potentialSavings: '~15% reduction in waste'
            },
            {
                id: 2,
                title: 'Storage Optimization',
                description: 'Improve organization of refrigerators and storage areas to reduce spoilage',
                potentialSavings: '~20% reduction in spoiled food'
            },
            {
                id: 3,
                title: 'Menu Planning',
                description: 'Schedule popular items on high-attendance days to reduce leftovers',
                potentialSavings: '~10% reduction in leftover food'
            }
        ];
        res.json(suggestions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;