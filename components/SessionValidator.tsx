'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface SessionValidatorProps {
    // How often to check session validity in milliseconds (default: 30 seconds)
    checkInterval?: number;
}

/**
 * This component periodically checks if the user's session is still valid.
 * If the user's account is deleted, set to inactive, or email is changed by admin,
 * it automatically logs them out.
 */
export default function SessionValidator({ checkInterval = 30000 }: SessionValidatorProps) {
    const supabase = createClient();
    const isLoggingOut = useRef(false);

    useEffect(() => {
        const validateSession = async () => {
            // Prevent multiple logout attempts
            if (isLoggingOut.current) return;

            try {
                const response = await fetch('/api/auth/validate-session');

                // If the request fails (e.g., network error), don't logout
                if (!response.ok) {
                    console.error('Session validation request failed');
                    return;
                }

                const data = await response.json();

                if (!data.valid) {
                    isLoggingOut.current = true;

                    // Sign out the user
                    await supabase.auth.signOut();

                    // Redirect to login with appropriate message
                    let message = '';
                    if (data.reason === 'deleted') {
                        message = 'Your account has been removed. Please contact an administrator.';
                    } else if (data.reason === 'inactive') {
                        message = 'Your account has been deactivated. Please contact an administrator.';
                    } else if (data.reason === 'email_changed') {
                        message = 'Your account email has been updated. Please log in again with your new email.';
                    } else if (data.reason === 'no_session') {
                        // Session expired naturally, don't show a message - just redirect
                        window.location.href = '/';
                        return;
                    } else {
                        message = 'Your session has expired. Please log in again.';
                    }

                    window.location.href = `/?message=${encodeURIComponent(message)}`;
                }
            } catch (error) {
                // Don't log out on network errors to avoid disrupting the user
                console.error('Session validation error:', error);
            }
        };

        // Don't validate immediately on mount - wait for the first interval
        // This prevents the issue where the session isn't fully established yet
        const initialDelay = setTimeout(() => {
            validateSession();
        }, 5000); // Wait 5 seconds after mount before first check

        // Set up periodic validation
        const intervalId = setInterval(validateSession, checkInterval);

        return () => {
            clearTimeout(initialDelay);
            clearInterval(intervalId);
        };
    }, [checkInterval, supabase.auth]);

    return null;
}
