import React, { useState, useEffect } from 'react';
import { Edit3, X } from 'lucide-react';

export const ExpenseModal = ({ isOpen, onClose, onSave, editingExpense }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    categoryBudget: '',
    notes: ''
  });

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        title: editingExpense.title || '',
        category: editingExpense.category || '',
        amount: editingExpense.amount || '',
        dueDate: editingExpense.dueDate || new Date().toISOString().split('T')[0],
        status: editingExpense.status || 'PENDING',
        categoryBudget: editingExpense.categoryBudget || '',
        notes: editingExpense.notes || ''
      });
    } else {
      setFormData({
        title: '',
        category: 'Utilities',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        categoryBudget: '',
        notes: ''
      });
    }
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <h3><Edit3 size={18} /> {editingExpense ? 'Edit Expense' : 'Add New Expense'}</h3>
          <button className="close-modal-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid">
            <div className="form-group">
              <label>Expense Title *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Fiber Internet, AWS Server" 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Utilities, Real Estate, Subscriptions" 
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Amount ($) *</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                required 
                placeholder="0.00" 
                value={formData.amount} 
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Due Date *</label>
              <input 
                type="date" 
                required 
                value={formData.dueDate} 
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select 
                className="form-select" 
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category Budget Cap ($)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                placeholder="Optional budget cap" 
                value={formData.categoryBudget} 
                onChange={(e) => setFormData({ ...formData, categoryBudget: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label>Notes / Payment Details</label>
              <textarea 
                rows="2" 
                placeholder="Account number, payment method notes..." 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Expense</button>
          </div>
        </form>
      </div>
    </div>
  );
};
