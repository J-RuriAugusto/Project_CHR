'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface UserManagementProps {
  users: User[];
}

export default function UserManagement({ users: initialUsers }: UserManagementProps) {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedRole, setSelectedRole] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'officer'
  });

  const roles = [
    'admin', 'investigation_chief', 'regional_director', 
    'officer', 'records_officer', 'legal_chief'
  ];

  const filteredUsers = selectedRole === 'all' 
    ? users 
    : users.filter(user => user.role === selectedRole);

  const handleEditClick = (user: User) => setEditingUser({...user});
  const handleDeleteClick = (user: User) => setUserToDelete(user);
  const handleCancelEdit = () => setEditingUser(null);
  const handleCancelDelete = () => setUserToDelete(null);
  
  const handleAddClick = () => setShowAddForm(true);
  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewUser({
      email: '',
      first_name: '',
      last_name: '',
      role: 'officer'
    });
  };

  const handleEditChange = (field: keyof User, value: string) => {
    if (editingUser) {
      setEditingUser({...editingUser, [field]: value});
    }
  };
  
  const handleNewUserChange = (field: keyof Omit<User, 'id'>, value: string) => {
    setNewUser({...newUser, [field]: value});
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsLoading(true);
    
    try {
      // Call API to update user in both auth and users table
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
          role: editingUser.role
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }
      
      // Update local state with the returned user data
      setUsers(users.map(user => user.id === editingUser.id ? result.user : user));
      setMessage({ text: 'User updated successfully', type: 'success' });
      setEditingUser(null);
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to update user', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddUser = async () => {
    setIsLoading(true);
    
    try {
      // Check if email already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', newUser.email);
      
      if (checkError) throw checkError;
      
      if (existingUsers && existingUsers.length > 0) {
        setMessage({ text: 'Email address is already in use', type: 'error' });
        setIsLoading(false);
        return;
      }
      
      // Call the server-side API to create the user
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          password: 'p@ssw0rD', // Make sure this is included
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }
      
      // Update local state with the returned user data
      setUsers([...users, result.user]);
      setMessage({ text: 'User created successfully', type: 'success' });
      handleCancelAdd();
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to create user', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsLoading(true);
    
    try {
      // Call API to delete user from both auth and users table
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userToDelete.id
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }
      
      // Update local state
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setMessage({ text: 'User deleted successfully', type: 'success' });
      setUserToDelete(null);
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to delete user', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeClasses = (role: string) => {
    const classes: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      officer: 'bg-blue-100 text-blue-800',
      records_officer: 'bg-green-100 text-green-800',
      investigation_chief: 'bg-yellow-100 text-yellow-800',
      legal_chief: 'bg-red-100 text-red-800',
      regional_director: 'bg-indigo-100 text-indigo-800'
    };
    return classes[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      {message.text && (
        <div className={`${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} 
          border px-4 py-3 rounded mb-4`}>
          {message.text}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">User Management</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleAddClick}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </button>
          <div className="flex items-center">
            <label htmlFor="role-filter" className="mr-2 text-sm font-medium text-gray-700">
              Filter by role:
            </label>
            <select
              id="role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm p-2 text-sm"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="bg-white hover:bg-gray-50">
                {editingUser && editingUser.id === user.id ? (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={editingUser.first_name}
                        onChange={(e) => handleEditChange('first_name', e.target.value)}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={editingUser.last_name}
                        onChange={(e) => handleEditChange('last_name', e.target.value)}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={editingUser.role}
                        onChange={(e) => handleEditChange('role', e.target.value)}
                        className="border rounded p-1 w-full"
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={isLoading}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.first_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClasses(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit user"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete user <span className="font-medium">{userToDelete.email}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) => handleNewUserChange('email', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  value={newUser.first_name}
                  onChange={(e) => handleNewUserChange('first_name', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  value={newUser.last_name}
                  onChange={(e) => handleNewUserChange('last_name', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => handleNewUserChange('role', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  onClick={handleCancelAdd}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={isLoading || !newUser.email || !newUser.first_name || !newUser.last_name}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                >
                  {isLoading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}