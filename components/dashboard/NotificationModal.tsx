import { useState } from 'react';

interface Notification {
    id: string;
    type: 'complete' | 'assigned' | 'overdue' | 'deadline';
    caseNumber?: string;
    message: string;
    date: string;
    isRead: boolean;
    assignedWith?: string;
}

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
        id: '1',
        type: 'complete',
        caseNumber: 'CHR-VII-2025-0042',
        message: 'marked as complete',
        date: 'Sept 30',
        isRead: false
        },
        {
        id: '2',
        type: 'assigned',
        message: 'New case assigned to you along with',
        assignedWith: 'Atty. Dela Cruz',
        date: 'Oct 1',
        isRead: true
        },
        {
        id: '3',
        type: 'overdue',
        caseNumber: 'CHR-VII-2025-0045',
        message: 'is overdue for 3 days',
        date: 'Oct 9, 2PM',
        isRead: true
        },
        {
        id: '4',
        type: 'complete',
        caseNumber: 'CHR-VII-2025-0042',
        message: 'marked as complete',
        date: 'Sept 30',
        isRead: true
        },
        {
        id: '5',
        type: 'deadline',
        caseNumber: 'CHR-VII-2025-0045',
        message: 'Deadline approaching for',
        date: 'Due Oct 3',
        isRead: true
        }
    ]);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
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
        default:
            return '';
        }
    };

    const newNotifications = notifications.filter(n => !n.isRead);
    const earlierNotifications = notifications.filter(n => n.isRead);

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
                onClick={markAllAsRead}
                className="font-medium text-base hover:underline"
                style={{ color: '#1B61E3' }}
            >
                Mark all as read
            </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
            {/* New Section */}
            {newNotifications.length > 0 && (
                <div>
                <h3 className="px-6 py-3 font-bold text-lg text-black">New</h3>
                {newNotifications.map((notification) => (
                    <div
                    key={notification.id}
                    className="mx-5 mb-2 px-4 py-3.5 rounded-md cursor-pointer transition flex items-center gap-3.5"
                    style={{ backgroundColor: '#EAF1FF' }}
                    >
                    <img src={getIconPath(notification.type)} alt="" className="w-12 h-12" />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium leading-snug" style={{ color: '#636B78' }}>
                        {notification.caseNumber && (
                            <span className="font-bold" style={{ color: '#0F2348' }}>Case {notification.caseNumber}</span>
                        )}
                        {notification.caseNumber && ' '}
                        {notification.message}
                        {notification.assignedWith && (
                            <span className="font-bold" style={{ color: '#0F2348' }}> {notification.assignedWith}</span>
                        )}
                        </p>
                        <p className="text-sm leading-snug" style={{ color: '#636B78' }}>{notification.date}</p>
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
                    className="mx-5 mb-2 px-4 py-3.5 rounded-md hover:bg-gray-50 cursor-pointer transition flex items-center gap-3.5">
                    <img src={getIconPath(notification.type)} alt="" className="w-12 h-12" />
                    <div className="flex-1 min-w-0">
                        <p className="leading-snug" style={{ color: '#636B78' }}>
                        {notification.message === 'Deadline approaching for' ? (
                            <>
                            {notification.message}{' '}
                            <span className="font-bold" style={{ color: '#0F2348' }}>Case {notification.caseNumber}</span>
                            </>
                        ) : (
                            <>
                            {notification.caseNumber && (
                                <span className="font-bold" style={{ color: '#0F2348' }}>Case {notification.caseNumber}</span>
                            )}
                            {notification.caseNumber && ' '}
                            {notification.message}
                            {notification.assignedWith && (
                                <span className="font-bold" style={{ color: '#0F2348' }}> {notification.assignedWith}</span>
                            )}
                            </>
                        )}
                        </p>
                        <p className="text-sm leading-snug" style={{ color: '#636B78' }}>{notification.date}</p>
                    </div>
                    <div className="w-3 h-3 flex-shrink-0 ml-2"></div>
                    </div>
                ))}
                </div>
            )}
            </div>
        </div>
        </div>
    );
}