import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Force dynamic to prevent static generation issues with cookies
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = createClient();

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json({ valid: false, reason: 'no_session' });
        }

        // Check if the user exists and their status using the auth user ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, status')
            .eq('id', session.user.id)
            .single();

        if (userError || !userData) {
            // User doesn't exist in the database - they were deleted
            return NextResponse.json({ valid: false, reason: 'deleted' });
        }

        // Check if the admin changed the user's email
        // The session email won't match the database email if admin updated it
        if (userData.email !== session.user.email) {
            return NextResponse.json({ valid: false, reason: 'email_changed' });
        }

        // Check if account is inactive (set by admin)
        if (userData.status === 'INACTIVE') {
            return NextResponse.json({ valid: false, reason: 'inactive' });
        }

        // User is valid and active
        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error('Session validation error:', error);
        // On error, assume valid to prevent disrupting user experience
        return NextResponse.json({ valid: true });
    }
}

