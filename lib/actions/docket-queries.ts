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
    dateReceived: string;
    // New search fields
    violationCategories: string[];
    requestMode: string;
    rights: string[];
    complainants: string[];
    parties: string[];
    sectors: string[];
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
            date_received,
            deadline,
            updated_at,
            status,
            docket_violation_categories (category_name),
            type_of_request_id,
            request_types!type_of_request_id (name),
            mode_of_request_id,
            request_modes!mode_of_request_id (name),
            docket_staff (
                users (first_name, last_name)
            ),
            docket_rights (right_name),
            docket_complainants (name),
            docket_parties (
                name,
                docket_party_sectors (
                    sectors (name)
                )
            )
        `)
        .order('updated_at', { ascending: false });

    if (userId) {
        // If userId is provided, we need to filter dockets where this user is assigned.
        // We use !inner to ensure we only get dockets that have a matching staff record.
        query = supabase
            .from('dockets')
            .select(`
                id,
                docket_number,
                date_received,
                deadline,
                updated_at,
                status,
                docket_violation_categories (category_name),
                type_of_request_id,
                request_types!type_of_request_id (name),
                mode_of_request_id,
                request_modes!mode_of_request_id (name),
                docket_staff (
                    users (first_name, last_name)
                ),
                docket_rights (right_name),
                docket_complainants (name),
                docket_parties (
                    name,
                    docket_party_sectors (
                        sectors (name)
                    )
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

        // Searchable fields extraction
        const rights = docket.docket_rights?.map((r: any) => r.right_name) || [];
        const complainants = docket.docket_complainants?.map((c: any) => c.name) || [];

        // Extract parties and Flatten sectors
        const parties: string[] = [];
        const sectorsSet = new Set<string>();

        if (docket.docket_parties) {
            docket.docket_parties.forEach((p: any) => {
                parties.push(p.name);
                if (p.docket_party_sectors) {
                    p.docket_party_sectors.forEach((s: any) => {
                        if (s.sectors?.name) sectorsSet.add(s.sectors.name);
                    });
                }
            });
        }
        const sectors = Array.from(sectorsSet);

        return {
            id: docket.id,
            docketNumber: docket.docket_number,
            typeOfRequest: docket.request_types?.name || 'Unknown',
            status,
            assignedTo,
            daysTillDeadline,
            lastUpdated: new Date(docket.updated_at).toLocaleDateString('en-US'),
            deadline: deadlineDate,
            dateReceived: docket.date_received,
            // New fields
            violationCategories: docket.docket_violation_categories?.map((c: any) => c.category_name) || [],
            requestMode: docket.request_modes?.name || '',
            rights,
            complainants,
            parties,
            sectors
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

    // 3. Fetch violation categories from junction table
    const { data: categories, error: categoriesError } = await supabase
        .from('docket_violation_categories')
        .select('category_name')
        .eq('docket_id', id);

    if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        // Don't fail completely, just use empty array
    }

    // 4. Fetch parties (victims and respondents) with their sectors
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

    // 5. Fetch complainants
    const { data: complainantsData, error: complainantsError } = await supabase
        .from('docket_complainants')
        .select('name, contact_number')
        .eq('docket_id', id);

    if (complainantsError) {
        console.error('Error fetching complainants:', complainantsError);
        return null;
    }

    // Process complainants
    const complainants = complainantsData.map((c: any) => ({
        name: c.name,
        contactNumber: c.contact_number
    }));

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

    // Process categories (now from junction table)
    const violationCategories = categories?.map((c: any) => c.category_name) || [];

    return {
        docketNumber: docket.docket_number,
        dateReceived: new Date(docket.date_received).toLocaleDateString('en-US'),
        deadline: new Date(docket.deadline).toLocaleDateString('en-US'),
        typeOfRequestId: docket.type_of_request_id,
        violationCategories, // Changed from violationCategory string to array
        modeOfRequestId: docket.mode_of_request_id,
        rightsViolated: rights.map((r: any) => r.right_name),
        victims,
        respondents,
        staff: staff.length > 0 ? staff : [{ userId: '', email: '' }],
        status: docket.status || 'PENDING',
        updatedAt: new Date(docket.updated_at).toLocaleDateString('en-US'),
        complainants: complainants.length > 0 ? complainants : [{ name: '', contactNumber: '' }]
    };
}

