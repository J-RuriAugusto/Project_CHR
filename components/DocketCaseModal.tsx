"use client";

import { useState } from 'react';
import { X, Calendar, Plus } from 'lucide-react';

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
    const [victims, setVictims] = useState<string[]>([]);
    const [currentVictim, setCurrentVictim] = useState<string>('');
    const [victimSector, setVictimSector] = useState('');
    const [showVictimInput, setShowVictimInput] = useState(false);
    const [respondents, setRespondents] = useState<string[]>([]);
    const [currentRespondent, setCurrentRespondent] = useState<string>('');
    const [respondentSector, setRespondentSector] = useState('');
    const [showRespondentInput, setShowRespondentInput] = useState(false);
    const [staffInCharge, setStaffInCharge] = useState('');
    const [staffList, setStaffList] = useState(['Maria Santos', 'Juan Dela Cruz', 'Ana Reyes']);
    const [currentStaff, setCurrentStaff] = useState('');
    const [showStaffInput, setShowStaffInput] = useState(false);
    const [emailAddress, setEmailAddress] = useState('staff-in-charge@chr.gov.ph');
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());


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
        if (currentVictim.trim()) {
            setVictims([...victims, currentVictim.trim()]);
            setCurrentVictim('');
            setShowVictimInput(false);
        }
    };

    const removeVictim = (index: number) => {
        setVictims(victims.filter((_, i) => i !== index));
    };

    const addRespondent = () => {
        if (currentRespondent.trim()) {
            setRespondents([...respondents, currentRespondent.trim()]);
            setCurrentRespondent('');
            setShowRespondentInput(false);
        }
    };

    const removeRespondent = (index: number) => {
        setRespondents(respondents.filter((_, i) => i !== index));
    };

    const addStaff = () => {
        if (currentStaff.trim()) {
        setStaffList([...staffList, currentStaff.trim()]);
        setCurrentStaff('');
        setShowStaffInput(false);
        }
    };

    const handleSubmit = () => {
        console.log('Submitting case...');
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
        const formattedDate = new Date(selectedYear, selectedMonth, day).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        if (!dateReceived) {
            setDateReceived(formattedDate);
        } else if (!deadline) {
            setDeadline(formattedDate);
            setShowCalendar(false);
        }
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
                        className="bg-white text-midnightNavy border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                            value={dateReceived || 'Nov 18, 2025'}
                            onChange={(e) => setDateReceived(e.target.value)}
                            className="flex-1 text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <input
                        type="text"
                        value={deadline || 'Feb 24, 2026'}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                        <label className="block text-graphite text-sm font-medium">
                            Victims
                        </label>
                        <button 
                            onClick={() => setShowVictimInput(!showVictimInput)}
                            className="text-royal hover:text-ash border border-royal rounded p-0.5"
                        >
                            <Plus size={16} />
                        </button>
                        </div>
                        {showVictimInput && (
                        <div className="flex gap-2 mb-2">
                            <input
                            type="text"
                            placeholder="Name"
                            value={currentVictim}
                            onChange={(e) => setCurrentVictim(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                e.preventDefault();
                                addVictim();
                                }
                            }}
                            className="flex-1 text-black border-2 border-blue-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                            type="button"
                            onClick={() => {
                                if (currentVictim.trim()) {
                                addVictim();
                                } else {
                                setShowVictimInput(false);
                                }
                            }}
                            className="text-royal hover:text-ash border border-royal rounded-full p-0.5"
                            >
                            <X size={16} />
                            </button>
                        </div>
                        )}
                        <div className="space-y-2">
                        {victims.map((victim, index) => (
                            <div
                            key={index}
                            className="text-black bg-white border-2 border-royal text-gray-800 px-3 py-2 rounded-lg flex items-center justify-between"
                            >
                            <span className="text-sm">{victim}</span>
                            <button
                                onClick={() => removeVictim(index)}
                                className="text-royal hover:text-ash border border-royal rounded-full p-0.5"
                            >
                                <X size={14} />
                            </button>
                            </div>
                        ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-graphite text-sm font-medium mb-2">
                        Sector
                        </label>
                        <select
                        value={victimSector}
                        onChange={(e) => setVictimSector(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-ash text-sm"
                        >
                        <option value="">Pick the Sector the Victim/s belo...</option>
                        <option value="women">Women</option>
                        <option value="children">Children</option>
                        <option value="indigenous">Indigenous Peoples</option>
                        <option value="workers">Workers</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                        <label className="block text-graphite text-sm font-medium">
                            Staff-in-Charge
                        </label>
                        <button 
                            onClick={() => setShowStaffInput(!showStaffInput)}
                            className="text-blue-500 hover:text-blue-700 border border-blue-500 rounded p-0.5"
                        >
                            <Plus size={16} />
                        </button>
                        </div>
                        {showStaffInput && (
                        <div className="flex gap-2 mb-2">
                            <input
                            type="text"
                            placeholder="Add new staff"
                            value={currentStaff}
                            onChange={(e) => setCurrentStaff(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                e.preventDefault();
                                addStaff();
                                }
                            }}
                            className="flex-1 border-2 border-blue-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                            type="button"
                            onClick={() => {
                                if (currentStaff.trim()) {
                                addStaff();
                                } else {
                                setShowStaffInput(false);
                                }
                            }}
                            className="text-blue-500 hover:text-blue-700 border border-blue-500 rounded-full p-1"
                            >
                            <X size={16} />
                            </button>
                        </div>
                        )}
                        <select
                        value={staffInCharge}
                        onChange={(e) => setStaffInCharge(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-ash"
                        >
                        <option value="">Assign the case to...</option>
                        {staffList.map((staff, index) => (
                            <option key={index} value={staff}>
                            {staff}
                            </option>
                        ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-graphite text-sm font-medium mb-2">
                        Email Address
                        </label>
                        <input
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    </div>

                    <div className="space-y-4">
                    <div>
                        <label className="block text-graphite text-sm font-medium mb-2">
                        Type of Request
                        </label>
                        <select
                        value={typeOfRequest}
                        onChange={(e) => setTypeOfRequest(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-ash"
                        >
                        <option value="">Pick the type of Request...</option>
                        <option value="complaint">Complaint</option>
                        <option value="inquiry">Inquiry</option>
                        <option value="request">Request for Assistance</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-graphite text-sm font-medium mb-2">
                        Mode of Request
                        </label>
                        <select
                        value={modeOfRequest}
                        onChange={(e) => setModeOfRequest(e.target.value)}
                        className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        <option value="Motu Proprio">Motu Proprio</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Email">Email</option>
                        <option value="Letter">Letter</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                        <label className="block text-graphite text-sm font-medium">
                            Respondents
                        </label>
                        <button 
                            onClick={() => setShowRespondentInput(!showRespondentInput)}
                            className="text-royal hover:text-ash border border-royal rounded p-0.5"
                        >
                            <Plus size={16} />
                        </button>
                        </div>
                        {showRespondentInput && (
                        <div className="flex gap-2 mb-2">
                            <input
                            type="text"
                            placeholder="Name"
                            value={currentRespondent}
                            onChange={(e) => setCurrentRespondent(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                e.preventDefault();
                                addRespondent();
                                }
                            }}
                            className="flex-1 text-black border-2 border-blue-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                            type="button"
                            onClick={() => {
                                if (currentRespondent.trim()) {
                                addRespondent();
                                } else {
                                setShowRespondentInput(false);
                                }
                            }}
                            className="text-royal hover:text-ash border border-royal rounded-full"
                            >
                            <X size={16} />
                            </button>
                        </div>
                        )}
                        <div className="space-y-2">
                        {respondents.map((respondent, index) => (
                            <div
                            key={index}
                            className="bg-white border-2 border-blue-500 text-black px-3 py-2 rounded-lg flex items-center justify-between"
                            >
                            <span className="text-sm">{respondent}</span>
                            <button
                                onClick={() => removeRespondent(index)}
                                className="text-royal hover:text-ash border border-royal rounded-full p-0.5"
                            >
                                <X size={14} />
                            </button>
                            </div>
                        ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-graphite text-sm font-medium mb-2">
                        Sector
                        </label>
                        <select
                        value={respondentSector}
                        onChange={(e) => setRespondentSector(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-ash text-sm"
                        >
                        <option value="">Pick the Sector the Respondent/s...</option>
                        <option value="government">Government Officials</option>
                        <option value="law">Law Enforcement</option>
                        <option value="private">Private Sector</option>
                        <option value="military">Military</option>
                        </select>
                    </div>
                    </div>

                    <div className="space-y-4">
                    <div>
                        <label className="block text-graphite text-sm font-medium mb-2">
                        Category of Alleged Violation
                        </label>
                        <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-ash"
                        >
                        <option value="">Pick the category of alleged...</option>
                        <option value="civil">Civil and Political Rights</option>
                        <option value="economic">Economic, Social and Cultural Rights</option>
                        <option value="collective">Collective Rights</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-graphite text-sm font-medium mb-2">
                        Right(s) Violated
                        </label>
                        <input
                        type="text"
                        placeholder="Specify the alleged right(s) violated..."
                        value={currentRight}
                        onChange={(e) => setCurrentRight(e.target.value)}
                        onKeyPress={addRightViolated}
                        className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <div className="mt-2 space-y-2">
                        {rightsViolated.map((right, index) => (
                            <div
                            key={index}
                            className="bg-white border-2 border-blue-500 text-black px-3 py-2 rounded-lg flex items-center justify-between"
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