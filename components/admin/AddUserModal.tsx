'use client';

import { useState } from 'react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'officer'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          password: 'p@ssw0rD'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      // Reset form and close modal
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'officer'
      });
      onClose();
      window.location.reload();
    } catch (error: any) {
      setError(error.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-xl relative">
        <div className="bg-sky rounded-t-3xl p-10 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-royal hover:text-blue"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form content */}
        <div className="p-8 space-y-6 bg-snowWhite rounded-b-3xl">
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
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-coal appearance-none cursor-pointer ${
                  !formData.role ? "text-gray-400" : ""
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
          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-soft text-coal rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-3 bg-royalAzure text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300"
            >
              {isLoading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}