'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DocketTable from './DocketTable';
import DocketCaseModal from "@/components/DocketCaseModal";
import DocketDetailsModal from "@/components/DocketDetailsModal";
import { DocketLookups } from '@/lib/actions/docket-lookups';
import { getDockets, DocketListItem } from '@/lib/actions/docket-queries';
import { updateDocketStatus } from '@/lib/actions/docket-actions';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

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
            setSelectedDockets([]);
            fetchDockets();
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
    const currentPath = usePathname() || "/";
    
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
                <Sidebar currentPath={currentPath} />

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
                <DashboardHeader userData={userData} />

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
                                <img src="/icon16.png" alt="dropdown" className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                                <img src="/icon16.png" alt="dropdown" className="w-4 h-4 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {/* MARK AS DROPDOWN */}
                            <div className="relative">
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
                                    className="w-full rounded-full px-6 py-0.5 mr-2 bg-white border border-midnightNavy text-charcoal text-center text-sm font-semibold appearance-none cursor-pointer truncate"
                                    defaultValue=""
                                >
                                    <option value="" disabled hidden>Mark selected as</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="FOR REVIEW">For Review</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                                <img src="/icon16.png" alt="dropdown" className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
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
                            </div>
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
            />
        </div>
    );
}
