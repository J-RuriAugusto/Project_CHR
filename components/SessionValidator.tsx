'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface SessionValidatorProps {
    // How often to check session validity in milliseconds (default: 30 seconds)
    checkInterval?: number;
}

/**
 * This component periodically checks if the user's session is still valid.
 * If the user's account is deleted or set to inactive, it automatically logs them out.
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
                    } else {
                        message = 'Your session has expired. Please log in again.';
                    }

                    window.location.href = `/?message=${encodeURIComponent(message)}`;
                }
            } catch (error) {
                console.error('Session validation error:', error);
                // Don't log out on network errors to avoid disrupting the user
            }
        };

        // Validate immediately on mount
        validateSession();

        // Set up periodic validation
        const intervalId = setInterval(validateSession, checkInterval);

        return () => {
            clearInterval(intervalId);
        };
    }, [checkInterval, supabase.auth]);

    return null;
}
