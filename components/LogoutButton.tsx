'use client';

import { useState } from 'react';

interface LogoutButtonProps {
    signOut: () => Promise<void>;
    className?: string;
}

export default function LogoutButton({ signOut, className = "" }: LogoutButtonProps) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingOut(true);
        try {
            await signOut();
        } catch (error) {
            console.error('Logout failed:', error);
            setIsLoggingOut(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center justify-center space-x-2 w-full text-white hover:text-paleSky py-2 px-4 rounded-md text-lg font-semibold transition ${isLoggingOut ? 'opacity-75 cursor-not-allowed' : ''
                } ${className}`}
        >
            {isLoggingOut ? (
                <span>Logging out...</span>
            ) : (
                <>
                    <img src="/icon8.png" alt="Logout" className="w-5 h-5" />
                    <span>Logout</span>
                </>
            )}
        </button>
    );
}
