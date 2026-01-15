'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
    profile_picture_url?: string;
  };
  signOut: () => Promise<void>;
  users: User[];
}

export default function AdminContent({ userData, signOut, users }: AdminContentProps) {
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Search states
  const [pendingSearchQuery, setPendingSearchQuery] = useState(''); // Input value
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(''); // Value used for filtering
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Editing state
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // New state for bulk actions
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 100;

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleSearch = () => {
    if (isSearching) return; // Prevent double trigger

    setIsSearching(true);

    // Simulate network request delay
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setAppliedSearchQuery(pendingSearchQuery);
      setIsSearching(false);
    }, 1500); // 1.5s delay to show animation
  };

  const cancelSearch = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent search trigger if bubbling
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setIsSearching(false);
    // Optionally revert pending to applied?
    // setPendingSearchQuery(appliedSearchQuery);
  };

  // Search filtering using appliedSearchQuery
  const searchFilteredUsers = users.filter(user => {
    if (!appliedSearchQuery) return true;

    // Split by comma and clean up whitespace
    const searchTerms = appliedSearchQuery
      .toLowerCase()
      .split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0);

    if (searchTerms.length === 0) return true;

    // Check if ALL terms match at least one field (AND logic)
    return searchTerms.every(term => {
      const matchesEmail = user.email.toLowerCase().includes(term);
      const matchesFirstName = user.first_name.toLowerCase().includes(term);
      const matchesLastName = user.last_name.toLowerCase().includes(term);
      const matchesRole = user.role.toLowerCase().includes(term);
      const matchesStatus = (user.status || 'ACTIVE').toLowerCase().includes(term);

      return matchesEmail || matchesFirstName || matchesLastName || matchesRole || matchesStatus;
    });
  });

  // Apply role and status filters
  const filteredUsers = searchFilteredUsers.filter(user => {
    const roleMatch = filterRole === 'all' || user.role === filterRole;
    const userStatus = user.status ? user.status.toUpperCase() : 'ACTIVE';
    const filterStatusUpper = filterStatus.toUpperCase();
    const statusMatch = filterStatus === 'all' || userStatus === filterStatusUpper;
    return roleMatch && statusMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, filterStatus, appliedSearchQuery]);

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

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsAddUserModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddUserModalOpen(false);
    setEditingUser(null);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
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
        {/* Logout button at bottom */}
        <div className="pt-4 border-t">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center justify-center space-x-2 w-full text-white hover:text-paleSky py-2 px-4 rounded-md text-lg font-semibold transition ${isLoggingOut ? 'opacity-75 cursor-not-allowed' : ''
              }`}
          >
            {isLoggingOut ? (
              <span>Logging out...</span>
            ) : (
              <>
                <img src="/icon8.png" alt="Logout" className="w-5 h-5" />
                <span>Logout</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MIDDLE COLUMN - Main Content */}
      <main className="bg-snowWhite flex-1 overflow-y-auto pb-6 relative custom-scrollbar">
        <div className="bg-white w-full shadow-sm p-6 sticky top-0 z-10 flex items-center justify-between relative">
          <div className={`transition-opacity duration-300 ease-in-out ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <h1 className="text-4xl font-bold text-midnightNavy">
              User & Role Management
            </h1>
            <p className="text-base font-normal text-midnightNavy mt-1">
              Manage CHR accounts, assign roles, and control system access.
            </p>
          </div>

          {/* Expanded Search Bar Overlay */}
          {isSearchOpen && (
            <div
              className="absolute left-6 right-48 top-1/2 -translate-y-1/2 transition-all duration-300"
              onMouseEnter={() => !isSearching && setIsSearchOpen(true)}
              onMouseLeave={() => !pendingSearchQuery && !isSearching && setIsSearchOpen(false)}
            >
              <input
                type="text"
                placeholder="Search details (keywords separated by comma)..."
                value={pendingSearchQuery}
                onChange={(e) => setPendingSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => !pendingSearchQuery && !isSearching && setIsSearchOpen(false)}
                autoFocus
                disabled={isSearching}
                className={`w-full pl-4 pr-12 py-2 border border-midnightNavy rounded-full text-sm text-midnightNavy outline-none focus:border-blue-500 ${isSearching ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
              />
            </div>
          )}

          {/* USER INFO */}
          <div className="flex items-center gap-4">
            <div
              className="relative flex items-center"
              onMouseEnter={() => !isSearching && setIsSearchOpen(true)}
              onMouseLeave={() => !pendingSearchQuery && !isSearching && setIsSearchOpen(false)}
            >
              <button
                onClick={isSearching ? cancelSearch : handleSearch}
                className={`p-2 rounded-full transition relative ${isSearching ? 'hover:bg-red-50' : 'hover:bg-snowWhite'}`}
                disabled={isSearching ? false : false}
              >
                {isSearching ? (
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    {/* Loading Spinner Ring */}
                    <div className="absolute inset-0 border-2 border-midnightNavy border-t-transparent rounded-full animate-spin"></div>
                    {/* X Mark inside */}
                    <svg
                      className="w-3 h-3 text-red-600 relative z-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                ) : (
                  <img src="/icon9.png" alt="search" className="w-6 h-6 object-contain text-midnightNavy" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard/profile" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
                <div className="text-right">
                  <p className="font-bold text-midnightNavy">
                    {userData.first_name} {userData.last_name}
                  </p>
                  <p className="text-sm text-midnightNavy capitalize">{userData.role}</p>
                </div>

                <img
                  src={userData.profile_picture_url || "/icon11.png"}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/icon11.png';
                  }}
                  alt="User Avatar"
                  className="w-12 h-12 rounded-full border border-gray-200 object-cover"
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between mb-4 px-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-midnightNavy">Count: {filteredUsers.length}</h2>
              {(filterRole !== 'all' || filterStatus !== 'all' || appliedSearchQuery !== '') && (
                <button
                  onClick={() => {
                    setFilterRole('all');
                    setFilterStatus('all');
                    setPendingSearchQuery('');
                    setAppliedSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium mt-1"
                >
                  Clear Filters
                </button>
              )}
            </div>
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
                onClick={() => {
                  setEditingUser(null);
                  setIsAddUserModalOpen(true);
                }}
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
              users={paginatedUsers}
              filterRole="all"
              filterStatus="all"
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
              onEditUser={handleEditUser}
            />

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
              <div className="flex justify-center items-center gap-4 py-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md bg-white border border-gray-300 text-midnightNavy hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  &lt;
                </button>
                <span className="text-sm text-midnightNavy">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md bg-white border border-gray-300 text-midnightNavy hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={handleCloseModal}
        user={editingUser}
      />
    </div>
  );
}