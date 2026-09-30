import React from 'react';
import { Wallet, FileSpreadsheet, Bell, Sun, Moon } from 'lucide-react';
import { downloadSampleExcelTemplate } from '../utils/sampleExcel';

export const Navbar = ({ theme, toggleTheme, notificationCount, onOpenNotifications }) => {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="logo-icon">
          <Wallet size={26} />
        </div>
        <div className="brand-text">
          <h1>SmartExpense <span>Hub</span></h1>
          <p className="subtitle">MERN Excel Tracker & Automated Due Notifier</p>
        </div>
      </div>

      <div className="nav-actions">
        <button className="btn btn-secondary" onClick={downloadSampleExcelTemplate}>
          <FileSpreadsheet size={18} /> Sample Excel Template
        </button>

        <button 
          className="btn btn-icon notification-bell" 
          onClick={onOpenNotifications}
          title="Due Date Notifications"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="badge-count">{notificationCount}</span>
          )}
        </button>

        <button 
          className="btn btn-icon" 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};
