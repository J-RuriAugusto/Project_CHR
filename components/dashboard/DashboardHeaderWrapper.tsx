'use client';

import { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DocketViewModal from '@/components/DocketViewModal';
import { DocketLookups } from '@/lib/actions/docket-lookups';

interface DashboardHeaderWrapperProps {
    userData: {
        first_name: string;
        last_name: string;
        role: string;
        profile_picture_url?: string;
    };
    users: any[];
    lookups: DocketLookups;
}

export default function DashboardHeaderWrapper({ userData, users, lookups }: DashboardHeaderWrapperProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDocketId, setSelectedDocketId] = useState<string | null>(null);

    const handleDocketClick = (docketId: string) => {
        setSelectedDocketId(docketId);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedDocketId(null);
    };

    return (
        <>
            <DashboardHeader
                userData={userData}
                onDocketClick={handleDocketClick}
            />
            <DocketViewModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                docketId={selectedDocketId}
                users={users}
                lookups={lookups}
                currentUserRole={userData.role}
            />
        </>
    );
}
