import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
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
      
      if (!error && userData && userData.role) {
        // Redirect to the appropriate dashboard based on role
        const validRoles = [
          'investigation_chief',
          'regional_director',
          'officer',
          'records_officer',
          'legal_chief',
          'admin'
        ];
        
        if (validRoles.includes(userData.role)) {
          return NextResponse.redirect(`${requestUrl.origin}/dashboard/${userData.role}`);
        } else {
          // User doesn't have a valid role
          await supabase.auth.signOut(); // Sign out the user
          return NextResponse.redirect(`${requestUrl.origin}/?message=Your account is not authorized to access the system.`);
        }
      } else {
        // User exists in auth but not in users table or has no role
        await supabase.auth.signOut(); // Sign out the user
        return NextResponse.redirect(`${requestUrl.origin}/?message=Your account is not authorized to access the system.`);
      }
    }
  }

  // Default redirect if no code or session - authentication failed
  return NextResponse.redirect(`${requestUrl.origin}/?message=Authentication failed. Please try again.`);
}
