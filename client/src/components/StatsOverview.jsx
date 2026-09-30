import React from 'react';
import { DollarSign, CreditCard, Clock, AlertTriangle } from 'lucide-react';

export const StatsOverview = ({ stats = {}, expenses = [] }) => {
  const {
    totalSpent = 0,
    pendingAmount = 0,
    overdueAmount = 0,
    overdueCount = 0,
    dueTodayCount = 0,
    totalCount = 0
  } = stats;

  const totalBudgetCalculated = expenses.reduce((sum, e) => sum + (parseFloat(e.categoryBudget) || 0), 0) || 5000;
  const spentPercent = Math.min(100, Math.round((totalSpent / (totalSpent + pendingAmount || 1)) * 100));

  return (
    <section className="stats-grid">
      <div className="stat-card glass-card">
        <div className="stat-header">
          <span className="stat-title">Calculated Budget Caps</span>
          <div className="stat-icon icon-blue"><DollarSign size={20} /></div>
        </div>
        <div className="stat-value">${totalBudgetCalculated.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div className="stat-footer">
          <span>Active Category Budgets</span>
        </div>
      </div>

      <div className="stat-card glass-card">
        <div className="stat-header">
          <span className="stat-title">Total Paid & Spent</span>
          <div className="stat-icon icon-purple"><CreditCard size={20} /></div>
        </div>
        <div className="stat-value">${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div className="stat-progress-bar">
          <div className="progress-fill" style={{ width: `${spentPercent}%` }}></div>
        </div>
      </div>

      <div className="stat-card glass-card">
        <div className="stat-header">
          <span className="stat-title">Pending Amount</span>
          <div className="stat-icon icon-amber"><Clock size={20} /></div>
        </div>
        <div className="stat-value">${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div className="stat-footer text-amber">
          {dueTodayCount > 0 ? `${dueTodayCount} due today` : 'Pending schedule'}
        </div>
      </div>

      <div className="stat-card glass-card" style={{ borderColor: overdueCount > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined }}>
        <div className="stat-header">
          <span className="stat-title">Overdue / Urgent</span>
          <div className="stat-icon icon-red"><AlertTriangle size={20} /></div>
        </div>
        <div className="stat-value text-red">{overdueCount}</div>
        <div className="stat-footer text-red">
          ${overdueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} Overdue Total
        </div>
      </div>
    </section>
  );
};
