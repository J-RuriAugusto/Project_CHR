"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Calendar, Plus, ChevronDown, Search, XCircle } from 'lucide-react';
import { DocketLookups } from '@/lib/actions/docket-lookups';

interface DocketCaseModalProps {
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

export default function DocketCaseModal({ isOpen, onClose, users, lookups }: DocketCaseModalProps) {
    const currentYear = new Date().getFullYear();
    const [docketNumber, setDocketNumber] = useState('');
    const [dateReceived, setDateReceived] = useState(new Date().toLocaleDateString('en-US'));
    const [deadline, setDeadline] = useState(new Date().toLocaleDateString('en-US'));
    const [typeOfRequest, setTypeOfRequest] = useState<number | ''>('');
    const [category, setCategory] = useState<number | ''>('');
    const [modeOfRequest, setModeOfRequest] = useState<number | ''>('');
    const [selectedRights, setSelectedRights] = useState<number[]>([]);

    // Updated state for Victims and Respondents - both support multiple sectors
    // Initialize victims with one empty field
    const [victims, setVictims] = useState<{ name: string; sectors: string[] }[]>([{ name: '', sectors: [] }]);
    const [respondents, setRespondents] = useState<{ name: string; sectors: string[] }[]>([]);

    // Staff state
    const [staff, setStaff] = useState<{ userId: string; email: string }[]>([{ userId: '', email: '' }]);

    const [showCalendar, setShowCalendar] = useState(false);
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

    const handleSubmit = () => {
        console.log('Submitting case...');
        console.log({
            docketNumber,
            dateReceived,
            deadline,
            typeOfRequest,
            category,
            modeOfRequest,
            selectedRights,
            victims,
            respondents,
            staff
        });
    };

    const handleSaveChanges = () => {
        console.log('Saving changes...');
    };

    // Calendar logic
    const getDaysInMonth = (month: number, year: number): number => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number): number => {
        return new Date(year, month, 1).getDay();
    };

    const handleDateSelect = (day: number) => {
        const selectedDate = new Date(selectedYear, selectedMonth, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            alert("Date received cannot be in the future.");
            return;
        }

        const formattedDate = selectedDate.toLocaleDateString('en-US');
        setDateReceived(formattedDate);
        setShowCalendar(false);
    };

    const renderCalendar = () => {
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
                    onClick={() => handleDateSelect(day)}
                    className="p-2 hover:bg-blue-100 rounded text-sm"
                >
                    {day}
                </button>
            );
        }

        return (
            <div className="absolute text-midnightNavy top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10">
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
                            <button
                                onClick={onClose}
                                className="text-royal hover:text-blue"
                            >
                                <X size={24} />
                            </button>
                        </div>

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
                                                onBlur={() => {
                                                    const d = new Date(dateReceived);
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    if (!isNaN(d.getTime()) && d > today) {
                                                        alert("Date received cannot be in the future.");
                                                        setDateReceived(today.toLocaleDateString('en-US'));
                                                    }
                                                }}
                                                className="flex-1 text-gray-600 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => setShowCalendar(!showCalendar)}
                                                className="text-royal hover:text-ash"
                                            >
                                                <Calendar size={20} />
                                            </button>
                                        </div>
                                        {showCalendar && renderCalendar()}
                                    </div>

                                    <div>
                                        <label className="block text-graphite text-sm font-medium mb-2">
                                            Deadline
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="mm/dd/yyyy"
                                                value={deadline}
                                                onChange={(e) => setDeadline(e.target.value)}
                                                onBlur={() => {
                                                    const d = new Date(deadline);
                                                    const r = new Date(dateReceived);
                                                    if (!isNaN(d.getTime()) && !isNaN(r.getTime()) && d < r) {
                                                        alert("Deadline cannot be before Date Received.");
                                                        setDeadline('');
                                                    }
                                                }}
                                                className="flex-1 text-gray-600 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                className="text-royal hover:text-ash"
                                            >
                                                <Calendar size={20} />
                                            </button>
                                        </div>
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

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={handleSubmit}
                                    className="bg-royalAzure text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Submit for Docketing
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    className="bg-soft text-coal px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}