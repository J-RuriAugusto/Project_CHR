"use client";

import React, { useState } from "react";

export default function DocketTable() {
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    const handleCheckboxChange = (rowIndex: number) => {
        setSelectedRows(prev =>
            prev.includes(rowIndex)
                ? prev.filter(i => i !== rowIndex)
                : [...prev, rowIndex]
        );
    };

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
            {/* Row 1 - Completed */}
            <tr className={`${selectedRows.includes(0) ? 'bg-highlight' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2">
                <input 
                    type="checkbox" 
                    className="rounded border-gray-300" 
                    checked={selectedRows.includes(0)}
                    onChange={() => handleCheckboxChange(0)}
                />
                </td>
                <td className="px-4 py-2 text-sm text-black">CHR-VII-2025-0649</td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-royalAzure border border-royalAzure">
                    Investigation
                </span>
                </td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-brightGreen text-white">
                    Completed
                </span>
                </td>
                <td className="px-4 py-2 text-sm text-black">Atty. Reyes</td>
                <td className="px-4 py-2 text-sm text-deepNavy">-</td>
                <td className="px-4 py-2 text-sm text-black">Oct 5, 2025</td>
            </tr>

            {/* Row 2 - Overdue */}
            <tr className={`${selectedRows.includes(1) ? 'bg-highlight' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2">
                <input 
                    type="checkbox" 
                    className="rounded border-gray-300" 
                    checked={selectedRows.includes(1)}
                    onChange={() => handleCheckboxChange(1)}
                />
                </td>
                <td className="px-4 py-2 text-sm text-black">CHR-VII-2025-0649</td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-royalAzure border border-royalAzure">
                    Investigation
                </span>
                </td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-coral text-white">
                    Overdue
                </span>
                </td>
                <td className="px-4 py-2 text-sm text-black">Atty. Reyes</td>
                <td className="px-4 py-2 text-sm text-deepNavy">-2 days</td>
                <td className="px-4 py-2 text-sm text-black">Oct 5, 2025</td>
            </tr>

            {/* Row 3 - Active */}
            <tr className={`${selectedRows.includes(2) ? 'bg-highlight' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2">
                <input 
                    type="checkbox" 
                    className="rounded border-gray-300" 
                    checked={selectedRows.includes(2)}
                    onChange={() => handleCheckboxChange(2)}
                />
                </td>
                <td className="px-4 py-2 text-sm text-black">CHR-VII-2025-0649</td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-royalAzure border border-royalAzure">
                    Investigation
                </span>
                </td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-royalBlue text-white">
                    Active
                </span>
                </td>
                <td className="px-4 py-2 text-sm text-black">Atty. Reyes</td>
                <td className="px-4 py-2 text-sm text-deepNavy">10 days</td>
                <td className="px-4 py-2 text-sm text-black">Oct 5, 2025</td>
            </tr>

            {/* Row 4 - Due */}
            <tr className={`${selectedRows.includes(3) ? 'bg-highlight' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2">
                <input 
                    type="checkbox" 
                    className="rounded border-gray-300" 
                    checked={selectedRows.includes(3)}
                    onChange={() => handleCheckboxChange(3)}
                />
                </td>
                <td className="px-4 py-2 text-sm text-black">CHR-VII-2025-0649</td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-oceanBlue border border-oceanBlue">
                    Legal Assist.
                </span>
                </td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-goldenYellow text-white">
                    Due
                </span>
                </td>
                <td className="px-4 py-2 text-sm text-black">Atty. Reyes</td>
                <td className="px-4 py-2 text-sm text-deepNavy">5 days</td>
                <td className="px-4 py-2 text-sm text-black">Oct 5, 2025</td>
            </tr>

            {/* Row 5 - Pending */}
            <tr className={`${selectedRows.includes(4) ? 'bg-highlight' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2">
                <input 
                    type="checkbox" 
                    className="rounded border-gray-300" 
                    checked={selectedRows.includes(4)}
                    onChange={() => handleCheckboxChange(4)}
                />
                </td>
                <td className="px-4 py-2 text-sm text-black">CHR-VII-2025-0649</td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-oceanBlue border border-oceanBlue">
                    Legal Assist.
                </span>
                </td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-white text-golden border border-golden">
                    Pending
                </span>
                </td>
                <td className="px-4 py-2 text-sm text-black">Atty. Reyes</td>
                <td className="px-4 py-2 text-sm text-deepNavy">Pending</td>
                <td className="px-4 py-2 text-sm text-black">Oct 5, 2025</td>
            </tr>

            {/* Row 6 - Completed */}
            <tr className={`${selectedRows.includes(5) ? 'bg-highlight' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2">
                <input 
                    type="checkbox" 
                    className="rounded border-gray-300" 
                    checked={selectedRows.includes(5)}
                    onChange={() => handleCheckboxChange(5)}
                />
                </td>
                <td className="px-4 py-2 text-sm text-black">CHR-VII-2025-0649</td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-royalAzure border border-royalAzure">
                    Investigation
                </span>
                </td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-brightGreen text-white">
                    Completed
                </span>
                </td>
                <td className="px-4 py-2 text-sm text-black">Atty. Reyes</td>
                <td className="px-4 py-2 text-sm text-deepNavy">-</td>
                <td className="px-4 py-2 text-sm text-black">Oct 5, 2025</td>
            </tr>

            {/* Row 7 - Overdue */}
            <tr className={`${selectedRows.includes(6) ? 'bg-highlight' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2">
                <input 
                    type="checkbox" 
                    className="rounded border-gray-300" 
                    checked={selectedRows.includes(6)}
                    onChange={() => handleCheckboxChange(6)}
                />
                </td>
                <td className="px-4 py-2 text-sm text-black">CHR-VII-2025-0649</td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-royalAzure border border-royalAzure">
                    Investigation
                </span>
                </td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-coral text-white">
                    Overdue
                </span>
                </td>
                <td className="px-4 py-2 text-sm text-black">Atty. Reyes</td>
                <td className="px-4 py-2 text-sm text-deepNavy">-2 days</td>
                <td className="px-4 py-2 text-sm text-black">Oct 7, 2025</td>
            </tr>

            {/* Row 8 - Active */}
            <tr className={`${selectedRows.includes(7) ? 'bg-highlight' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2">
                <input 
                    type="checkbox" 
                    className="rounded border-gray-300" 
                    checked={selectedRows.includes(7)}
                    onChange={() => handleCheckboxChange(7)}
                />
                </td>
                <td className="px-4 py-2 text-sm text-black">CHR-VII-2025-0649</td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-royalAzure border border-royalAzure">
                    Investigation
                </span>
                </td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-royalBlue text-white">
                    Active
                </span>
                </td>
                <td className="px-4 py-2 text-sm text-black">Atty. Reyes</td>
                <td className="px-4 py-2 text-sm text-deepNavy">10 days</td>
                <td className="px-4 py-2 text-sm text-black">Oct 7, 2025</td>
            </tr>

            {/* Row 9 - Due */}
            <tr className={`${selectedRows.includes(8) ? 'bg-highlight' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2">
                <input 
                    type="checkbox" 
                    className="rounded border-gray-300" 
                    checked={selectedRows.includes(8)}
                    onChange={() => handleCheckboxChange(8)}
                />
                </td>
                <td className="px-4 py-2 text-sm text-black">CHR-VII-2025-0649</td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-oceanBlue border border-oceanBlue">
                    Legal Assist.
                </span>
                </td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-goldenYellow text-white">
                    Due
                </span>
                </td>
                <td className="px-4 py-2 text-sm text-black">Atty. Reyes</td>
                <td className="px-4 py-2 text-sm text-deepNavy">5 days</td>
                <td className="px-4 py-2 text-sm text-black">Oct 7, 2025</td>
            </tr>

            {/* Row 10 - Pending */}
            <tr className={`${selectedRows.includes(9) ? 'bg-highlight' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2">
                <input 
                    type="checkbox" 
                    className="rounded border-gray-300" 
                    checked={selectedRows.includes(9)}
                    onChange={() => handleCheckboxChange(9)}
                />
                </td>
                <td className="px-4 py-2 text-sm text-black">CHR-VII-2025-0649</td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-oceanBlue border border-oceanBlue">
                    Legal Assist.
                </span>
                </td>
                <td className="px-4 py-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-white text-golden border border-golden">
                    Pending
                </span>
                </td>
                <td className="px-4 py-2 text-sm text-black">Atty. Reyes</td>
                <td className="px-4 py-2 text-sm text-deepNavy">Pending</td>
                <td className="px-4 py-2 text-sm text-black">Oct 5, 2025</td>
            </tr>
            </tbody>
        </table>
    );
}
