'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthConfirm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get hash fragment from URL
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');
                const errorCode = hashParams.get('error_code');
                const errorDescription = hashParams.get('error_description');

                // Check for errors in the hash
                if (errorCode) {
                    let errorMessage = 'There was a problem signing you in.';
                    if (errorCode === 'otp_expired') {
                        errorMessage = 'This invitation link has expired or has already been used. Please ask the administrator to send a new invitation.';
                    } else if (errorDescription) {
                        errorMessage = errorDescription.replace(/\+/g, ' ');
                    }
                    setError(errorMessage);
                    setIsProcessing(false);
                    return;
                }

                if (!accessToken || !refreshToken) {
                    setError('Invalid or missing authentication tokens. The link may have expired or already been used.');
                    setIsProcessing(false);
                    return;
                }

                const supabase = createClient();

                // Set the session using the tokens from the hash
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (sessionError) {
                    setError(sessionError.message);
                    setIsProcessing(false);
                    return;
                }

                // Redirect based on the type
                // 'invite' = new user invitation, 'recovery' = password reset
                if (type === 'invite' || type === 'recovery') {
                    router.replace('/reset-password');
                } else {
                    // For other types (like magiclink or oauth), redirect to home
                    router.replace('/');
                }
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred');
                setIsProcessing(false);
            }
        };

        handleAuthCallback();
    }, [router]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <a
                        href="/"
                        className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Return to Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing your invitation...</p>
            </div>
        </div>
    );
}
