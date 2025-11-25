import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import { signOut } from '../../../components/actions';

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
        <form action={signOut} className="pt-4 border-t">
          <button
            type="submit"
            className="flex items-center justify-center space-x-2 w-full text-white hover:text-paleSky py-2 px-4 rounded-md text-lg font-semibold transition"
          >
            <img src="/icon8.png" alt="Logout" className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </form>
      </aside>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardHeader userData={userData} />
      </main>
    </div>
  );
}