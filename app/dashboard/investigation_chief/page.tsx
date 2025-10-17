import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';

export default async function InvestigationChiefDashboard() {
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

  if (error || !userData || userData.role !== 'investigation_chief') {
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
          <h2 className="text-xl font-semibold mb-4">Investigation Chief Dashboard</h2>
          <p className="text-gray-600">
            Welcome to your dashboard. Here you can manage investigations and oversee case progress.
          </p>
          
          {/* Dashboard content specific to Investigation Chief would go here */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-medium text-indigo-800">Active Investigations</h3>
              <p className="text-indigo-600 text-2xl font-bold">24</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800">Completed This Month</h3>
              <p className="text-green-600 text-2xl font-bold">12</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-800">Pending Review</h3>
              <p className="text-yellow-600 text-2xl font-bold">8</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}