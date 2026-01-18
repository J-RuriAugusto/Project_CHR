'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DocketLookups } from '@/lib/actions/docket-lookups';
import { getDockets, DocketListItem } from '@/lib/actions/docket-queries';
import { updateDocketStatus, deleteDockets } from '@/lib/actions/docket-actions';
import DocketTable from '@/app/dashboard/officer/docket/DocketTable'; // Updated path for DocketTable
import DocketNewCaseModal from "@/components/DocketNewCaseModal";
import DocketViewModal from "@/components/DocketViewModal";
import Sidebar from '@/components/Sidebar';
import DocketHeader from '@/components/dashboard/DocketHeader';
import LogoutButton from '@/components/LogoutButton';



interface DocketContentProps {
    userData: {
        first_name: string;
        last_name: string;
        role: string;
        profile_picture_url?: string;
    };
    signOut: () => Promise<void>;
    users: any[];
    lookups: DocketLookups;
}

export default function DocketContent({ userData, signOut, users, lookups }: DocketContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const basePath = `/dashboard/${userData.role}`;
    const currentPath = usePathname();
    const searchQuery = searchParams.get('search') || '';
    const initialStatuses = searchParams.getAll('status');
    const initialDateStart = searchParams.get('dateStart') || '';
    const initialDateEnd = searchParams.get('dateEnd') || '';
    const excludeCompleted = searchParams.get('excludeCompleted') === 'true';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedDocketId, setSelectedDocketId] = useState<string | null>(null);
    const [dockets, setDockets] = useState<DocketListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Multi-select filter arrays
    const [filterStatuses, setFilterStatuses] = useState<string[]>(initialStatuses.length > 0 ? initialStatuses : []);
    const [filterTypes, setFilterTypes] = useState<string[]>([]);
    // Date range filter (for deadline)
    const [dateRangeStart, setDateRangeStart] = useState<string>(initialDateStart);
    const [dateRangeEnd, setDateRangeEnd] = useState<string>(initialDateEnd);
    // Dropdown open states
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [selectedDockets, setSelectedDockets] = useState<string[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 100;

    // Refs for click-outside detection
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const typeDropdownRef = useRef<HTMLDivElement>(null);
    const dateDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
                setIsTypeDropdownOpen(false);
            }
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
                setIsDateDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const STATUS_OPTIONS = ['Overdue', 'Urgent', 'Due', 'Active', 'Completed', 'For Review'];

    // Toggle status filter
    const toggleStatusFilter = (status: string) => {
        setFilterStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    // Toggle type filter
    const toggleTypeFilter = (type: string) => {
        setFilterTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    // Clear all filters
    const clearFilters = () => {
        setFilterStatuses([]);
        setFilterTypes([]);
        setDateRangeStart('');
        setDateRangeEnd('');
        router.replace(`${basePath}/docket`);
    };

    // Check if any filters are active
    // Check if any filters are active
    const hasActiveFilters = filterStatuses.length > 0 || filterTypes.length > 0 || dateRangeStart !== '' || dateRangeEnd !== '' || searchQuery !== '';

    // Fetch dockets on component mount
    useEffect(() => {
        fetchDockets();
    }, []);

    const fetchDockets = async () => {
        setIsLoading(true);
        const data = await getDockets();
        setDockets(data);
        setIsLoading(false);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        // Refresh dockets after closing modal (in case a new one was added)
        fetchDockets();
    };

    const handleSelectionChange = (docketId: string) => {
        setSelectedDockets(prev =>
            prev.includes(docketId)
                ? prev.filter(id => id !== docketId)
                : [...prev, docketId]
        );
    };

    const handleSelectAll = (ids: string[]) => {
        setSelectedDockets(ids);
    };

    const handleStatusUpdate = async (status: string) => {
        if (selectedDockets.length === 0) return;

        setIsUpdating(true);
        const result = await updateDocketStatus(selectedDockets, status);
        setIsUpdating(false);

        if (result.success) {
            setSelectedDockets([]); // Clear selection
            fetchDockets(); // Refresh data
        } else {
            alert('Failed to update status');
        }
    };

    const handleDeleteDockets = async () => {
        if (selectedDockets.length === 0) {
            alert("Please select at least one docket to delete.");
            return;
        }

        if (!confirm('Are you sure you want to delete the selected dockets? This action cannot be undone.')) {
            return;
        }

        setIsUpdating(true);
        const result = await deleteDockets(selectedDockets);
        setIsUpdating(false);

        if (result.success) {
            setSelectedDockets([]); // Clear selection
            fetchDockets(); // Refresh data
        } else {
            alert('Failed to delete dockets: ' + result.error);
        }
    };

    const handleRowClick = (docketId: string) => {
        setSelectedDocketId(docketId);
        setIsDetailsModalOpen(true);
    };

    const handleDetailsModalClose = () => {
        setIsDetailsModalOpen(false);
        setSelectedDocketId(null);
        // Optional: refresh dockets if changes were made
        fetchDockets();
    };

    // Apply filters
    const filteredDockets = dockets.filter(docket => {
        // 1. Status Filter
        const statusMatch = filterStatuses.length === 0 || filterStatuses.includes(docket.status);

        // 2. Type Filter
        const typeMatch = filterTypes.length === 0 || filterTypes.includes(docket.typeOfRequest);

        // 3. Date Filter (on deadline field)
        let dateMatch = true;
        if (dateRangeStart || dateRangeEnd) {
            const deadlineDate = docket.deadline ? new Date(docket.deadline) : null;
            if (deadlineDate) {
                if (dateRangeStart) {
                    const startDate = new Date(dateRangeStart);
                    if (deadlineDate < startDate) dateMatch = false;
                }
                if (dateRangeEnd) {
                    const endDate = new Date(dateRangeEnd);
                    endDate.setHours(23, 59, 59, 999); // Include the entire end day
                    if (deadlineDate > endDate) dateMatch = false;
                }
            } else {
                dateMatch = false; // No deadline, exclude from date-filtered results
            }
        }

        // 3b. Exclude Completed filter
        const completedMatch = !excludeCompleted || docket.status !== 'Completed';

        // 4. Search Filter (Comma-separated AND logic)
        let searchMatch = true;
        if (searchQuery) {
            const searchTerms = searchQuery
                .toLowerCase()
                .split(',')
                .map(term => term.trim())
                .filter(term => term.length > 0);

            if (searchTerms.length > 0) {
                searchMatch = searchTerms.every(term => {
                    const matchesNumber = docket.docketNumber.toLowerCase().includes(term);
                    const matchesType = docket.typeOfRequest.toLowerCase().includes(term);
                    const matchesStatus = docket.status.toLowerCase().includes(term);
                    const matchesAssigned = docket.assignedTo.toLowerCase().includes(term);
                    const matchesDate = docket.dateReceived ? new Date(docket.dateReceived).toLocaleDateString().includes(term) : false;

                    // New expanded search fields
                    const matchesViolation = docket.violationCategories.some(c => c.toLowerCase().includes(term));
                    const matchesMode = docket.requestMode.toLowerCase().includes(term);
                    const matchesRights = docket.rights.some(r => r.toLowerCase().includes(term));
                    const matchesComplainants = docket.complainants.some(c => c.toLowerCase().includes(term));
                    const matchesParties = docket.parties.some(p => p.toLowerCase().includes(term));
                    const matchesSectors = docket.sectors.some(s => s.toLowerCase().includes(term));

                    return matchesNumber || matchesType || matchesStatus || matchesAssigned || matchesDate ||
                        matchesViolation || matchesMode || matchesRights || matchesComplainants ||
                        matchesParties || matchesSectors;
                });
            }
        }

        return statusMatch && typeMatch && dateMatch && completedMatch && searchMatch;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredDockets.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedDockets = filteredDockets.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatuses, filterTypes, dateRangeStart, dateRangeEnd]);

    return (
        <div className="h-screen flex bg-gray-50">
            {/* LEFT COLUMN */}
            <aside className="w-60 bg-midnightNavy border-r shadow-sm flex flex-col justify-between p-4">
                <div className="flex justify-center mb-4">
                    <img
                        src="/cmms-logo2.png"
                        alt="Logo"
                        className="w-auto h-auto"
                    />
                </div>

                {/* Navigation Links */}
                <Sidebar currentPath={currentPath} role="records_officer" />

                {/* Logout button at bottom */}
                {/* Logout button at bottom */}
                <div className="pt-4 border-t">
                    <LogoutButton signOut={signOut} />
                </div>
            </aside>

            {/* MIDDLE COLUMN */}
            <main className="bg-snowWhite flex-1 overflow-y-auto pb-6 relative custom-scrollbar">
                <DocketHeader userData={userData} onDocketClick={handleRowClick} />

                <div className="mt-6">
                    {/* Controls Bar */}
                    <div className="flex items-center justify-between mb-4 px-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-midnightNavy">Count: {filteredDockets.length}</h2>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium mt-1"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {/* STATUS FILTER DROPDOWN */}
                            <div className="relative" ref={statusDropdownRef}>
                                <button
                                    onClick={() => {
                                        setIsStatusDropdownOpen(!isStatusDropdownOpen);
                                        setIsTypeDropdownOpen(false);
                                        setIsDateDropdownOpen(false);
                                    }}
                                    className="px-4 py-1 rounded-full bg-white text-sm font-semibold text-charcoal hover:bg-gray-50 flex items-center gap-2 border border-gray-200"
                                >
                                    Status {filterStatuses.length > 0 && `(${filterStatuses.length})`}
                                    <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isStatusDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                                        {STATUS_OPTIONS.map((status) => (
                                            <label
                                                key={status}
                                                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={filterStatuses.includes(status)}
                                                    onChange={() => toggleStatusFilter(status)}
                                                    className="mr-2 h-4 w-4 rounded border-gray-300"
                                                />
                                                <span className="text-charcoal">{status}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* TYPE FILTER DROPDOWN */}
                            <div className="relative" ref={typeDropdownRef}>
                                <button
                                    onClick={() => {
                                        setIsTypeDropdownOpen(!isTypeDropdownOpen);
                                        setIsStatusDropdownOpen(false);
                                        setIsDateDropdownOpen(false);
                                    }}
                                    className="px-4 py-1 rounded-full bg-white text-sm font-semibold text-charcoal hover:bg-gray-50 flex items-center gap-2 border border-gray-200"
                                >
                                    Request Type {filterTypes.length > 0 && `(${filterTypes.length})`}
                                    <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isTypeDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
                                        {lookups.requestTypes.map((type) => (
                                            <label
                                                key={type.id}
                                                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={filterTypes.includes(type.name)}
                                                    onChange={() => toggleTypeFilter(type.name)}
                                                    className="mr-2 h-4 w-4 rounded border-gray-300"
                                                />
                                                <span className="text-charcoal">{type.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* DATE RECEIVED FILTER DROPDOWN */}
                            <div className="relative" ref={dateDropdownRef}>
                                <button
                                    onClick={() => {
                                        setIsDateDropdownOpen(!isDateDropdownOpen);
                                        setIsStatusDropdownOpen(false);
                                        setIsTypeDropdownOpen(false);
                                    }}
                                    className="px-4 py-1 rounded-full bg-white text-sm font-semibold text-charcoal hover:bg-gray-50 flex items-center gap-2 border border-gray-200"
                                >
                                    Date Received {(dateRangeStart || dateRangeEnd) && '(filtered)'}
                                    <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isDateDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-[280px]">
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-charcoal mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={dateRangeStart}
                                                onChange={(e) => setDateRangeStart(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-charcoal mb-1">End Date</label>
                                            <input
                                                type="date"
                                                value={dateRangeEnd}
                                                onChange={(e) => setDateRangeEnd(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                setDateRangeStart('');
                                                setDateRangeEnd('');
                                            }}
                                            className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                        >
                                            Clear Dates
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-4 py-2 bg-blue text-white rounded-md text-sm font-semibold hover:bg-highlight flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Docket New Case
                            </button>

                            {/* MARK AS DROPDOWN */}
                            <div className="relative w-40">
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            if (selectedDockets.length === 0) {
                                                alert("Please select at least one docket to update.");
                                                e.target.value = "";
                                                return;
                                            }
                                            handleStatusUpdate(e.target.value);
                                            e.target.value = "";
                                        }
                                    }}
                                    disabled={isUpdating}
                                    className="w-full pl-4 pr-10 py-2 rounded-md bg-darkBlue text-white text-center text-sm font-semibold appearance-none cursor-pointer truncate"
                                    defaultValue=""
                                >
                                    <option value="" disabled hidden>Mark selected as</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="FOR REVIEW">For Review</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                                <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            {/* DELETE BUTTON */}
                            <button
                                onClick={handleDeleteDockets}
                                disabled={isUpdating}
                                aria-label="Delete Selected"
                                title="Delete Selected"
                                className="p-2 rounded-md text-sm font-semibold text-white bg-coral hover:bg-red-700 transition-disabled:opacity-50"
                            >
                                <img src="/icon21.png" alt="Delete" className="w-4 h-5" />
                            </button>

                        </div>
                    </div>

                    {/* Table */}
                    <div className="shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 text-center text-midnightNavy">
                                <p>Loading dockets...</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden mx-6">
                                <DocketTable
                                    dockets={paginatedDockets}
                                    selectedDockets={selectedDockets}
                                    onSelectionChange={handleSelectionChange}
                                    onSelectAll={handleSelectAll}
                                    onRowClick={handleRowClick}
                                />

                                {/* Pagination Controls */}
                                {filteredDockets.length > 0 && (
                                    <div className="flex justify-center items-center gap-4 py-4">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 rounded-md bg-white border border-gray-300 text-midnightNavy hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                        >
                                            &lt;
                                        </button>
                                        <span className="text-sm text-midnightNavy">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 rounded-md bg-white border border-gray-300 text-midnightNavy hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                        >
                                            &gt;
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <DocketNewCaseModal isOpen={isModalOpen} onClose={handleModalClose} users={users} lookups={lookups} />
            <DocketViewModal
                isOpen={isDetailsModalOpen}
                onClose={handleDetailsModalClose}
                docketId={selectedDocketId}
                users={users}
                lookups={lookups}
                currentUserRole={userData.role}
            />
        </div>
    );
}
