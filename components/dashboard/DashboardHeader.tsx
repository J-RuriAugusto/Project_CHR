'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationModal from './NotificationModal';
import { getNotificationsForUser } from '@/lib/actions/notification-actions';

interface DashboardHeaderProps {
    userData: {
        first_name: string;
        last_name: string;
        role: string;
        profile_picture_url?: string;
    };
    onDocketClick?: (docketId: string) => void;
}

// Format role from backend (e.g., 'records_officer' -> 'Records Officer')
function formatRole(role: string): string {
    return role
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export default function DashboardHeader({ userData, onDocketClick }: DashboardHeaderProps) {
    const router = useRouter();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [rightOffset, setRightOffset] = useState(300);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const rightSectionRef = useRef<HTMLDivElement>(null);

    // Fetch unread count on mount and periodically
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const result = await getNotificationsForUser();
                setUnreadCount(result.unreadCount);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnreadCount();

        // Refresh every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Refresh unread count when modal closes
    useEffect(() => {
        if (!showNotifications) {
            const fetchUnreadCount = async () => {
                try {
                    const result = await getNotificationsForUser();
                    setUnreadCount(result.unreadCount);
                } catch (error) {
                    console.error('Error fetching unread count:', error);
                }
            };
            fetchUnreadCount();
        }
    }, [showNotifications]);

    // Measure the right section width dynamically
    useEffect(() => {
        const measureWidth = () => {
            if (rightSectionRef.current) {
                // Get the width of notification + user info (excluding search button)
                const children = rightSectionRef.current.children;
                let width = 0;
                // Skip the first child (search button), sum the rest
                for (let i = 1; i < children.length; i++) {
                    width += (children[i] as HTMLElement).offsetWidth;
                }
                // Add gaps (gap-4 = 16px between elements)
                width += (children.length - 2) * 16;
                // Add some padding
                setRightOffset(width + 24);
            }
        };
        measureWidth();
        window.addEventListener('resize', measureWidth);
        return () => window.removeEventListener('resize', measureWidth);
    }, [userData]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    const handleSearch = () => {
        if (!searchQuery.trim() || isSearching) return;

        setIsSearching(true);

        // Simulate network request delay
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            const rolePath = userData.role; // Assumes userData.role matches directory names
            router.push(`/dashboard/${rolePath}/docket?search=${encodeURIComponent(searchQuery)}`);
            setIsSearching(false);
        }, 1500); // 1.5s delay to show animation
    };

    const cancelSearch = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent search trigger if bubbling
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
        setIsSearching(false);
    };

    return (
        <div className="bg-white w-full shadow-sm p-6 sticky top-0 z-10 flex items-center justify-between relative">
            {/* Left side - Title */}
            <div className={`transition-opacity duration-300 ease-in-out ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <h1 className="text-4xl font-bold text-midnightNavy whitespace-nowrap">
                    Welcome, Chief {userData.first_name} {userData.last_name}!
                </h1>
                <p className="text-base font-normal text-midnightNavy mt-1 whitespace-nowrap">
                    Monitor ongoing investigations and ensure timely case resolution.
                </p>
            </div>

            {/* Expanded Search Bar Overlay */}
            {isSearchOpen && (
                <div
                    className="absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-300"
                    style={{ right: `${rightOffset}px` }}
                    onMouseEnter={() => !isSearching && setIsSearchOpen(true)}
                    onMouseLeave={() => !searchQuery && !isSearching && setIsSearchOpen(false)}
                >
                    <input
                        type="text"
                        placeholder="Search details (keywords separated by comma)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        onFocus={() => setIsSearchOpen(true)}
                        onBlur={() => !searchQuery && !isSearching && setIsSearchOpen(false)}
                        autoFocus
                        disabled={isSearching}
                        className={`w-full pl-4 pr-12 py-2 border border-midnightNavy rounded-full text-sm text-midnightNavy outline-none focus:border-blue-500 ${isSearching ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
                    />
                </div>
            )}

            {/* USER INFO */}
            <div ref={rightSectionRef} className="flex items-center gap-4">
                {/* Search Button */}
                <div
                    className="relative flex items-center"
                    onMouseEnter={() => !isSearching && setIsSearchOpen(true)}
                    onMouseLeave={() => !searchQuery && !isSearching && setIsSearchOpen(false)}
                >
                    <button
                        onClick={isSearching ? cancelSearch : handleSearch}
                        className={`p-2 rounded-full transition relative ${isSearching ? 'hover:bg-red-50' : 'hover:bg-snowWhite'}`}
                        disabled={isSearching ? false : false}
                    >
                        {isSearching ? (
                            <div className="relative w-6 h-6 flex items-center justify-center">
                                {/* Loading Spinner Ring */}
                                <div className="absolute inset-0 border-2 border-midnightNavy border-t-transparent rounded-full animate-spin"></div>
                                {/* X Mark inside */}
                                <svg
                                    className="w-3 h-3 text-red-600 relative z-10"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        ) : (
                            <img src="/icon9.png" alt="search" className="w-6 h-6 object-contain text-midnightNavy" />
                        )}
                    </button>
                </div>

                {/* Notification Button with Badge */}
                <button
                    className="relative p-2"
                    onClick={() => setShowNotifications(!showNotifications)}
                >
                    <img src="/icon10.png" alt="Notifications" className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {showNotifications && (
                    <NotificationModal
                        isOpen={showNotifications}
                        onClose={() => setShowNotifications(false)}
                        onDocketClick={(docketId) => {
                            setShowNotifications(false);
                            if (onDocketClick) onDocketClick(docketId);
                        }}
                    />
                )}

                <div
                    onClick={() => router.push('/dashboard/profile')}
                    className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer"
                >
                    <div className="text-right">
                        <p className="font-bold text-midnightNavy">
                            {userData.first_name} {userData.last_name}
                        </p>
                        <p className="text-sm text-midnightNavy">{formatRole(userData.role)}</p>
                    </div>

                    <img
                        src={userData.profile_picture_url || "/icon11.png"}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/icon11.png';
                        }}
                        alt="User Avatar"
                        className="w-12 h-12 rounded-full border border-gray-200 object-cover"
                    />
                </div>
            </div>
        </div>
    );
}