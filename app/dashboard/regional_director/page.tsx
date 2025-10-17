import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';

export default async function RegionalDirectorDashboard() {
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

  if (error || !userData || userData.role !== 'regional_director') {
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
          <h2 className="text-xl font-semibold mb-4">Regional Director Dashboard</h2>
          <p className="text-gray-600">
            Welcome to your dashboard. Here you can oversee regional operations and performance metrics.
          </p>
          
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800">Regional Cases</h3>
              <p className="text-blue-600 text-2xl font-bold">156</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800">Staff Performance</h3>
              <p className="text-purple-600 text-2xl font-bold">92%</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="font-medium text-pink-800">Budget Utilization</h3>
              <p className="text-pink-600 text-2xl font-bold">78%</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}