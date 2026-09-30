import React from 'react';
import { Bell, Volume2, X, AlertTriangle, Clock } from 'lucide-react';

export const NotificationDrawer = ({ isOpen, onClose, alerts = [], onMarkPaid }) => {
  if (!isOpen) return null;

  const playChimeSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio Context error', e);
    }
  };

  const requestBrowserPush = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Smart Expense Hub', {
            body: 'Browser push notifications active for due dates!',
            icon: '/favicon.ico'
          });
        }
      });
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <h3><Bell size={18} /> Due Date Notifications</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={requestBrowserPush}>
              Enable OS Desktop Push
            </button>
            <button className="btn btn-icon" onClick={playChimeSound} title="Test Sound Chime">
              <Volume2 size={16} />
            </button>
          </div>

          <div className="notification-list">
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1.5rem' }}>
                🎉 All expenses are up to date! No pending alerts.
              </div>
            ) : (
              alerts.map(item => (
                <div key={item.id} className="notification-item">
                  {item.type === 'OVERDUE' ? (
                    <AlertTriangle className="text-red" size={20} />
                  ) : (
                    <Clock className="text-amber" size={20} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.message}</div>
                    <div className="subtitle" style={{ fontSize: '0.75rem' }}>Due Date: {item.dueDate}</div>
                  </div>
                  <button 
                    className="btn btn-sm btn-success" 
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    onClick={() => {
                      onMarkPaid(item.id);
                    }}
                  >
                    Mark Paid
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
