import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const { userId, email, first_name, last_name, role, status } = await request.json();

    if (!userId || !email || !first_name || !last_name || !role || !status) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
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

    // Check if email is already in use by another user
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .neq('id', userId)
      .single();

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email address is already in use by another user' 
      }, { status: 400 });
    }

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const emailChanged = currentUser.email !== email;

    // Update auth user
    if (emailChanged) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          email: email,
          user_metadata: {
            first_name,
            last_name,
            role
          }
        }
      );

      if (authError) {
        console.error('Auth update error:', authError);
        return NextResponse.json({ 
          error: `Failed to update authentication: ${authError.message}` 
        }, { status: 400 });
      }
    } else {
      // Update only metadata if email didn't change
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            first_name,
            last_name,
            role
          }
        }
      );

      if (authError) {
        console.error('Auth metadata update error:', authError);
        // Continue with database update even if metadata update fails
      }
    }

    // Update users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .update({
        email,
        first_name,
        last_name,
        role,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: emailChanged ? 
        'User updated successfully. Email changed in authentication system.' : 
        'User updated successfully',
      user: userData
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}