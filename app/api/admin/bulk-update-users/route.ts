import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
    try {
        const { userIds, status } = await request.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !status) {
            return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
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

        // Update users table
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .in('id', userIds)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: `Successfully updated ${data.length} users to ${status}`,
            updatedCount: data.length
        });

    } catch (error: any) {
        console.error('Error bulk updating users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
