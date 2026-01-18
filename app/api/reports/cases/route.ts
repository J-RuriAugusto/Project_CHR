import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    // Create Supabase client inside the handler to avoid build-time errors
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing env vars:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(req.url);

    const startYear = Number(searchParams.get('startYear'));
    const endYear = Number(searchParams.get('endYear'));
    const categoriesParam = searchParams.get('categories');

    console.log('Report params:', { startYear, endYear, categoriesParam });

    if (!startYear || !endYear) {
      return NextResponse.json(
        { error: 'startYear and endYear are required' },
        { status: 400 }
      );
    }

    const categories = categoriesParam
      ? categoriesParam.split(',').map(c => c.trim()).filter(c => c)
      : [];

    let query = supabase
      .from('dockets')
      .select('*')
      .gte('date_received', `${startYear}-01-01`)
      .lte('date_received', `${endYear}-12-31`);

    if (categories.length > 0) {
      query = query.in('violation_category', categories);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Query successful, returned rows:', data?.length || 0);
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error('API error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
