import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const supabase = createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/');
  }

  // Fetch user data from the users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single();
  
  if (!error && userData && userData.role) {
    const validRoles = [
      'investigation_chief',
      'regional_director',
      'officer',
      'records_officer',
      'legal_chief',
      'admin'
    ];
    
    if (validRoles.includes(userData.role)) {
      return redirect(`/dashboard/${userData.role}`);
    } else {
      // User doesn't have a valid role, sign them out
      await supabase.auth.signOut();
      return redirect('/login?message=Your account does not have the required permissions');
    }
  }
  
  // If no role found, sign out and redirect to login
  await supabase.auth.signOut();
  return redirect('/login?message=Your account does not have the required permissions');
}