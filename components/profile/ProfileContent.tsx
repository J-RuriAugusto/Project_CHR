'use client';

import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useState, useRef } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { updateProfilePicture, sendPasswordResetEmail, updatePassword } from '@/lib/actions/user-actions';



interface ProfileContentProps {
    userData: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
        created_at: string;
        profile_picture_url?: string;
    };
    signOut: () => Promise<void>;
}

function ProfilePasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <style jsx>{`
                input::-ms-reveal,
                input::-ms-clear {
                    display: none;
                }
            `}</style>
            <input
                {...props}
                type={showPassword ? 'text' : 'password'}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm pr-10 ${props.className || ''}`}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );
}

export default function ProfileContent({ userData, signOut }: ProfileContentProps) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [profileImage, setProfileImage] = useState(userData.profile_picture_url || '/icon11.png');
    const [uploading, setUploading] = useState(false);
    const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    // Password Update State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleUpdatePassword = async () => {
        // Basic Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            alert('Please fill in all password fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters long.');
            return;
        }

        setIsUpdatingPassword(true);

        try {
            const result = await updatePassword(userData.email, oldPassword, newPassword);

            if (result.success) {
                alert('Password updated successfully!');
                // Clear fields
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Update password error:', error);
            alert('An unexpected error occurred while updating password.');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleSendResetLink = async () => {
        if (resetStatus === 'sending') return;

        // Reset to sending state immediately
        setResetStatus('sending');

        try {
            const result = await sendPasswordResetEmail(userData.email, window.location.origin);

            if (!result.success) {
                console.error('Error sending reset link:', result.error);
                setResetStatus('error');
                // Optional: alert can still be used for serious errors, or just let the button show "Error"
                alert('Error sending reset link: ' + result.error);
            } else {
                setResetStatus('sent');
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setResetStatus('error');
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
        } catch (error) {
            console.error('Logout failed:', error);
            setIsLoggingOut(false);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            // Validation
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file (JPG, PNG, etc).');
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('File size must be less than 2MB.');
                return;
            }

            setUploading(true);

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${userData.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Database
            const result = await updateProfilePicture(userData.id, publicUrl);

            if (!result.success) {
                throw new Error('Failed to update profile picture in database');
            }

            // 4. Update Local State
            setProfileImage(publicUrl);

        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert('Error uploading image: ' + (error.message || 'Unknown error'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Determine Sidebar content based on role
    const renderSidebar = () => {
        if (userData.role === 'admin') {
            return (
                <aside className="w-60 bg-midnightNavy border-r shadow-sm flex flex-col justify-between p-4 flex-shrink-0">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/cmms-logo2.png"
                            alt="Logo"
                            className="w-auto h-auto"
                        />
                    </div>

                    <div className="pt-4 border-t">
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className={`flex items-center justify-center space-x-2 w-full text-white hover:text-paleSky py-2 px-4 rounded-md text-lg font-semibold transition ${isLoggingOut ? 'opacity-75 cursor-not-allowed' : ''
                                }`}
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
                    </div>
                </aside>
            );
        }

        // For other roles, use the shared Sidebar component
        return (
            <aside className="w-60 bg-midnightNavy border-r shadow-sm flex flex-col justify-between p-4 flex-shrink-0">
                <div className="flex justify-center mb-4">
                    <img
                        src="/cmms-logo2.png"
                        alt="Logo"
                        className="w-auto h-auto"
                    />
                </div>

                <Sidebar currentPath={null} role={userData.role} />

                <div className="pt-4 border-t">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={`flex items-center justify-center space-x-2 w-full text-white hover:text-paleSky py-2 px-4 rounded-md text-lg font-semibold transition ${isLoggingOut ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
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
                </div>
            </aside>
        );
    };

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            {renderSidebar()}

            <main className="bg-white flex-1 overflow-y-auto relative custom-scrollbar p-8">
                {/* Back Button */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-midnightNavy hover:text-blue-600 transition"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-semibold text-sm">Back</span>
                    </button>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                        {/* LEFT COLUMN - Profile Info */}
                        <div className="md:col-span-4 lg:col-span-3 flex flex-col">
                            <div className="mb-6 relative group w-64 h-64 rounded-full border border-gray-200 overflow-hidden shadow-sm mx-auto md:mx-0">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/jpg"
                                />
                                <img
                                    src={profileImage}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null; // Prevent infinite loop
                                        target.src = '/icon11.png';
                                    }}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                                {uploading && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                                <div
                                    onClick={handleImageClick}
                                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 cursor-pointer flex items-center justify-center"
                                >
                                    <span className="text-white opacity-0 group-hover:opacity-100 font-semibold text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                                        {uploading ? 'Uploading...' : 'Change'}
                                    </span>
                                </div>
                            </div>


                            <div className="text-center md:text-left">
                                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                    {userData.first_name} {userData.last_name}
                                </h1>
                                <p className="text-xl text-gray-500 font-normal mb-4">
                                    {userData.role.replace('_', ' ')}
                                </p>

                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-center md:justify-start text-gray-600">
                                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm">{userData.email}</span>
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start text-gray-600">
                                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm">Joined {formatDate(userData.created_at)}</span>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* RIGHT COLUMN - Change Password */}
                        <div className="md:col-span-8 lg:col-span-9">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                                Password & Authentication
                            </h2>

                            <div className="bg-white">
                                <form className="max-w-lg">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                Old password
                                            </label>
                                            <ProfilePasswordInput
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                                placeholder="Enter current password"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                New password
                                            </label>
                                            <ProfilePasswordInput
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                Confirm new password
                                            </label>
                                            <ProfilePasswordInput
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Retype new password"
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={handleUpdatePassword}
                                                disabled={isUpdatingPassword}
                                                className={`bg-[#2da44e] text-white font-semibold py-2 px-6 rounded-md hover:bg-[#2c974b] transition text-sm shadow-sm ${isUpdatingPassword ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {isUpdatingPassword ? 'Updating...' : 'Update password'}
                                            </button>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-4">
                                                {/* Reset Link Logic */}
                                                {(resetStatus === 'idle' || resetStatus === 'error') && (
                                                    <button
                                                        type="button"
                                                        onClick={handleSendResetLink}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                                                    >
                                                        {resetStatus === 'error' ? 'Error. Try again' : 'Send Reset Link Instead'}
                                                    </button>
                                                )}

                                                {resetStatus === 'sending' && (
                                                    <span className="text-gray-400 text-sm font-medium">
                                                        Sending...
                                                    </span>
                                                )}

                                                {resetStatus === 'sent' && (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="text-green-600 text-sm font-medium">
                                                            Reset link sent
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={handleSendResetLink}
                                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"
                                                        >
                                                            Resend link
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
