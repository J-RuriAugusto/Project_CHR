import { isValidDateFormat, parseDateString } from '@/lib/utils/date-helpers';
import { submitDocket, DocketSubmissionData } from '@/lib/actions/docket-submission';
import { checkDocketNumberExists } from '@/lib/actions/docket-queries';
import { createClient } from '@/utils/supabase/client';

interface ValidationErrors {
    [key: string]: string;
}

interface DocketFormData {
    docketNumber: string;
    dateReceived: string;
    deadline: string;
    typeOfRequest: number | '';
    category: number | '';
    modeOfRequest: number | '';
    selectedRights: number[];
    victims: { name: string; sectors: string[] }[];
    respondents: { name: string; sectors: string[] }[];
    staff: { userId: string; email: string }[];
}

export async function validateDocketForm(formData: DocketFormData): Promise<ValidationErrors> {
    const errors: ValidationErrors = {};

    // Docket number validation
    if (!formData.docketNumber.trim()) {
        errors.docketNumber = 'Docket number is required';
    } else if (!/^CHR-VII-\d{4}-\d+$/.test(formData.docketNumber)) {
        errors.docketNumber = 'Invalid format. Expected: CHR-VII-YEAR-NUMBER';
    } else {
        const exists = await checkDocketNumberExists(formData.docketNumber);
        if (exists) {
            errors.docketNumber = 'This docket number already exists';
        }
    }

    // Type of Request
    if (formData.typeOfRequest === '') {
        errors.typeOfRequest = 'Type of Request is required';
    }

    // Category
    if (formData.category === '') {
        errors.category = 'Category is required';
    }

    // Mode of Request
    if (formData.modeOfRequest === '') {
        errors.modeOfRequest = 'Mode of Request is required';
    }

    // Rights Violated
    if (formData.selectedRights.length === 0) {
        errors.rights = 'At least one right must be selected';
    }

    // Date validation
    if (!isValidDateFormat(formData.dateReceived)) {
        errors.dateReceived = 'Invalid date format. Use mm/dd/yyyy';
    } else {
        const receivedDate = parseDateString(formData.dateReceived);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (receivedDate && receivedDate > today) {
            errors.dateReceived = 'Date received cannot be in the future';
        }
    }

    if (!isValidDateFormat(formData.deadline)) {
        errors.deadline = 'Invalid date format. Use mm/dd/yyyy';
    } else {
        const deadlineDate = parseDateString(formData.deadline);
        const receivedDate = parseDateString(formData.dateReceived);
        if (deadlineDate && receivedDate && deadlineDate < receivedDate) {
            errors.deadline = 'Deadline cannot be before Date Received';
        }
    }

    // Victims validation
    const victimsWithNames = formData.victims.filter(v => v.name.trim() !== '');
    if (victimsWithNames.length === 0) {
        errors.victims = 'At least one victim is required';
    } else {
        const victimsWithoutSectors = victimsWithNames.filter(v => v.sectors.length === 0);
        if (victimsWithoutSectors.length > 0) {
            errors.victims = 'Each victim must have at least one sector selected';
        }
    }

    // Respondents validation (optional, but if name provided, must have sectors)
    const respondentsWithNames = formData.respondents.filter(r => r.name.trim() !== '');
    const respondentsWithoutSectors = respondentsWithNames.filter(r => r.sectors.length === 0);
    if (respondentsWithoutSectors.length > 0) {
        errors.respondents = 'Each respondent must have at least one sector selected';
    }

    // Staff validation
    const assignedStaff = formData.staff.filter(s => s.userId.trim() !== '');
    if (assignedStaff.length === 0) {
        errors.staff = 'At least one staff member must be assigned';
    }

    return errors;
}

export async function submitDocketForm(formData: DocketFormData): Promise<{ success: boolean; message: string }> {
    // Get current user session
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const createdByUserId = session?.user?.id;

    if (!createdByUserId) {
        return { success: false, message: 'User session not found. Please log in again.' };
    }

    // Filter victims and respondents with names
    const victimsWithNames = formData.victims.filter(v => v.name.trim() !== '');
    const respondentsWithNames = formData.respondents.filter(r => r.name.trim() !== '');

    // Prepare submission data
    const submissionData: DocketSubmissionData = {
        docketNumber: formData.docketNumber,
        dateReceived: formData.dateReceived,
        deadline: formData.deadline,
        typeOfRequestId: formData.typeOfRequest as number,
        categoryId: formData.category as number,
        modeOfRequestId: formData.modeOfRequest as number,
        selectedRightIds: formData.selectedRights,
        victims: victimsWithNames.map(v => ({ name: v.name, sectorNames: v.sectors })),
        respondents: respondentsWithNames.map(r => ({ name: r.name, sectorNames: r.sectors })),
        staffInChargeIds: formData.staff.filter(s => s.userId.trim() !== '').map(s => s.userId)
    };

    // Submit to database
    return await submitDocket(submissionData, createdByUserId);
}
