'use server';

import { createClient } from '@/utils/supabase/server';
import { convertToDBFormat } from '@/lib/utils/date-helpers';

export interface DocketSubmissionData {
    docketNumber: string;
    dateReceived: string;
    deadline: string;
    typeOfRequestId: number;
    categoryId: number;
    modeOfRequestId: number;
    selectedRightIds: number[];
    victims: { name: string; sectorNames: string[] }[];
    respondents: { name: string; sectorNames: string[] }[];
    staffInChargeIds: string[];
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
        // Get the authenticated user to ensure security
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user || !user.email) {
            return {
                success: false,
                message: 'User authentication failed'
            };
        }

        // Fetch the corresponding user ID from the public.users table
        // The foreign key references public.users(id), which might differ from auth.users(id)
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

        // 1. Insert into dockets table
        const { data: docketData, error: docketError } = await supabase
            .from('dockets')
            .insert({
                docket_number: data.docketNumber,
                date_received: dateReceivedDB,
                deadline: deadlineDB,
                type_of_request_id: data.typeOfRequestId,
                category_id: data.categoryId,
                mode_of_request_id: data.modeOfRequestId,
                created_by_user_id: publicUserId, // Use the ID from public.users
                status: 'PENDING'
            })
            .select('id')
            .single();

        if (docketError) {
            console.error('Error inserting docket:', docketError);

            // Check for duplicate docket number
            if (docketError.code === '23505') {
                return {
                    success: false,
                    message: 'Docket number already exists'
                };
            }

            return {
                success: false,
                message: `Database error: ${docketError.message}`
            };
        }

        const docketId = docketData.id;

        // 2. Insert into docket_rights junction table
        if (data.selectedRightIds.length > 0) {
            const rightsToInsert = data.selectedRightIds.map(rightId => ({
                docket_id: docketId,
                right_id: rightId
            }));

            const { error: rightsError } = await supabase
                .from('docket_rights')
                .insert(rightsToInsert);

            if (rightsError) {
                console.error('Error inserting docket rights:', rightsError);
                // Rollback: delete the docket
                await supabase.from('dockets').delete().eq('id', docketId);
                return {
                    success: false,
                    message: 'Error saving rights violated'
                };
            }
        }

        // 3. Insert victims into docket_parties
        for (const victim of data.victims) {
            if (victim.name.trim() === '') continue;

            const { data: partyData, error: partyError } = await supabase
                .from('docket_parties')
                .insert({
                    docket_id: docketId,
                    name: victim.name,
                    party_type: 'VICTIM'
                })
                .select('id')
                .single();

            if (partyError) {
                console.error('Error inserting victim:', partyError);
                await supabase.from('dockets').delete().eq('id', docketId);
                return {
                    success: false,
                    message: 'Error saving victim information'
                };
            }

            // Insert victim sectors
            if (victim.sectorNames.length > 0) {
                const sectorIds: number[] = [];

                for (const sectorName of victim.sectorNames) {
                    const sectorId = await getSectorIdByName(supabase, sectorName);
                    if (sectorId) {
                        sectorIds.push(sectorId);
                    }
                }

                if (sectorIds.length > 0) {
                    const sectorsToInsert = sectorIds.map(sectorId => ({
                        party_id: partyData.id,
                        sector_id: sectorId
                    }));

                    const { error: sectorError } = await supabase
                        .from('docket_party_sectors')
                        .insert(sectorsToInsert);

                    if (sectorError) {
                        console.error('Error inserting victim sectors:', sectorError);
                        await supabase.from('dockets').delete().eq('id', docketId);
                        return {
                            success: false,
                            message: 'Error saving victim sectors'
                        };
                    }
                }
            }
        }

        // 4. Insert respondents into docket_parties
        for (const respondent of data.respondents) {
            if (respondent.name.trim() === '') continue;

            const { data: partyData, error: partyError } = await supabase
                .from('docket_parties')
                .insert({
                    docket_id: docketId,
                    name: respondent.name,
                    party_type: 'RESPONDENT'
                })
                .select('id')
                .single();

            if (partyError) {
                console.error('Error inserting respondent:', partyError);
                await supabase.from('dockets').delete().eq('id', docketId);
                return {
                    success: false,
                    message: 'Error saving respondent information'
                };
            }

            // Insert respondent sectors
            if (respondent.sectorNames.length > 0) {
                const sectorIds: number[] = [];

                for (const sectorName of respondent.sectorNames) {
                    const sectorId = await getSectorIdByName(supabase, sectorName);
                    if (sectorId) {
                        sectorIds.push(sectorId);
                    }
                }

                if (sectorIds.length > 0) {
                    const sectorsToInsert = sectorIds.map(sectorId => ({
                        party_id: partyData.id,
                        sector_id: sectorId
                    }));

                    const { error: sectorError } = await supabase
                        .from('docket_party_sectors')
                        .insert(sectorsToInsert);

                    if (sectorError) {
                        console.error('Error inserting respondent sectors:', sectorError);
                        await supabase.from('dockets').delete().eq('id', docketId);
                        return {
                            success: false,
                            message: 'Error saving respondent sectors'
                        };
                    }
                }
            }
        }

        // 5. Insert staff into docket_staff
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

        return {
            success: true,
            message: 'Docket submitted successfully',
            docketId
        };

    } catch (error) {
        console.error('Unexpected error during docket submission:', error);
        return {
            success: false,
            message: 'An unexpected error occurred'
        };
    }
}
