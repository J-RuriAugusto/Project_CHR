import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardHeaderWrapper from '@/components/dashboard/DashboardHeaderWrapper';
import { getAllDocketLookups } from '@/lib/actions/docket-lookups';

export default async function LegalChiefDashboard() {
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
    .select('first_name, last_name, role, profile_picture_url')
    .eq('email', session.user.email)
    .single();

  if (error || !userData || userData.role !== 'legal_chief') {
    await supabase.auth.signOut();
    redirect('/login?message=You do not have the required permissions');
  }

  // Fetch lookups and users for the notification modal
  const lookups = await getAllDocketLookups();
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, role')
    .eq('role', 'officer');

  return (
    <div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardHeaderWrapper userData={userData} users={allUsers || []} lookups={lookups} />
      </main>
    </div>
  );
}