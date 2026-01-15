'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NotificationModal from './NotificationModal';

interface DocketHeaderProps {
    userData: {
        first_name: string;
        last_name: string;
        role: string;
        profile_picture_url?: string;
    };
}

export default function DocketHeader({ userData }: DocketHeaderProps) {
    const router = useRouter();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <div className="bg-white w-full shadow-sm p-6 sticky top-0 z-10 flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-bold text-midnightNavy">
                    Case Docketing & Tracking
                </h1>
                <p className="text-base font-normal text-midnightNavy mt-1">
                    Register and track all human right cases with real-time status updates and investigation deadlines.
                </p>
            </div>

            {/* USER INFO */}
            <div className="flex items-center gap-4">
                <div
                    className="relative flex items-center"
                    onMouseEnter={() => setIsSearchOpen(true)}
                    onMouseLeave={() => setIsSearchOpen(false)}
                >
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-60 opacity-100' : 'w-0 opacity-0'
                        }`}>
                        <input
                            type="text"
                            placeholder="Search case by docket number or key..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-midnightNavy rounded-full text-xs text-midnightNavy outline-none focus:border-blue-500"
                        />
                    </div>
                    <button className="p-2 rounded-full hover:bg-snowWhite transition ml-2">
                        <img src="/icon9.png" alt="search" className="w-6 h-6 object-contain text-midnightNavy" />
                    </button>
                </div>

                <button
                    className="relative p-2"
                    onClick={() => setShowNotifications(!showNotifications)}
                >
                    <img src="/icon10.png" alt="Notifications" className="w-6 h-6" />
                </button>

                {showNotifications && (
                    <NotificationModal
                        isOpen={showNotifications}
                        onClose={() => setShowNotifications(false)}
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
                        <p className="text-sm text-midnightNavy">{userData.role}</p>
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