import * as XLSX from 'xlsx';

/**
 * Normalizes header string for fuzzy matching
 */
const normalizeHeader = (header) => {
    if (!header) return '';
    return String(header).toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Intelligent Column Detection Engine
 */
export const parseExcelBuffer = (buffer) => {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parse to JSON array of objects
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    if (!rawRows || rawRows.length === 0) {
        throw new Error('The uploaded Excel sheet is empty.');
    }

    // Get column headers
    const headers = Object.keys(rawRows[0]);
    
    // Identify best matching column names
    let titleKey = headers.find(h => /expense|item|title|name|description|bill|description/i.test(h)) || headers[0];
    let categoryKey = headers.find(h => /category|type|dept|tag|group/i.test(h)) || 'Category';
    let amountKey = headers.find(h => /amount|cost|price|val|total|fee|sum/i.test(h));
    let dueDateKey = headers.find(h => /due|date|deadline|paydate/i.test(h));
    let statusKey = headers.find(h => /status|paid|state/i.test(h));
    let budgetKey = headers.find(h => /budget|cap|limit/i.test(h));

    // Fallback search if strict regex missed
    if (!amountKey) {
        amountKey = headers.find(h => typeof rawRows[0][h] === 'number') || headers[1];
    }
    if (!dueDateKey) {
        dueDateKey = headers.find(h => rawRows[0][h] instanceof Date || /\d{2,4}[-/\.]\d{1,2}[-/\.]\d{1,2}/.test(String(rawRows[0][h]))) || headers[2];
    }

    const parsedExpenses = rawRows.map((row, idx) => {
        const rawTitle = row[titleKey] || `Expense #${idx + 1}`;
        const rawCategory = row[categoryKey] || 'General';
        
        let amount = parseFloat(row[amountKey]);
        if (isNaN(amount)) amount = 0;

        // Parse date properly
        let rawDate = row[dueDateKey];
        let dueDate = new Date();
        if (rawDate instanceof Date && !isNaN(rawDate)) {
            dueDate = rawDate;
        } else if (rawDate) {
            const parsed = new Date(rawDate);
            if (!isNaN(parsed)) dueDate = parsed;
        }

        const dateStr = dueDate.toISOString().split('T')[0];

        // Parse status
        let rawStatus = String(row[statusKey] || 'Pending').trim().toUpperCase();
        let status = 'PENDING';
        if (['PAID', 'YES', 'DONE', 'COMPLETED', 'TRUE', '1'].includes(rawStatus)) {
            status = 'PAID';
        }

        // Parse category budget cap if present
        let categoryBudget = budgetKey && row[budgetKey] ? parseFloat(row[budgetKey]) : 0;
        if (isNaN(categoryBudget)) categoryBudget = 0;

        return {
            title: String(rawTitle).trim(),
            category: String(rawCategory).trim(),
            amount: Math.round(amount * 100) / 100,
            dueDate: dateStr,
            status,
            categoryBudget,
            notes: row.Notes || row.notes || row.PaymentMethod || row['Payment Method'] || ''
        };
    });

    return parsedExpenses;
};
