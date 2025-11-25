'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateDocketStatus(docketIds: string[], status: string) {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('dockets')
            .update({ status })
            .in('id', docketIds);

        if (error) {
            console.error('Error updating docket status:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/records_officer/docket');
        revalidatePath('/dashboard/investigation_chief/docket');

        return { success: true };
    } catch (error) {
        console.error('Unexpected error updating docket status:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

export async function deleteDockets(docketIds: string[]) {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('dockets')
            .delete()
            .in('id', docketIds);

        if (error) {
            console.error('Error deleting dockets:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/records_officer/docket');
        revalidatePath('/dashboard/investigation_chief/docket');

        return { success: true };
    } catch (error) {
        console.error('Unexpected error deleting dockets:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Get sector ID by name (Helper for updateDocket)
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

import { DocketSubmissionData } from './docket-submission';
import { convertToDBFormat } from '@/lib/utils/date-helpers';

export async function updateDocket(docketId: string, data: DocketSubmissionData, status?: string) {
    const supabase = createClient();

    try {
        // Convert dates to database format
        const dateReceivedDB = convertToDBFormat(data.dateReceived);
        const deadlineDB = convertToDBFormat(data.deadline);

        if (!dateReceivedDB || !deadlineDB) {
            return { success: false, error: 'Invalid date format' };
        }

        // 1. Update dockets table
        const updatePayload: any = {
            docket_number: data.docketNumber,
            date_received: dateReceivedDB,
            deadline: deadlineDB,
            type_of_request_id: data.typeOfRequestId,
            category_id: data.categoryId,
            mode_of_request_id: data.modeOfRequestId,
            // staff_in_charge_id removed
        };

        if (status) {
            updatePayload.status = status;
        }

        const { error: docketError } = await supabase
            .from('dockets')
            .update(updatePayload)
            .eq('id', docketId);

        if (docketError) {
            console.error('Error updating docket:', docketError);
            return { success: false, error: docketError.message };
        }

        // 2. Update Rights (Delete all and re-insert)
        const { error: deleteRightsError } = await supabase
            .from('docket_rights')
            .delete()
            .eq('docket_id', docketId);

        if (deleteRightsError) {
            console.error('Error deleting existing rights:', deleteRightsError);
            return { success: false, error: 'Failed to update rights' };
        }

        if (data.selectedRightIds.length > 0) {
            const rightsToInsert = data.selectedRightIds.map(rightId => ({
                docket_id: docketId,
                right_id: rightId
            }));

            const { error: insertRightsError } = await supabase
                .from('docket_rights')
                .insert(rightsToInsert);

            if (insertRightsError) {
                console.error('Error inserting new rights:', insertRightsError);
                return { success: false, error: 'Failed to save new rights' };
            }
        }

        // 3. Update Parties (Delete all and re-insert)
        // This cascades to docket_party_sectors
        const { error: deletePartiesError } = await supabase
            .from('docket_parties')
            .delete()
            .eq('docket_id', docketId);

        if (deletePartiesError) {
            console.error('Error deleting existing parties:', deletePartiesError);
            return { success: false, error: 'Failed to update parties' };
        }

        // Insert Victims
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
                return { success: false, error: 'Failed to save victim' };
            }

            // Insert victim sectors
            if (victim.sectorNames.length > 0) {
                const sectorIds: number[] = [];
                for (const sectorName of victim.sectorNames) {
                    const sectorId = await getSectorIdByName(supabase, sectorName);
                    if (sectorId) sectorIds.push(sectorId);
                }

                if (sectorIds.length > 0) {
                    const sectorsToInsert = sectorIds.map(sectorId => ({
                        party_id: partyData.id,
                        sector_id: sectorId
                    }));
                    await supabase.from('docket_party_sectors').insert(sectorsToInsert);
                }
            }
        }

        // Insert Respondents
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
                return { success: false, error: 'Failed to save respondent' };
            }

            // Insert respondent sectors
            if (respondent.sectorNames.length > 0) {
                const sectorIds: number[] = [];
                for (const sectorName of respondent.sectorNames) {
                    const sectorId = await getSectorIdByName(supabase, sectorName);
                    if (sectorId) sectorIds.push(sectorId);
                }

                if (sectorIds.length > 0) {
                    const sectorsToInsert = sectorIds.map(sectorId => ({
                        party_id: partyData.id,
                        sector_id: sectorId
                    }));
                    await supabase.from('docket_party_sectors').insert(sectorsToInsert);
                }
            }
        }

        // 4. Update Staff (Delete all and re-insert)
        const { error: deleteStaffError } = await supabase
            .from('docket_staff')
            .delete()
            .eq('docket_id', docketId);

        if (deleteStaffError) {
            console.error('Error deleting existing staff:', deleteStaffError);
            return { success: false, error: 'Failed to update staff' };
        }

        if (data.staffInChargeIds.length > 0) {
            const staffToInsert = data.staffInChargeIds.map(userId => ({
                docket_id: docketId,
                user_id: userId
            }));

            const { error: insertStaffError } = await supabase
                .from('docket_staff')
                .insert(staffToInsert);

            if (insertStaffError) {
                console.error('Error inserting new staff:', insertStaffError);
                return { success: false, error: 'Failed to save new staff' };
            }
        }

        revalidatePath('/dashboard/records_officer/docket');
        revalidatePath('/dashboard/investigation_chief/docket');

        return { success: true };
    } catch (error) {
        console.error('Unexpected error updating docket:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}
