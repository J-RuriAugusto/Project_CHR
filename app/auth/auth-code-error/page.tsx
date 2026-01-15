'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
    const searchParams = useSearchParams();
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    let errorMessage = 'There was a problem signing you in.';

    if (errorCode === 'otp_expired') {
        errorMessage = 'This invitation link has expired or has already been used. Please ask the administrator to send a new invitation.';
    } else if (errorDescription) {
        errorMessage = errorDescription.replace(/\+/g, ' ');
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
                <p className="text-gray-600 mb-6">{errorMessage}</p>

                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Return to Home
                </Link>
            </div>
        </div>
    );
}

export default function AuthCodeError() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
