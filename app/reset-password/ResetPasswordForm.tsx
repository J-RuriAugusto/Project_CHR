'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface ResetPasswordFormProps {
    code?: string;
}

export default function ResetPasswordForm({ code }: ResetPasswordFormProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            // If there's a code, try to exchange it first
            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) {
                    setError('Invalid or expired reset link. Please request a new one.');
                    setIsLoading(false);
                    return;
                }
            }

            // Update the password
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) {
                setError(updateError.message || 'Unable to reset password. Try again!');
                setIsLoading(false);
                return;
            }

            // Success! Redirect to home/dashboard
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-3">
            {/* New Password */}
            <div>
                <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-[#737373] mb-2 ml-1 font-sans"
                >
                    New Password
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Input your new password..."
                        required
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm pr-10 focus:outline-none focus:border-[#5ea2ef] focus:ring-1 focus:ring-[#5ea2ef]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#5ea2ef]"
                    >
                        {showPassword ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Confirm New Password */}
            <div>
                <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-[#737373] mb-2 ml-1 font-sans"
                >
                    Confirm New Password
                </label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new Password..."
                        required
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm pr-10 focus:outline-none focus:border-[#5ea2ef] focus:ring-1 focus:ring-[#5ea2ef]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#5ea2ef]"
                    >
                        {showConfirmPassword ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#5ea2ef] text-white py-3 rounded-xl hover:bg-[#4d91de] transition text-md font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
                {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-3 rounded-md text-xs text-center bg-red-50 text-red-700">
                    {error}
                </div>
            )}
        </form>
    );
}
