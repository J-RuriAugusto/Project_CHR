import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileContent from '@/components/profile/ProfileContent';
import { signOut } from '@/components/actions';

export default async function ProfilePage() {
    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect('/');
    }

    // Fetch user data including created_at
    const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, created_at, profile_picture_url')
        .eq('email', session.user.email)
        .single();

    if (error || !userData) {
        // Check if we need to sign out or just redirect
        console.error('Error fetching user profile:', error);
        await supabase.auth.signOut();
        redirect('/login?message=Error loading profile');
    }

    return (
        <ProfileContent
            userData={userData}
            signOut={signOut}
        />
    );
}
