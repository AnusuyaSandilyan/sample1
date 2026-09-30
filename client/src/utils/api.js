import * as XLSX from 'xlsx';

const API_BASE = '/api/expenses';
const NOTIF_BASE = '/api/notifications';

// Local storage fallback key
const STORAGE_KEY = 'smart_expenses_db_v1';

const getLocalExpenses = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {}
    
    // Default initial mock dataset if empty
    const todayStr = new Date().toISOString().split('T')[0];
    const initial = [
        {
            id: 'exp-1',
            title: 'Office Fiber Internet',
            category: 'Utilities',
            amount: 149.99,
            dueDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
            status: 'PENDING',
            categoryBudget: 300,
            notes: 'High-speed fiber connection'
        },
        {
            id: 'exp-2',
            title: 'AWS EC2 & RDS Server',
            category: 'Cloud Services',
            amount: 480.00,
            dueDate: todayStr,
            status: 'PENDING',
            categoryBudget: 400, // Exceeded
            notes: 'Production cloud billing'
        },
        {
            id: 'exp-3',
            title: 'Office Space Rent',
            category: 'Real Estate',
            amount: 2500.00,
            dueDate: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
            status: 'PAID',
            categoryBudget: 3000,
            notes: 'Paid via bank transfer'
        }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
};

const saveLocalExpenses = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const enrichLocalList = (rawList) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const categoryTotals = {};
    rawList.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount || 0);
    });

    let totalSpent = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let dueTodayCount = 0;

    const enriched = rawList.map(e => {
        const amount = parseFloat(e.amount || 0);
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

        if (e.status === 'PAID') {
            totalSpent += amount;
        } else {
            pendingAmount += amount;
            if (computedStatus === 'OVERDUE') {
                overdueCount++;
                overdueAmount += amount;
            } else if (computedStatus === 'DUE_TODAY') {
                dueTodayCount++;
            }
        }

        const categoryTotal = categoryTotals[e.category] || 0;
        const isCategoryOverBudget = e.categoryBudget > 0 && categoryTotal > e.categoryBudget;

        return {
            ...e,
            amount,
            daysRemaining: diffDays,
            computedStatus,
            isCategoryOverBudget,
            categoryTotalSpent: categoryTotal
        };
    });

    return {
        data: enriched,
        stats: {
            totalSpent: Math.round(totalSpent * 100) / 100,
            pendingAmount: Math.round(pendingAmount * 100) / 100,
            overdueAmount: Math.round(overdueAmount * 100) / 100,
            overdueCount,
            dueTodayCount,
            totalCount: enriched.length
        }
    };
};

export const api = {
    async fetchExpenses() {
        try {
            const res = await fetch(API_BASE);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn('Backend unavailable, using LocalStorage data store.');
        }
        const local = getLocalExpenses();
        const enriched = enrichLocalList(local);
        return { success: true, ...enriched };
    },

    async addExpense(expenseData) {
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseData)
            });
            if (res.ok) return await res.json();
        } catch (e) {}

        const local = getLocalExpenses();
        const newItem = {
            id: 'exp-' + Date.now(),
            ...expenseData,
            amount: parseFloat(expenseData.amount) || 0,
            categoryBudget: parseFloat(expenseData.categoryBudget) || 0,
            status: expenseData.status || 'PENDING'
        };
        local.unshift(newItem);
        saveLocalExpenses(local);
        return { success: true, data: newItem };
    },

    async updateExpense(id, updateData) {
        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if (res.ok) return await res.json();
        } catch (e) {}

        const local = getLocalExpenses();
        const idx = local.findIndex(e => e.id === id);
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...updateData };
            saveLocalExpenses(local);
            return { success: true, data: local[idx] };
        }
        return { success: false, error: 'Not found' };
    },

    async deleteExpense(id) {
        try {
            const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
            if (res.ok) return await res.json();
        } catch (e) {}

        let local = getLocalExpenses();
        local = local.filter(e => e.id !== id);
        saveLocalExpenses(local);
        return { success: true };
    },

    async uploadExcel(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) return await res.json();
        } catch (e) {}

        // Fallback browser-side SheetJS parsing
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const buffer = evt.target.result;
                const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                const parsed = rawRows.map((row, idx) => {
                    const keys = Object.keys(row);
                    const titleKey = keys.find(k => /expense|title|item|bill|name/i.test(k)) || keys[0];
                    const categoryKey = keys.find(k => /category|type/i.test(k)) || 'Category';
                    const amountKey = keys.find(k => /amount|cost|price|total/i.test(k)) || keys[1];
                    const dueDateKey = keys.find(k => /due|date|deadline/i.test(k)) || keys[2];
                    const statusKey = keys.find(k => /status|paid/i.test(k));

                    let rawDate = row[dueDateKey];
                    let dateStr = new Date().toISOString().split('T')[0];
                    if (rawDate instanceof Date && !isNaN(rawDate)) {
                        dateStr = rawDate.toISOString().split('T')[0];
                    } else if (rawDate) {
                        const p = new Date(rawDate);
                        if (!isNaN(p)) dateStr = p.toISOString().split('T')[0];
                    }

                    return {
                        id: 'exp-' + Date.now() + '-' + idx,
                        title: String(row[titleKey] || `Imported #${idx + 1}`),
                        category: String(row[categoryKey] || 'General'),
                        amount: parseFloat(row[amountKey]) || 0,
                        dueDate: dateStr,
                        status: String(row[statusKey] || '').toUpperCase().includes('PAID') ? 'PAID' : 'PENDING',
                        categoryBudget: 0,
                        notes: row.Notes || ''
                    };
                });

                const local = getLocalExpenses();
                const updated = [...parsed, ...local];
                saveLocalExpenses(updated);
                const enriched = enrichLocalList(updated);
                resolve({ success: true, message: `Imported ${parsed.length} items`, ...enriched });
            };
            reader.readAsBinaryString(file);
        });
    },

    async autoMarkPaid() {
        try {
            const res = await fetch(`${API_BASE}/auto-mark-paid`, { method: 'POST' });
            if (res.ok) return await res.json();
        } catch (e) {}

        const todayStr = new Date().toISOString().split('T')[0];
        const local = getLocalExpenses();
        let marked = 0;
        local.forEach(e => {
            if (e.status === 'PENDING' && e.dueDate <= todayStr) {
                e.status = 'PAID';
                marked++;
            }
        });
        saveLocalExpenses(local);
        const enriched = enrichLocalList(local);
        return { success: true, markedCount: marked, ...enriched };
    },

    async fetchNotifications() {
        try {
            const res = await fetch(NOTIF_BASE);
            if (res.ok) return await res.json();
        } catch (e) {}

        const local = getLocalExpenses();
        const enriched = enrichLocalList(local);
        const alerts = enriched.data
            .filter(e => e.status !== 'PAID' && ['OVERDUE', 'DUE_TODAY', 'DUE_SOON'].includes(e.computedStatus))
            .map(e => ({
                id: e.id,
                title: e.title,
                amount: e.amount,
                dueDate: e.dueDate,
                type: e.computedStatus,
                message: `${e.computedStatus === 'OVERDUE' ? '🚨 Overdue' : e.computedStatus === 'DUE_TODAY' ? '⚠️ Due Today' : '⏰ Due Soon'}: "${e.title}" ($${e.amount.toFixed(2)}) on ${e.dueDate}`
            }));

        return { success: true, alerts };
    }
};
