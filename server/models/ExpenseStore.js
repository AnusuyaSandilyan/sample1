import { pool } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'expenses.json');

class ExpenseStore {
    constructor() {
        this.usePostgres = true;
    }

    // Map database row to standard JS object
    mapRow(row) {
        let dueDateStr = row.due_date;
        if (row.due_date instanceof Date) {
            dueDateStr = row.due_date.toISOString().split('T')[0];
        } else if (typeof row.due_date === 'string') {
            dueDateStr = row.due_date.split('T')[0];
        }

        return {
            id: row.id,
            title: row.title,
            category: row.category,
            amount: parseFloat(row.amount),
            dueDate: dueDateStr,
            status: row.status,
            categoryBudget: parseFloat(row.category_budget || 0),
            notes: row.notes || '',
            createdAt: row.created_at
        };
    }

    async getAll() {
        try {
            const res = await pool.query('SELECT * FROM expenses ORDER BY due_date ASC');
            return res.rows.map(this.mapRow);
        } catch (err) {
            console.error('PostgreSQL getAll error, falling back to local file:', err.message);
            return this.getLocalExpenses();
        }
    }

    async add(expenseData) {
        const id = 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        const title = expenseData.title || 'Untitled Expense';
        const category = expenseData.category || 'General';
        const amount = parseFloat(expenseData.amount) || 0;
        const dueDate = expenseData.dueDate || new Date().toISOString().split('T')[0];
        const status = (expenseData.status || 'PENDING').toUpperCase();
        const categoryBudget = parseFloat(expenseData.categoryBudget) || 0;
        const notes = expenseData.notes || '';

        try {
            const query = `
                INSERT INTO expenses (id, title, category, amount, due_date, status, category_budget, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;
            const values = [id, title, category, amount, dueDate, status, categoryBudget, notes];
            const res = await pool.query(query, values);
            return this.mapRow(res.rows[0]);
        } catch (err) {
            console.error('PostgreSQL add error:', err.message);
            return this.addLocal({ id, title, category, amount, dueDate, status, categoryBudget, notes });
        }
    }

    async bulkAdd(expensesArray) {
        const results = [];
        for (const item of expensesArray) {
            const added = await this.add(item);
            results.push(added);
        }
        return results;
    }

    async update(id, updateData) {
        try {
            const currentRes = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
            if (currentRes.rows.length === 0) return null;
            const current = currentRes.rows[0];

            const title = updateData.title !== undefined ? updateData.title : current.title;
            const category = updateData.category !== undefined ? updateData.category : current.category;
            const amount = updateData.amount !== undefined ? parseFloat(updateData.amount) : parseFloat(current.amount);
            const dueDate = updateData.dueDate !== undefined ? updateData.dueDate : current.due_date;
            const status = updateData.status !== undefined ? updateData.status.toUpperCase() : current.status;
            const categoryBudget = updateData.categoryBudget !== undefined ? parseFloat(updateData.categoryBudget) : parseFloat(current.category_budget);
            const notes = updateData.notes !== undefined ? updateData.notes : current.notes;

            const query = `
                UPDATE expenses
                SET title = $1, category = $2, amount = $3, due_date = $4, status = $5, category_budget = $6, notes = $7, updated_at = NOW()
                WHERE id = $8
                RETURNING *
            `;
            const values = [title, category, amount, dueDate, status, categoryBudget, notes, id];
            const res = await pool.query(query, values);
            return this.mapRow(res.rows[0]);
        } catch (err) {
            console.error('PostgreSQL update error:', err.message);
            return null;
        }
    }

    async delete(id) {
        try {
            const res = await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
            return res.rowCount > 0;
        } catch (err) {
            console.error('PostgreSQL delete error:', err.message);
            return false;
        }
    }

    async autoMarkPaidRules() {
        const todayStr = new Date().toISOString().split('T')[0];
        try {
            const query = `
                UPDATE expenses
                SET status = 'PAID', updated_at = NOW()
                WHERE status = 'PENDING' AND due_date <= $1
            `;
            const res = await pool.query(query, [todayStr]);
            return res.rowCount;
        } catch (err) {
            console.error('PostgreSQL autoMarkPaid error:', err.message);
            return 0;
        }
    }

    async matchReceiptLogs(paymentLogs) {
        let matchedCount = 0;
        const allExpenses = await this.getAll();

        for (const log of paymentLogs) {
            const logTitle = String(log.title || '').toLowerCase();
            const logAmount = parseFloat(log.amount);

            const match = allExpenses.find(e => {
                if (e.status === 'PAID') return false;
                const eTitle = String(e.title).toLowerCase();
                const titleMatches = eTitle.includes(logTitle) || logTitle.includes(eTitle);
                const amountMatches = isNaN(logAmount) || Math.abs(e.amount - logAmount) < 0.01;
                return titleMatches && amountMatches;
            });

            if (match) {
                await this.update(match.id, {
                    status: 'PAID',
                    notes: (match.notes ? match.notes + ' | ' : '') + 'Paid via receipt log sync'
                });
                matchedCount++;
            }
        }

        return matchedCount;
    }

    // Local JSON Fallback Helpers
    getLocalExpenses() {
        try {
            if (fs.existsSync(DATA_FILE)) {
                return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            }
        } catch (e) {}
        return [];
    }

    addLocal(item) {
        const list = this.getLocalExpenses();
        list.unshift(item);
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
        return item;
    }
}

export const expenseStore = new ExpenseStore();
