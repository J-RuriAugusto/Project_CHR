import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface DashboardHeaderProps {
  firstName: string;
  lastName: string;
  role: string;
}

export default async function DashboardHeader({ firstName, lastName, role }: DashboardHeaderProps) {
  const signOut = async () => {
    'use server';

    const supabase = createClient();
    await supabase.auth.signOut();
    return redirect('/');
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-black">
              {role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Dashboard
            </h1>
            <p className="text-black">
              Welcome, {firstName} {lastName}
            </p>
          </div>
          <div className="flex items-center">
            <form action={signOut}>
              <button 
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}