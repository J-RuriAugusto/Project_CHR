'use client';

import { useState, useEffect } from 'react';
import {
    getNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    Notification
} from '@/lib/actions/notification-actions';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDocketClick?: (docketId: string) => void;
}

export default function NotificationModal({ isOpen, onClose, onDocketClick }: NotificationModalProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    // State for "Case Deleted" warning modal
    const [showDeletedCaseModal, setShowDeletedCaseModal] = useState(false);

    // Fetch notifications when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const result = await getNotificationsForUser();
            if (result.notifications) {
                setNotifications(result.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if not already
        if (!notification.is_read) {
            try {
                await markNotificationAsRead(notification.id);
                // Update local state
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                );
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        if (notification.notification_type === 'deleted') {
            setShowDeletedCaseModal(true);
            return;
        }

        // If docket_id is missing (e.g. deleted and set to NULL by DB), show unavailable modal
        if (!notification.docket_id) {
            setShowDeletedCaseModal(true);
            return;
        }

        // Open docket modal if there's a docket_id
        if (onDocketClick) {
            onDocketClick(notification.docket_id);
            onClose();
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsMarkingAll(true);
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setIsMarkingAll(false);
        }
    };

    const getIconPath = (type: string) => {
        switch (type) {
            case 'complete':
                return '/icon12.png';
            case 'assigned':
                return '/icon14.png';
            case 'overdue':
                return '/icon19.png';
            case 'deadline':
                return '/icon13.png';
            case 'new_case':
                return '/icon14.png'; // Use assignment icon for new cases
            case 'deleted':
                return '/icon19.png'; // Use alert/warning icon for deleted cases
            default:
                return '/icon14.png';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const newNotifications = notifications.filter(n => !n.is_read);
    const earlierNotifications = notifications.filter(n => n.is_read);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-start justify-end p-4 z-50 pointer-events-none">
            <div
                className="bg-snowWhite rounded-md shadow-2xl w-full max-w-sm mt-16 mr-4 max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto"
                style={{
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
                }}
            >
                {/* Header */}
                <div className="p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-black">Notifications</h2>
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={isMarkingAll || newNotifications.length === 0}
                        className="font-medium text-base hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: '#1B61E3' }}
                    >
                        {isMarkingAll ? 'Marking...' : 'Mark all as read'}
                    </button>
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <img src="/icon10.png" alt="" className="w-12 h-12 opacity-50 mb-3" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <>
                            {/* New Section */}
                            {newNotifications.length > 0 && (
                                <div>
                                    <h3 className="px-6 py-3 font-bold text-lg text-black">New</h3>
                                    {newNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className="mx-5 mb-2 px-4 py-3.5 rounded-md cursor-pointer transition flex items-center gap-3.5 hover:opacity-80"
                                            style={{ backgroundColor: '#EAF1FF' }}
                                        >
                                            <img src={getIconPath(notification.notification_type)} alt="" className="w-12 h-12" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium leading-snug" style={{ color: '#636B78' }}>
                                                    <span className="font-bold" style={{ color: '#0F2348' }}>{notification.title}</span>
                                                    <br />
                                                    {notification.message}
                                                </p>
                                                <p className="text-sm leading-snug" style={{ color: '#636B78' }}>
                                                    {formatDate(notification.created_at)}
                                                </p>
                                            </div>
                                            <div className="w-3 h-3 rounded-full flex-shrink-0 ml-2" style={{ backgroundColor: '#1B61E3' }}></div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Earlier Section */}
                            {earlierNotifications.length > 0 && (
                                <div>
                                    <h3 className="px-6 py-3 font-bold text-lg text-black">Earlier</h3>
                                    {earlierNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className="mx-5 mb-2 px-4 py-3.5 rounded-md hover:bg-gray-50 cursor-pointer transition flex items-center gap-3.5"
                                        >
                                            <img src={getIconPath(notification.notification_type)} alt="" className="w-12 h-12" />
                                            <div className="flex-1 min-w-0">
                                                <p className="leading-snug" style={{ color: '#636B78' }}>
                                                    <span className="font-bold" style={{ color: '#0F2348' }}>{notification.title}</span>
                                                    <br />
                                                    {notification.message}
                                                </p>
                                                <p className="text-sm leading-snug" style={{ color: '#636B78' }}>
                                                    {formatDate(notification.created_at)}
                                                </p>
                                            </div>
                                            <div className="w-3 h-3 flex-shrink-0 ml-2"></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Deleted Case Warning Modal */}
            {showDeletedCaseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] pointer-events-auto">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center shadow-xl">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-midnightNavy mb-2">Case Unavailable</h3>
                        <p className="text-gray-600 mb-6">
                            The case no longer exists or you are no longer assigned with the case.
                        </p>
                        <button
                            onClick={() => setShowDeletedCaseModal(false)}
                            className="bg-royalAzure hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}