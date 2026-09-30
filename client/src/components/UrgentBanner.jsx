import React from 'react';
import { BellRing, X } from 'lucide-react';

export const UrgentBanner = ({ overdueCount, dueTodayCount, onOpenNotifications, onClose }) => {
  if (overdueCount === 0 && dueTodayCount === 0) return null;

  return (
    <div className="urgent-banner">
      <div className="banner-content" onClick={onOpenNotifications} style={{ cursor: 'pointer' }}>
        <BellRing size={20} className="banner-icon" />
        <span>
          Attention: {overdueCount > 0 && <strong>{overdueCount} Overdue</strong>}
          {overdueCount > 0 && dueTodayCount > 0 && ' and '}
          {dueTodayCount > 0 && <strong>{dueTodayCount} Due Today</strong>}! Click to inspect payment schedule.
        </span>
      </div>
      <button className="btn-icon" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white' }}>
        <X size={18} />
      </button>
    </div>
  );
};
