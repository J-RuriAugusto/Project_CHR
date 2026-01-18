'use client';

import { useEffect } from 'react';

/**
 * This component clears the browser history state to prevent 
 * users from navigating back to pages like reset-password after
 * successfully logging in or resetting their password.
 */
export default function HistoryCleaner() {
    useEffect(() => {
        // Replace the current history entry to prevent back navigation
        // to auth pages like reset-password
        if (typeof window !== 'undefined') {
            const currentUrl = window.location.href;
            window.history.replaceState(null, '', currentUrl);

            // Also push a new state so back button goes to a safe location
            // if they somehow still try to go back
            window.history.pushState(null, '', currentUrl);

            // Listen for popstate (back button) and redirect back
            const handlePopState = () => {
                window.history.pushState(null, '', currentUrl);
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, []);

    return null;
}
