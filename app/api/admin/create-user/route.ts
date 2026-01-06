import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, first_name, last_name, role } = await request.json();

    // Validate required fields
    if (!email || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, first_name, last_name, role' },
        { status: 400 }
      );
    }

    // Use the service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key, not anon key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Step 1: Invite user via Supabase Auth
    // This sends an email to the user with a link to set their password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          first_name,
          last_name,
          role
        },
        redirectTo: `${new URL(request.url).origin}/auth/confirm`
      }
    );

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 400 });
    }

    // Step 2: Create user in your users table with the same ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id, // Use the same ID from auth
        email: email,
        first_name: first_name,
        last_name: last_name,
        role: role,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('User table creation error:', userError);

      // If users table insert fails, clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json({ error: `Database error: ${userError.message}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userData
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}