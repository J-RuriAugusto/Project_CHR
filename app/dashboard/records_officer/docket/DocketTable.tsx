"use client";

import React, { useState } from "react";
import { DocketListItem } from "@/lib/actions/docket-queries";

interface DocketTableProps {
    dockets: DocketListItem[];
}

// Status badge component with color coding
function StatusBadge({ status }: { status: string }) {
    const statusStyles = {
        'Overdue': 'bg-coral text-white',
        'Urgent': 'bg-goldenYellow text-white',
        'Due': 'bg-goldenYellow text-white',
        'Active': 'bg-royalBlue text-white',
        'Completed': 'bg-brightGreen text-white',
        'Pending': 'bg-white text-golden border border-golden'
    };

    const style = statusStyles[status as keyof typeof statusStyles] || 'bg-gray-200 text-gray-800';

    return (
        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${style}`}>
            {status}
        </span>
    );
}

export default function DocketTable({ dockets }: DocketTableProps) {
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    const handleCheckboxChange = (rowIndex: number) => {
        setSelectedRows(prev =>
            prev.includes(rowIndex)
                ? prev.filter(i => i !== rowIndex)
                : [...prev, rowIndex]
        );
    };

    // Show message if no dockets
    if (dockets.length === 0) {
        return (
            <div className="w-full p-8 text-center text-gray-500">
                <p className="text-lg">No dockets found</p>
                <p className="text-sm mt-2">Click "Docket New Case" to create your first docket</p>
            </div>
        );
    }

    return (
        <table className="w-full">
            <thead className="border-b-2 border-t-2 border-graphiteGray">
                <tr>
                    <th className="w-12 px-4 py-2">
                    </th>
                    <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
                        Docket No.
                    </th>
                    <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
                        Type of Request
                    </th>
                    <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
                        Status
                    </th>
                    <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
                        Assigned
                    </th>
                    <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
                        Days till Deadline
                    </th>
                    <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
                        Last Updated
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y-2 divide-graphiteGray border-b-2 border-graphiteGray">
                {dockets.map((docket, index) => (
                    <tr
                        key={docket.id}
                        className={`${selectedRows.includes(index) ? 'bg-highlight' : 'hover:bg-gray-50'}`}
                    >
                        <td className="px-4 py-2">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedRows.includes(index)}
                                onChange={() => handleCheckboxChange(index)}
                            />
                        </td>
                        <td className="px-4 py-2 text-sm text-black">{docket.docketNumber}</td>
                        <td className="px-4 py-2">
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-royalAzure border border-royalAzure">
                                {docket.typeOfRequest}
                            </span>
                        </td>
                        <td className="px-4 py-2">
                            <StatusBadge status={docket.status} />
                        </td>
                        <td className="px-4 py-2 text-sm text-black">{docket.assignedTo}</td>
                        <td className="px-4 py-2 text-sm text-deepNavy">
                            {docket.daysTillDeadline < 0
                                ? `${docket.daysTillDeadline} days`
                                : `${docket.daysTillDeadline} days`}
                        </td>
                        <td className="px-4 py-2 text-sm text-black">{docket.lastUpdated}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
