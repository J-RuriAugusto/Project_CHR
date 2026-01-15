"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Calendar, Plus, ChevronDown, Search, XCircle } from 'lucide-react';
import { validateDocketForm, submitDocketForm } from '@/lib/utils/docket-form-helpers';
import { DocketLookups } from '@/lib/actions/docket-lookups';

interface DocketNewCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
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

export default function DocketNewCaseModal({ isOpen, onClose, users, lookups }: DocketNewCaseModalProps) {
    const currentYear = new Date().getFullYear();
    const [docketNumber, setDocketNumber] = useState('');
    const [dateReceived, setDateReceived] = useState(new Date().toLocaleDateString('en-US'));
    const [deadline, setDeadline] = useState(new Date().toLocaleDateString('en-US'));
    const [typeOfRequest, setTypeOfRequest] = useState<number | ''>('');
    const [modeOfRequest, setModeOfRequest] = useState<number | ''>('');
    const [complainants, setComplainants] = useState<{ name: string; contactNumber: string }[]>([{ name: '', contactNumber: '' }]);

    const [categories, setCategories] = useState<string[]>([]);
    const [rights, setRights] = useState<string[]>([]);

    // Updated state for Victims and Respondents - both support multiple sectors
    const [victims, setVictims] = useState<{ name: string; sectors: string[] }[]>([{ name: '', sectors: [] }]);
    const [respondents, setRespondents] = useState<{ name: string; sectors: string[] }[]>([{ name: '', sectors: [] }]);

    // Staff state
    const [staff, setStaff] = useState<{ userId: string; email: string }[]>([{ userId: '', email: '' }]);
    const [showCalendar, setShowCalendar] = useState(false);
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

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);

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
            // Small delay to allow render to update layout
            setTimeout(() => {
                victimDropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    }, [openVictimSectorDropdown]);

    // Scroll to respondent dropdown when opened
    useEffect(() => {
        if (openRespondentSectorDropdown !== null && respondentDropdownRef.current) {
            // Small delay to allow render to update layout
            setTimeout(() => {
                respondentDropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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

    // Calendar ref and scroll logic
    const calendarRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (showCalendar && calendarRef.current) {
            setTimeout(() => {
                calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [showCalendar]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setDocketNumber('');
        setDateReceived(new Date().toLocaleDateString('en-US'));
        setDeadline(new Date().toLocaleDateString('en-US'));
        setTypeOfRequest('');
        setComplainants([{ name: '', contactNumber: '' }]);

        setCategories(['']);
        setModeOfRequest('');
        setRights(['']);
        setVictims([{ name: '', sectors: [] }]);
        setRespondents([{ name: '', sectors: [] }]);
        setStaff([{ userId: '', email: '' }]);
        setShowCalendar(false);
    };

    // Calculate deadline based on request type and date received
    const calculateDeadline = (dateReceivedStr: string, typeId: number | '') => {
        if (!dateReceivedStr || typeId === '') return;

        const requestType = lookups.requestTypes.find(t => t.id === typeId);
        if (!requestType) return;

        const receivedDate = new Date(dateReceivedStr);
        if (isNaN(receivedDate.getTime())) return;

        // Add 1 day to start counting from the next day
        const startDate = new Date(receivedDate);
        startDate.setDate(startDate.getDate() + 1);

        let daysToAdd = 0;
        if (requestType.name === 'Legal Assistance / OPS') {
            daysToAdd = 120;
        } else if (requestType.name === 'Legal Investigation') {
            daysToAdd = 60;
        } else {
            return; // Don't autofill for other types
        }

        const deadlineDate = new Date(startDate);
        deadlineDate.setDate(deadlineDate.getDate() + daysToAdd);

        setDeadline(deadlineDate.toLocaleDateString('en-US'));
    };

    // Effect to trigger calculation when dependencies change
    useEffect(() => {
        calculateDeadline(dateReceived, typeOfRequest);
    }, [dateReceived, typeOfRequest]);

    // Category Handlers
    // const addCategory = () => {
    //     const lastCategory = categories[categories.length - 1];
    // Only add if the last category has content
    //     if (lastCategory && lastCategory.trim() !== '') {
    //         setCategories([...categories, '']);
    //     }
    // };
    // const updateCategory = (index: number, value: string) => {
    //     const newCategories = [...categories];
    //     newCategories[index] = value;
    //     setCategories(newCategories);
    // };
    // const removeCategory = (index: number) => {
    //     if (categories.length > 1) {
    //         setCategories(categories.filter((_, i) => i !== index));
    //     }
    // };

    // Rights Handlers
    // const addRight = () => {
    //     const lastRight = rights[rights.length - 1];
    // Only add if the last right has content
    //     if (lastRight && lastRight.trim() !== '') {
    //         setRights([...rights, '']);
    //     }
    // };
    // const updateRight = (index: number, value: string) => {
    //     const newRights = [...rights];
    //     newRights[index] = value;
    //     setRights(newRights);
    // };
    // const removeRight = (index: number) => {
    //     if (rights.length > 1) {
    //         setRights(rights.filter((_, i) => i !== index));
    //     }
    // };

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

    const handleSubmit = async () => {
        setIsSubmitting(true);

        // Validate form
        const errors = await validateDocketForm({
            docketNumber,
            dateReceived,
            deadline,
            typeOfRequest,
            violationCategory: categories,
            complainants,

            modeOfRequest,
            rightsViolated: rights,
            victims,
            respondents,
            staff
        }, lookups.requestModes.find(m => m.id === modeOfRequest)?.name === 'Motu Proprio');

        // If there are errors, show error modal and stop
        if (Object.keys(errors).length > 0) {
            setErrorMessages(Object.values(errors));
            setShowErrorModal(true);
            setIsSubmitting(false);
            return;
        }

        // Submit form
        const result = await submitDocketForm({
            docketNumber,
            dateReceived,
            deadline,
            typeOfRequest,
            violationCategory: categories,
            complainants,
            modeOfRequest,
            rightsViolated: rights,
            victims,
            respondents,
            staff
        });

        setIsSubmitting(false);

        if (result.success) {
            setShowSuccessModal(true);
        } else {
            setErrorMessages([result.message || 'An unexpected error occurred']);
            setShowErrorModal(true);
        }
    };

    // Calendar logic
    const getDaysInMonth = (month: number, year: number): number => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number): number => {
        return new Date(year, month, 1).getDay();
    };

    const handleDateSelect = (day: number) => {
        const formattedDate = new Date(selectedYear, selectedMonth, day).toLocaleDateString('en-US');

        if (calendarMode === 'dateReceived') {
            setDateReceived(formattedDate);
            setShowCalendar(false);
        } else if (calendarMode === 'deadline') {
            setDeadline(formattedDate);
            setShowCalendar(false);
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

    const renderCalendar = () => {
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
                    onClick={() => handleDateSelect(day)}
                    className={buttonClass}
                >
                    {day}
                </button>
            );
        }

        return (
            <div ref={calendarRef} className="absolute text-midnightNavy top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 w-80">
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
        dropdownRef: React.RefObject<HTMLDivElement>
    ) => (
        <div className="relative" ref={isOpen ? dropdownRef : null}>
            <button
                type="button"
                onClick={onToggle}
                className="w-full text-left text-ash bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex justify-between items-center"
            >
                <span className="truncate">
                    {selectedSectors.length > 0
                        ? `Sector (${selectedSectors.length} applied)`
                        : 'Sector (0 applied)'}
                </span>
                <img src="/icon18.png" alt="Dropdown" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </button>

            {isOpen && (
                <div className="relative w-full mt-1 bg-white rounded-lg shadow-lg">
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

    return (
        <div>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="bg-sky p-4 flex justify-between items-center">
                            <div>
                                <label className="block text-graphite text-sm font-semibold mb-2">
                                    Docket Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="CHR-VII-YEAR-NUMBER"
                                    value={docketNumber}
                                    onChange={(e) => setDocketNumber(e.target.value)}
                                    onFocus={handleDocketNumberFocus}
                                    onBlur={handleDocketNumberBlur}
                                    className="bg-white text-midnightNavy rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                onClick={onClose}
                                className="text-royal hover:text-blue"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 bg-snowWhite overflow-y-auto flex-1 custom-scrollbar">
                            <div className="flex flex-col gap-6 mb-6">
                                {/* Row 1: Dates, Request Types, Categories/Rights */}
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
                                                value={dateReceived || ''}
                                                placeholder='mm/dd/yyyy'
                                                onChange={(e) => setDateReceived(e.target.value)}
                                                className="flex-1 text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => {
                                                    setCalendarMode('dateReceived');
                                                    setShowCalendar(!showCalendar);
                                                }}
                                                className="text-royal hover:text-ash"
                                            >
                                                <img src="/icon20.png" alt="Calendar" className="w-5 h-5" />
                                            </button>
                                            {showCalendar && calendarMode === 'dateReceived' && renderCalendar()}
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
                                                onChange={(e) => {
                                                    const newTypeId = e.target.value ? Number(e.target.value) : '';
                                                    setTypeOfRequest(newTypeId);

                                                    // Auto-calculate deadline based on request type
                                                    if (newTypeId && dateReceived) {
                                                        const selectedType = lookups.requestTypes.find(t => t.id === newTypeId);
                                                        if (selectedType) {
                                                            const receivedDate = new Date(dateReceived);
                                                            if (!isNaN(receivedDate.getTime())) {
                                                                // Check if it's Legal Investigation (60 days) or Legal Assistance/OPS (120 days)
                                                                const daysToAdd = selectedType.name === 'Legal Investigation' ? 60 : 120;
                                                                const deadlineDate = new Date(receivedDate);
                                                                deadlineDate.setDate(deadlineDate.getDate() + daysToAdd);
                                                                setDeadline(deadlineDate.toLocaleDateString('en-US'));
                                                            }
                                                        }
                                                    }
                                                }}
                                                style={{ appearance: 'none' }}
                                                className="w-full text-ash rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                            className="hover:text-blue"
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
                                                placeholder='mm/dd/yyyy'
                                                value={deadline || ''}
                                                onChange={(e) => setDeadline(e.target.value)}
                                                className="flex-1 text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => {
                                                    setCalendarMode('deadline');
                                                    setShowCalendar(!showCalendar);
                                                }}
                                                className="text-royal hover:text-ash"
                                            >
                                                <img src="/icon20.png" alt="Calendar" className="w-5 h-5" />
                                            </button>
                                            {showCalendar && calendarMode === 'deadline' && renderCalendar()}
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
                                                onChange={(e) => {
                                                    const newModeId = e.target.value ? Number(e.target.value) : '';
                                                    setModeOfRequest(newModeId);

                                                    // Check if Motu Proprio
                                                    const selectedMode = lookups.requestModes.find(m => m.id === newModeId);
                                                    if (selectedMode?.name === 'Motu Proprio') {
                                                        setComplainants([{ name: '', contactNumber: '' }]);
                                                    }
                                                }}
                                                style={{ appearance: 'none' }}
                                                className="w-full text-ash rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            Right(s) Violated ({rights.filter(r => r.trim() !== '').length})
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter Right(s) Violated..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                                                    e.preventDefault();
                                                    const newValue = e.currentTarget.value.trim();
                                                    if (!rights.includes(newValue)) {
                                                        setRights([...rights.filter(r => r !== ''), newValue]);
                                                    }
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                            className="w-full text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {rights.filter(r => r.trim() !== '').length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {rights.filter(r => r.trim() !== '').map((right, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-1 px-2 py-1 border border-royal text-midnightNavy text-xs rounded-full"
                                                    >
                                                        {right}
                                                        <button
                                                            type="button"
                                                            onClick={() => setRights(rights.filter((_, i) => i !== index))}
                                                            className="hover:text-blue"
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
                                                Name of Complainant ({complainants.filter(c => c.name.trim() !== '').length})
                                            </label>
                                            <button
                                                onClick={addComplainantField}
                                                disabled={lookups.requestModes.find(m => m.id === modeOfRequest)?.name === 'Motu Proprio'}
                                                className={`text-royal hover:text-ash border border-royal rounded p-0.5 ${lookups.requestModes.find(m => m.id === modeOfRequest)?.name === 'Motu Proprio' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {complainants.map((comp, index) => (
                                                <div key={index} className="flex gap-2 items-start">
                                                    <div className="flex-1 flex flex-col gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Name of Complainant"
                                                            value={comp.name}
                                                            onChange={(e) => updateComplainant(index, 'name', e.target.value)}
                                                            disabled={lookups.requestModes.find(m => m.id === modeOfRequest)?.name === 'Motu Proprio'}
                                                            className={`w-full text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${lookups.requestModes.find(m => m.id === modeOfRequest)?.name === 'Motu Proprio' ? 'bg-gray-100' : ''}`}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Contact Number"
                                                            value={comp.contactNumber}
                                                            onChange={(e) => updateComplainant(index, 'contactNumber', e.target.value)}
                                                            disabled={lookups.requestModes.find(m => m.id === modeOfRequest)?.name === 'Motu Proprio'}
                                                            className={`w-full text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${lookups.requestModes.find(m => m.id === modeOfRequest)?.name === 'Motu Proprio' ? 'bg-gray-100' : ''}`}
                                                        />
                                                    </div>
                                                    {complainants.length > 1 && (
                                                        <button
                                                            onClick={() => removeComplainant(index)}
                                                            className="text-royal hover:text-ash border border-royal rounded p-0.5 mt-2"
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
                                                className="text-royal hover:text-ash border border-royal rounded p-0.5"
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
                                                            className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                                        className="inline-flex items-center gap-1 px-2 py-1 border border-royal text-midnightNavy text-xs rounded-full"
                                                                    >
                                                                        {sector}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleVictimSector(index, sector)}
                                                                            className="hover:text-blue"
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
                                                            className="text-royal hover:text-ash border border-royal rounded p-0.5"
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
                                                className="text-royal hover:text-ash border border-royal rounded p-0.5"
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
                                                            className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                                        className="inline-flex items-center gap-1 px-2 py-1 border border-royal text-midnightNavy text-xs rounded-full"
                                                                    >
                                                                        {sector}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleRespondentSector(index, sector)}
                                                                            className="hover:text-blue"
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

                                {/* Row 3: Staff */}
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <label className="block text-graphite text-sm font-semibold">
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
                                                    <div className="flex-1 flex flex-col gap-2 rounded-lg">
                                                        <div className="relative" ref={openStaffDropdown === index ? staffDropdownRef : null}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setOpenStaffDropdown(openStaffDropdown === index ? null : index)}
                                                                className="w-full text-left text-ash bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex justify-between items-center"
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
                            </div>

                            <div className="flex justify-end -mt-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`bg-royalAzure hover:bg-highlight text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit for Docketing'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-xl">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-midnightNavy mb-2">Success!</h3>
                        <p className="text-gray-600 mb-6">Docket has been submitted successfully.</p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                onClose();
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-midnightNavy mb-2 text-center">Please Fix the Following Errors</h3>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-h-60 overflow-y-auto">
                            <ul className="list-disc list-inside space-y-1">
                                {errorMessages.map((error, index) => (
                                    <li key={index} className="text-red-700 text-sm">{error}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
