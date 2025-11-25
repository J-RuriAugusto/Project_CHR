'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateDocketStatus(docketIds: string[], status: string) {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('dockets')
            .update({ status })
            .in('id', docketIds);

        if (error) {
            console.error('Error updating docket status:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/records_officer/docket');
        revalidatePath('/dashboard/investigation_chief/docket');

        return { success: true };
    } catch (error) {
        console.error('Unexpected error updating docket status:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}
