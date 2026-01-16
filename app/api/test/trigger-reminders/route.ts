import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createLegalInvestigationReminders } from '@/lib/actions/notification-actions';

// Test endpoint to manually trigger reminders for a specific docket
// Usage: POST /api/test/trigger-reminders
// Body: { "docketNumber": "CHR-2024-001", "daysSinceDocketing": 45 }

export async function POST(request: NextRequest) {
    // Only allow in development or for admin users
    const supabase = createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .single();

    if (userError || !userData || userData.role !== 'admin') {
        return NextResponse.json({
            error: 'Only admins can trigger test reminders'
        }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { docketNumber, daysSinceDocketing } = body;

        if (!docketNumber || !daysSinceDocketing) {
            return NextResponse.json({
                error: 'Missing required fields: docketNumber, daysSinceDocketing'
            }, { status: 400 });
        }

        // Validate daysSinceDocketing is one of the valid reminder days
        const validDays = [45, 50, 55, 58, 60];
        if (!validDays.includes(daysSinceDocketing)) {
            return NextResponse.json({
                error: `daysSinceDocketing must be one of: ${validDays.join(', ')}`
            }, { status: 400 });
        }

        // Fetch the docket
        const { data: docket, error: docketError } = await supabase
            .from('dockets')
            .select(`
                id,
                docket_number,
                deadline,
                docket_staff (
                    user_id
                )
            `)
            .eq('docket_number', docketNumber)
            .single();

        if (docketError || !docket) {
            return NextResponse.json({
                error: `Docket not found: ${docketNumber}`
            }, { status: 404 });
        }

        const assignedOfficerIds = (docket.docket_staff || []).map((staff: any) => staff.user_id);

        console.log(`[TEST] Triggering day ${daysSinceDocketing} reminder for ${docketNumber}`);

        const result = await createLegalInvestigationReminders(
            docket.id,
            docket.docket_number,
            daysSinceDocketing,
            assignedOfficerIds,
            docket.deadline
        );

        return NextResponse.json({
            success: result.success,
            message: result.message || result.error,
            details: {
                docketNumber,
                daysSinceDocketing,
                assignedOfficerIds
            }
        });

    } catch (error) {
        console.error('Test trigger error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET endpoint to show usage instructions
export async function GET() {
    return NextResponse.json({
        usage: 'POST /api/test/trigger-reminders',
        body: {
            docketNumber: 'The docket number (e.g., "CHR-2024-001")',
            daysSinceDocketing: 'One of: 45, 50, 55, 58, 60'
        },
        example: {
            docketNumber: 'CHR-2024-001',
            daysSinceDocketing: 45
        },
        note: 'Only accessible by admin users'
    });
}
