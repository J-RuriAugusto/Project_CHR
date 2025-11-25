"use client";

import Link from "next/link";

interface SidebarProps {
    currentPath: string | null;
}

export default function Sidebar({ currentPath }: SidebarProps) {
    return (
        <div className="flex-1 mt-2">
        <ul className="space-y-2">

            {/* Dashboard */}
            <li>
            <Link
                href="/dashboard/investigation_chief"
                className={`flex justify-start space-x-3 text-base font-semibold transition pl-10
                ${
                currentPath === "/dashboard/investigation_chief"
                    ? "text-white bg-blue-600 rounded-md py-2"
                    : "text-paleSky hover:text-white"
                }`}
            >
                <img src="/icon5.png" className="w-5 h-5" />
                <span>Dashboard</span>
            </Link>
            </li>

            {/* Docket */}
            <li>
            <Link
                href="/dashboard/investigation_chief/docket"
                className={`flex justify-start space-x-3 text-base font-semibold transition pl-10
                ${
                currentPath === "/dashboard/investigation_chief/docket"
                    ? "text-white bg-blue-600 rounded-md py-2"
                    : "text-paleSky hover:text-white"
                }`}
            >
                <img src="/icon7.png" className="w-5 h-5" />
                <span>Docket</span>
            </Link>
            </li>

        </ul>
        </div>
    );
}
