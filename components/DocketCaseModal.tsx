"use client";

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface DocketCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DocketCaseModal({ isOpen, onClose }: DocketCaseModalProps) {
    const [docketNumber, setDocketNumber] = useState('');
    const [dateReceived, setDateReceived] = useState('');
    const [deadline, setDeadline] = useState('');
    const [typeOfRequest, setTypeOfRequest] = useState('');
    const [category, setCategory] = useState('');
    const [modeOfRequest, setModeOfRequest] = useState('Motu Proprio');
    const [rightsViolated, setRightsViolated] = useState<string[]>([]);
    const [currentRight, setCurrentRight] = useState<string>('');
    const [victims, setVictims] = useState<Array<{name: string, sector: string}>>([]);
    const [currentVictim, setCurrentVictim] = useState<string>('');
    const [currentVictimSector, setCurrentVictimSector] = useState('');
    const [showVictimInput, setShowVictimInput] = useState(false);
    const [respondents, setRespondents] = useState<Array<{name: string, sector: string}>>([]);
    const [currentRespondent, setCurrentRespondent] = useState<string>('');
    const [currentRespondentSector, setCurrentRespondentSector] = useState('');
    const [showRespondentInput, setShowRespondentInput] = useState(false);
    const [staffList, setStaffList] = useState<Array<{name: string, email: string}>>([]);
    const [currentStaff, setCurrentStaff] = useState('');
    const [currentStaffEmail, setCurrentStaffEmail] = useState('');
    const [showStaffInput, setShowStaffInput] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [calendarMode, setCalendarMode] = useState<'dateReceived' | 'deadline'>('dateReceived');


    const addRightViolated = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentRight.trim()) {
            setRightsViolated([...rightsViolated, currentRight.trim()]);
            setCurrentRight('');
        }
    };

    const removeRight = (index: number) => {
        setRightsViolated(rightsViolated.filter((_, i) => i !== index));
    };

    const addVictim = () => {
        if (currentVictim.trim() && currentVictimSector) {
            setVictims([...victims, { name: currentVictim.trim(), sector: currentVictimSector }]);
            setCurrentVictim('');
            setCurrentVictimSector('');
            setShowVictimInput(false);
        }
    };

    const removeVictim = (index: number) => {
        setVictims(victims.filter((_, i) => i !== index));
    };

    const addRespondent = () => {
        if (currentRespondent.trim() && currentRespondentSector) {
            setRespondents([...respondents, { name: currentRespondent.trim(), sector: currentRespondentSector }]);
            setCurrentRespondent('');
            setCurrentRespondentSector('');
            setShowRespondentInput(false);
        }
    };

    const removeRespondent = (index: number) => {
        setRespondents(respondents.filter((_, i) => i !== index));
    };

    const addStaff = () => {
        if (currentStaff.trim() && currentStaffEmail.trim()) {
            setStaffList([...staffList, { name: currentStaff.trim(), email: currentStaffEmail.trim() }]);
            setCurrentStaff('');
            setCurrentStaffEmail('');
            setShowStaffInput(false);
        }
    };

    const handleSubmit = () => {
        console.log('Submitting case...');
    };

    const handleSaveChanges = () => {
        console.log('Saving changes...');
    };

    const getDaysInMonth = (month: number, year: number): number => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number): number => {
        return new Date(year, month, 1).getDay();
    };

    const handleDateSelect = (day: number) => {
        const formattedDate = new Date(selectedYear, selectedMonth, day).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

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
        const checkDate = new Date(selectedYear, selectedMonth, day).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
        return checkDate === dateReceived;
    };

    const isDeadline = (day: number) => {
        if (!deadline) return false;
        const checkDate = new Date(selectedYear, selectedMonth, day).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
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
            <div className="absolute text-midnightNavy top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 w-80">
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
                        ←
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
                        →
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

    return (
        <div>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="bg-sky p-4 flex justify-between items-center border-b">
                            <input
                                type="text"
                                placeholder="Input Docket number..."
                                value={docketNumber}
                                onChange={(e) => setDocketNumber(e.target.value)}
                                className="bg-white text-midnightNavy rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={onClose}
                                className="text-royal hover:text-blue"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 bg-snow">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="block text-graphite text-sm font-semibold mb-2">
                                            Date Received
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={dateReceived || 'Nov 18, 2025'}
                                                onChange={(e) => setDateReceived(e.target.value)}
                                                className="flex-1 text-black border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky"
                                            />
                                            <button
                                                onClick={() => {
                                                    setCalendarMode('dateReceived');
                                                    setShowCalendar(!showCalendar);
                                                }}
                                                className="text-royal hover:text-ash"
                                            >
                                                <img src="/icon17.png" alt="Calendar" className="w-5 h-5" />
                                            </button>
                                        </div>
                                        {showCalendar && renderCalendar()}
                                    </div>

                                    <div>
                                        <label className="block text-graphite text-sm font-semibold mb-2">
                                            Deadline
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={deadline || 'Feb 24, 2026'}
                                                onChange={(e) => setDeadline(e.target.value)}
                                                className="flex-1 text-black border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky"
                                            />
                                            <button
                                                onClick={() => {
                                                    setCalendarMode('deadline');
                                                    setShowCalendar(!showCalendar);
                                                }}
                                                className="text-royal hover:text-ash"
                                            >
                                                <img src="/icon17.png" alt="Calendar" className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <label className="block text-graphite text-sm font-semibold">
                                                Victims
                                            </label>
                                            <button 
                                                onClick={() => setShowVictimInput(!showVictimInput)}
                                                className="text-royal hover:text-ash border border-royal rounded p-0.5 mt-0.5"
                                            >
                                                {showVictimInput ? <X size={16} /> : <Plus size={16} />}
                                            </button>
                                        </div>
                                        {showVictimInput && (
                                            <div className="space-y-3 mb-3">
                                                <input
                                                    type="text"
                                                    placeholder="Name"
                                                    value={currentVictim}
                                                    onChange={(e) => setCurrentVictim(e.target.value)}
                                                    className="w-full text-black border-2 border-blue-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky"
                                                />
                                                <div>
                                                    <label className="block text-graphite text-xs font-semibold mb-1">
                                                        Sector
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            value={currentVictimSector}
                                                            onChange={(e) => setCurrentVictimSector(e.target.value)}
                                                            className="w-full border-2 border-blue-500 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-sky text-sm appearance-none"
                                                            style={{ color: currentVictimSector ? 'black' : '#9CA3AF' }}
                                                        >
                                                            <option value="">Pick the Sector the Victim belongs...</option>
                                                            <option value="Women">Women</option>
                                                            <option value="Children">Children</option>
                                                            <option value="Indigenous Peoples">Indigenous Peoples</option>
                                                            <option value="Workers">Workers</option>
                                                        </select>
                                                        <img src="/icon16.png" alt="Dropdown" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={addVictim}
                                                    className="w-full bg-royalAzure text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
                                                >
                                                    Add Victim
                                                </button>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            {victims.map((victim, index) => (
                                                <div key={index} className="bg-white border-2 border-royal rounded-lg px-3 py-2">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="text-xs text-graphite font-semibold mb-1">Name</div>
                                                            <div className="text-sm text-black pl-4">{victim.name}</div>
                                                            <div className="text-xs text-graphite font-semibold mt-2 mb-1">Sector</div>
                                                            <div className="text-sm text-black pl-4">{victim.sector}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeVictim(index)}
                                                            className="text-royal hover:text-ash border border-royal rounded-full p-0.5"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <label className="block text-graphite text-sm font-semibold">
                                                Staff-in-Charge
                                            </label>
                                            <button 
                                                onClick={() => setShowStaffInput(!showStaffInput)}
                                                className="text-royal hover:text-blue-700 border border-royal rounded p-0.5 mt-0.5"
                                            >
                                                {showStaffInput ? <X size={16} /> : <Plus size={16} />}
                                            </button>
                                        </div>
                                        {showStaffInput && (
                                            <div className="space-y-3 mb-3">
                                                <input
                                                    type="text"
                                                    placeholder="Name"
                                                    value={currentStaff}
                                                    onChange={(e) => setCurrentStaff(e.target.value)}
                                                    className="w-full text-black border-2 border-blue-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky"
                                                />
                                                <div>
                                                    <label className="block text-graphite text-xs font-semibold mb-1">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        placeholder="Email Address"
                                                        value={currentStaffEmail}
                                                        onChange={(e) => setCurrentStaffEmail(e.target.value)}
                                                        className="w-full text-black border-2 border-blue-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky"
                                                    />
                                                </div>
                                                <button
                                                    onClick={addStaff}
                                                    className="w-full bg-royalAzure text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
                                                >
                                                    Add Staff
                                                </button>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            {staffList.map((staff, index) => (
                                                <div key={index} className="bg-white border-2 border-royal rounded-lg px-3 py-2">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="text-xs text-graphite font-semibold mb-1">Name</div>
                                                            <div className="text-sm text-black pl-4">{staff.name}</div>
                                                            <div className="text-xs text-graphite font-semibold mt-2 mb-1">Email Address</div>
                                                            <div className="text-sm text-black pl-4">{staff.email}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => setStaffList(staffList.filter((_, i) => i !== index))}
                                                            className="text-royal hover:text-ash border border-royal rounded-full p-0.5"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-graphite text-sm font-semibold mb-2">
                                            Type of Request
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={typeOfRequest}
                                                onChange={(e) => setTypeOfRequest(e.target.value)}
                                                className="w-full border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-sky appearance-none"
                                                style={{ color: typeOfRequest ? 'black' : '#9CA3AF' }}
                                            >
                                                <option value="">Pick the type of Request...</option>
                                                <option value="complaint">Complaint</option>
                                                <option value="inquiry">Inquiry</option>
                                                <option value="request">Request for Assistance</option>
                                            </select>
                                            <img src="/icon16.png" alt="Dropdown" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-graphite text-sm font-semibold mb-2">
                                            Mode of Request
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={modeOfRequest}
                                                onChange={(e) => setModeOfRequest(e.target.value)}
                                                className="w-full text-black border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-sky appearance-none"
                                            >
                                                <option value="Motu Proprio">Motu Proprio</option>
                                                <option value="Walk-in">Walk-in</option>
                                                <option value="Email">Email</option>
                                                <option value="Letter">Letter</option>
                                            </select>
                                            <img src="/icon16.png" alt="Dropdown" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <label className="block text-graphite text-sm font-semibold">
                                                Respondents
                                            </label>
                                            <button 
                                                onClick={() => setShowRespondentInput(!showRespondentInput)}
                                                className="text-royal hover:text-ash border border-royal rounded p-0.5 mt-0.5"
                                            >
                                                {showRespondentInput ? <X size={16} /> : <Plus size={16} />}
                                            </button>
                                        </div>
                                        {showRespondentInput && (
                                            <div className="space-y-3 mb-3">
                                                <input
                                                    type="text"
                                                    placeholder="Name"
                                                    value={currentRespondent}
                                                    onChange={(e) => setCurrentRespondent(e.target.value)}
                                                    className="w-full text-black border-2 border-blue-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky"
                                                />
                                                <div>
                                                    <label className="block text-graphite text-xs font-semibold mb-1">
                                                        Sector
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            value={currentRespondentSector}
                                                            onChange={(e) => setCurrentRespondentSector(e.target.value)}
                                                            className="w-full border-2 border-blue-500 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-sky text-sm appearance-none"
                                                            style={{ color: currentRespondentSector ? 'black' : '#9CA3AF' }}
                                                        >
                                                            <option value="">Pick the Sector the Respondent belongs...</option>
                                                            <option value="Government Officials">Government Officials</option>
                                                            <option value="Law Enforcement">Law Enforcement</option>
                                                            <option value="Private Sector">Private Sector</option>
                                                            <option value="Military">Military</option>
                                                        </select>
                                                        <img src="/icon16.png" alt="Dropdown" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={addRespondent}
                                                    className="w-full bg-royalAzure text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
                                                >
                                                    Add Respondent
                                                </button>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            {respondents.map((respondent, index) => (
                                                <div key={index} className="bg-white border-2 border-royal rounded-lg px-3 py-2">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="text-xs text-graphite font-semibold mb-1">Name</div>
                                                            <div className="text-sm text-black pl-4">{respondent.name}</div>
                                                            <div className="text-xs text-graphite font-semibold mt-2 mb-1">Sector</div>
                                                            <div className="text-sm text-black pl-4">{respondent.sector}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeRespondent(index)}
                                                            className="text-royal hover:text-ash border border-royal rounded-full p-0.5"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-graphite text-sm font-semibold mb-2">
                                            Category of Alleged Violation
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-sky appearance-none"
                                                style={{ color: category ? 'black' : '#9CA3AF' }}
                                            >
                                                <option value="">Pick the category of alleged...</option>
                                                <option value="civil">Civil and Political Rights</option>
                                                <option value="economic">Economic, Social and Cultural Rights</option>
                                                <option value="collective">Collective Rights</option>
                                            </select>
                                            <img src="/icon16.png" alt="Dropdown" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-graphite text-sm font-semibold mb-2">
                                            Right(s) Violated
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Specify the alleged right(s) violated..."
                                            value={currentRight}
                                            onChange={(e) => setCurrentRight(e.target.value)}
                                            onKeyPress={addRightViolated}
                                            className="w-full text-black border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky text-sm placeholder-ash"
                                        />
                                        <div className="mt-2 space-y-2">
                                            {rightsViolated.map((right, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-white border border-2 border-royal text-black px-3 py-2 rounded-lg flex items-center justify-between"
                                                >
                                                    <span className="text-sm">{right}</span>
                                                    <button
                                                        onClick={() => removeRight(index)}
                                                        className="text-royal hover:text-ash border border-royal rounded-full p-0.5"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-24">
                                        <label className="block text-graphite text-sm font-semibold mt-1 mb-2 invisible">
                                            Buttons
                                        </label>
                                        <div className="flex justify-end mt-32 gap-4">
                                            <button
                                                onClick={handleSubmit}
                                                className="bg-royalAzure text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
                                            >
                                                Submit for Docketing
                                            </button>
                                            <button
                                                onClick={handleSaveChanges}
                                                className="bg-soft text-coal px-6 py-2 rounded-lg hover:bg-gray-300 font-medium whitespace-nowrap"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}