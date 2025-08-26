
import React, { useEffect } from 'react';
import { useNotificationData } from '../contexts/NotificationContext';

const Notification: React.FC = () => {
    const { notification, setNotification } = useNotificationData();

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, setNotification]);

    if (!notification) {
        return null;
    }

    const baseClasses = 'fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-fade-in-down';
    
    const typeClasses = {
        success: 'bg-gradient-to-r from-green-500 to-emerald-600',
        error: 'bg-gradient-to-r from-red-500 to-rose-600',
        info: 'bg-gradient-to-r from-brand-pink to-brand-purple',
    };

    return (
        <div className={`${baseClasses} ${typeClasses[notification.type]}`}>
            {notification.message}
        </div>
    );
};

export default Notification;
