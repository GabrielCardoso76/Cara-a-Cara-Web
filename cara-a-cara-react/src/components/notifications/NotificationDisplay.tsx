import React from 'react';
import { useNotification, Notification } from '../../contexts/NotificationContext'; // Ajuste o caminho se necessário
import './NotificationDisplay.css';

// Ícones simples para os tipos de notificação (poderiam ser SVGs mais elaborados)
const getIconForType = (type: Notification['type']) => {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'info': return 'ℹ';
    case 'warning': return '⚠';
    default: return '';
  }
};

const NotificationItem: React.FC<{ notification: Notification; onRemove: (id: string) => void }> = ({ notification, onRemove }) => {
  return (
    <div className={`notification-item ${notification.type}`}>
      <span className="notification-icon">{getIconForType(notification.type)}</span>
      <span className="notification-message">{notification.message}</span>
      <button onClick={() => onRemove(notification.id)} className="notification-close-btn">
        &times;
      </button>
    </div>
  );
};

const NotificationDisplay: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map(notif => (
        <NotificationItem
          key={notif.id}
          notification={notif}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationDisplay;
