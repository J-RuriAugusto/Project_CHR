import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing env vars');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch unique rights from docket_rights junction table
        const { data, error } = await supabase
            .from('docket_rights')
            .select('right_name');

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: `Database error: ${error.message}` },
                { status: 500 }
            );
        }

        // Extract unique rights and sort them
        const uniqueRights = Array.from(new Set(
            data
                .map(d => d.right_name)
                .filter((r): r is string => typeof r === 'string' && r.trim() !== '')
        )).sort();

        return NextResponse.json(uniqueRights);
    } catch (err: any) {
        console.error('API error:', err.message);
        return NextResponse.json(
            { error: err.message || 'Failed to fetch rights' },
            { status: 500 }
        );
    }
}
