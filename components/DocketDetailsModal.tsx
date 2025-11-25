"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Calendar, Plus, ChevronDown, Search, XCircle } from 'lucide-react';
import { DocketLookups } from '@/lib/actions/docket-lookups';
import { getDocketDetails, checkDocketNumberExists } from '@/lib/actions/docket-queries';

interface DocketDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    docketId: string | null;
    users: any[];
    lookups: DocketLookups;
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

export default function DocketDetailsModal({ isOpen, onClose, docketId, users, lookups }: DocketDetailsModalProps) {
    const currentYear = new Date().getFullYear();
    const [isLoading, setIsLoading] = useState(false);

    const [originalDocketNumber, setOriginalDocketNumber] = useState('');
    const [docketNumber, setDocketNumber] = useState('');
    const [dateReceived, setDateReceived] = useState('');
    const [deadline, setDeadline] = useState('');
    const [typeOfRequest, setTypeOfRequest] = useState<number | ''>('');
    const [category, setCategory] = useState<number | ''>('');
    const [modeOfRequest, setModeOfRequest] = useState<number | ''>('');
    const [selectedRights, setSelectedRights] = useState<number[]>([]);
    const [status, setStatus] = useState<string>('Pending');

    // Updated state for Victims and Respondents - both support multiple sectors
    const [victims, setVictims] = useState<{ name: string; sectors: string[] }[]>([{ name: '', sectors: [] }]);
    const [respondents, setRespondents] = useState<{ name: string; sectors: string[] }[]>([]);

    // Staff state
    const [staff, setStaff] = useState<{ userId: string; email: string }[]>([{ userId: '', email: '' }]);

    const [showCalendar, setShowCalendar] = useState(false);
    const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Sector dropdown state for victims
    const [openVictimSectorDropdown, setOpenVictimSectorDropdown] = useState<number | null>(null);
    const [victimSectorSearch, setVictimSectorSearch] = useState('');
    const victimDropdownRef = useRef<HTMLDivElement>(null);

    // Sector dropdown state for respondents
    const [openRespondentSectorDropdown, setOpenRespondentSectorDropdown] = useState<number | null>(null);
    const [respondentSectorSearch, setRespondentSectorSearch] = useState('');
    const respondentDropdownRef = useRef<HTMLDivElement>(null);

    // Rights dropdown state
    const [openRightsDropdown, setOpenRightsDropdown] = useState(false);
    const [rightsSearch, setRightsSearch] = useState('');
    const rightsDropdownRef = useRef<HTMLDivElement>(null);

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
            if (rightsDropdownRef.current && !rightsDropdownRef.current.contains(event.target as Node)) {
                setOpenRightsDropdown(false);
                setRightsSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                setTypeOfRequest(details.typeOfRequestId);
                setCategory(details.categoryId || '');
                setModeOfRequest(details.modeOfRequestId);
                setSelectedRights(details.selectedRights);
                setVictims(details.victims.length > 0 ? details.victims : [{ name: '', sectors: [] }]);
                setRespondents(details.respondents.length > 0 ? details.respondents : []);
                setStaff(details.staff.length > 0 ? details.staff : [{ userId: '', email: '' }]);

                // Format status for display
                const docketStatus = details.status || 'PENDING';
                if (docketStatus === 'FOR REVIEW') {
                    setStatus('For Review');
                } else {
                    setStatus(docketStatus.charAt(0).toUpperCase() + docketStatus.slice(1).toLowerCase());
                }
            }
        } catch (error) {
            console.error("Failed to fetch docket details", error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setOriginalDocketNumber('');
        setDocketNumber('');
        setDateReceived('');
        setDeadline('');
        setTypeOfRequest('');
        setCategory('');
        setModeOfRequest('');
        setSelectedRights([]);
        setVictims([{ name: '', sectors: [] }]);
        setRespondents([]);
        setStaff([{ userId: '', email: '' }]);
        setStatus('Pending');
        setShowCalendar(false);
        setShowDeadlineCalendar(false);
    };

    // Rights Violated Handlers
    const toggleRight = (rightId: number) => {
        if (selectedRights.includes(rightId)) {
            setSelectedRights(selectedRights.filter(id => id !== rightId));
        } else {
            setSelectedRights([...selectedRights, rightId]);
        }
    };

    // Victim Handlers
    const addVictimField = () => {
        setVictims([...victims, { name: '', sectors: [] }]);
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
        setRespondents([...respondents, { name: '', sectors: [] }]);
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
        setStaff([...staff, { userId: '', email: '' }]);
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

        // Allow mm/dd/yyyy format with 1 or 2 digits for month and day
        const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = dateString.match(datePattern);

        if (!match) return false;

        const month = parseInt(match[1]);
        const day = parseInt(match[2]);
        const year = parseInt(match[3]);

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
        const errors: string[] = [];

        // 1. Validate Docket Number
        if (!docketNumber.trim()) {
            errors.push('Docket Number is required');
        } else {
            // Check format
            const pattern = new RegExp(`^CHR-VII-${currentYear}-\\d+$`);
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
            errors.push('Date Received must be in mm/dd/yyyy format');
        }

        // 3. Validate Deadline
        if (!deadline.trim()) {
            errors.push('Deadline is required');
        } else if (!validateDateFormat(deadline)) {
            errors.push('Deadline must be in mm/dd/yyyy format');
        }

        // 4. Validate Rights Violated
        if (selectedRights.length === 0) {
            errors.push('At least one Right Violated must be selected');
        }

        // 5. Validate Victims
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

        // 6. Validate Respondents (can be none, but if exists, must have sectors)
        const validRespondents = respondents.filter(r => r.name.trim() !== '');
        if (validRespondents.length > 0) {
            validRespondents.forEach((respondent, index) => {
                if (respondent.sectors.length === 0) {
                    errors.push(`Respondent "${respondent.name}" must have at least one sector associated`);
                }
            });
        }

        // 7. Validate Staff in Charge
        const assignedStaff = staff.filter(s => s.userId.trim() !== '');
        if (assignedStaff.length === 0) {
            errors.push('At least one Staff in Charge must be assigned');
        }

        // Show results
        if (errors.length > 0) {
            alert('Please fix the following errors:\n\n' + errors.map((err, i) => `${i + 1}. ${err}`).join('\n'));
        } else {
            alert('All validations passed! Ready to save changes.');
            // TODO: Implement actual save logic here
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

    const renderCalendar = (field: 'received' | 'deadline') => {
        const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
        const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
        const days = [];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push(
                <button
                    key={day}
                    onClick={() => handleDateSelect(day, field)}
                    className="p-2 hover:bg-blue-100 rounded text-sm"
                >
                    {day}
                </button>
            );
        }

        return (
            <div className="absolute text-midnightNavy top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 w-64">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setSelectedMonth(selectedMonth - 1)} className="p-1">←</button>
                    <span>{monthNames[selectedMonth]} {selectedYear}</span>
                    <button onClick={() => setSelectedMonth(selectedMonth + 1)} className="p-1">→</button>
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

    // Filter rights based on search
    const filteredRights = lookups.humanRights.filter(right =>
        right.name.toLowerCase().includes(rightsSearch.toLowerCase())
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
        dropdownRef: React.RefObject<HTMLDivElement>
    ) => (
        <div className="relative" ref={isOpen ? dropdownRef : null}>
            <button
                type="button"
                onClick={onToggle}
                className="w-full text-left text-gray-500 bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex justify-between items-center"
            >
                <span className="truncate">
                    {selectedSectors.length > 0
                        ? `${selectedSectors.length} selected`
                        : 'Pick the Sector...'}
                </span>
                <ChevronDown size={16} />
            </button>

            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {/* Search Bar */}
                    <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search sectors..."
                                value={searchValue}
                                onChange={(e) => onSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">{sector}</span>
                                </label>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                No sectors found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="bg-sky p-4 flex justify-between items-center border-b">
                            <div>
                                <label className="block text-graphite text-sm font-medium mb-2">
                                    Docket Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="CHR-VII-YEAR-NUMBER"
                                    value={docketNumber}
                                    onChange={(e) => setDocketNumber(e.target.value)}
                                    onFocus={handleDocketNumberFocus}
                                    onBlur={handleDocketNumberBlur}
                                    className="bg-white text-midnightNavy border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <div>
                                    <label className="block text-graphite text-sm font-medium mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="bg-white text-midnightNavy border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="For Review">For Review</option>
                                        <option value="Terminated">Terminated</option>
                                        <option value="Void">Void</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-royal hover:text-blue mt-6"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="p-12 text-center text-gray-500">
                                Loading details...
                            </div>
                        ) : (
                            <div className="p-6 bg-snow">
                                <div className="grid grid-cols-3 gap-6 mb-6">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <label className="block text-graphite text-sm font-medium mb-2">
                                                Date Received
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="mm/dd/yyyy"
                                                    value={dateReceived}
                                                    onChange={(e) => setDateReceived(e.target.value)}
                                                    className="flex-1 text-gray-600 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                    onClick={() => {
                                                        setShowCalendar(!showCalendar);
                                                        setShowDeadlineCalendar(false);
                                                    }}
                                                    className="text-royal hover:text-ash"
                                                >
                                                    <Calendar size={20} />
                                                </button>
                                            </div>
                                            {showCalendar && renderCalendar('received')}
                                        </div>

                                        <div className="relative">
                                            <label className="block text-graphite text-sm font-medium mb-2">
                                                Deadline
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="mm/dd/yyyy"
                                                    value={deadline}
                                                    onChange={(e) => setDeadline(e.target.value)}
                                                    className="flex-1 text-gray-600 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowDeadlineCalendar(!showDeadlineCalendar);
                                                        setShowCalendar(false);
                                                    }}
                                                    className="text-royal hover:text-ash"
                                                >
                                                    <Calendar size={20} />
                                                </button>
                                            </div>
                                            {showDeadlineCalendar && renderCalendar('deadline')}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="block text-graphite text-sm font-medium">
                                                    Victims ({victims.filter(v => v.name.trim() !== '').length})
                                                </label>
                                                <button
                                                    onClick={addVictimField}
                                                    className="text-royal hover:text-ash border border-royal rounded p-0.5"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {victims.map((victim, index) => (
                                                    <div key={index} className="flex gap-2 items-start">
                                                        <div className="flex-1 flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                            <input
                                                                type="text"
                                                                placeholder="Name"
                                                                value={victim.name}
                                                                onChange={(e) => updateVictimName(index, e.target.value)}
                                                                className="w-full text-gray-600 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                                victimDropdownRef
                                                            )}

                                                            {/* Selected Sectors Display */}
                                                            {victim.sectors.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {victim.sectors.map((sector) => (
                                                                        <span
                                                                            key={sector}
                                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                                                        >
                                                                            {sector}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleVictimSector(index, sector)}
                                                                                className="hover:text-blue-900"
                                                                            >
                                                                                <XCircle size={14} className="text-blue-600" />
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {victims.length > 1 && (
                                                            <button
                                                                onClick={() => removeVictim(index)}
                                                                className="text-royal hover:text-ash border border-royal rounded p-0.5"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="block text-graphite text-sm font-medium">
                                                    Staff-in-Charge ({staff.filter(s => s.userId.trim() !== '').length})
                                                </label>
                                                <button
                                                    onClick={addStaffField}
                                                    className="text-royal hover:text-ash border border-royal rounded p-0.5"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {staff.map((member, index) => (
                                                    <div key={index} className="flex gap-2 items-start">
                                                        <div className="flex-1 flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                            <select
                                                                value={member.userId}
                                                                onChange={(e) => updateStaff(index, e.target.value)}
                                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-ash"
                                                            >
                                                                <option value="">Assign the case to...</option>
                                                                {users.map((user) => (
                                                                    <option key={user.id} value={user.id}>
                                                                        {user.first_name} {user.last_name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <input
                                                                type="email"
                                                                value={member.email}
                                                                readOnly
                                                                placeholder="Email Address"
                                                                className="w-full text-gray-500 bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                                                            />
                                                        </div>
                                                        {staff.length > 1 && (
                                                            <button
                                                                onClick={() => removeStaff(index)}
                                                                className="text-royal hover:text-ash border border-royal rounded p-0.5"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-graphite text-sm font-medium mb-2">
                                                Type of Request
                                            </label>
                                            <select
                                                value={typeOfRequest}
                                                onChange={(e) => setTypeOfRequest(e.target.value ? Number(e.target.value) : '')}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-ash"
                                            >
                                                <option value="">Pick the type of Request...</option>
                                                {lookups.requestTypes.map((type) => (
                                                    <option key={type.id} value={type.id}>
                                                        {type.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-graphite text-sm font-medium mb-2">
                                                Mode of Request
                                            </label>
                                            <select
                                                value={modeOfRequest}
                                                onChange={(e) => setModeOfRequest(e.target.value ? Number(e.target.value) : '')}
                                                className="w-full text-gray-600 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Pick the mode...</option>
                                                {lookups.requestModes.map((mode) => (
                                                    <option key={mode.id} value={mode.id}>
                                                        {mode.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="block text-graphite text-sm font-medium">
                                                    Respondents ({respondents.filter(r => r.name.trim() !== '').length})
                                                </label>
                                                <button
                                                    onClick={addRespondentField}
                                                    className="text-royal hover:text-ash border border-royal rounded p-0.5"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {respondents.map((respondent, index) => (
                                                    <div key={index} className="flex gap-2 items-start">
                                                        <div className="flex-1 flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                            <input
                                                                type="text"
                                                                placeholder="Name"
                                                                value={respondent.name}
                                                                onChange={(e) => updateRespondentName(index, e.target.value)}
                                                                className="w-full text-gray-600 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                                respondentDropdownRef
                                                            )}

                                                            {/* Selected Sectors Display */}
                                                            {respondent.sectors.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {respondent.sectors.map((sector) => (
                                                                        <span
                                                                            key={sector}
                                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                                                        >
                                                                            {sector}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleRespondentSector(index, sector)}
                                                                                className="hover:text-blue-900"
                                                                            >
                                                                                <XCircle size={14} className="text-blue-600" />
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => removeRespondent(index)}
                                                            className="text-royal hover:text-ash border border-royal rounded p-0.5"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-graphite text-sm font-medium mb-2">
                                                Category of Alleged Violation
                                            </label>
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : '')}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-ash"
                                            >
                                                <option value="">Pick the category of alleged...</option>
                                                {lookups.violationCategories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="block text-graphite text-sm font-medium">
                                                    Right(s) Violated ({selectedRights.length})
                                                </label>
                                            </div>

                                            {/* Multi-Select Dropdown for Rights */}
                                            <div className="relative" ref={openRightsDropdown ? rightsDropdownRef : null}>
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenRightsDropdown(!openRightsDropdown)}
                                                    className="w-full text-left text-gray-500 bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex justify-between items-center"
                                                >
                                                    <span className="truncate">
                                                        {selectedRights.length > 0
                                                            ? `${selectedRights.length} selected`
                                                            : 'Pick the right(s) violated...'}
                                                    </span>
                                                    <ChevronDown size={16} />
                                                </button>

                                                {openRightsDropdown && (
                                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                                                        {/* Search Bar */}
                                                        <div className="p-2 border-b border-gray-200">
                                                            <div className="relative">
                                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search rights..."
                                                                    value={rightsSearch}
                                                                    onChange={(e) => setRightsSearch(e.target.value)}
                                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Scrollable Options */}
                                                        <div className="max-h-60 overflow-y-auto">
                                                            {filteredRights.length > 0 ? (
                                                                filteredRights.map((right) => (
                                                                    <label
                                                                        key={right.id}
                                                                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedRights.includes(right.id)}
                                                                            onChange={() => toggleRight(right.id)}
                                                                            className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                        />
                                                                        <span className="text-gray-700">{right.name}</span>
                                                                    </label>
                                                                ))
                                                            ) : (
                                                                <div className="px-3 py-2 text-sm text-gray-500">
                                                                    No rights found
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Selected Rights Display */}
                                            {selectedRights.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {selectedRights.map((rightId) => {
                                                        const right = lookups.humanRights.find(r => r.id === rightId);
                                                        return right ? (
                                                            <span
                                                                key={rightId}
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                                            >
                                                                {right.name}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleRight(rightId)}
                                                                    className="hover:text-blue-900"
                                                                >
                                                                    <XCircle size={14} className="text-blue-600" />
                                                                </button>
                                                            </span>
                                                        ) : null;
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                                <div className="flex justify-end gap-4 mt-6">
                                    <button
                                        onClick={handleSaveChanges}
                                        className="bg-soft text-coal px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
