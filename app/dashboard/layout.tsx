import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import HistoryCleaner from '@/components/HistoryCleaner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HistoryCleaner />
      {children}
    </div>
  );
}
