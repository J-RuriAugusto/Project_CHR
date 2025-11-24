'use server';

import { createClient } from '@/utils/supabase/server';
import { computeStatus, getDaysDifference } from '@/lib/utils/date-helpers';

export interface DocketListItem {
    id: string;
    docketNumber: string;
    typeOfRequest: string;
    status: 'Overdue' | 'Urgent' | 'Due' | 'Active';
    assignedTo: string;
    daysTillDeadline: number;
    lastUpdated: string;
    deadline: Date;
}

/**
 * Fetch all dockets with computed status and days till deadline
 */
export async function getDockets(): Promise<DocketListItem[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('dockets')
        .select(`
            id,
            docket_number,
            deadline,
            updated_at,
            type_of_request_id,
            staff_in_charge_id,
            request_types!type_of_request_id (name),
            users!staff_in_charge_id (first_name, last_name)
        `)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching dockets:', error);
        return [];
    }

    if (!data) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.map((docket: any) => {
        const deadlineDate = new Date(docket.deadline);
        const status = computeStatus(deadlineDate);
        const daysTillDeadline = getDaysDifference(today, deadlineDate);

        return {
            id: docket.id,
            docketNumber: docket.docket_number,
            typeOfRequest: docket.request_types?.name || 'Unknown',
            status,
            assignedTo: docket.users
                ? `${docket.users.first_name} ${docket.users.last_name}`
                : 'Unassigned',
            daysTillDeadline,
            lastUpdated: new Date(docket.updated_at).toLocaleDateString('en-US'),
            deadline: deadlineDate
        };
    });
}

/**
 * Check if a docket number already exists
 */
export async function checkDocketNumberExists(docketNumber: string): Promise<boolean> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('dockets')
        .select('id')
        .eq('docket_number', docketNumber)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking docket number:', error);
    }

    return !!data;
}
