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
        // First, get docket info and assigned officers BEFORE deletion
        const docketInfoPromises = docketIds.map(async (docketId) => {
            // Get docket number
            const { data: docket } = await supabase
                .from('dockets')
                .select('docket_number')
                .eq('id', docketId)
                .single();

            // Get assigned officers
            const { data: staffAssignments } = await supabase
                .from('docket_staff')
                .select('user_id')
                .eq('docket_id', docketId);

            return {
                docketNumber: docket?.docket_number || 'Unknown',
                assignedOfficerIds: (staffAssignments || []).map(s => s.user_id)
            };
        });

        const docketInfos = await Promise.all(docketInfoPromises);

        // Now perform the deletion
        const { error } = await supabase
            .from('dockets')
            .delete()
            .in('id', docketIds);

        if (error) {
            console.error('Error deleting dockets:', error);
            return { success: false, error: error.message };
        }

        // Create notifications for each deleted docket
        const { createNotificationsForDeletedCase } = await import('./notification-actions');

        for (const info of docketInfos) {
            await createNotificationsForDeletedCase(
                info.docketNumber,
                info.assignedOfficerIds
            );
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

        // 1. Update dockets table (removed violation_category from payload)
        const updatePayload: any = {
            docket_number: data.docketNumber,
            date_received: dateReceivedDB,
            deadline: deadlineDB,
            type_of_request_id: data.typeOfRequestId,
            mode_of_request_id: data.modeOfRequestId,
            // violation_category now in junction table
        };

        if (status) {
            updatePayload.status = status;
        }

        // Check if switching to Motu Proprio
        const { data: motuProprioMode } = await supabase
            .from('request_modes')
            .select('id')
            .eq('name', 'Motu Proprio')
            .single();

        if (motuProprioMode && data.modeOfRequestId === motuProprioMode.id) {
            // If switching to Motu Proprio, delete complainants first to avoid constraint violation
            const { error: preDeleteComplainantsError } = await supabase
                .from('docket_complainants')
                .delete()
                .eq('docket_id', docketId);

            if (preDeleteComplainantsError) {
                console.error('Error deleting existing complainants (pre-update):', preDeleteComplainantsError);
                return { success: false, error: 'Failed to clear complainants for Motu Proprio update' };
            }
        }

        const { error: docketError } = await supabase
            .from('dockets')
            .update(updatePayload)
            .eq('id', docketId);

        if (docketError) {
            console.error('Error updating docket:', docketError);
            return { success: false, error: docketError.message };
        }

        // 2. Update Violation Categories (Delete all and re-insert)
        const { error: deleteCategoriesError } = await supabase
            .from('docket_violations')
            .delete()
            .eq('docket_id', docketId);

        if (deleteCategoriesError) {
            console.error('Error deleting existing categories:', deleteCategoriesError);
            return { success: false, error: 'Failed to update categories: ' + deleteCategoriesError.message };
        }

        if (data.violationCategories && data.violationCategories.length > 0) {
            const categoriesToInsert = data.violationCategories
                .filter(c => c.trim() !== '')
                .map(categoryName => ({
                    docket_id: docketId,
                    category_name: categoryName.trim()
                }));

            if (categoriesToInsert.length > 0) {
                const { error: insertCategoriesError } = await supabase
                    .from('docket_violations')
                    .insert(categoriesToInsert);

                if (insertCategoriesError) {
                    console.error('Error inserting new categories:', insertCategoriesError);
                    return { success: false, error: 'Failed to save new categories' };
                }
            }
        }

        // 3. Update Rights (Delete all and re-insert)
        const { error: deleteRightsError } = await supabase
            .from('docket_rights')
            .delete()
            .eq('docket_id', docketId);

        if (deleteRightsError) {
            console.error('Error deleting existing rights:', deleteRightsError);
            return { success: false, error: 'Failed to update rights: ' + deleteRightsError.message };
        }

        // Filter out empty and duplicate rights
        const filteredRights = data.rightsViolated.filter(r => r.trim() !== '');
        const uniqueRights = filteredRights.filter((r, i, arr) => arr.indexOf(r) === i);

        if (uniqueRights.length > 0) {
            const rightsToInsert = uniqueRights.map(rightName => ({
                docket_id: docketId,
                right_name: rightName.trim()
            }));

            console.log('Inserting rights:', rightsToInsert);

            const { error: insertRightsError } = await supabase
                .from('docket_rights')
                .insert(rightsToInsert);

            if (insertRightsError) {
                console.error('Error inserting new rights:', insertRightsError);
                return { success: false, error: 'Failed to save new rights: ' + insertRightsError.message };
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

            // Resolve sector IDs first
            const sectorIds: number[] = [];
            if (victim.sectorNames.length > 0) {
                for (const sectorName of victim.sectorNames) {
                    const sectorId = await getSectorIdByName(supabase, sectorName);
                    if (sectorId) {
                        sectorIds.push(sectorId);
                    }
                }
            }

            // Use RPC to insert atomically
            const { error: rpcError } = await supabase.rpc('insert_party_with_sectors', {
                p_docket_id: docketId,
                p_name: victim.name,
                p_party_type: 'VICTIM',
                p_sector_ids: sectorIds
            });

            if (rpcError) {
                console.error('Error inserting victim (RPC):', rpcError);
                return { success: false, error: 'Failed to save victim: ' + rpcError.message };
            }
        }

        // Insert Respondents
        for (const respondent of data.respondents) {
            if (respondent.name.trim() === '') continue;

            // Resolve sector IDs first
            const sectorIds: number[] = [];
            if (respondent.sectorNames.length > 0) {
                for (const sectorName of respondent.sectorNames) {
                    const sectorId = await getSectorIdByName(supabase, sectorName);
                    if (sectorId) {
                        sectorIds.push(sectorId);
                    }
                }
            }

            // Use RPC to insert atomically
            const { error: rpcError } = await supabase.rpc('insert_party_with_sectors', {
                p_docket_id: docketId,
                p_name: respondent.name,
                p_party_type: 'RESPONDENT',
                p_sector_ids: sectorIds
            });

            if (rpcError) {
                console.error('Error inserting respondent (RPC):', rpcError);
                return { success: false, error: 'Failed to save respondent: ' + rpcError.message };
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

        // 5. Update Complainants (Delete all and re-insert)
        const { error: deleteComplainantsError } = await supabase
            .from('docket_complainants')
            .delete()
            .eq('docket_id', docketId);

        if (deleteComplainantsError) {
            console.error('Error deleting existing complainants:', deleteComplainantsError);
            return { success: false, error: 'Failed to update complainants' };
        }

        if (data.complainants.length > 0) {
            const complainantsToInsert = data.complainants
                .filter(c => c.name.trim() !== '')
                .map(c => ({
                    docket_id: docketId,
                    name: c.name,
                    contact_number: c.contactNumber
                }));

            if (complainantsToInsert.length > 0) {
                const { error: insertComplainantsError } = await supabase
                    .from('docket_complainants')
                    .insert(complainantsToInsert);

                if (insertComplainantsError) {
                    console.error('Error inserting new complainants:', insertComplainantsError);
                    return { success: false, error: 'Failed to save new complainants' };
                }
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
