'use client';

import { useState } from 'react';
import UserManagementTable from './UserManagementTable';
import AddUserModal from './AddUserModal';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
}

interface AdminContentProps {
  userData: {
    first_name: string;
    last_name: string;
    role: string;
  };
  signOut: () => Promise<void>;
  users: User[];
}

export default function AdminContent({ userData, signOut, users }: AdminContentProps) {
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New state for bulk actions
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Search filtering
  const searchFilteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const handleBulkStatusUpdate = async (status: 'ACTIVE' | 'INACTIVE') => {
    if (selectedRows.length === 0) return;

    // Filter out users who already have the target status
    const usersToUpdate = selectedRows.filter(userId => {
      const user = users.find(u => u.id === userId);
      const currentStatus = user?.status?.toUpperCase() || 'ACTIVE';
      return currentStatus !== status;
    });

    if (usersToUpdate.length === 0) {
      alert(`Selected users are already ${status}`);
      return;
    }

    setIsBulkUpdating(true);
    try {
      const response = await fetch('/api/admin/bulk-update-users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: usersToUpdate,
          status
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update users');
      }

      setSelectedRows([]);
      window.location.reload();
    } catch (error: any) {
      console.error('Error bulk updating users:', error);
      alert(error.message || 'Failed to update users');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* LEFT COLUMN - Sidebar */}
      <aside className="w-60 bg-midnightNavy border-r shadow-sm flex flex-col justify-between p-4">
        <div className="flex justify-center mb-4">
          <img
            src="/cmms-logo2.png"
            alt="Logo"
            className="w-auto h-auto"
          />
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

      {/* MIDDLE COLUMN - Main Content */}
      <main className="bg-snowWhite flex-1 overflow-y-auto pb-6 relative custom-scrollbar">
        <div className="bg-white w-full shadow-sm p-6 sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-midnightNavy">
              User & Role Management
            </h1>
            <p className="text-base font-normal text-midnightNavy mt-1">
              Manage CHR accounts, assign roles, and control system access.
            </p>
          </div>

          {/* USER INFO */}
          <div className="flex items-center gap-16">
            <div
              className="relative flex items-center"
              onMouseEnter={() => setIsSearchOpen(true)}
              onMouseLeave={() => setIsSearchOpen(false)}
            >
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'
                }`}>
                <input
                  type="text"
                  placeholder="Search a user or a keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-midnightNavy rounded-full text-sm text-midnightNavy outline-none focus:border-blue-500"
                />
              </div>
              <button className="p-2 rounded-full hover:bg-snowWhite transition ml-2">
                <img src="/icon9.png" alt="search" className="w-6 h-6 object-contain text-midnightNavy" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-bold text-midnightNavy">
                  {userData.first_name} {userData.last_name}
                </p>
                <p className="text-sm text-midnightNavy capitalize">{userData.role}</p>
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
              {/* Mark as Active/Inactive buttons */}
              <button
                onClick={() => handleBulkStatusUpdate('ACTIVE')}
                disabled={isBulkUpdating || selectedRows.length === 0}
                className={`px-4 py-0.5 rounded-full text-sm font-semibold border border-charcoal transition ${isBulkUpdating || selectedRows.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-charcoal hover:bg-gray-50'
                  }`}
              >
                Mark as Active
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('INACTIVE')}
                disabled={isBulkUpdating || selectedRows.length === 0}
                className={`px-2 py-0.5 rounded-full text-sm font-semibold border border-charcoal transition ${isBulkUpdating || selectedRows.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-charcoal hover:bg-gray-50'
                  }`}
              >
                Mark as Inactive
              </button>

              {/* STATUS FILTER */}
              <div className="relative w-32">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2 py-0.5 rounded-full bg-white text-center text-sm font-semibold text-charcoal appearance-none pr-8 cursor-pointer truncate"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

                <img src="/icon16.png" alt="dropdown" className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* ROLE FILTER */}
              <div className="relative w-32">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-2 py-0.5 rounded-full bg-white text-center text-sm font-semibold text-charcoal appearance-none pr-8 cursor-pointer truncate"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="officer">Officer</option>
                  <option value="records_officer">Records Officer</option>
                  <option value="investigation_chief">Investigation Chief</option>
                  <option value="legal_chief">Legal Chief</option>
                  <option value="regional_director">Regional Director</option>
                </select>

                <img src="/icon16.png" alt="dropdown" className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-4 py-2 bg-blue text-white rounded-md text-sm font-semibold hover:bg-highlight flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New User
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-snowWhite shadow-sm overflow-hidden mx-6">
            <UserManagementTable
              users={searchFilteredUsers}
              filterRole={filterRole}
              filterStatus={filterStatus}
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
            />
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
      />
    </div>
  );
}