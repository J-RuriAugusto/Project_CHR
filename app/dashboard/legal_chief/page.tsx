import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';

export default async function LegalChiefDashboard() {
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

  if (error || !userData || userData.role !== 'legal_chief') {
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
          <h2 className="text-xl font-semibold mb-4">Legal Chief Dashboard</h2>
          <p className="text-gray-600">
            Welcome to your dashboard. Here you can manage legal proceedings and case reviews.
          </p>
          
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-violet-50 p-4 rounded-lg">
              <h3 className="font-medium text-violet-800">Legal Reviews</h3>
              <p className="text-violet-600 text-2xl font-bold">32</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-lg">
              <h3 className="font-medium text-rose-800">Court Proceedings</h3>
              <p className="text-rose-600 text-2xl font-bold">18</p>
            </div>
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-medium text-teal-800">Pending Approvals</h3>
              <p className="text-teal-600 text-2xl font-bold">7</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}