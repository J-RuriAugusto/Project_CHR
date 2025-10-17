import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import dynamic from 'next/dynamic';

// Import the client component with dynamic to avoid SSR
const UserManagement = dynamic(() => import('@/components/admin/UserManagement'), { ssr: false });

export default async function AdminDashboard() {
  const supabase = createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/login');
  }

  // Fetch user data from the users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('first_name, last_name, role')
    .eq('email', session.user.email)
    .single();

  if (error || !userData || userData.role !== 'admin') {
    await supabase.auth.signOut();
    return redirect('/login?message=You do not have admin permissions');
  }

  // Fetch all users for the table
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role');

  if (usersError) {
    console.error('Error fetching users:', usersError);
  }

  return (
    <div>
      <DashboardHeader 
        firstName={userData.first_name} 
        lastName={userData.last_name} 
        role={userData.role} 
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
          <p className="text-gray-600 mb-6">
            Welcome to your dashboard. Here you can manage system settings and user accounts.
          </p>
          
          <UserManagement users={allUsers || []} />
        </div>
      </main>
    </div>
  );
}