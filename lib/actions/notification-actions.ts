'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// ==========================================
// TYPES
// ==========================================

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    is_read: boolean;
    notification_type: 'new_case' | 'assigned' | 'deadline' | 'overdue' | 'complete' | 'deleted';
    docket_id: string | null;
    created_at: string;
    docket?: {
        docket_number: string;
    };
}

export interface NotificationResult {
    success: boolean;
    message?: string;
    error?: string;
}

// ==========================================
// CREATE NOTIFICATIONS FOR NEW CASE
// ==========================================

/**
 * Creates notifications for all relevant users when a new case is docketed.
 * - Non-admin/non-officer roles get "New case created" notification
 * - Assigned officers get "Assigned to you" notification + pending email
 */
export async function createNotificationsForNewCase(
    docketId: string,
    docketNumber: string,
    assignedOfficerIds: string[],
    deadlineDate: string
): Promise<NotificationResult> {
    const supabase = createClient();

    console.log('=== CREATING NOTIFICATIONS ===');
    console.log('Docket ID:', docketId);
    console.log('Docket Number:', docketNumber);
    console.log('Assigned Officers:', assignedOfficerIds);
    console.log('Deadline:', deadlineDate);

    try {
        // Calculate days until deadline
        const deadline = new Date(deadlineDate);
        const today = new Date();
        const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // 1. Get all users with these roles who should see the "new case created" notification
        //    Including records_officer so they can see confirmation of their own submissions
        const targetRoles = ['regional_director', 'investigation_chief', 'legal_chief', 'records_officer'];

        const { data: targetUsers, error: usersError } = await supabase
            .from('users')
            .select('id, role')
            .in('role', targetRoles)
            .eq('status', 'ACTIVE');

        if (usersError) {
            console.error('Error fetching target users:', usersError);
            return { success: false, error: usersError.message };
        }

        // 2. Create notifications for non-officer roles
        const generalNotifications = (targetUsers || []).map(user => ({
            user_id: user.id,
            title: 'New Case Docketed',
            message: `New case with docket ${docketNumber} has been created.`,
            notification_type: 'new_case',
            docket_id: docketId,
            is_read: false
        }));

        if (generalNotifications.length > 0) {
            const { error: insertError } = await supabase
                .from('notifications')
                .insert(generalNotifications);

            if (insertError) {
                console.error('Error creating general notifications:', insertError);
                // Continue anyway - don't fail the whole operation
            }
        }

        // 3. Create notifications for assigned officers
        const assignedNotifications = assignedOfficerIds.map(officerId => ({
            user_id: officerId,
            title: 'New Case Assigned',
            message: `New case with docket ${docketNumber} has been assigned to you.`,
            notification_type: 'assigned',
            docket_id: docketId,
            is_read: false
        }));

        if (assignedNotifications.length > 0) {
            const { error: assignedError } = await supabase
                .from('notifications')
                .insert(assignedNotifications);

            if (assignedError) {
                console.error('Error creating assigned notifications:', assignedError);
            }
        }

        // 4. Create pending emails for assigned officers
        const pendingEmails = assignedOfficerIds.map(officerId => ({
            user_id: officerId,
            docket_id: docketId,
            email_type: 'case_assignment',
            subject: `New Case Assignment: ${docketNumber}`,
            body: `The case with docket ${docketNumber} has been taken cognizance by this Regional Office for Investigation. You have ${daysUntilDeadline} days to complete this investigation.`,
            status: 'PENDING'
        }));

        if (pendingEmails.length > 0) {
            const { error: emailError } = await supabase
                .from('pending_emails')
                .insert(pendingEmails);

            if (emailError) {
                console.error('Error creating pending emails:', emailError);
            }
        }

        return { success: true, message: 'Notifications created successfully' };

    } catch (error) {
        console.error('Unexpected error creating notifications:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// ==========================================
// CREATE NOTIFICATIONS FOR DELETED CASE
// ==========================================

/**
 * Creates notifications for all relevant users when a case is deleted.
 * - Leadership roles get "Case deleted" notification
 * - Previously assigned officers get "Case deleted" notification + pending email
 */
export async function createNotificationsForDeletedCase(
    docketNumber: string,
    assignedOfficerIds: string[]
): Promise<NotificationResult> {
    const supabase = createClient();

    console.log('=== CREATING DELETION NOTIFICATIONS ===');
    console.log('Docket Number:', docketNumber);
    console.log('Assigned Officers:', assignedOfficerIds);

    try {
        // 1. Get all users with leadership roles who should see the "case deleted" notification
        const targetRoles = ['regional_director', 'investigation_chief', 'legal_chief', 'records_officer'];

        // Removed .eq('status', 'ACTIVE') to ensure we get users even if status column/value differs
        const { data: targetUsers, error: usersError } = await supabase
            .from('users')
            .select('id, role')
            .in('role', targetRoles);

        if (usersError) {
            console.error('Error fetching target users:', usersError);
            return { success: false, error: usersError.message };
        }

        // 2. Create notifications for leadership roles (docket_id is null since it's deleted)
        const generalNotifications = (targetUsers || []).map(user => ({
            user_id: user.id,
            title: 'Case Deleted',
            message: `The docket with case number ${docketNumber} has been deleted.`,
            notification_type: 'deleted',
            docket_id: null,
            is_read: false
        }));

        console.log('General deletion notifications to create:', generalNotifications.length);

        if (generalNotifications.length > 0) {
            const { error: insertError } = await supabase
                .from('notifications')
                .insert(generalNotifications);

            if (insertError) {
                console.error('Error creating general deletion notifications:', insertError);
            }
        }

        // 3. Create notifications for previously assigned officers
        const assignedNotifications = assignedOfficerIds.map(officerId => ({
            user_id: officerId,
            title: 'Case Deleted',
            message: `The docket with case number ${docketNumber} that was assigned to you has been deleted.`,
            notification_type: 'deleted',
            docket_id: null,
            is_read: false
        }));

        console.log('Assigned officer deletion notifications to create:', assignedNotifications.length);

        if (assignedNotifications.length > 0) {
            const { error: assignedError } = await supabase
                .from('notifications')
                .insert(assignedNotifications);

            if (assignedError) {
                console.error('Error creating assigned deletion notifications:', assignedError);
            }
        }

        // 4. Create pending emails for previously assigned officers
        const pendingEmails = assignedOfficerIds.map(officerId => ({
            user_id: officerId,
            docket_id: null,
            email_type: 'case_deleted',
            subject: `Case Deleted: ${docketNumber}`,
            body: `The case with docket ${docketNumber} that was assigned to you has been deleted from the system. You are no longer required to work on this case.`,
            status: 'PENDING'
        }));

        if (pendingEmails.length > 0) {
            const { error: emailError } = await supabase
                .from('pending_emails')
                .insert(pendingEmails);

            if (emailError) {
                console.error('Error creating pending deletion emails:', emailError);
            }
        }

        console.log('=== DELETION NOTIFICATIONS CREATED SUCCESSFULLY ===');
        return { success: true, message: 'Deletion notifications created successfully' };

    } catch (error) {
        console.error('Unexpected error creating deletion notifications:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// ==========================================
// GET NOTIFICATIONS FOR USER
// ==========================================

/**
 * Fetches notifications for the current authenticated user
 */
export async function getNotificationsForUser(): Promise<{
    notifications: Notification[];
    unreadCount: number;
    error?: string;
}> {
    const supabase = createClient();

    try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user?.email) {
            return { notifications: [], unreadCount: 0, error: 'Not authenticated' };
        }

        // Get the public user ID from email
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

        if (userError || !userData) {
            return { notifications: [], unreadCount: 0, error: 'User not found' };
        }

        // Fetch notifications with docket info
        const { data: notifications, error: notifError } = await supabase
            .from('notifications')
            .select(`
                id,
                user_id,
                title,
                message,
                is_read,
                notification_type,
                docket_id,
                created_at,
                dockets (
                    docket_number
                )
            `)
            .eq('user_id', userData.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (notifError) {
            console.error('Error fetching notifications:', notifError);
            return { notifications: [], unreadCount: 0, error: notifError.message };
        }

        // Transform the data
        const transformedNotifications: Notification[] = (notifications || []).map(n => ({
            id: n.id,
            user_id: n.user_id,
            title: n.title,
            message: n.message,
            is_read: n.is_read,
            notification_type: n.notification_type,
            docket_id: n.docket_id,
            created_at: n.created_at,
            docket: n.dockets ? { docket_number: (n.dockets as any).docket_number } : undefined
        }));

        const unreadCount = transformedNotifications.filter(n => !n.is_read).length;

        return { notifications: transformedNotifications, unreadCount };

    } catch (error) {
        console.error('Unexpected error fetching notifications:', error);
        return {
            notifications: [],
            unreadCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================

/**
 * Marks a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<NotificationResult> {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard');
        return { success: true };

    } catch (error) {
        console.error('Unexpected error marking notification as read:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================

/**
 * Marks all notifications as read for the current user
 */
export async function markAllNotificationsAsRead(): Promise<NotificationResult> {
    const supabase = createClient();

    try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user?.email) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get the public user ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

        if (userError || !userData) {
            return { success: false, error: 'User not found' };
        }

        // Update all unread notifications for this user
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userData.id)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard');
        return { success: true };

    } catch (error) {
        console.error('Unexpected error marking all notifications as read:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
