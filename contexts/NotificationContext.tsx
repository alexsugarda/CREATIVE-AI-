
import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

interface Notification {
    message: string;
    type: NotificationType;
}

interface NotificationContextData {
    notification: Notification | null;
    setNotification: (notification: Notification | null) => void;
}

interface NotificationContextActions {
    showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationDataContext = createContext<NotificationContextData | undefined>(undefined);
export const NotificationActionsContext = createContext<NotificationContextActions | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notification, setNotification] = useState<Notification | null>(null);

    const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
        setNotification({ message, type });
    }, []);

    return (
        <NotificationDataContext.Provider value={{ notification, setNotification }}>
            <NotificationActionsContext.Provider value={{ showNotification }}>
                {children}
            </NotificationActionsContext.Provider>
        </NotificationDataContext.Provider>
    );
};

export const useNotificationData = () => {
    const context = useContext(NotificationDataContext);
    if (!context) throw new Error('useNotificationData must be used within a NotificationProvider');
    return context;
};

export const useNotification = () => {
    const context = useContext(NotificationActionsContext);
    if (!context) throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};
