'use server';

import { createClient } from '@/utils/supabase/server';

export interface DashboardStats {
    activeCases: { count: number; thisMonth: number };
    overdueCases: { count: number; thisMonth: number };
    pendingReview: { count: number; thisMonth: number };
    completedCases: { count: number; thisMonth: number };
}

export async function getDashboardStats(userId?: string): Promise<DashboardStats> {
    const supabase = createClient();
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    // Base query for dockets
    let query = supabase.from('dockets').select(`
    id,
    status,
    deadline,
    created_at,
    updated_at,
    docket_staff!inner (user_id)
  `);

    // If userId is provided, filter by assigned staff
    if (userId) {
        query = query.eq('docket_staff.user_id', userId);
    }

    const { data: dockets, error } = await query;

    if (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            activeCases: { count: 0, thisMonth: 0 },
            overdueCases: { count: 0, thisMonth: 0 },
            pendingReview: { count: 0, thisMonth: 0 },
            completedCases: { count: 0, thisMonth: 0 },
        };
    }

    const stats: DashboardStats = {
        activeCases: { count: 0, thisMonth: 0 },
        overdueCases: { count: 0, thisMonth: 0 },
        pendingReview: { count: 0, thisMonth: 0 },
        completedCases: { count: 0, thisMonth: 0 },
    };

    dockets.forEach((docket: any) => {
        const deadline = new Date(docket.deadline);
        const createdAt = new Date(docket.created_at);
        const updatedAt = new Date(docket.updated_at);
        const isThisMonthCreated = createdAt >= new Date(firstDayOfMonth);
        const isThisMonthUpdated = updatedAt >= new Date(firstDayOfMonth);
        const isDeadlineThisMonth = deadline >= new Date(firstDayOfMonth) && deadline <= new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Active Cases: Status is PENDING (and not overdue)
        // Note: The requirement says "Total Active Cases", usually implies all open cases.
        // But "Overdue" is often a subset or separate.
        // Based on UI, "Active" likely means everything not completed/terminated/void.
        // Let's assume Active = PENDING + FOR REVIEW (basically open).
        // However, "Overdue" is a separate card.
        // Let's strictly follow the status.

        const isOverdue = (docket.status === 'PENDING' || !docket.status) && deadline < today;

        if (docket.status === 'COMPLETED') {
            stats.completedCases.count++;
            if (isThisMonthUpdated) stats.completedCases.thisMonth++;
        } else if (docket.status === 'FOR REVIEW') {
            stats.pendingReview.count++;
            if (isThisMonthUpdated) stats.pendingReview.thisMonth++;
        } else if (isOverdue) {
            stats.overdueCases.count++;
            // For overdue, "this month" could mean deadline was this month
            if (isDeadlineThisMonth) stats.overdueCases.thisMonth++;
        } else if (docket.status === 'PENDING' || !docket.status) {
            // Active and NOT overdue
            stats.activeCases.count++;
            if (isThisMonthCreated) stats.activeCases.thisMonth++;
        }
    });

    // Adjust Active Count: Usually "Active" includes Overdue and For Review in a general sense,
    // but in this dashboard layout, they are mutually exclusive buckets.
    // So "Active" here effectively means "On Track" or "Pending".

    return stats;
}

export async function getUrgentCases(userId?: string) {
    const supabase = createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate start and end of "This Week" (Monday to Sunday)
    const currentDay = today.getDay(); // 0 is Sunday
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() + diffToMonday);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

    // Calculate start and end of "Last Week"
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

    // Base query
    let query = supabase
        .from('dockets')
        .select(`
            id,
            docket_number,
            deadline,
            status,
            request_types (name),
            docket_staff!inner (user_id)
        `)
        .in('status', ['PENDING', 'FOR REVIEW']);

    // Filter by user if provided
    if (userId) {
        query = query.eq('docket_staff.user_id', userId);
    }

    const { data: dockets, error } = await query;

    if (error) {
        console.error('Error fetching urgent cases:', error);
        return { dueThisWeek: [], dueLastWeek: [] };
    }

    const dueThisWeek: any[] = [];
    const dueLastWeek: any[] = [];

    dockets?.forEach((docket: any) => {
        const deadline = new Date(docket.deadline);
        // Normalize deadline to compare dates properly
        deadline.setHours(0, 0, 0, 0);

        if (deadline >= thisWeekStart && deadline <= thisWeekEnd) {
            dueThisWeek.push(docket);
        } else if (deadline >= lastWeekStart && deadline <= lastWeekEnd) {
            dueLastWeek.push(docket);
        }
    });

    // Sort by deadline (asc)
    dueThisWeek.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    dueLastWeek.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    return { dueThisWeek, dueLastWeek };
}
