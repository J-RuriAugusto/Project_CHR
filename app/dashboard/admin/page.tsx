import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AdminContent from '@/components/admin/AdminContent';
import { signOut } from '@/components/actions';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/');
  }

  // Fetch user data from the users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('first_name, last_name, role')
    .eq('email', session.user.email)
    .single();

  if (error || !userData || userData.role !== 'admin') {
    await supabase.auth.signOut();
    redirect('/login?message=You do not have admin permissions');
  }

  // Fetch all users for the table
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, status');

  if (usersError) {
    console.error('Error fetching users:', usersError);
  }

  return (
    <AdminContent
      userData={userData}
      signOut={signOut}
      users={allUsers || []}
    />
  );
}