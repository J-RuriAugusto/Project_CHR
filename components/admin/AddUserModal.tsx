'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

export default function AddUserModal({ isOpen, onClose, user }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'officer',
    status: 'ACTIVE'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ checked: boolean; isConfirmed: boolean }>({
    checked: false,
    isConfirmed: false
  });

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        status: user.status?.toUpperCase() || 'ACTIVE'
      });
    } else {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'officer',
        status: 'ACTIVE'
      });
    }
    setError('');

    // Check invite status if user exists
    if (user) {
      checkInviteStatus(user.id);
    } else {
      setInviteStatus({ checked: false, isConfirmed: false });
    }
  }, [user, isOpen]);

  const checkInviteStatus = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/check-invite-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (response.ok) {
        setInviteStatus({ checked: true, isConfirmed: data.isConfirmed });
      }
    } catch (err) {
      console.error('Failed to check invite status', err);
    }
  };

  const handleResendInvite = async () => {
    if (!user?.email) return;

    setIsResending(true);
    setError('');

    try {
      const response = await fetch('/api/admin/resend-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation');
      }

      alert(`Invitation resent to ${user.email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend invitation');
    } finally {
      setIsResending(false);
    }
  };

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'investigation_chief', label: 'Investigation Chief' },
    { value: 'regional_director', label: 'Regional Director' },
    { value: 'officer', label: 'Officer' },
    { value: 'records_officer', label: 'Records Officer' },
    { value: 'legal_chief', label: 'Legal Chief' }
  ];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.first_name || !formData.last_name) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const url = user ? '/api/admin/update-user' : '/api/admin/create-user';
      const method = user ? 'PUT' : 'POST';

      const body: any = {
        ...formData,
      };

      if (user) {
        body.userId = user.id;
        // body.status is already included in ...formData
      }
      // Password is no longer needed as we use inviteUserByEmail

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${user ? 'update' : 'create'} user`);
      }

      // Reset form and close modal
      if (!user) {
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          role: 'officer',
          status: 'ACTIVE'
        });
        alert(`Invitation email sent to ${formData.email}`);
      }
      onClose();
      window.location.reload();
    } catch (error: any) {
      setError(error.message || `Failed to ${user ? 'update' : 'create'} user`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-md relative">
        <div className="bg-sky rounded-t-3xl p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-midnightNavy">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex flex-col items-center gap-1 mr-2">
                <span className="text-midnightNavy font-medium text-xs uppercase tracking-wider">Status</span>
                <button
                  onClick={() => handleChange('status', formData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                  className={`relative w-24 h-7 rounded-full transition-colors duration-200 ease-in-out flex items-center ${formData.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray'
                    }`}
                >
                  <span
                    className={`absolute left-2 text-[10px] font-bold text-white transition-opacity duration-200 ${formData.status === 'ACTIVE' ? 'opacity-100' : 'opacity-0'
                      }`}
                  >
                    ACTIVE
                  </span>
                  <span
                    className={`absolute right-2 text-[10px] font-bold text-white transition-opacity duration-200 ${formData.status === 'ACTIVE' ? 'opacity-0' : 'opacity-100'
                      }`}
                  >
                    INACTIVE
                  </span>
                  <div
                    className={`absolute left-1 w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${formData.status === 'ACTIVE' ? 'translate-x-[4.25rem]' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-royal hover:text-blue"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form content */}
        <div className="p-6 space-y-4 bg-snowWhite rounded-b-3xl">
          {error && (
            <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-graphite font-semibold mb-2 text-lg">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter the email address..."
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-coal placeholder-ash"
            />
          </div>

          {/* First Name */}
          <div>
            <label className="block text-graphite font-semibold mb-2 text-lg">
              First Name
            </label>
            <input
              type="text"
              placeholder="Enter user's first name..."
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-coal placeholder-ash"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-graphite font-semibold mb-2 text-lg">
              Last Name
            </label>
            <input
              type="text"
              placeholder="Enter user's last name..."
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-coal placeholder-ash"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-graphite font-semibold mb-2 text-lg">
              Role
            </label>
            <div className="relative">
              <select
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-coal appearance-none cursor-pointer ${!formData.role ? "text-gray-400" : ""
                  }`}
              >
                <option value="" disabled hidden>
                  Assign them to their designated role...
                </option>

                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>

              <img
                src="/icon18.png"
                alt="dropdown"
                className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center pt-4">
            <div>
              {user && (
                <button
                  onClick={handleResendInvite}
                  disabled={isResending}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-green-400"
                  title="Resend invitation email"
                >
                  {isResending ? 'Sending...' : 'Resend Invitation'}
                </button>
              )}
            </div>
            <div className="flex gap-4">

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-8 py-3 bg-royalAzure text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300"
              >
                {isLoading ? 'Saving...' : (user ? 'Save Changes' : 'Add User')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
