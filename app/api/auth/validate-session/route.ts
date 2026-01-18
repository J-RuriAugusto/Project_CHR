import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = createClient();

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json({ valid: false, reason: 'no_session' });
        }

        // Check if the user exists and their status
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, status')
            .eq('email', session.user.email)
            .single();

        if (userError || !userData) {
            // User doesn't exist in the database - they were deleted
            return NextResponse.json({ valid: false, reason: 'deleted' });
        }

        if (userData.status === 'INACTIVE') {
            // User is inactive
            return NextResponse.json({ valid: false, reason: 'inactive' });
        }

        // User is valid and active
        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error('Session validation error:', error);
        return NextResponse.json({ valid: false, reason: 'error' });
    }
}
