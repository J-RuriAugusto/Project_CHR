'use server';

import { createClient } from '@/utils/supabase/server';
import { computeStatus, getDaysDifference } from '@/lib/utils/date-helpers';

export interface DocketListItem {
    id: string;
    docketNumber: string;
    typeOfRequest: string;
    status: string;
    assignedTo: string;
    daysTillDeadline: number;
    lastUpdated: string;
    deadline: Date;
}

/**
 * Fetch all dockets with computed status and days till deadline
 */
export async function getDockets(userId?: string): Promise<DocketListItem[]> {
    const supabase = createClient();

    let query: any = supabase
        .from('dockets')
        .select(`
            id,
            docket_number,
            deadline,
            updated_at,
            status,
            type_of_request_id,
            request_types!type_of_request_id (name),
            docket_staff (
                users (first_name, last_name)
            )
        `)
        .order('updated_at', { ascending: false });

    if (userId) {
        // If userId is provided, we need to filter dockets where this user is assigned.
        // We use !inner to ensure we only get dockets that have a matching staff record.
        // Note: This filters the returned docket_staff array to ONLY contain this user.
        // If we want to show ALL staff for these dockets, we would need a more complex query (e.g. aliases),
        // but for now, showing just the assigned officer (the current user) in the "Assigned To" column
        // for their own dashboard is acceptable, or we can assume the "Assigned To" logic handles it.
        // Actually, let's try to use an alias if possible, but Supabase simple client might be tricky with aliases in the same query builder chain if not careful.
        // Let's stick to the simple filter first. If the user complains about "Assigned To" only showing themselves, we can improve.
        // However, the current query selects `docket_staff`. If we add a filter on `docket_staff.user_id`, it implicitly adds !inner logic if we are not careful, or we explicitly ask for it.

        // To properly filter dockets BY user but return ALL staff, we need:
        // .select('..., all_staff:docket_staff(...), my_staff:docket_staff!inner(user_id)')
        // .eq('my_staff.user_id', userId)

        query = supabase
            .from('dockets')
            .select(`
                id,
                docket_number,
                deadline,
                updated_at,
                status,
                type_of_request_id,
                request_types!type_of_request_id (name),
                docket_staff (
                    users (first_name, last_name)
                ),
                filter_staff:docket_staff!inner(user_id)
            `)
            .eq('filter_staff.user_id', userId)
            .order('updated_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching dockets:', error);
        return [];
    }

    if (!data) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.map((docket: any) => {
        // Parse deadline manually to ensure it's treated as local time 00:00:00
        // new Date("YYYY-MM-DD") parses as UTC, which can be previous day in local time
        const deadlineParts = docket.deadline.split('-');
        const deadlineDate = new Date(
            parseInt(deadlineParts[0]),
            parseInt(deadlineParts[1]) - 1,
            parseInt(deadlineParts[2])
        );
        let status = docket.status;

        // If status is PENDING (or null/undefined which we treat as pending for safety), compute it
        if (!status || status === 'PENDING') {
            status = computeStatus(deadlineDate);
        } else if (status === 'FOR REVIEW') {
            status = 'For Review';
        } else {
            // Convert COMPLETED, TERMINATED, VOID to Title Case for display
            status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        }

        const daysTillDeadline = getDaysDifference(today, deadlineDate);

        // Format assigned staff
        let assignedTo = 'Unassigned';
        if (docket.docket_staff && docket.docket_staff.length > 0) {
            const staffNames = docket.docket_staff.map((ds: any) =>
                `${ds.users.first_name} ${ds.users.last_name}`
            );
            if (staffNames.length === 1) {
                assignedTo = staffNames[0];
            } else {
                assignedTo = `${staffNames[0]} +${staffNames.length - 1} more`;
            }
        }

        return {
            id: docket.id,
            docketNumber: docket.docket_number,
            typeOfRequest: docket.request_types?.name || 'Unknown',
            status,
            assignedTo,
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

/**
 * Fetch full docket details by ID
 */
export async function getDocketDetails(id: string) {
    const supabase = createClient();

    // 1. Fetch main docket details
    const { data: docket, error: docketError } = await supabase
        .from('dockets')
        .select(`
            *,
            request_types!type_of_request_id (id, name),
            docket_staff (
                user_id,
                users (id, email, first_name, last_name)
            )
        `)
        .eq('id', id)
        .single();

    if (docketError || !docket) {
        console.error('Error fetching docket details:', docketError);
        return null;
    }

    // 2. Fetch rights
    const { data: rights, error: rightsError } = await supabase
        .from('docket_rights')
        .select('right_name')
        .eq('docket_id', id);

    if (rightsError) {
        console.error('Error fetching rights:', rightsError);
        return null;
    }

    // 3. Fetch parties (victims and respondents) with their sectors
    const { data: parties, error: partiesError } = await supabase
        .from('docket_parties')
        .select(`
            id,
            name,
            party_type,
            docket_party_sectors (
                sectors (name)
            )
        `)
        .eq('docket_id', id);

    if (partiesError) {
        console.error('Error fetching parties:', partiesError);
        return null;
    }

    // Process parties into victims and respondents
    const victims = parties
        .filter((p: any) => p.party_type === 'VICTIM')
        .map((p: any) => ({
            name: p.name,
            sectors: p.docket_party_sectors.map((s: any) => s.sectors.name)
        }));

    const respondents = parties
        .filter((p: any) => p.party_type === 'RESPONDENT')
        .map((p: any) => ({
            name: p.name,
            sectors: p.docket_party_sectors.map((s: any) => s.sectors.name)
        }));

    // Process staff
    const staff = docket.docket_staff.map((ds: any) => ({
        userId: ds.users.id,
        email: ds.users.email
    }));

    return {
        docketNumber: docket.docket_number,
        dateReceived: new Date(docket.date_received).toLocaleDateString('en-US'),
        deadline: new Date(docket.deadline).toLocaleDateString('en-US'),
        typeOfRequestId: docket.type_of_request_id,
        violationCategory: docket.violation_category,
        modeOfRequestId: docket.mode_of_request_id,
        rightsViolated: rights.map((r: any) => r.right_name),
        victims,
        respondents,
        staff: staff.length > 0 ? staff : [{ userId: '', email: '' }],
        status: docket.status || 'PENDING'
    };
}
