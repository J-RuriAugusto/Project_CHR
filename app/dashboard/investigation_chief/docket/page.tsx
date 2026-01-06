import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DocketContent from './DocketContent';
import { signOut } from '../../../../components/actions';
import { getAllDocketLookups } from '@/lib/actions/docket-lookups';

export default async function Docket() {
    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect('/');
    }

    // Fetch user data
    const { data: userData, error } = await supabase
        .from('users')
        .select('first_name, last_name, role, profile_picture_url')
        .eq('email', session.user.email)
        .single();

    if (error || !userData || userData.role !== 'investigation_chief') {
        await supabase.auth.signOut();
        redirect('/login?message=You do not have the required permissions');
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