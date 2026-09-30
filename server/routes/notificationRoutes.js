import express from 'express';
import { checkAndNotifyDueExpenses, getNotificationLog } from '../services/cronNotifier.js';

const router = express.Router();

// GET /api/notifications - Get active due date alerts
router.get('/', async (req, res) => {
    try {
        const alerts = await checkAndNotifyDueExpenses();
        res.json({
            success: true,
            alerts,
            unreadCount: alerts.length
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/notifications/trigger-check - Force immediate notification scan
router.post('/trigger-check', async (req, res) => {
    try {
        const alerts = await checkAndNotifyDueExpenses();
        res.json({
            success: true,
            message: `Scanned expenses: ${alerts.length} due notifications active.`,
            alerts
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
