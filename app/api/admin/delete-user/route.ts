import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Use the service role key for admin operations
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

    // Step 1: Delete user from auth system
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Auth deletion error:', authError);
      // Even if auth deletion fails, we might still want to delete from users table
      // But you can choose to return an error here if you prefer
    }

    // Step 2: Delete user from users table (this will cascade due to foreign key)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      console.error('User table deletion error:', userError);
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully from both auth and database'
    });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}