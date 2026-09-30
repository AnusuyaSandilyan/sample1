import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UrgentBanner } from './components/UrgentBanner';
import { StatsOverview } from './components/StatsOverview';
import { ExcelUploader } from './components/ExcelUploader';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ExpenseTable } from './components/ExpenseTable';
import { ExpenseModal } from './components/ExpenseModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { api } from './utils/api';
import './styles/main.css';

export function App() {
  const [theme, setTheme] = useState('dark');
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  // Load initial data
  const loadData = async () => {
    const res = await api.fetchExpenses();
    if (res && res.success) {
      setExpenses(res.data);
      setStats(res.stats);
    }
    const notifRes = await api.fetchNotifications();
    if (notifRes && notifRes.success) {
      setNotifications(notifRes.alerts);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleFileUpload = async (file) => {
    const res = await api.uploadExcel(file);
    if (res && res.success) {
      loadData();
    }
  };

  const handleReceiptUpload = async (file) => {
    // Similar excel reader matching logic
    const res = await api.uploadExcel(file);
    if (res && res.success) {
      loadData();
    }
  };

  const handleSaveExpense = async (formData) => {
    if (editingExpense) {
      await api.updateExpense(editingExpense.id, formData);
    } else {
      await api.addExpense(formData);
    }
    setIsModalOpen(false);
    setEditingExpense(null);
    loadData();
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await api.deleteExpense(id);
      loadData();
    }
  };

  const handleMarkPaid = async (id) => {
    await api.updateExpense(id, { status: 'PAID' });
    loadData();
  };

  const handleAutoMarkPaid = async () => {
    const res = await api.autoMarkPaid();
    if (res && res.success) {
      alert(`Automated Rule Applied: ${res.markedCount || 0} expense(s) marked as PAID!`);
      loadData();
    }
  };

  return (
    <div className="app-container">
      {isBannerVisible && (
        <UrgentBanner 
          overdueCount={stats.overdueCount || 0}
          dueTodayCount={stats.dueTodayCount || 0}
          onOpenNotifications={() => setIsNotifDrawerOpen(true)}
          onClose={() => setIsBannerVisible(false)}
        />
      )}

      <Navbar 
        theme={theme}
        toggleTheme={toggleTheme}
        notificationCount={notifications.length}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
      />

      <main>
        <ExcelUploader 
          onFileUpload={handleFileUpload}
          onReceiptUpload={handleReceiptUpload}
        />

        <StatsOverview 
          stats={stats}
          expenses={expenses}
        />

        <AnalyticsCharts 
          expenses={expenses}
        />

        <ExpenseTable 
          expenses={expenses}
          onAddExpense={() => { setEditingExpense(null); setIsModalOpen(true); }}
          onEditExpense={(item) => { setEditingExpense(item); setIsModalOpen(true); }}
          onDeleteExpense={handleDeleteExpense}
          onMarkPaid={handleMarkPaid}
          onAutoMarkPaid={handleAutoMarkPaid}
        />
      </main>

      <ExpenseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
      />

      <NotificationDrawer 
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        alerts={notifications}
        onMarkPaid={handleMarkPaid}
      />
    </div>
  );
}
