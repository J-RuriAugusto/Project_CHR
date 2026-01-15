'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfilePicture(userId: string, imageUrl: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('users')
            .update({ profile_picture_url: imageUrl })
            .eq('id', userId);

        if (error) {
            console.error('Database update failed:', error);
            throw new Error('Failed to update profile picture');
        }

        revalidatePath('/dashboard/profile');
        return { success: true };
    } catch (error) {
        console.error('Error in updateProfilePicture:', error);
        return { success: false, error: 'Failed to update profile picture' };
    }
}

export async function sendPasswordResetEmail(email: string, origin: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/reset-password`,
        });

        if (error) {
            console.error('Error sending reset link:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error sending reset link:', error);
        return { success: false, error: error.message || 'An unexpected error occurred' };
    }
}

export async function updatePassword(email: string, oldPassword: string, newPassword: string) {
    const supabase = await createClient();

    try {
        // 1. Verify old password by signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: oldPassword,
        });

        if (signInError) {
            return { success: false, error: 'Incorrect old password' };
        }

        // 2. Update password
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error updating password:', error);
        return { success: false, error: error.message || 'An unexpected error occurred' };
    }
}
