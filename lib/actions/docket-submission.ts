'use server';

import { createClient } from '@/utils/supabase/server';
import { convertToDBFormat } from '@/lib/utils/date-helpers';
import { createNotificationsForNewCase } from './notification-actions';

export interface DocketSubmissionData {
    docketNumber: string;
    dateReceived: string;
    deadline: string;
    typeOfRequestId: number;
    violationCategories: string[]; // Changed from single string to array
    modeOfRequestId: number;
    rightsViolated: string[];
    victims: { name: string; sectorNames: string[] }[];
    respondents: { name: string; sectorNames: string[] }[];
    staffInChargeIds: string[];
    complainants: { name: string; contactNumber: string }[];
}

export interface SubmissionResult {
    success: boolean;
    message: string;
    docketId?: string;
}

/**
 * Get sector ID by name
 */
async function getSectorIdByName(supabase: any, sectorName: string): Promise<number | null> {
    const { data, error } = await supabase
        .from('sectors')
        .select('id')
        .eq('name', sectorName)
        .single();

    if (error || !data) {
        console.error(`Sector not found: ${sectorName}`, error);
        return null;
    }

    return data.id;
}

/**
 * Submit a new docket with all related data
 */
export async function submitDocket(
    data: DocketSubmissionData,
    createdByUserId: string // This is the Auth ID, but we need the public.users ID
): Promise<SubmissionResult> {
    const supabase = createClient();

    try {
        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user || !user.email) {
            console.error('User authentication failed:', authError);
            return {
                success: false,
                message: 'User authentication failed'
            };
        }

        // --- DEFENSIVE CODING & DEBUGGING ---
        console.log('Received Docket Submission Data:', JSON.stringify(data, null, 2));

        // Ensure arrays are arrays to prevent "is not iterable" errors
        data.complainants = Array.isArray(data.complainants) ? data.complainants : [];
        data.victims = Array.isArray(data.victims) ? data.victims : [];
        data.respondents = Array.isArray(data.respondents) ? data.respondents : [];
        data.staffInChargeIds = Array.isArray(data.staffInChargeIds) ? data.staffInChargeIds : [];
        data.rightsViolated = Array.isArray(data.rightsViolated) ? data.rightsViolated : [];
        // ------------------------------------

        // Fetch the corresponding user ID from the public.users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

        if (userError || !userData) {
            console.error('User record not found in public.users:', userError);
            return {
                success: false,
                message: 'User profile not found. Please contact administrator.'
            };
        }

        const publicUserId = userData.id;

        // Convert dates to database format
        const dateReceivedDB = convertToDBFormat(data.dateReceived);
        const deadlineDB = convertToDBFormat(data.deadline);

        if (!dateReceivedDB || !deadlineDB) {
            return {
                success: false,
                message: 'Invalid date format'
            };
        }

        if (data.staffInChargeIds.length === 0) {
            return {
                success: false,
                message: 'At least one Staff in Charge is required'
            };
        }

        // --- VALIDATION: Motu Proprio Rule ---
        const { data: motuProprioMode } = await supabase
            .from('request_modes')
            .select('id')
            .eq('name', 'Motu Proprio')
            .single();

        const hasComplainants = data.complainants.some(c => c.name.trim() !== '');

        if (motuProprioMode && data.modeOfRequestId === motuProprioMode.id) {
            if (hasComplainants) {
                return {
                    success: false,
                    message: 'Motu Proprio dockets cannot have complainants.'
                };
            }
        }
        // -------------------------------------

        // 1. Insert into dockets table AND rights via RPC
        const { data: docketId, error: rpcError } = await supabase.rpc('create_docket_with_rights', {
            p_docket_number: data.docketNumber,
            p_date_received: dateReceivedDB,
            p_deadline: deadlineDB,
            p_type_of_request_id: data.typeOfRequestId,
            p_mode_of_request_id: data.modeOfRequestId,
            p_violation_category: '', // Legacy param, now using junction table
            p_created_by_user_id: publicUserId,
            p_rights: data.rightsViolated,
            p_categories: data.violationCategories // NEW: array of categories
        });

        if (rpcError) {
            console.error('Error creating docket (RPC):', rpcError);
            if (rpcError.code === '23505') {
                return { success: false, message: 'Docket number already exists' };
            }
            return { success: false, message: `Database error: ${rpcError.message}` };
        }

        if (!docketId) {
            return { success: false, message: 'Failed to retrieve new docket ID from RPC' };
        }

        // 2. Insert victims into docket_parties
        for (const victim of data.victims) {
            if (victim.name.trim() === '') continue;

            const sectorIds: number[] = [];
            if (victim.sectorNames.length > 0) {
                for (const sectorName of victim.sectorNames) {
                    const sectorId = await getSectorIdByName(supabase, sectorName);
                    if (sectorId) {
                        sectorIds.push(sectorId);
                    }
                }
            }

            const { error: rpcErrorVictim } = await supabase.rpc('insert_party_with_sectors', {
                p_docket_id: docketId,
                p_name: victim.name,
                p_party_type: 'VICTIM',
                p_sector_ids: sectorIds
            });

            if (rpcErrorVictim) {
                console.error('Error inserting victim (RPC):', rpcErrorVictim);
                await supabase.from('dockets').delete().eq('id', docketId);
                return {
                    success: false,
                    message: 'Error saving victim information: ' + rpcErrorVictim.message
                };
            }
        }

        // 3. Insert respondents into docket_parties
        for (const respondent of data.respondents) {
            if (respondent.name.trim() === '') continue;

            const sectorIds: number[] = [];
            if (respondent.sectorNames.length > 0) {
                for (const sectorName of respondent.sectorNames) {
                    const sectorId = await getSectorIdByName(supabase, sectorName);
                    if (sectorId) {
                        sectorIds.push(sectorId);
                    }
                }
            }

            const { error: rpcErrorRespondent } = await supabase.rpc('insert_party_with_sectors', {
                p_docket_id: docketId,
                p_name: respondent.name,
                p_party_type: 'RESPONDENT',
                p_sector_ids: sectorIds
            });

            if (rpcErrorRespondent) {
                console.error('Error inserting respondent (RPC):', rpcErrorRespondent);
                await supabase.from('dockets').delete().eq('id', docketId);
                return {
                    success: false,
                    message: 'Error saving respondent information: ' + rpcErrorRespondent.message
                };
            }
        }

        // 4. Insert staff into docket_staff
        if (data.staffInChargeIds.length > 0) {
            const staffToInsert = data.staffInChargeIds.map(userId => ({
                docket_id: docketId,
                user_id: userId
            }));

            const { error: staffError } = await supabase
                .from('docket_staff')
                .insert(staffToInsert);

            if (staffError) {
                console.error('Error inserting docket staff:', staffError);
                await supabase.from('dockets').delete().eq('id', docketId);
                return {
                    success: false,
                    message: 'Error saving staff assignment'
                };
            }
        }

        // 5. Insert complainants into docket_complainants
        console.log('Processing complainants:', data.complainants);
        for (const complainant of data.complainants) {
            if (complainant.name.trim() === '') continue;

            console.log(`Inserting complainant: ${complainant.name}`);
            const { error: complainantError } = await supabase
                .from('docket_complainants')
                .insert({
                    docket_id: docketId,
                    name: complainant.name,
                    contact_number: complainant.contactNumber
                });

            if (complainantError) {
                console.error('Error inserting complainant:', complainantError);
                // Best practice: Fail strict or Warn. Let's fail strict for consistency.
                await supabase.from('dockets').delete().eq('id', docketId);
                return {
                    success: false,
                    message: 'Error saving complainant information'
                };
            }
        }

        // 6. Create notifications for all relevant users
        await createNotificationsForNewCase(
            docketId,
            data.docketNumber,
            data.staffInChargeIds,
            deadlineDB
        );

        return {
            success: true,
            message: 'Docket submitted successfully',
            docketId
        };

    } catch (error) {
        console.error('Unexpected error during docket submission:', error);
        return {
            success: false,
            // @ts-ignore
            message: 'An unexpected error occurred: ' + (error.message || error)
        };
    }
}
