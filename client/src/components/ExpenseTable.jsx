import React, { useState } from 'react';
import { 
  Search, Plus, CheckCheck, Download, Edit3, Trash2, CheckCircle, 
  AlertTriangle, Clock, ShieldAlert, FolderSearch, ArrowUpDown 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';

export const ExpenseTable = ({ 
  expenses = [], 
  onAddExpense, 
  onEditExpense, 
  onDeleteExpense, 
  onMarkPaid, 
  onAutoMarkPaid 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');

  // Get list of unique categories for dropdown
  const categories = Array.from(new Set(expenses.map(e => e.category))).filter(Boolean);

  // Filter logic
  const filtered = expenses.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
      return false;
    }

    if (statusFilter === 'PAID') return item.status === 'PAID';
    if (statusFilter === 'OVERDUE') return item.computedStatus === 'OVERDUE';
    if (statusFilter === 'DUE_TODAY') return item.computedStatus === 'DUE_TODAY';
    if (statusFilter === 'DUE_SOON') return item.computedStatus === 'DUE_SOON';
    if (statusFilter === 'PENDING') return item.status !== 'PAID' && item.computedStatus === 'PENDING';
    if (statusFilter === 'OVER_BUDGET') return item.isCategoryOverBudget;

    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'amount') {
      valA = parseFloat(valA) || 0;
      valB = parseFloat(valB) || 0;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleMarkPaidClick = (item) => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
    onMarkPaid(item.id);
  };

  const handleExportExcel = () => {
    const exportData = sorted.map(e => ({
      'Expense Name': e.title,
      'Category': e.category,
      'Amount ($)': e.amount,
      'Due Date': e.dueDate,
      'Payment Status': e.status,
      'Category Budget ($)': e.categoryBudget || '',
      'Budget Over Cap': e.isCategoryOverBudget ? 'EXCEEDED' : 'OK',
      'Notes': e.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Expenses');
    XLSX.writeFile(workbook, 'Exported_Expenses.xlsx');
  };

  const renderStatusBadge = (item) => {
    if (item.status === 'PAID') {
      return <span className="status-pill pill-paid"><CheckCircle size={12} /> Paid</span>;
    }
    if (item.computedStatus === 'OVERDUE') {
      return <span className="status-pill pill-overdue"><AlertTriangle size={12} /> Overdue</span>;
    }
    if (item.computedStatus === 'DUE_TODAY') {
      return <span className="status-pill pill-due-today"><Clock size={12} /> Due Today</span>;
    }
    if (item.computedStatus === 'DUE_SOON') {
      return <span className="status-pill pill-due-soon"><Clock size={12} /> Due Soon</span>;
    }
    return <span className="status-pill pill-pending">Pending</span>;
  };

  return (
    <section className="table-section card">
      <div className="table-toolbar">
        <div className="search-box">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Search expense name, category, notes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="form-select"
          >
            <option value="ALL">All Statuses</option>
            <option value="OVERDUE">🚨 Overdue</option>
            <option value="DUE_TODAY">⚠️ Due Today</option>
            <option value="DUE_SOON">⏰ Due Soon (Next 7 Days)</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="PAID">✅ Paid</option>
            <option value="OVER_BUDGET">⚠️ Exceeded Category Budget</option>
          </select>

          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)} 
            className="form-select"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="action-buttons">
          <button className="btn btn-primary" onClick={onAddExpense}>
            <Plus size={16} /> Add Expense
          </button>

          <button className="btn btn-success" onClick={onAutoMarkPaid} title="Auto-Mark Due / Overdue items as Paid">
            <CheckCheck size={16} /> Auto-Mark Paid
          </button>

          <button className="btn btn-secondary" onClick={handleExportExcel}>
            <Download size={16} /> Export (.xlsx)
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="expense-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('title')} style={{ cursor: 'pointer' }}>
                Expense Name <ArrowUpDown size={12} />
              </th>
              <th onClick={() => toggleSort('category')} style={{ cursor: 'pointer' }}>
                Category <ArrowUpDown size={12} />
              </th>
              <th onClick={() => toggleSort('amount')} style={{ cursor: 'pointer' }}>
                Amount ($) <ArrowUpDown size={12} />
              </th>
              <th onClick={() => toggleSort('dueDate')} style={{ cursor: 'pointer' }}>
                Due Date <ArrowUpDown size={12} />
              </th>
              <th>Days Left</th>
              <th>Status</th>
              <th>Budget Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(item => (
              <tr key={item.id}>
                <td>
                  <strong style={{ fontSize: '0.95rem' }}>{item.title}</strong>
                  {item.notes && <div className="subtitle" style={{ fontSize: '0.75rem' }}>{item.notes}</div>}
                </td>
                <td>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                    {item.category}
                  </span>
                </td>
                <td><strong>${parseFloat(item.amount).toFixed(2)}</strong></td>
                <td>{item.dueDate}</td>
                <td>
                  {item.status === 'PAID' ? (
                    <span className="text-green">-</span>
                  ) : item.daysRemaining < 0 ? (
                    <span className="text-red" style={{ fontWeight: 700 }}>{Math.abs(item.daysRemaining)} days ago</span>
                  ) : item.daysRemaining === 0 ? (
                    <span className="text-amber" style={{ fontWeight: 700 }}>Today</span>
                  ) : (
                    <span>{item.daysRemaining} days</span>
                  )}
                </td>
                <td>{renderStatusBadge(item)}</td>
                <td>
                  {item.isCategoryOverBudget ? (
                    <span className="budget-alert-badge" title={`Spent $${item.categoryTotalSpent} exceeds category cap of $${item.categoryBudget}`}>
                      <ShieldAlert size={12} /> OVER BUDGET
                    </span>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>OK</span>
                  )}
                </td>
                <td className="action-cell">
                  {item.status !== 'PAID' && (
                    <button 
                      className="btn-table-action btn-table-paid" 
                      onClick={() => handleMarkPaidClick(item)}
                      title="Mark as Paid"
                    >
                      <CheckCircle size={15} />
                    </button>
                  )}
                  <button 
                    className="btn-table-action" 
                    onClick={() => onEditExpense(item)}
                    title="Edit Expense"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button 
                    className="btn-table-action" 
                    style={{ color: '#ef4444' }} 
                    onClick={() => onDeleteExpense(item.id)}
                    title="Delete Expense"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="empty-state">
          <FolderSearch className="empty-icon" />
          <h4>No Expenses Found</h4>
          <p>No matching expenses for the current filter criteria.</p>
        </div>
      )}
    </section>
  );
};
