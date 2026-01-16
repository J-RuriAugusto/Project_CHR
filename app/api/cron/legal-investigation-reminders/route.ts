import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
    createLegalInvestigationReminders,
    getLegalInvestigationReminderDays
} from '@/lib/actions/notification-actions';

// Vercel Cron Job - runs daily to check for Legal Investigation cases needing reminders
// Configured in vercel.json

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for processing

/**
 * Calculate days since docketing (counting starts the day AFTER date_received)
 */
function getDaysSinceDocketing(dateReceived: string): number {
    const received = new Date(dateReceived);
    received.setHours(0, 0, 0, 0);

    // Add 1 day to start counting from day after docketing
    const startDate = new Date(received);
    startDate.setDate(startDate.getDate() + 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because day 1 is the first day

    return diffDays;
}

export async function GET(request: NextRequest) {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, validate it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.log('Unauthorized cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== LEGAL INVESTIGATION REMINDERS CRON JOB STARTED ===');
    console.log('Execution time:', new Date().toISOString());

    const supabase = createClient();
    const reminderDays = await getLegalInvestigationReminderDays(); // [45, 50, 55, 58, 60]

    try {
        // 1. Get the "Legal Investigation" request type ID
        const { data: legalInvestigationType, error: typeError } = await supabase
            .from('request_types')
            .select('id')
            .eq('name', 'Legal Investigation')
            .single();

        if (typeError || !legalInvestigationType) {
            console.error('Error fetching Legal Investigation type:', typeError);
            return NextResponse.json({
                error: 'Legal Investigation type not found'
            }, { status: 500 });
        }

        const typeId = legalInvestigationType.id;
        console.log('Legal Investigation type ID:', typeId);

        // 2. Fetch all PENDING Legal Investigation dockets
        const { data: dockets, error: docketsError } = await supabase
            .from('dockets')
            .select(`
                id,
                docket_number,
                date_received,
                docket_staff (
                    user_id
                )
            `)
            .eq('type_of_request_id', typeId)
            .eq('status', 'PENDING');

        if (docketsError) {
            console.error('Error fetching dockets:', docketsError);
            return NextResponse.json({
                error: 'Failed to fetch dockets'
            }, { status: 500 });
        }

        console.log(`Found ${dockets?.length || 0} pending Legal Investigation dockets`);

        const results: { docketNumber: string; daysSinceDocketing: number; result: string }[] = [];

        // 3. Process each docket
        for (const docket of dockets || []) {
            const daysSinceDocketing = getDaysSinceDocketing(docket.date_received);

            console.log(`Docket ${docket.docket_number}: ${daysSinceDocketing} days since docketing`);

            // Check if this docket needs a reminder today
            if (reminderDays.includes(daysSinceDocketing)) {
                const assignedOfficerIds = (docket.docket_staff || []).map((staff: any) => staff.user_id);

                console.log(`Sending day ${daysSinceDocketing} reminder for ${docket.docket_number}`);

                const result = await createLegalInvestigationReminders(
                    docket.id,
                    docket.docket_number,
                    daysSinceDocketing,
                    assignedOfficerIds
                );

                results.push({
                    docketNumber: docket.docket_number,
                    daysSinceDocketing,
                    result: result.success ? 'success' : (result.error || 'failed')
                });
            }
        }

        console.log('=== LEGAL INVESTIGATION REMINDERS CRON JOB COMPLETED ===');
        console.log(`Processed ${results.length} reminders`);

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
