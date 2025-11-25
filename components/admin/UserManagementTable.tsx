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

export default function UserManagementTable({ users, filterRole, filterStatus, selectedRows, onSelectionChange }: UserManagementTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckboxChange = (userId: string) => {
    onSelectionChange(
      selectedRows.includes(userId)
        ? selectedRows.filter(id => id !== userId)
        : [...selectedRows, userId]
    );
  };

  const handleEditClick = (user: User) => {
    setEditingUser({ ...user });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleEditChange = (field: keyof User, value: string) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, [field]: value });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    // Check for changes
    const originalUser = users.find(u => u.id === editingUser.id);
    if (originalUser) {
      const hasChanges =
        originalUser.email !== editingUser.email ||
        originalUser.first_name !== editingUser.first_name ||
        originalUser.last_name !== editingUser.last_name ||
        originalUser.role !== editingUser.role;

      if (!hasChanges) {
        setEditingUser(null);
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUser.id,
          email: editingUser.email,
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          role: editingUser.role,
          status: editingUser.status
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }

      setEditingUser(null);
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(error.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
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

  const roles = ['admin', 'investigation_chief', 'regional_director', 'officer', 'records_officer', 'legal_chief'];

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
            const isHovered = hoveredRow === user.id;

            return (
              <tr
                key={user.id}
                className={`${selectedRows.includes(user.id) ? 'bg-highlight' : 'hover:bg-gray-50'}`}
                onMouseEnter={() => setHoveredRow(user.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {editingUser && editingUser.id === user.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedRows.includes(user.id)}
                        onChange={() => handleCheckboxChange(user.id)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        className="border rounded p-1 w-full text-sm text-black"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editingUser.first_name}
                        onChange={(e) => handleEditChange('first_name', e.target.value)}
                        className="border rounded p-1 w-full text-sm text-black"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editingUser.last_name}
                        onChange={(e) => handleEditChange('last_name', e.target.value)}
                        className="border rounded p-1 w-full text-sm text-black"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="relative">
                        <select
                          value={editingUser.role}
                          onChange={(e) => handleEditChange('role', e.target.value)}
                          className="border rounded p-1 w-full text-sm text-black pr-8 appearance-none"
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>
                              {role.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </option>
                          ))}
                        </select>
                        <img
                          src="/icon16.png"
                          alt="dropdown"
                          className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-black">Oct 9, 2025</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={isLoading}
                          className="text-black hover:text-blue-900 text-sm font-medium"
                        >
                          {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-black hover:text-gray-900 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedRows.includes(user.id)}
                        onChange={() => handleCheckboxChange(user.id)}
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
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit user"
                        >
                          <img src="/icon17.png" alt="Edit" className="w-5 h-5" />
                        </button>

                        {/* Status Indicator with Toggle */}
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={`flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out ${isHovered
                            ? 'w-20 px-3 py-1 rounded-full'
                            : 'w-3 h-3 rounded-full'
                            } ${status === 'ACTIVE' ? 'bg-brightGreen' : 'bg-ash'
                            }`}
                          title={`Toggle status (currently ${status})`}
                        >
                          {isHovered && (
                            <span className={`text-xs font-medium whitespace-nowrap ${status === 'ACTIVE' ? 'text-white' : 'text-white'
                              }`}>
                              {status === 'ACTIVE' ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}