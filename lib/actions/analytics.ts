'use server';

export interface CaseTypeBreakdown {
    type: string;
    count: number;
    //   percentage: number;
    color: string;
}



import { createClient } from '@/utils/supabase/server';

export async function getCaseTypeBreakdown(officerId?: string): Promise<CaseTypeBreakdown[]> {
    const supabase = await createClient();

    // Start building the query - exclude completed cases
    let query = supabase
        .from('dockets')
        .select(`
            id,
            request_types (
                name
            )${officerId ? ', docket_staff!inner(user_id)' : ''}
        `)
        .neq('status', 'COMPLETED');

    // Apply officer filter if provided
    if (officerId) {
        query = query.eq('docket_staff.user_id', officerId);
    }

    // Execute query
    const { data: dockets, error } = await query;

    if (error) {
        console.error('Error fetching case type breakdown:', error);
        return [];
    }

    // Initialize counts
    const counts: Record<string, number> = {
        'Legal Assistance / OPS': 0,
        'Investigation': 0
    };

    // Process dockets
    dockets.forEach((docket: any) => {
        const typeName = docket.request_types?.name;
        if (typeName === 'Legal Assistance / OPS') {
            counts['Legal Assistance / OPS']++;
        } else if (typeName === 'Legal Investigation') {
            counts['Investigation']++;
        }
    });

    // Color mapping
    const colorMap: Record<string, string> = {
        'Legal Assistance / OPS': '#3B82F6', // Mid Blue
        'Investigation': '#172554',          // Darkest Blue
    };

    const breakdown: CaseTypeBreakdown[] = Object.entries(counts).map(([type, count]) => ({
        type,
        count,
        color: colorMap[type] || '#012453'
    }));

    return breakdown;
}

export interface CaseAgeingOverview {
    range: string;
    count: number;
    color: string;
}

export async function getCaseAgeingOverview(officerId?: string): Promise<CaseAgeingOverview[]> {
    const supabase = await createClient();

    // Start building the query - include PENDING and FOR REVIEW (exclude only COMPLETED)
    let query = supabase
        .from('dockets')
        .select(`
            date_received
            ${officerId ? ', docket_staff!inner(user_id)' : ''}
        `)
        .in('status', ['PENDING', 'FOR REVIEW']);

    // Apply officer filter if provided
    if (officerId) {
        query = query.eq('docket_staff.user_id', officerId);
    }

    // Execute query
    const { data: dockets, error } = await query;

    if (error) {
        console.error('Error fetching case ageing overview:', error);
        return [];
    }

    // Initialize counts
    const ageingCounts: Record<string, number> = {
        '0 - 30 days': 0,
        '31 - 60 days': 0,
        '61 - 90 days': 0,
        '91 - 120 days': 0,
        '121 days and above': 0,
    };

    const now = new Date();

    // Process dockets
    dockets.forEach((docket: any) => {
        // Use date_received for accurate case ageing (not created_at)
        const dateReceived = new Date(docket.date_received);

        // Handle invalid dates just in case
        if (isNaN(dateReceived.getTime())) return;

        const diffTime = Math.abs(now.getTime() - dateReceived.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
            ageingCounts['0 - 30 days']++;
        } else if (diffDays <= 60) {
            ageingCounts['31 - 60 days']++;
        } else if (diffDays <= 90) {
            ageingCounts['61 - 90 days']++;
        } else if (diffDays <= 120) {
            ageingCounts['91 - 120 days']++;
        } else {
            ageingCounts['121 days and above']++;
        }
    });

    // Color mapping for different age ranges (Blue-Green Gradient)
    const colorMap: Record<string, string> = {
        '0 - 30 days': '#86EFAC',        // Light Green
        '31 - 60 days': '#34D399',       // Medium Green
        '61 - 90 days': '#2DD4BF',       // Teal
        '91 - 120 days': '#3B82F6',      // Blue
        '121 days and above': '#1E3A8A', // Dark Blue
    };

    const breakdown: CaseAgeingOverview[] = Object.entries(ageingCounts).map(([range, count]) => ({
        range,
        count,
        color: colorMap[range]
    }));

    return breakdown;
}
