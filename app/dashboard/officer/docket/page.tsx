import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DocketContent from './DocketContent';
import { signOut } from './actions';

export default async function Docket() {
    const supabase = createClient();
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

    if (error || !userData || userData.role !== 'officer') {
        await supabase.auth.signOut();
        return redirect('/login?message=You do not have the required permissions');
    }

    return <DocketContent userData={userData} signOut={signOut} />;
}