import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DocketContent from './DocketContent';
import { signOut } from '../actions';
import { getAllDocketLookups } from '@/lib/actions/docket-lookups';

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

    if (error || !userData || userData.role !== 'investigation_chief') {
        await supabase.auth.signOut();
        return redirect('/login?message=You do not have the required permissions');
    }

    // Fetch all users for the staff dropdown
    const { data: allUsers } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('role', 'officer');

    // Fetch all docket lookup data
    const lookups = await getAllDocketLookups();

    return <DocketContent userData={userData} signOut={signOut} users={allUsers || []} lookups={lookups} />;
}