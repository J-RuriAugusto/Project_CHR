"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Calendar, Plus, ChevronDown, Search, XCircle } from 'lucide-react';
import { DocketLookups } from '@/lib/actions/docket-lookups';
import { getDocketDetails, checkDocketNumberExists } from '@/lib/actions/docket-queries';
import { deleteDockets, updateDocket, updateDocketStatus } from "@/lib/actions/docket-actions";
import { DocketSubmissionData } from '@/lib/actions/docket-submission';

interface DocketViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    docketId: string | null;
    users: any[];
    lookups: DocketLookups;
    currentUserRole?: string;
}

const SECTORS = [
    "Women",
    "Child",
    "Child in Conflict with the Law",
    "Child in Situations of Armed Conflict",
    "Child Involved in Armed Conflict",
    "Student",
    "Student Leader",
    "Elderly",
    "Person Living with HIV",
    "LGBTQIA+",
    "Farmer",
    "Fisherfolk",
    "Military",
    "Police",
    "Civil Servant / Government Employee",
    "Government Official (Elected)",
    "Government Official (Appointed)",
    "Media",
    "Person Deprived of Liberty",
    "Internally Displaced Person",
    "Person with Disability",
    "Person Who Uses Drugs",
    "Person Suspected of Committing a Crime",
    "Person Suspected of Terrorism etc",
    "Activist",
    "Labor Leader",
    "Laborer / Worker",
    "Factory or Plant Worker",
    "Urban Poor",
    "Informal Settler",
    "Leader of CSO / NGO / Cause Oriented Group",
    "Sectoral Leader",
    "Religious Leader",
    "Environmental Protection Advocate",
    "Indigenous People (Member)",
    "Teacher",
    "Bantay Dagat",
    "Bantay Banwa",
    "General Public / Private Citizen",
    "PUJ / PUV Driver",
    "Mental Health Service User",
    "Youth",
    "Street Dweller",
    "Vendor",
    "People in Street Situations",
    "Children in Street Situations"
];

export default function DocketViewModal({ isOpen, onClose, docketId, users, lookups, currentUserRole }: DocketViewModalProps) {
    const currentYear = new Date().getFullYear();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [originalDocketNumber, setOriginalDocketNumber] = useState('');
    const [docketNumber, setDocketNumber] = useState('');
    const [dateReceived, setDateReceived] = useState('');
    const [deadline, setDeadline] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');
    const [typeOfRequest, setTypeOfRequest] = useState<number | ''>('');
    const [categories, setCategories] = useState<string[]>(['']);
    const [complainants, setComplainants] = useState<{ name: string; contactNumber: string }[]>([{ name: '', contactNumber: '' }]);
    const [modeOfRequest, setModeOfRequest] = useState<number | ''>('');
    const [rightsViolated, setRightsViolated] = useState<string[]>(['']);
    const [status, setStatus] = useState<string>('Pending');
    const isEditable = status === 'Pending' && currentUserRole !== 'officer';
    const isCompletedForOfficer = status === 'Completed' && currentUserRole === 'officer';


    // Updated state for Victims and Respondents - both support multiple sectors
    const [victims, setVictims] = useState<{ name: string; sectors: string[] }[]>([{ name: '', sectors: [] }]);
    const [respondents, setRespondents] = useState<{ name: string; sectors: string[] }[]>([{ name: '', sectors: [] }]);

    // Staff state
    const [staff, setStaff] = useState<{ userId: string; email: string }[]>([{ userId: '', email: '' }]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [calendarMode, setCalendarMode] = useState<'dateReceived' | 'deadline'>('dateReceived');

    // Sector dropdown state for victims
    const [openVictimSectorDropdown, setOpenVictimSectorDropdown] = useState<number | null>(null);
    const [victimSectorSearch, setVictimSectorSearch] = useState('');
    const victimDropdownRef = useRef<HTMLDivElement>(null);

    // Sector dropdown state for respondents
    const [openRespondentSectorDropdown, setOpenRespondentSectorDropdown] = useState<number | null>(null);
    const [respondentSectorSearch, setRespondentSectorSearch] = useState('');
    const respondentDropdownRef = useRef<HTMLDivElement>(null);

    // Staff dropdown state
    const [openStaffDropdown, setOpenStaffDropdown] = useState<number | null>(null);
    const [staffSearch, setStaffSearch] = useState('');
    const staffDropdownRef = useRef<HTMLDivElement>(null);

    // Delete modal states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

    const [showDeleteError, setShowDeleteError] = useState(false);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Not found modal state
    const [showNotFoundModal, setShowNotFoundModal] = useState(false);

    // Save modal states
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [showSaveError, setShowSaveError] = useState(false);
    const [saveErrorMessages, setSaveErrorMessages] = useState<string[]>([]);
    const [showNoChanges, setShowNoChanges] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (victimDropdownRef.current && !victimDropdownRef.current.contains(event.target as Node)) {
                setOpenVictimSectorDropdown(null);
                setVictimSectorSearch('');
            }
            if (respondentDropdownRef.current && !respondentDropdownRef.current.contains(event.target as Node)) {
                setOpenRespondentSectorDropdown(null);
                setRespondentSectorSearch('');
            }
            if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target as Node)) {
                setOpenStaffDropdown(null);
                setStaffSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to victim dropdown when opened
    useEffect(() => {
        if (openVictimSectorDropdown !== null && victimDropdownRef.current) {
            setTimeout(() => {
                const menu = victimDropdownRef.current?.lastElementChild;
                menu?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    }, [openVictimSectorDropdown]);

    // Scroll to respondent dropdown when opened
    useEffect(() => {
        if (openRespondentSectorDropdown !== null && respondentDropdownRef.current) {
            setTimeout(() => {
                const menu = respondentDropdownRef.current?.lastElementChild;
                menu?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    }, [openRespondentSectorDropdown]);

    // Scroll to staff dropdown when opened
    useEffect(() => {
        if (openStaffDropdown !== null && staffDropdownRef.current) {
            setTimeout(() => {
                const menu = staffDropdownRef.current?.lastElementChild;
                menu?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    }, [openStaffDropdown]);

    // Calendar refs and scroll logic
    const calendarRef = useRef<HTMLDivElement>(null);
    const deadlineCalendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showCalendar && calendarRef.current) {
            setTimeout(() => {
                calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [showCalendar]);

    useEffect(() => {
        if (showDeadlineCalendar && deadlineCalendarRef.current) {
            setTimeout(() => {
                deadlineCalendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [showDeadlineCalendar]);

    const [initialState, setInitialState] = useState<any>(null);

    // Fetch details when modal opens
    useEffect(() => {
        if (isOpen && docketId) {
            fetchDetails(docketId);
        } else {
            resetForm();
        }
    }, [isOpen, docketId]);

    const fetchDetails = async (id: string) => {
        setIsLoading(true);
        try {
            const details = await getDocketDetails(id);
            if (details) {
                setOriginalDocketNumber(details.docketNumber);
                setDocketNumber(details.docketNumber);
                setDateReceived(details.dateReceived);
                setDeadline(details.deadline);
                setUpdatedAt(details.updatedAt);
                setTypeOfRequest(details.typeOfRequestId);

                // Handle categories (now comes as array from API)
                if (details.violationCategories && details.violationCategories.length > 0) {
                    setCategories(details.violationCategories);
                } else {
                    setCategories(['']);
                }

                setModeOfRequest(details.modeOfRequestId);

                // Handle rights
                if (details.rightsViolated && details.rightsViolated.length > 0) {
                    setRightsViolated(details.rightsViolated);
                } else {
                    setRightsViolated(['']);
                }

                setVictims(details.victims.length > 0 ? details.victims : [{ name: '', sectors: [] }]);
                setRespondents(details.respondents.length > 0 ? details.respondents : []);
                setStaff(details.staff.length > 0 ? details.staff : [{ userId: '', email: '' }]);
                setComplainants(details.complainants && details.complainants.length > 0 ? details.complainants : [{ name: '', contactNumber: '' }]);

                // Format status for display
                let currentStatus = 'Pending';
                const docketStatus = details.status || 'PENDING';
                if (docketStatus === 'FOR REVIEW') {
                    currentStatus = 'For Review';
                } else {
                    currentStatus = docketStatus.charAt(0).toUpperCase() + docketStatus.slice(1).toLowerCase();
                }
                setStatus(currentStatus);

                // Set initial state for change detection
                setInitialState({
                    docketNumber: details.docketNumber,
                    dateReceived: details.dateReceived,
                    deadline: details.deadline,
                    typeOfRequest: details.typeOfRequestId,
                    categories: details.violationCategories && details.violationCategories.length > 0 ? details.violationCategories : [''],
                    modeOfRequest: details.modeOfRequestId,
                    rightsViolated: details.rightsViolated && details.rightsViolated.length > 0 ? details.rightsViolated : [''],
                    victims: details.victims.length > 0 ? details.victims : [{ name: '', sectors: [] }],
                    respondents: details.respondents.length > 0 ? details.respondents : [],
                    staff: details.staff.length > 0 ? details.staff : [{ userId: '', email: '' }],
                    status: currentStatus,
                    complainants: details.complainants && details.complainants.length > 0 ? details.complainants : [{ name: '', contactNumber: '' }]
                });
            } else {
                // If details is null/undefined, it means not found or no permission
                setShowNotFoundModal(true);
            }
        } catch (error) {
            console.error("Failed to fetch docket details", error);
            // Also show not found modal on error
            setShowNotFoundModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setOriginalDocketNumber('');
        setDocketNumber('');
        setDateReceived('');
        setDateReceived('');
        setDeadline('');
        setUpdatedAt('');
        setTypeOfRequest('');
        setTypeOfRequest('');
        setComplainants([{ name: '', contactNumber: '' }]);
        setCategories(['']);
        setModeOfRequest('');
        setRightsViolated(['']);
        setVictims([{ name: '', sectors: [] }]);
        setRespondents([]);
        setStaff([{ userId: '', email: '' }]);
        setStatus('Pending');
        setShowCalendar(false);
        setShowDeadlineCalendar(false);
    };

    // Calculate deadline based on request type and date received
    const calculateDeadline = (dateReceivedStr: string, typeId: number | '') => {
        if (!dateReceivedStr || typeId === '') return;

        const requestType = lookups.requestTypes.find(t => t.id === typeId);
        if (!requestType) return;

        const receivedDate = new Date(dateReceivedStr);
        if (isNaN(receivedDate.getTime())) return;

        // Day 1 = date_received, deadline is 60 or 120 days from day 1
        let daysToAdd = 0;
        if (requestType.name === 'Legal Assistance / OPS') {
            daysToAdd = 120;
        } else if (requestType.name === 'Legal Investigation') {
            daysToAdd = 60;
        } else {
            return; // Don't autofill for other types
        }

        const deadlineDate = new Date(receivedDate);
        deadlineDate.setDate(deadlineDate.getDate() + daysToAdd);

        setDeadline(deadlineDate.toLocaleDateString('en-US'));
    };

    // Handlers for inputs that trigger deadline calculation
    const handleTypeOfRequestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value ? Number(e.target.value) : '';
        setTypeOfRequest(newValue);
        calculateDeadline(dateReceived, newValue);
    };

    const handleDateReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setDateReceived(newValue);
        // Only calculate if it's a valid date string (simple check)
        if (newValue.split('/').length === 3) {
            calculateDeadline(newValue, typeOfRequest);
        }
    };


    // Category Handlers
    // const addCategory = () => {
    //     const lastCategory = categories[categories.length - 1];
    // Only add if the last category has content
    //     if (lastCategory && lastCategory.trim() !== '') {
    //         setCategories([...categories, '']);
    //     }
    // };
    const updateCategory = (index: number, value: string) => {
        const newCategories = [...categories];
        newCategories[index] = value;
        setCategories(newCategories);
    };
    const removeCategory = (index: number) => {
        if (categories.length > 1) {
            setCategories(categories.filter((_, i) => i !== index));
        }
    };

    // Rights Handlers
    // const addRight = () => {
    //     const lastRight = rights[rights.length - 1];
    // Only add if the last right has content
    //     if (lastRight && lastRight.trim() !== '') {
    //         setRights([...rights, '']);
    //     }
    // };
    const updateRight = (index: number, value: string) => {
        const newRights = [...rightsViolated];
        newRights[index] = value;
        setRightsViolated(newRights);
    };
    const removeRight = (index: number) => {
        if (rightsViolated.length > 1) {
            setRightsViolated(rightsViolated.filter((_, i) => i !== index));
        }
    };

    // Complainant Handlers
    const addComplainantField = () => {
        const lastComplainant = complainants[complainants.length - 1];
        if (lastComplainant && lastComplainant.name.trim() !== '') {
            setComplainants([...complainants, { name: '', contactNumber: '' }]);
        }
    };

    const updateComplainant = (index: number, field: 'name' | 'contactNumber', value: string) => {
        const newComplainants = [...complainants];
        newComplainants[index][field] = value;
        setComplainants(newComplainants);
    };

    const removeComplainant = (index: number) => {
        if (complainants.length > 1) {
            setComplainants(complainants.filter((_, i) => i !== index));
        }
    };

    // Victim Handlers
    const addVictimField = () => {
        const lastVictim = victims[victims.length - 1];
        // Only add if the last victim has a name
        if (lastVictim && lastVictim.name.trim() !== '') {
            setVictims([...victims, { name: '', sectors: [] }]);
        }
    };

    const updateVictimName = (index: number, value: string) => {
        const newVictims = [...victims];
        newVictims[index].name = value;
        setVictims(newVictims);
    };

    const toggleVictimSector = (victimIndex: number, sector: string) => {
        const newVictims = [...victims];
        const sectors = newVictims[victimIndex].sectors;
        if (sectors.includes(sector)) {
            newVictims[victimIndex].sectors = sectors.filter(s => s !== sector);
        } else {
            newVictims[victimIndex].sectors = [...sectors, sector];
        }
        setVictims(newVictims);
    };

    const removeVictim = (index: number) => {
        if (victims.length > 1) {
            setVictims(victims.filter((_, i) => i !== index));
        }
    };

    // Respondent Handlers
    const addRespondentField = () => {
        // If empty, add first field
        if (respondents.length === 0) {
            setRespondents([{ name: '', sectors: [] }]);
        } else {
            const lastRespondent = respondents[respondents.length - 1];
            // Only add if the last respondent has a name
            if (lastRespondent && lastRespondent.name.trim() !== '') {
                setRespondents([...respondents, { name: '', sectors: [] }]);
            }
        }
    };

    const updateRespondentName = (index: number, value: string) => {
        const newRespondents = [...respondents];
        newRespondents[index].name = value;
        setRespondents(newRespondents);
    };

    const toggleRespondentSector = (respondentIndex: number, sector: string) => {
        const newRespondents = [...respondents];
        const sectors = newRespondents[respondentIndex].sectors;

        if (sectors.includes(sector)) {
            newRespondents[respondentIndex].sectors = sectors.filter(s => s !== sector);
        } else {
            newRespondents[respondentIndex].sectors = [...sectors, sector];
        }

        setRespondents(newRespondents);
    };

    const removeRespondent = (index: number) => {
        setRespondents(respondents.filter((_, i) => i !== index));
    };

    // Staff Handlers
    const addStaffField = () => {
        const lastStaff = staff[staff.length - 1];
        // Only add if the last staff has been assigned
        if (lastStaff && lastStaff.userId.trim() !== '') {
            setStaff([...staff, { userId: '', email: '' }]);
        }
    };

    const updateStaff = (index: number, userId: string) => {
        const isAlreadySelected = staff.some((s, i) => i !== index && s.userId === userId);

        if (isAlreadySelected && userId !== '') {
            alert("This staff member is already assigned.");
            return;
        }

        const selectedUser = users.find(u => u.id === userId);
        const newStaff = [...staff];
        newStaff[index] = {
            userId,
            email: selectedUser ? selectedUser.email : ''
        };
        setStaff(newStaff);
    };

    const removeStaff = (index: number) => {
        if (staff.length > 1) {
            setStaff(staff.filter((_, i) => i !== index));
        }
    };

    const handleDocketNumberFocus = () => {
        if (docketNumber === '') {
            setDocketNumber(`CHR-VII-${currentYear}-`);
        }
    };

    const handleDocketNumberBlur = () => {
        if (docketNumber && docketNumber !== `CHR-VII-${currentYear}-`) {
            const pattern = new RegExp(`^CHR-VII-${currentYear}-\\d+$`);
            if (!pattern.test(docketNumber)) {
                alert('Invalid docket number format. Expected format: CHR-VII-YEAR-NUMBER');
            }
        }
    };

    const validateDateFormat = (dateString: string): boolean => {
        if (!dateString) return false;
        const parts = dateString.split('/');
        if (parts.length !== 3) return false;
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (isNaN(month) || isNaN(day) || isNaN(year)) return false;

        // Validate month (1-12) and day (1-31)
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;

        // Additional validation: check if the date is valid
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day;
    };

    const handleSaveChanges = async () => {
        // Check for changes
        if (initialState) {
            const currentFormState = {
                docketNumber,
                dateReceived,
                deadline,
                typeOfRequest,
                categories,
                complainants,
                modeOfRequest,
                rightsViolated,
                victims,
                respondents,
                staff,
                status
            };

            const hasChanges = JSON.stringify(initialState) !== JSON.stringify(currentFormState);

            // Special check for Officer: if only status can change, check that specifically
            if (currentUserRole === 'officer') {
                if (status === initialState.status) {
                    setShowNoChanges(true);
                    return;
                }
            } else {
                // For others, check everything (simplified JSON comparison)
                if (JSON.stringify(initialState) === JSON.stringify(currentFormState)) {
                    setShowNoChanges(true);
                    return;
                }
            }
        }

        const errors: string[] = [];

        // 1. Validate Docket Number
        if (!docketNumber.trim()) {
            errors.push('Docket Number is required');
        } else {
            // Check format - allow any year (CHR-VII-YYYY-NUMBER)
            const pattern = new RegExp(`^CHR-VII-\\d{4}-\\d+$`);
            if (!pattern.test(docketNumber)) {
                errors.push('Docket Number format is invalid. Expected format: CHR-VII-YEAR-NUMBER');
            } else if (docketNumber !== originalDocketNumber) {
                // Check uniqueness only if docket number was changed
                const exists = await checkDocketNumberExists(docketNumber);
                if (exists) {
                    errors.push('Docket Number already exists. Please use a unique docket number');
                }
            }
        }

        // 2. Validate Date Received
        if (!dateReceived.trim()) {
            errors.push('Date Received is required');
        } else if (!validateDateFormat(dateReceived)) {
            errors.push('Date Received must be in mm/dd/yyyy format and must be a valid date');
        }

        // 3. Validate Deadline
        if (!deadline.trim()) {
            errors.push('Deadline is required');
        } else if (!validateDateFormat(deadline)) {
            errors.push('Deadline must be in mm/dd/yyyy format and must be a valid date');
        }

        // 4. Validate Category of Alleged Violation
        const validCategories = categories.filter(c => c.trim() !== '');
        if (validCategories.length === 0) {
            errors.push('At least one Category of Alleged Violation is required');
        } else {
            const uniqueCategories = new Set(validCategories.map(c => c.trim().toLowerCase()));
            if (uniqueCategories.size !== validCategories.length) {
                errors.push('Duplicate categories are not allowed');
            }
        }

        // 5. Validate Rights Violated
        const validRights = rightsViolated.filter(r => r.trim() !== '');
        if (validRights.length === 0) {
            errors.push('At least one Right Violated is required');
        } else {
            const uniqueRights = new Set(validRights.map(r => r.trim().toLowerCase()));
            if (uniqueRights.size !== validRights.length) {
                errors.push('Duplicate rights are not allowed');
            }
        }

        // 6. Validate Victims
        const validVictims = victims.filter(v => v.name.trim() !== '');
        if (validVictims.length === 0) {
            errors.push('At least one Victim is required');
        } else {
            // Check that each victim has at least one sector
            validVictims.forEach((victim, index) => {
                if (victim.sectors.length === 0) {
                    errors.push(`Victim "${victim.name}" must have at least one sector associated`);
                }
            });
        }

        // 7. Validate Respondents (can be none, but if exists, must have sectors)
        const validRespondents = respondents.filter(r => r.name.trim() !== '');
        if (validRespondents.length > 0) {
            validRespondents.forEach((respondent, index) => {
                if (respondent.sectors.length === 0) {
                    errors.push(`Respondent "${respondent.name}" must have at least one sector associated`);
                }
            });
        }

        // 8. Validate Staff in Charge
        const assignedStaff = staff.filter(s => s.userId.trim() !== '');
        if (assignedStaff.length === 0) {
            errors.push('At least one Staff in Charge must be assigned');
        }

        // 9. Validate Complainants (Required unless Motu Proprio)
        const motuProprioMode = lookups.requestModes.find(m => m.name === 'Motu Proprio');
        const isMotuProprio = modeOfRequest === motuProprioMode?.id;

        const validComplainants = complainants.filter(c => c.name.trim() !== '');

        if (!isMotuProprio && validComplainants.length === 0) {
            errors.push('At least one Complainant is required');
        }

        // Check contact number for each valid complainant
        validComplainants.forEach((c) => {
            if (!c.contactNumber.trim()) {
                errors.push(`Contact number for complainant "${c.name}" is required`);
            }
        });

        // Show results
        if (errors.length > 0) {
            setSaveErrorMessages(errors);
            setShowSaveError(true);
        } else {
            if (!docketId) return;

            setIsSaving(true);

            try {
                let result;

                // Officers can only update status, so use the simpler updateDocketStatus function
                if (currentUserRole === 'officer') {
                    result = await updateDocketStatus([docketId], status.toUpperCase());
                } else {
                    // Other roles use the full updateDocket function
                    const submissionData: DocketSubmissionData = {
                        docketNumber,
                        dateReceived,
                        deadline,
                        typeOfRequestId: Number(typeOfRequest),
                        violationCategories: categories.filter(c => c.trim() !== ''),
                        complainants: isMotuProprio ? [] : complainants.map(c => ({ name: c.name, contactNumber: c.contactNumber })),
                        modeOfRequestId: Number(modeOfRequest),
                        rightsViolated: rightsViolated.filter(r => r.trim() !== ''),
                        victims: victims.map(v => ({ name: v.name, sectorNames: v.sectors })),
                        respondents: respondents.map(r => ({ name: r.name, sectorNames: r.sectors })),
                        staffInChargeIds: assignedStaff.map(s => s.userId)
                    };

                    result = await updateDocket(docketId, submissionData, status.toUpperCase());
                }

                if (result.success) {
                    setShowSaveSuccess(true);
                } else {
                    setSaveErrorMessages([result.error || 'Unknown error']);
                    setShowSaveError(true);
                }
            } catch (error) {
                console.error('Error saving changes:', error);
                setSaveErrorMessages(['An unexpected error occurred while saving changes.']);
                setShowSaveError(true);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleDelete = async () => {
        if (!docketId) return;
        setShowDeleteConfirm(false);
        setIsDeleting(true);

        const result = await deleteDockets([docketId]);

        setIsDeleting(false);

        if (result.success) {
            setShowDeleteSuccess(true);
        } else {
            setDeleteErrorMessage(result.error || 'An unexpected error occurred');
            setShowDeleteError(true);
        }
    };

    // Calendar logic
    const getDaysInMonth = (month: number, year: number): number => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number): number => {
        return new Date(year, month, 1).getDay();
    };

    const handleDateSelect = (day: number, field: 'received' | 'deadline') => {
        const selectedDate = new Date(selectedYear, selectedMonth, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (field === 'received') {
            if (selectedDate > today) {
                alert("Date received cannot be in the future.");
                return;
            }
            setDateReceived(selectedDate.toLocaleDateString('en-US'));
            setShowCalendar(false);
            calculateDeadline(selectedDate.toLocaleDateString('en-US'), typeOfRequest);
        } else {
            const received = new Date(dateReceived);
            if (!isNaN(received.getTime()) && selectedDate < received) {
                alert("Deadline cannot be before Date Received.");
                return;
            }
            setDeadline(selectedDate.toLocaleDateString('en-US'));
            setShowDeadlineCalendar(false);
        }
    };

    const isDateReceived = (day: number) => {
        if (!dateReceived) return false;
        const checkDate = new Date(selectedYear, selectedMonth, day).toLocaleDateString('en-US');
        return checkDate === dateReceived;
    };

    const isDeadline = (day: number) => {
        if (!deadline) return false;
        const checkDate = new Date(selectedYear, selectedMonth, day).toLocaleDateString('en-US');
        return checkDate === deadline;
    };

    const renderCalendar = (field: 'received' | 'deadline') => {
        const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
        const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
        const days = [];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isReceivedDate = isDateReceived(day);
            const isDeadlineDate = isDeadline(day);

            let buttonClass = "w-10 h-10 flex items-center justify-center rounded-full text-sm transition-colors ";

            if (isDeadlineDate) {
                buttonClass += "bg-blue text-white font-semibold";
            } else if (isReceivedDate) {
                buttonClass += "bg-sky text-blue font-semibold";
            } else {
                buttonClass += "text-gray-700 hover:bg-sky";
            }

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateSelect(day, field)}
                    className={buttonClass}
                >
                    {day}
                </button>
            );
        }

        return (
            <div ref={field === 'received' ? calendarRef : deadlineCalendarRef} className="absolute text-midnightNavy top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 w-80">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => {
                            if (selectedMonth === 0) {
                                setSelectedMonth(11);
                                setSelectedYear(selectedYear - 1);
                            } else {
                                setSelectedMonth(selectedMonth - 1);
                            }
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <img src="/icon23.png" alt="Previous" className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                        <div className="font-bold text-lg">{monthNames[selectedMonth]} {selectedYear}</div>
                        <div className="text-sm text-blue font-semibold">Select Dates</div>
                    </div>
                    <button
                        onClick={() => {
                            if (selectedMonth === 11) {
                                setSelectedMonth(0);
                                setSelectedYear(selectedYear + 1);
                            } else {
                                setSelectedMonth(selectedMonth + 1);
                            }
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <img src="/icon24.png" alt="Next" className="w-5 h-5" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(dayName => (
                        <div key={dayName} className="w-10 h-8 flex items-center justify-center text-xs font-semibold text-gray-500">
                            {dayName}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            </div>
        );
    };

    // Filter sectors based on search
    const filteredVictimSectors = SECTORS.filter(sector =>
        sector.toLowerCase().includes(victimSectorSearch.toLowerCase())
    );

    const filteredRespondentSectors = SECTORS.filter(sector =>
        sector.toLowerCase().includes(respondentSectorSearch.toLowerCase())
    );

    // Render sector dropdown component
    const renderSectorDropdown = (
        type: 'victim' | 'respondent',
        index: number,
        selectedSectors: string[],
        isOpen: boolean,
        searchValue: string,
        filteredSectors: string[],
        onToggle: () => void,
        onSearch: (value: string) => void,
        onToggleSector: (sector: string) => void,
        dropdownRef: React.RefObject<HTMLDivElement>,
        disabled: boolean = false
    ) => (
        <div className="relative" ref={isOpen ? dropdownRef : null}>
            <button
                type="button"
                onClick={onToggle}
                disabled={disabled}
                className={`w-full text-left text-ash bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex justify-between items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className="truncate">
                    {selectedSectors.length > 0
                        ? `Sector (${selectedSectors.length} applied)`
                        : 'Sector (0 applied)'}
                </span>
                <img src="/icon18.png" alt="Dropdown" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </button>

            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg">
                    {/* Search Bar */}
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-royal" size={16} />
                            <input
                                type="text"
                                placeholder="Search sectors..."
                                value={searchValue}
                                onChange={(e) => onSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-black text-sm border border-royal rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Scrollable Options */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredSectors.length > 0 ? (
                            filteredSectors.map((sector) => (
                                <label
                                    key={sector}
                                    className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedSectors.includes(sector)}
                                        onChange={() => onToggleSector(sector)}
                                        className="mr-2 h-4 w-4 text-black border-royal rounded focus:ring-blue-500"
                                    />
                                    <span className="text-black">{sector}</span>
                                </label>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-black">
                                No sectors found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const isMotuProprio = lookups.requestModes.find(m => m.id === modeOfRequest)?.name === 'Motu Proprio';

    return (
        <div>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-lg flex flex-col bg-white overflow-hidden ${isLoading ? 'w-auto' : 'w-full max-w-4xl max-h-[90vh]'}`}>
                        {isLoading ? (
                            /* Compact loading state */
                            <div className="px-12 py-8 flex flex-col items-center justify-center">
                                {/* Spinner */}
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full border-4 border-gray-200"></div>
                                    <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-transparent border-t-royalBlue animate-spin"></div>
                                </div>
                                {/* Loading text */}
                                <p className="mt-3 text-midnightNavy text-sm font-medium animate-pulse">
                                    Loading docket details...
                                </p>
                            </div>
                        ) : (
                            /* Full modal content - only shown when data is ready */
                            <>
                                <div className="bg-sky p-4 flex justify-between items-center">
                                    <div>
                                        <label className="block text-graphite text-sm font-semibold mb-1">
                                            Docket Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="CHR-VII-YEAR-NUMBER"
                                            value={docketNumber}
                                            onChange={(e) => setDocketNumber(e.target.value)}
                                            onFocus={handleDocketNumberFocus}
                                            onBlur={handleDocketNumberBlur}
                                            disabled={!isEditable || currentUserRole === 'investigation_chief'}
                                            className={`bg-white text-midnightNavy rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 ${(!isEditable || currentUserRole === 'investigation_chief') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-center">
                                            <label className="block text-graphite text-sm font-semibold mb-1">
                                                {status === 'Completed' ? 'Date Completed' : 'Days till deadline'}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                {status === 'Completed' ? (
                                                    <>
                                                        <Calendar className="w-6 h-6 text-deepNavy" />
                                                        <span className="text-deepNavy text-xl font-semibold">
                                                            {updatedAt || 'N/A'}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <img src="/icon22.png" alt="Time" className="w-6 h-6" />
                                                        <span className="text-deepNavy text-xl font-semibold">
                                                            {(() => {
                                                                if (!deadline) return 'N/A';
                                                                const [month, day, year] = deadline.split('/').map(Number);
                                                                if (!month || !day || !year) return 'N/A';

                                                                const deadlineDate = new Date(year, month - 1, day);
                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);

                                                                const diffTime = deadlineDate.getTime() - today.getTime();
                                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                                if (isNaN(diffDays)) return 'N/A';

                                                                const absDays = Math.abs(diffDays);
                                                                const dayString = absDays === 1 ? 'day' : 'days';
                                                                return `${diffDays} ${dayString}`;
                                                            })()}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-graphite text-sm font-semibold mb-1">
                                                Status
                                            </label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                disabled={isCompletedForOfficer}
                                                className={`bg-white text-midnightNavy rounded-full px-4 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isCompletedForOfficer ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="For Review">For Review</option>
                                                {(currentUserRole !== 'officer' || status === 'Completed') && <option value="Completed">Completed</option>}
                                            </select>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="text-royal hover:text-blue justify-self-end"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6 bg-snowWhite overflow-y-auto flex-1 custom-scrollbar">
                                    {!isEditable && currentUserRole !== 'officer' && (
                                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm font-medium">
                                            Non-pending status cannot be edited. Please change the status to Pending to make changes.
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-6 mb-6">
                                        {/* Row 1: Date Received, Type of Request, Category */}
                                        <div className="grid grid-cols-3 gap-6">
                                            {/* Date Received */}
                                            <div>
                                                <label className="block text-graphite text-sm font-semibold mb-2">
                                                    Date Received
                                                </label>
                                                <div className="relative flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="mm/dd/yyyy"
                                                        value={dateReceived}
                                                        onChange={handleDateReceivedChange}
                                                        disabled={!isEditable || currentUserRole === 'investigation_chief'}
                                                        className={`flex-1 text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${(!isEditable || currentUserRole === 'investigation_chief') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setShowCalendar(!showCalendar);
                                                            setShowDeadlineCalendar(false);
                                                        }}
                                                        disabled={!isEditable || currentUserRole === 'investigation_chief'}
                                                        className={`text-royal hover:text-ash ${(!isEditable || currentUserRole === 'investigation_chief') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <Calendar size={20} />
                                                    </button>
                                                    {showCalendar && renderCalendar('received')}
                                                </div>
                                            </div>

                                            {/* Type of Request */}
                                            <div>
                                                <label className="block text-graphite text-sm font-semibold mb-2">
                                                    Type of Request
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={typeOfRequest}
                                                        onChange={handleTypeOfRequestChange}
                                                        disabled={!isEditable}
                                                        style={{ appearance: 'none' }}
                                                        className={`w-full text-ash rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <option value="">Pick the Type of Request...</option>
                                                        {lookups.requestTypes.map((type) => (
                                                            <option key={type.id} value={type.id} className='text-black'>
                                                                {type.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <img src="/icon18.png" alt="Dropdown" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Category */}
                                            <div>
                                                <label className="block text-graphite text-sm font-semibold mb-2">
                                                    Category of Alleged Violation ({categories.filter(c => c.trim() !== '').length})
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter Category of Alleged..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                                                            e.preventDefault();
                                                            const newValue = e.currentTarget.value.trim();
                                                            if (!categories.includes(newValue)) {
                                                                setCategories([...categories.filter(c => c !== ''), newValue]);
                                                            }
                                                            e.currentTarget.value = '';
                                                        }
                                                    }}
                                                    disabled={!isEditable}
                                                    className={`w-full text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                />
                                                {categories.filter(c => c.trim() !== '').length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {categories.filter(c => c.trim() !== '').map((category, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center gap-1 px-2 py-1 border border-royal text-midnightNavy text-xs rounded-full"
                                                            >
                                                                {category}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setCategories(categories.filter((_, i) => i !== index))}
                                                                    disabled={!isEditable}
                                                                    className={`hover:text-blue ${!isEditable ? 'cursor-not-allowed' : ''}`}
                                                                >
                                                                    <XCircle size={14} className="text-royal" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 2: Deadline, Mode of Request, Rights */}
                                        <div className="grid grid-cols-3 gap-6">
                                            {/* Deadline */}
                                            <div>
                                                <label className="block text-graphite text-sm font-semibold mb-2">
                                                    Deadline
                                                </label>
                                                <div className="relative flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="mm/dd/yyyy"
                                                        value={deadline}
                                                        onChange={(e) => setDeadline(e.target.value)}
                                                        disabled={!isEditable}
                                                        className={`flex-1 text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowDeadlineCalendar(!showDeadlineCalendar);
                                                            setShowCalendar(false);
                                                        }}
                                                        disabled={!isEditable}
                                                        className={`text-royal hover:text-ash ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <Calendar size={20} />
                                                    </button>
                                                    {showDeadlineCalendar && renderCalendar('deadline')}
                                                </div>
                                            </div>

                                            {/* Mode of Request */}
                                            <div>
                                                <label className="block text-graphite text-sm font-semibold mb-2">
                                                    Mode of Request
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={modeOfRequest}
                                                        onChange={(e) => setModeOfRequest(e.target.value ? Number(e.target.value) : '')}
                                                        disabled={!isEditable}
                                                        style={{ appearance: 'none' }}
                                                        className={`w-full text-ash rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <option value="">Pick the Mode of Request...</option>
                                                        {lookups.requestModes.map((mode) => (
                                                            <option key={mode.id} value={mode.id} className='text-black'>
                                                                {mode.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <img src="/icon18.png" alt="Dropdown" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Rights */}
                                            <div>
                                                <label className="block text-graphite text-sm font-semibold mb-2">
                                                    Right(s) Violated ({rightsViolated.filter(r => r.trim() !== '').length})
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter Right(s) Violated..."
                                                    disabled={!isEditable}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                                                            e.preventDefault();
                                                            const newValue = e.currentTarget.value.trim();
                                                            if (!rightsViolated.includes(newValue)) {
                                                                setRightsViolated([...rightsViolated.filter(r => r !== ''), newValue]);
                                                            }
                                                            e.currentTarget.value = '';
                                                        }
                                                    }}
                                                    className={`w-full text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                />
                                                {rightsViolated.filter(r => r.trim() !== '').length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {rightsViolated.filter(r => r.trim() !== '').map((right, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center gap-1 px-2 py-1 border border-royal text-midnightNavy text-xs rounded-full"
                                                            >
                                                                {right}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRightsViolated(rightsViolated.filter((_, i) => i !== index))}
                                                                    disabled={!isEditable}
                                                                    className={`hover:text-blue ${!isEditable ? 'cursor-not-allowed' : ''}`}
                                                                >
                                                                    <XCircle size={14} className="text-royal" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 2: People (Complainants, Victims, Respondents) */}
                                        <div className="grid grid-cols-3 gap-6 items-start">
                                            {/* Complainants */}
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <label className="block text-graphite text-sm font-semibold">
                                                        Name of Complainant ({isMotuProprio ? 0 : complainants.filter(c => c.name.trim() !== '').length})
                                                    </label>
                                                    <button
                                                        onClick={addComplainantField}
                                                        disabled={!isEditable || isMotuProprio}
                                                        className={`text-royal hover:text-ash border border-royal rounded p-0.5 ${(!isEditable || isMotuProprio) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {(isMotuProprio ? [{ name: '', contactNumber: '' }] : complainants).map((comp, index) => (
                                                        <div key={index} className="flex gap-2 items-start">
                                                            <div className="flex-1 flex flex-col gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Name of Complainant"
                                                                    value={isMotuProprio ? '' : comp.name}
                                                                    onChange={(e) => !isMotuProprio && updateComplainant(index, 'name', e.target.value)}
                                                                    disabled={!isEditable || isMotuProprio}
                                                                    className={`w-full text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${(!isEditable || isMotuProprio) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Contact Number"
                                                                    value={isMotuProprio ? '' : comp.contactNumber}
                                                                    onChange={(e) => !isMotuProprio && updateComplainant(index, 'contactNumber', e.target.value)}
                                                                    disabled={!isEditable || isMotuProprio}
                                                                    className={`w-full text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${(!isEditable || isMotuProprio) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                />
                                                            </div>
                                                            {(isMotuProprio ? [{ name: '', contactNumber: '' }] : complainants).length > 1 && (
                                                                <button
                                                                    onClick={() => removeComplainant(index)}
                                                                    disabled={!isEditable || isMotuProprio}
                                                                    className={`text-royal hover:text-ash border border-royal rounded p-0.5 mt-2 ${(!isEditable || isMotuProprio) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Victims */}
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <label className="block text-graphite text-sm font-semibold">
                                                        Victims ({victims.filter(v => v.name.trim() !== '').length})
                                                    </label>
                                                    <button
                                                        onClick={addVictimField}
                                                        disabled={!isEditable}
                                                        className={`text-royal hover:text-ash border border-royal rounded p-0.5 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {victims.map((victim, index) => (
                                                        <div key={index} className="flex gap-2 items-start">
                                                            <div className="flex-1 flex flex-col gap-2 rounded-lg">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Name"
                                                                    value={victim.name}
                                                                    onChange={(e) => updateVictimName(index, e.target.value)}
                                                                    disabled={!isEditable}
                                                                    className={`w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />

                                                                {/* Multi-Select Dropdown for Victims */}
                                                                {renderSectorDropdown(
                                                                    'victim',
                                                                    index,
                                                                    victim.sectors,
                                                                    openVictimSectorDropdown === index,
                                                                    victimSectorSearch,
                                                                    filteredVictimSectors,
                                                                    () => setOpenVictimSectorDropdown(openVictimSectorDropdown === index ? null : index),
                                                                    setVictimSectorSearch,
                                                                    (sector) => toggleVictimSector(index, sector),
                                                                    victimDropdownRef,
                                                                    !isEditable
                                                                )}

                                                                {/* Selected Sectors Display */}
                                                                {victim.sectors.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {victim.sectors.map((sector) => (
                                                                            <span
                                                                                key={sector}
                                                                                className="inline-flex items-center gap-1 px-2 py-1 border border-royal text-midnightNavy text-xs rounded-full"
                                                                            >
                                                                                {sector}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleVictimSector(index, sector)}
                                                                                    disabled={!isEditable}
                                                                                    className={`hover:text-blue ${!isEditable ? 'cursor-not-allowed' : ''}`}
                                                                                >
                                                                                    <XCircle size={14} className="text-royal" />
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {victims.length > 1 && (
                                                                <button
                                                                    onClick={() => removeVictim(index)}
                                                                    disabled={!isEditable}
                                                                    className={`text-royal hover:text-ash border border-royal rounded p-0.5 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Respondents */}
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <label className="block text-graphite text-sm font-semibold">
                                                        Respondents ({respondents.filter(r => r.name.trim() !== '').length})
                                                    </label>
                                                    <button
                                                        onClick={addRespondentField}
                                                        disabled={!isEditable}
                                                        className={`text-royal hover:text-ash border border-royal rounded p-0.5 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {respondents.map((respondent, index) => (
                                                        <div key={index} className="flex gap-2 items-start">
                                                            <div className="flex-1 flex flex-col gap-2 rounded-lg">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Name"
                                                                    value={respondent.name}
                                                                    onChange={(e) => updateRespondentName(index, e.target.value)}
                                                                    disabled={!isEditable}
                                                                    className={`w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />

                                                                {/* Multi-Select Dropdown for Respondents */}
                                                                {renderSectorDropdown(
                                                                    'respondent',
                                                                    index,
                                                                    respondent.sectors,
                                                                    openRespondentSectorDropdown === index,
                                                                    respondentSectorSearch,
                                                                    filteredRespondentSectors,
                                                                    () => setOpenRespondentSectorDropdown(openRespondentSectorDropdown === index ? null : index),
                                                                    setRespondentSectorSearch,
                                                                    (sector) => toggleRespondentSector(index, sector),
                                                                    respondentDropdownRef,
                                                                    !isEditable
                                                                )}

                                                                {/* Selected Sectors Display */}
                                                                {respondent.sectors.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {respondent.sectors.map((sector) => (
                                                                            <span
                                                                                key={sector}
                                                                                className="inline-flex items-center gap-1 px-2 py-1 border border-royal text-midnightNavy text-xs rounded-full"
                                                                            >
                                                                                {sector}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleRespondentSector(index, sector)}
                                                                                    disabled={!isEditable}
                                                                                    className={`hover:text-blue ${!isEditable ? 'cursor-not-allowed' : ''}`}
                                                                                >
                                                                                    <XCircle size={14} className="text-royal" />
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {respondents.length > 1 && (
                                                                <button
                                                                    onClick={() => removeRespondent(index)}
                                                                    disabled={!isEditable}
                                                                    className={`text-royal hover:text-ash border border-royal rounded p-0.5 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 3: Staff */}
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <label className="block text-graphite text-sm font-semibold">
                                                        Staff-in-Charge ({staff.filter(s => s.userId.trim() !== '').length})
                                                    </label>
                                                    <button
                                                        onClick={addStaffField}
                                                        disabled={!isEditable}
                                                        className={`text-royal hover:text-ash border border-royal rounded p-0.5 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {staff.map((member, index) => (
                                                        <div key={index} className="flex gap-2 items-start">
                                                            <div className="flex-1 flex flex-col gap-2 rounded-lg">
                                                                <div className="relative" ref={openStaffDropdown === index ? staffDropdownRef : null}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setOpenStaffDropdown(openStaffDropdown === index ? null : index)}
                                                                        disabled={!isEditable}
                                                                        className={`w-full text-left text-ash bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex justify-between items-center ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <span className={`truncate ${member.userId ? 'text-black' : 'text-ash'}`}>
                                                                            {member.userId
                                                                                ? (() => {
                                                                                    const user = users.find(u => u.id === member.userId);
                                                                                    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
                                                                                })()
                                                                                : 'Assign the case to...'}
                                                                        </span>
                                                                        <img src="/icon18.png" alt="Dropdown" className="w-4 h-4" />
                                                                    </button>

                                                                    {openStaffDropdown === index && (
                                                                        <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                                                                            {/* Search Bar */}
                                                                            <div className="p-2 border-b">
                                                                                <div className="relative">
                                                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-royal" size={16} />
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="Search staff..."
                                                                                        value={staffSearch}
                                                                                        onChange={(e) => setStaffSearch(e.target.value)}
                                                                                        className="w-full pl-9 pr-3 py-2 text-black text-sm border border-royal rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            {/* Options */}
                                                                            <div className="max-h-60 overflow-y-auto">
                                                                                {users
                                                                                    .filter(user => {
                                                                                        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
                                                                                        return fullName.includes(staffSearch.toLowerCase());
                                                                                    })
                                                                                    .map((user) => (
                                                                                        <div
                                                                                            key={user.id}
                                                                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-black"
                                                                                            onClick={() => {
                                                                                                updateStaff(index, user.id);
                                                                                                setOpenStaffDropdown(null);
                                                                                                setStaffSearch('');
                                                                                            }}
                                                                                        >
                                                                                            {user.first_name} {user.last_name}
                                                                                        </div>
                                                                                    ))}
                                                                                {users.filter(user => `${user.first_name} ${user.last_name}`.toLowerCase().includes(staffSearch.toLowerCase())).length === 0 && (
                                                                                    <div className="px-4 py-2 text-sm text-gray-500">
                                                                                        No staff found
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <input
                                                                    type="email"
                                                                    value={member.email}
                                                                    readOnly
                                                                    placeholder="Email Address"
                                                                    className="w-full text-black rounded-lg px-4 py-2 focus:outline-none"
                                                                />
                                                            </div>
                                                            {staff.length > 1 && (
                                                                <button
                                                                    onClick={() => removeStaff(index)}
                                                                    disabled={!isEditable}
                                                                    className={`text-royal hover:text-ash border border-royal rounded p-0.5 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end items-center -mt-10 gap-2">
                                        <button
                                            onClick={handleSaveChanges}
                                            disabled={isSaving || isCompletedForOfficer}
                                            className={`bg-royalAzure text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-70 ${isCompletedForOfficer ? 'cursor-not-allowed' : ''}`}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                    Saving
                                                </>
                                            ) : (
                                                'Save Changes'
                                            )}
                                        </button>
                                        {currentUserRole === 'records_officer' && (
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-xl font-bold text-midnightNavy mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this docket? This action cannot be undone and all associated data will be removed.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        Deleting
                                    </>
                                ) : (
                                    'Delete Docket'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Success Modal */}
            {showDeleteSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
                    <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-xl">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-midnightNavy mb-2">Deleted Successfully</h3>
                        <p className="text-gray-600 mb-6">The docket has been permanently deleted.</p>
                        <button
                            onClick={() => {
                                setShowDeleteSuccess(false);
                                onClose();
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Error Modal */}
            {showDeleteError && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
                    <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-xl">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-midnightNavy mb-2">Deletion Failed</h3>
                        <p className="text-gray-600 mb-6">{deleteErrorMessage}</p>
                        <button
                            onClick={() => setShowDeleteError(false)}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Not Found / Unavailable Modal */}
            {showNotFoundModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
                    <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-xl">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-midnightNavy mb-2">Case Unavailable</h3>
                        <p className="text-gray-600 mb-6">
                            The case no longer exists or you are no longer assigned with the case.
                        </p>
                        <button
                            onClick={() => {
                                setShowNotFoundModal(false);
                                onClose();
                            }}
                            className="bg-royalAzure hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Save Success Modal */}
            {showSaveSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
                    <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-xl">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-midnightNavy mb-2">Saved Successfully</h3>
                        <p className="text-gray-600 mb-6">The docket has been updated successfully.</p>
                        <button
                            onClick={() => {
                                setShowSaveSuccess(false);
                                onClose();
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Save Error Modal */}
            {showSaveError && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-midnightNavy mb-2 text-center">Save Failed</h3>
                        <p className="text-gray-600 mb-4 text-center">Please fix the following errors:</p>
                        <ul className="text-left text-gray-700 mb-6 space-y-1 max-h-60 overflow-y-auto">
                            {saveErrorMessages.map((err, i) => (
                                <li key={i} className="text-sm">• {err}</li>
                            ))}
                        </ul>
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowSaveError(false)}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* No Changes Modal */}
            {showNoChanges && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
                    <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-xl">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-midnightNavy mb-2">No Changes Made</h3>
                        <p className="text-gray-600 mb-6">There are no changes to save.</p>
                        <button
                            onClick={() => setShowNoChanges(false)}
                            className="bg-royalAzure hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
