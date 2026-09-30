import cron from 'node-cron';
import { expenseStore } from '../models/ExpenseStore.js';

let notificationLog = [];

export const initCronNotifier = () => {
    console.log('⏰ Starting Neon PostgreSQL Due Date Cron Scheduler...');
    
    // Schedule daily check at 08:00 AM
    cron.schedule('0 8 * * *', async () => {
        await checkAndNotifyDueExpenses();
    });

    // Run initial scan on boot
    checkAndNotifyDueExpenses();
};

export const checkAndNotifyDueExpenses = async () => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const expenses = await expenseStore.getAll();
        const alerts = [];

        expenses.forEach(e => {
            if (e.status === 'PAID') return;

            const diffDays = Math.ceil((new Date(e.dueDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                alerts.push({
                    id: 'alert-' + e.id,
                    expenseId: e.id,
                    title: e.title,
                    amount: e.amount,
                    dueDate: e.dueDate,
                    type: 'OVERDUE',
                    message: `🚨 OVERDUE: "${e.title}" ($${e.amount.toFixed(2)}) was due on ${e.dueDate}!`,
                    timestamp: new Date().toISOString()
                });
            } else if (diffDays === 0) {
                alerts.push({
                    id: 'alert-' + e.id,
                    expenseId: e.id,
                    title: e.title,
                    amount: e.amount,
                    dueDate: e.dueDate,
                    type: 'DUE_TODAY',
                    message: `⚠️ DUE TODAY: "${e.title}" ($${e.amount.toFixed(2)}) is due today!`,
                    timestamp: new Date().toISOString()
                });
            } else if (diffDays <= 3) {
                alerts.push({
                    id: 'alert-' + e.id,
                    expenseId: e.id,
                    title: e.title,
                    amount: e.amount,
                    dueDate: e.dueDate,
                    type: 'DUE_SOON',
                    message: `⏰ UPCOMING: "${e.title}" ($${e.amount.toFixed(2)}) is due in ${diffDays} days (${e.dueDate}).`,
                    timestamp: new Date().toISOString()
                });
            }
        });

        notificationLog = alerts;
        return alerts;
    } catch (err) {
        console.error('Error scanning due date notifications:', err.message);
        return [];
    }
};

export const getNotificationLog = () => notificationLog;
