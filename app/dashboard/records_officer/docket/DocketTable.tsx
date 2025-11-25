"use client";

import React, { useState } from "react";
import { DocketListItem } from "@/lib/actions/docket-queries";

interface DocketTableProps {
    dockets: DocketListItem[];
    selectedDockets: string[];
    onSelectionChange: (docketId: string) => void;
    onSelectAll: (ids: string[]) => void;
    onRowClick: (docketId: string) => void;
}

// Status badge component with color coding
function StatusBadge({ status }: { status: string }) {
    const statusStyles = {
        'Overdue': 'bg-coral text-white',
        'Urgent': 'bg-goldenYellow text-white',
        'Due': 'bg-goldenYellow text-white',
        'Active': 'bg-royalBlue text-white',
        'Completed': 'bg-brightGreen text-white',
        'Pending': 'bg-white text-golden border border-golden',
        'For Review': 'bg-transparent text-golden border border-golden',

    };

    const style = statusStyles[status as keyof typeof statusStyles] || 'bg-gray-200 text-gray-800';

    return (
        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${style}`}>
            {status}
        </span>
    );
}

export default function DocketTable({ dockets, selectedDockets, onSelectionChange, onSelectAll, onRowClick }: DocketTableProps) {

    // Show message if no dockets
    if (dockets.length === 0) {
        return (
            <div className="w-full p-8 text-center text-gray-500">
                <p className="text-lg">No dockets found</p>
                <p className="text-sm mt-2">Click "Docket New Case" to create your first docket</p>
            </div>
        );
    }

    const allSelected = dockets.length > 0 && dockets.every(d => selectedDockets.includes(d.id));
    const isIndeterminate = selectedDockets.length > 0 && !allSelected;

    return (
        <table className="w-full">
            <thead className="border-b-2 border-t-2 border-graphiteGray">
                <tr>
                    <th className="w-12 px-4 py-2">
                        <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={allSelected}
                            ref={input => {
                                if (input) input.indeterminate = isIndeterminate;
                            }}
                            onChange={() => {
                                if (allSelected) {
                                    onSelectAll([]);
                                } else {
                                    onSelectAll(dockets.map(d => d.id));
                                }
                            }}
                        />
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
                {dockets.map((docket) => (
                    <tr
                        key={docket.id}
                        className={`${selectedDockets.includes(docket.id) ? 'bg-highlight' : 'hover:bg-sky'} cursor-pointer transition-colors duration-150`}
                        onClick={() => onRowClick(docket.id)}
                    >
                        <td
                            className="px-4 py-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectionChange(docket.id);
                            }}
                        >
                            <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedDockets.includes(docket.id)}
                                onChange={() => { }} // Controlled component, handled by parent or td click
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectionChange(docket.id);
                                }}
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
                            {['Completed', 'For Review'].includes(docket.status) ? (
                                <div className="pl-14">—</div>
                            ) : (
                                docket.daysTillDeadline < 0
                                    ? `${docket.daysTillDeadline} days`
                                    : `${docket.daysTillDeadline} days`
                            )}
                        </td>
                        <td className="px-4 py-2 text-sm text-black">{docket.lastUpdated}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
