import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import DashboardHeaderWrapper from '@/components/dashboard/DashboardHeaderWrapper';
import Sidebar from '@/components/Sidebar';
import { signOut } from '../../../components/actions';
import LogoutButton from '@/components/LogoutButton';
import { getAllDocketLookups } from '@/lib/actions/docket-lookups';

export default async function RegionalDirectorDashboard() {
  const supabase = await createClient();
  const currentPath = (await headers()).get("next-url") || "/";
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/');
  }

  // Fetch user data from the users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('first_name, last_name, role, profile_picture_url')
    .eq('email', session.user.email)
    .single();

  if (error || !userData || userData.role !== 'regional_director') {
    await supabase.auth.signOut();
    return redirect('/login?message=You do not have the required permissions');
  }

  // Fetch lookups and users for the notification modal
  const lookups = await getAllDocketLookups();
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, role')
    .eq('role', 'officer');

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
        <div className="pt-4 border-t">
          <LogoutButton signOut={signOut} />
        </div>
      </aside>
      <main className="bg-snowWhite flex-1 overflow-y-auto pb-6 relative custom-scrollbar">
        <DashboardHeaderWrapper userData={userData} users={allUsers || []} lookups={lookups} />
      </main>
    </div>
  );
}