import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number; // Duração em ms
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  defaultDuration?: number; // Duração padrão para notificações
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  defaultDuration = 5000
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((message: string, type: NotificationType, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9); // ID simples
    const notificationDuration = duration || defaultDuration;

    const newNotification: Notification = { id, message, type, duration: notificationDuration };
    setNotifications(prev => [...prev, newNotification]);

    setTimeout(() => {
      removeNotification(id);
    }, notificationDuration);
  }, [removeNotification, defaultDuration]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* O componente de exibição será renderizado separadamente */}
    </NotificationContext.Provider>
  );
};
