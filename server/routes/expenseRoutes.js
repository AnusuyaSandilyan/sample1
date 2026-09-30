import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { parseExcelBuffer } from '../services/excelParser.js';
import { expenseStore } from '../models/ExpenseStore.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to compute stats & due categories
const getEnrichedExpenses = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const expenses = await expenseStore.getAll();

    // Group expenses by category to check category budget overflow
    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const enriched = expenses.map(e => {
        let computedStatus = e.status;
        const diffDays = Math.ceil((new Date(e.dueDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24));

        if (e.status !== 'PAID') {
            if (diffDays < 0) {
                computedStatus = 'OVERDUE';
            } else if (diffDays === 0) {
                computedStatus = 'DUE_TODAY';
            } else if (diffDays <= 7) {
                computedStatus = 'DUE_SOON';
            } else {
                computedStatus = 'PENDING';
            }
        }

        const categoryTotal = categoryTotals[e.category] || 0;
        const isCategoryOverBudget = e.categoryBudget > 0 && categoryTotal > e.categoryBudget;

        return {
            ...e,
            daysRemaining: diffDays,
            computedStatus,
            isCategoryOverBudget,
            categoryTotalSpent: categoryTotal
        };
    });

    return enriched;
};

// GET /api/expenses - Get list & summary stats
router.get('/', async (req, res) => {
    try {
        const enriched = await getEnrichedExpenses();
        
        let totalSpent = 0;
        let pendingAmount = 0;
        let overdueAmount = 0;
        let overdueCount = 0;
        let dueTodayCount = 0;

        enriched.forEach(e => {
            if (e.status === 'PAID') {
                totalSpent += e.amount;
            } else {
                pendingAmount += e.amount;
                if (e.computedStatus === 'OVERDUE') {
                    overdueCount++;
                    overdueAmount += e.amount;
                } else if (e.computedStatus === 'DUE_TODAY') {
                    dueTodayCount++;
                }
            }
        });

        res.json({
            success: true,
            data: enriched,
            stats: {
                totalSpent: Math.round(totalSpent * 100) / 100,
                pendingAmount: Math.round(pendingAmount * 100) / 100,
                overdueAmount: Math.round(overdueAmount * 100) / 100,
                overdueCount,
                dueTodayCount,
                totalCount: enriched.length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/expenses - Create single expense
router.post('/', async (req, res) => {
    try {
        const created = await expenseStore.add(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req, res) => {
    try {
        const updated = await expenseStore.update(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// DELETE /api/expenses/:id - Delete single expense
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await expenseStore.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }
        res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/expenses/upload - Upload & Parse Excel file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No Excel file provided' });
        }

        const parsed = parseExcelBuffer(req.file.buffer);
        const bulkAdded = await expenseStore.bulkAdd(parsed);
        const enriched = await getEnrichedExpenses();

        res.json({
            success: true,
            message: `Successfully imported ${bulkAdded.length} expenses into Neon PostgreSQL.`,
            count: bulkAdded.length,
            data: enriched
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// POST /api/expenses/upload-receipt - Upload payment confirmation log
router.post('/upload-receipt', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No receipt file provided' });
        }

        const parsedReceipts = parseExcelBuffer(req.file.buffer);
        const matchedCount = await expenseStore.matchReceiptLogs(parsedReceipts);
        const enriched = await getEnrichedExpenses();

        res.json({
            success: true,
            message: `Cross-referenced payment log: ${matchedCount} expenses marked as PAID!`,
            matchedCount,
            data: enriched
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// POST /api/expenses/auto-mark-paid - Run automated paid rules
router.post('/auto-mark-paid', async (req, res) => {
    try {
        const markedCount = await expenseStore.autoMarkPaidRules();
        const enriched = await getEnrichedExpenses();
        res.json({
            success: true,
            message: `${markedCount} expense(s) automatically marked as PAID based on due date rules!`,
            markedCount,
            data: enriched
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/expenses/export - Download re-exported Excel file
router.get('/export', async (req, res) => {
    try {
        const enriched = await getEnrichedExpenses();
        const exportRows = enriched.map(e => ({
            'Expense Name': e.title,
            'Category': e.category,
            'Amount ($)': e.amount,
            'Due Date': e.dueDate,
            'Payment Status': e.status,
            'Category Budget ($)': e.categoryBudget || '',
            'Over Budget Alert': e.isCategoryOverBudget ? 'EXCEEDED' : 'OK',
            'Notes': e.notes || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Updated_Expenses_Export.xlsx"');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
