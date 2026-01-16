import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
    createLegalInvestigationReminders,
    getLegalInvestigationReminderDays,
    createLegalAssistanceReminders,
    getLegalAssistanceReminderDays,
    createOverdueReminders
} from '@/lib/actions/notification-actions';

// Vercel Cron Job - runs daily to check for cases needing reminders
// Handles both Legal Investigation (60-day) and Legal Assistance / OPS (120-day) cases
// Configured in vercel.json

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for processing

/**
 * Calculate days since docketing (day 0 = docket date)
 */
function getDaysSinceDocketing(dateReceived: string): number {
    const received = new Date(dateReceived);
    received.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - received.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Calculate days past deadline
 */
function getDaysPastDeadline(deadline: string): number {
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - deadlineDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

export async function GET(request: NextRequest) {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.log('Unauthorized cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== CASE REMINDERS CRON JOB STARTED ===');
    console.log('Execution time:', new Date().toISOString());

    const supabase = createClient();

    // Get reminder days for both case types
    const legalInvestigationDays = await getLegalInvestigationReminderDays(); // [45, 50, 55, 58, 60]
    const legalAssistanceDays = await getLegalAssistanceReminderDays(); // [100, 110, 115, 118, 120]

    const results: { docketNumber: string; caseType: string; reminderType: string; days: number; result: string }[] = [];

    try {
        // ==========================================
        // PROCESS LEGAL INVESTIGATION CASES (60-day)
        // ==========================================

        const { data: legalInvestigationType } = await supabase
            .from('request_types')
            .select('id')
            .eq('name', 'Legal Investigation')
            .single();

        if (legalInvestigationType) {
            const { data: investigationDockets } = await supabase
                .from('dockets')
                .select(`
                    id,
                    docket_number,
                    date_received,
                    deadline,
                    docket_staff (user_id)
                `)
                .eq('type_of_request_id', legalInvestigationType.id)
                .eq('status', 'PENDING');

            console.log(`Found ${investigationDockets?.length || 0} pending Legal Investigation dockets`);

            for (const docket of investigationDockets || []) {
                const daysSinceDocketing = getDaysSinceDocketing(docket.date_received);
                const daysPastDeadline = getDaysPastDeadline(docket.deadline);
                const assignedOfficerIds = (docket.docket_staff || []).map((staff: any) => staff.user_id);

                // Pre-deadline reminders
                if (legalInvestigationDays.includes(daysSinceDocketing)) {
                    console.log(`[Legal Investigation] Day ${daysSinceDocketing} reminder for ${docket.docket_number}`);
                    const result = await createLegalInvestigationReminders(
                        docket.id, docket.docket_number, daysSinceDocketing, assignedOfficerIds, docket.deadline
                    );
                    results.push({
                        docketNumber: docket.docket_number,
                        caseType: 'Legal Investigation',
                        reminderType: 'pre-deadline',
                        days: daysSinceDocketing,
                        result: result.success ? 'success' : (result.error || 'failed')
                    });
                }

                // Overdue reminders (every 30 days past deadline)
                if (daysPastDeadline > 0 && daysPastDeadline % 30 === 0) {
                    console.log(`[Legal Investigation] ${daysPastDeadline}-day overdue reminder for ${docket.docket_number}`);
                    const result = await createOverdueReminders(
                        docket.id, docket.docket_number, daysPastDeadline, assignedOfficerIds
                    );
                    results.push({
                        docketNumber: docket.docket_number,
                        caseType: 'Legal Investigation',
                        reminderType: 'overdue',
                        days: daysPastDeadline,
                        result: result.success ? 'success' : (result.error || 'failed')
                    });
                }
            }
        }

        // ==========================================
        // PROCESS LEGAL ASSISTANCE / OPS CASES (120-day)
        // ==========================================

        const { data: legalAssistanceType } = await supabase
            .from('request_types')
            .select('id')
            .eq('name', 'Legal Assistance / OPS')
            .single();

        if (legalAssistanceType) {
            const { data: assistanceDockets } = await supabase
                .from('dockets')
                .select(`
                    id,
                    docket_number,
                    date_received,
                    deadline,
                    docket_staff (user_id)
                `)
                .eq('type_of_request_id', legalAssistanceType.id)
                .eq('status', 'PENDING');

            console.log(`Found ${assistanceDockets?.length || 0} pending Legal Assistance / OPS dockets`);

            for (const docket of assistanceDockets || []) {
                const daysSinceDocketing = getDaysSinceDocketing(docket.date_received);
                const daysPastDeadline = getDaysPastDeadline(docket.deadline);
                const assignedOfficerIds = (docket.docket_staff || []).map((staff: any) => staff.user_id);

                // Pre-deadline reminders
                if (legalAssistanceDays.includes(daysSinceDocketing)) {
                    console.log(`[Legal Assistance] Day ${daysSinceDocketing} reminder for ${docket.docket_number}`);
                    const result = await createLegalAssistanceReminders(
                        docket.id, docket.docket_number, daysSinceDocketing, assignedOfficerIds, docket.deadline
                    );
                    results.push({
                        docketNumber: docket.docket_number,
                        caseType: 'Legal Assistance / OPS',
                        reminderType: 'pre-deadline',
                        days: daysSinceDocketing,
                        result: result.success ? 'success' : (result.error || 'failed')
                    });
                }

                // Overdue reminders (every 30 days past deadline)
                if (daysPastDeadline > 0 && daysPastDeadline % 30 === 0) {
                    console.log(`[Legal Assistance] ${daysPastDeadline}-day overdue reminder for ${docket.docket_number}`);
                    const result = await createOverdueReminders(
                        docket.id, docket.docket_number, daysPastDeadline, assignedOfficerIds
                    );
                    results.push({
                        docketNumber: docket.docket_number,
                        caseType: 'Legal Assistance / OPS',
                        reminderType: 'overdue',
                        days: daysPastDeadline,
                        result: result.success ? 'success' : (result.error || 'failed')
                    });
                }
            }
        }

        console.log('=== CASE REMINDERS CRON JOB COMPLETED ===');
        console.log(`Total reminders processed: ${results.length}`);

        return NextResponse.json({
            success: true,
            message: `Cron job completed. Processed ${results.length} reminders.`,
            details: results
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

