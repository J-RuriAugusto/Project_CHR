'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DocketTable from './DocketTable';
import DocketCaseModal from "@/components/DocketCaseModal";
import DocketDetailsModal from "@/components/DocketDetailsModal";
import { DocketLookups } from '@/lib/actions/docket-lookups';
import { getDockets, DocketListItem } from '@/lib/actions/docket-queries';
import { updateDocketStatus } from '@/lib/actions/docket-actions';

interface DocketContentProps {
    userData: {
        first_name: string;
        last_name: string;
        role: string;
    };
    signOut: () => Promise<void>;
    users: any[];
    lookups: DocketLookups;
}

export default function DocketContent({ userData, signOut, users, lookups }: DocketContentProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedDocketId, setSelectedDocketId] = useState<string | null>(null);
    const [dockets, setDockets] = useState<DocketListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [selectedDockets, setSelectedDockets] = useState<string[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

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

    const basePath = `/dashboard/${userData.role}`;

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
                <div className="flex-1 mt-2">
                    <ul className="space-y-4">
                        <li>
                            <Link
                                href={basePath}
                                className="flex justify-center space-x-3 text-base text-paleSky font-semibold hover:text-white transition"
                            >
                                <img src="/icon5.png" alt="Dashboard" className="w-5 h-5" />
                                <span>Dashboard</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`${basePath}/docket`}
                                className="flex justify-center space-x-3 text-base text-paleSky font-semibold hover:text-white transition"
                            >
                                <img src="/icon7.png" alt="Docker" className="w-5 h-5" />
                                <span>Docker</span>
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Logout button at bottom */}
                <form action={signOut} className="pt-4 border-t">
                    <button
                        type="submit"
                        className="flex items-center justify-center space-x-2 w-full text-white hover:text-paleSky py-2 px-4 rounded-md text-lg font-semibold transition"
                    >
                        <img src="/icon8.png" alt="Logout" className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </form>
            </aside>

            {/* MIDDLE COLUMN */}
            <main className="bg-snowWhite flex-1 overflow-y-auto pb-6 relative custom-scrollbar">
                <div className="bg-white w-full shadow-sm p-6 sticky top-0 z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-midnightNavy">
                            Case Docketing & Tracking
                        </h1>
                        <p className="text-base font-normal text-midnightNavy mt-1">
                            Register and track all human right cases with real-time status updates and investigation deadlines.
                        </p>
                    </div>

                    {/* USER INFO */}
                    <div className="flex items-center gap-4">
                        <button className="p-2 rounded-full hover:bg-snowWhite transition">
                            <img src="/icon9.png" alt="search" className="w-6 h-6 object-contain text-midnightNavy" />
                        </button>

                        <button className="relative p-2">
                            <img src="/icon10.png" alt="Notifications" className="w-6 h-6" />
                            <span className="absolute top-1 right-1 bg-crimsonRose text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                                3
                            </span>
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="font-bold text-midnightNavy">
                                    {userData.first_name} {userData.last_name}
                                </p>
                                <p className="text-sm text-midnightNavy">{userData.role}</p>
                            </div>

                            <img
                                src="/icon11.png"
                                alt="User Avatar"
                                className="w-12 h-12 rounded-full border border-gray-200"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    {/* Controls Bar */}
                    <div className="flex items-center justify-between mb-4 px-6">
                        <h2 className="text-xl font-bold text-midnightNavy">Recent</h2>
                        <div className="flex items-center gap-3">
                            {/* STATUS FILTER */}
                            <div className="relative w-32">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full px-2 py-0.5 rounded-full bg-white text-center text-sm font-semibold text-charcoal hover:bg-gray-50 appearance-none pr-8 cursor-pointer truncate"
                                >
                                    <option value="" disabled hidden>Status</option>
                                    <option value="Overdue">Overdue</option>
                                    <option value="Urgent">Urgent</option>
                                    <option value="Due">Due</option>
                                    <option value="Active">Active</option>
                                    <option value="Completed">Completed</option>
                                    <option value="For Review">For Review</option>


                                    <option value="all">All Status</option>
                                </select>

                                <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            {/* TYPE FILTER */}
                            <div className="relative w-32">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full px-2 py-0.5 rounded-full bg-white text-center text-sm font-semibold text-charcoal hover:bg-gray-50 appearance-none pr-8 cursor-pointer truncate"
                                >
                                    <option value="" disabled hidden>Type</option>
                                    {lookups.requestTypes.map((type) => (
                                        <option key={type.id} value={type.name}>
                                            {type.name}
                                        </option>
                                    ))}
                                    <option value="all">All Requests</option>
                                </select>

                                <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>



                            {/* MARK AS DROPDOWN */}
                            <div className="relative w-40">
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            if (selectedDockets.length === 0) {
                                                alert("Please select at least one docket to update.");
                                                e.target.value = ""; // Reset select
                                                return;
                                            }
                                            handleStatusUpdate(e.target.value);
                                            e.target.value = ""; // Reset select
                                        }
                                    }}
                                    disabled={isUpdating}
                                    className="w-full px-2 py-2 rounded-md bg-midnightNavy text-white text-center text-sm font-semibold hover:bg-opacity-90 appearance-none cursor-pointer truncate"
                                    defaultValue=""
                                >
                                    <option value="" disabled hidden>Mark selected as</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="FOR REVIEW">For Review</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>Loading dockets...</p>
                            </div>
                        ) : (
                            <DocketTable
                                dockets={dockets.filter(docket => {
                                    const statusMatch = filterStatus === 'all' || docket.status === filterStatus;
                                    const typeMatch = filterType === 'all' || docket.typeOfRequest === filterType;
                                    return statusMatch && typeMatch;
                                })}
                                selectedDockets={selectedDockets}
                                onSelectionChange={handleSelectionChange}
                                onSelectAll={handleSelectAll}
                                onRowClick={handleRowClick}
                            />
                        )}
                    </div>
                </div>
            </main>

            <DocketCaseModal isOpen={isModalOpen} onClose={handleModalClose} users={users} lookups={lookups} />
            <DocketDetailsModal
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
