'use client';

import { useState } from 'react';
import GenerateReportModal from '@/components/dashboard/GenerateReportModal';

export default function GenerateReportButton() {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const handleGenerateReport = async (filters: any) => {
        console.log('Generating report with filters:', filters);
        // TODO: Implement report generation logic
        // Example: await fetch('/api/generate-report', { method: 'POST', body: JSON.stringify(filters) });
    };

    return (
        <>
        <button
            onClick={() => setIsReportModalOpen(true)}
            className="text-sm text-slateGray font-semibold hover:underline cursor-pointer transition-all"
        >
            Generate Report
        </button>

        <GenerateReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            onGenerate={handleGenerateReport}
        />
        </>
    );
}