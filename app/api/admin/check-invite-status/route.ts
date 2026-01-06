import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if email is confirmed
        const isConfirmed = !!user.email_confirmed_at;

        return NextResponse.json({ isConfirmed });

    } catch (error: any) {
        console.error('Check status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
