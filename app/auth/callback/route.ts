import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    // Handle code exchange errors
    if (exchangeError) {
      return NextResponse.redirect(`${requestUrl.origin}/?message=Authentication failed. Please try again.`);
    }
    
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Fetch user data from the users table to get their role
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', session.user.email)
        .single();
      
      // USER AUTHORIZATION CHECK
      if (error || !userData || !userData.role) {
        // User exists in auth but not in users table or has no role
        console.log(`Unauthorized user attempt: ${session.user.email}`);
        
        // First sign out to clear the session
        await supabase.auth.signOut().catch(err => {
          console.error('Error during sign out:', err);
        });
        
        try {
          // Then delete the user from auth using admin client
          const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(session.user.id);
          
          if (deleteError) {
            console.error('Error deleting unauthorized user:', deleteError);
          } else {
            console.log(`Successfully deleted unauthorized user: ${session.user.email}`);
          }
        } catch (adminError) {
          console.error('Admin API error:', adminError);
        }

        return NextResponse.redirect(`${requestUrl.origin}/?message=Your account is not authorized to access the system.`);
      }
      
      // Check if user has a valid role
      const validRoles = [
        'investigation_chief',
        'regional_director', 
        'officer',
        'records_officer',
        'legal_chief',
        'admin'
      ];
      
      if (validRoles.includes(userData.role)) {
        // User is authorized - redirect to their dashboard
        return NextResponse.redirect(`${requestUrl.origin}/dashboard/${userData.role}`);
      } else {
        // User has a role but it's not valid
        console.log(`User with invalid role attempt: ${session.user.email}, role: ${userData.role}`);
        
        // First sign out to clear the session
        await supabase.auth.signOut().catch(err => {
          console.error('Error during sign out:', err);
        });
        
        try {
          // Then delete the user from auth using admin client
          const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(session.user.id);
          
          if (deleteError) {
            console.error('Error deleting user with invalid role:', deleteError);
          } else {
            console.log(`Successfully deleted user with invalid role: ${session.user.email}`);
          }
        } catch (adminError) {
          console.error('Admin API error:', adminError);
        }

        return NextResponse.redirect(`${requestUrl.origin}/?message=Your account is not authorized to access the system.`);
      }
    }
  }

  // If we get here, redirect to login without any session issues
  return NextResponse.redirect(`${requestUrl.origin}/`);
}