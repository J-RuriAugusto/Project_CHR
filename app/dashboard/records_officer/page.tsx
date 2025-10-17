import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';

export default async function RecordsOfficerDashboard() {
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

  if (error || !userData || userData.role !== 'records_officer') {
    await supabase.auth.signOut();
    return redirect('/login?message=You do not have the required permissions');
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
          <h2 className="text-xl font-semibold mb-4">Records Officer Dashboard</h2>
          <p className="text-gray-600">
            Welcome to your dashboard. Here you can manage case records and documentation.
          </p>
          
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-cyan-50 p-4 rounded-lg">
              <h3 className="font-medium text-cyan-800">Total Records</h3>
              <p className="text-cyan-600 text-2xl font-bold">1,247</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="font-medium text-amber-800">Pending Archival</h3>
              <p className="text-amber-600 text-2xl font-bold">28</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="font-medium text-emerald-800">Recent Updates</h3>
              <p className="text-emerald-600 text-2xl font-bold">15</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}