import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import { signOut } from '../../../components/actions';
import LogoutButton from '@/components/LogoutButton';

export default async function RegionalDirectorDashboard() {
  const supabase = await createClient();
  const currentPath = (await headers()).get("next-url") || "/";
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/');
  }

  // Fetch user data
  const { data: userData, error } = await supabase
    .from('users')
    .select('first_name, last_name, role')
    .eq('email', session.user.email)
    .single();

  if (error || !userData || userData.role !== 'regional_director') {
    await supabase.auth.signOut();
    return redirect('/login?message=You do not have the required permissions');
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* LEFT COLUMN */}
      <aside className="w-60 bg-midnightNavy border-r shadow-sm flex flex-col justify-between p-4">
        <div className="flex justify-center mb-4">
          <img
            src="/cmms-logo2.png"
            alt="Logo"
            className="w-auto h-auto"
          />
        </div>

        {/* Navigation Links */}
        <Sidebar currentPath={currentPath} />

        {/* Logout button at bottom */}
        {/* Logout button at bottom */}
        <div className="pt-4 border-t">
          <LogoutButton signOut={signOut} />
        </div>
      </aside>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardHeader userData={userData} />
      </main>
    </div>
  );
}