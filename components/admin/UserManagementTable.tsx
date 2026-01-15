"use client";

import React, { useState } from "react";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
}

interface UserManagementTableProps {
  users: User[];
  filterRole: string;
  filterStatus: string;
  selectedRows: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onEditUser: (user: User) => void;
}

// Role badge component with color coding
function RoleBadge({ role }: { role: string }) {
  const roleStyles: Record<string, string> = {
    'admin': 'bg-purple-200 text-purple-800',
    'officer': 'bg-softGray text-gray',
    'records_officer': 'bg-green-200 text-green-800',
    'investigation_chief': 'bg-yellow-200 text-yellow-800',
    'legal_chief': 'bg-red-200 text-red-800',
    'regional_director': 'bg-indigo-200 text-indigo-800'
  };

  const style = roleStyles[role] || 'bg-gray-200 text-gray-800';

  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${style}`}>
      {role.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
    </span>
  );
}

export default function UserManagementTable({ users, filterRole, filterStatus, selectedRows, onSelectionChange, onEditUser }: UserManagementTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, userId: string) => {
    e.stopPropagation(); // Prevent row click
    onSelectionChange(
      selectedRows.includes(userId)
        ? selectedRows.filter(id => id !== userId)
        : [...selectedRows, userId]
    );
  };

  const toggleUserStatus = async (e: React.MouseEvent, user: User) => {
    e.stopPropagation(); // Prevent row click

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  // Filter users based on role and status
  const filteredUsers = users.filter(user => {
    const roleMatch = filterRole === 'all' || user.role === filterRole;
    // Case insensitive status match
    const userStatus = user.status ? user.status.toUpperCase() : 'ACTIVE'; // Default to ACTIVE if null
    const filterStatusUpper = filterStatus.toUpperCase();
    const statusMatch = filterStatus === 'all' || userStatus === filterStatusUpper;
    return roleMatch && statusMatch;
  });

  // Show message if no users
  if (filteredUsers.length === 0) {
    return (
      <div className="w-full p-8 text-center text-midnightNavy">
        <p className="text-lg">No user(s) found</p>
        <p className="text-sm mt-2">Adjust filters or add a new user.</p>
      </div>
    );
  }

  return (
    <div>
      <table className="w-full bg-snowWhite">
        <thead className="border-b border-t bg-white border-ash">
          <tr>
            <th className="w-12 px-4 py-2"></th>
            <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
              Email
            </th>
            <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
              First Name
            </th>
            <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
              Last Name
            </th>
            <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
              Role
            </th>
            <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
              Last Updated
            </th>
            <th className="px-4 py-2 text-left text-base font-semibold text-black tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-graphiteGray border-b border-ash">
          {filteredUsers.map((user) => {
            const status = user.status ? user.status.toUpperCase() : 'ACTIVE';

            return (
              <tr
                key={user.id}
                className={`${selectedRows.includes(user.id) ? 'bg-highlight' : 'hover:bg-softGray'} cursor-pointer transition-colors duration-150`}
                onMouseEnter={() => setHoveredRow(user.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onEditUser(user)}
              >
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 cursor-pointer"
                    checked={selectedRows.includes(user.id)}
                    onChange={(e) => handleCheckboxChange(e, user.id)}
                  />
                </td>
                <td className="px-4 py-2 text-sm text-black">{user.email}</td>
                <td className="px-4 py-2 text-sm text-black">{user.first_name}</td>
                <td className="px-4 py-2 text-sm text-black">{user.last_name}</td>
                <td className="px-4 py-2">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-4 py-2 text-sm text-black">Oct 9, 2025</td>
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    {/* Status Toggle - Clean Switch */}
                    <button
                      onClick={(e) => toggleUserStatus(e, user)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${status === 'ACTIVE' ? 'bg-brightGreen' : 'bg-ashGray'
                        }`}
                      title={`Toggle status (currently ${status})`}
                    >
                      <span className="sr-only">Use setting</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </button>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
