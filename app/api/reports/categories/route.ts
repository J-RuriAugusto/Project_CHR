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

        // Fetch unique violation categories from the docket_violations junction table
        const { data, error } = await supabase
            .from('docket_violations')
            .select('category_name')
            .not('category_name', 'is', null);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: `Database error: ${error.message}` },
                { status: 500 }
            );
        }

        // Extract unique categories and sort them
        const uniqueCategories = Array.from(new Set(
            data
                .map(d => d.category_name)
                .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
        )).sort();

        return NextResponse.json(uniqueCategories);
    } catch (err: any) {
        console.error('API error:', err.message);
        return NextResponse.json(
            { error: err.message || 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}
