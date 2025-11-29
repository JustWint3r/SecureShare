'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Mail, Building2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  user: any; // Database user object
  privyUser: any; // Privy user object
  onClose: () => void;
  onUpdateSuccess: (updatedUser: any) => void;
}

interface SettingsFormData {
  name: string;
  email?: string;
  department?: string;
}

export default function SettingsModal({
  user,
  privyUser,
  onClose,
  onUpdateSuccess,
}: SettingsModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    setLoading(true);

    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (privyUser?.id) {
        headers['x-privy-user-id'] = privyUser.id;
      }

      const updateData = {
        name: data.name,
        email: data.email || null,
        department: data.department || null,
      };

      const response = await fetch('/api/user/update-settings', {
        method: 'POST',
        headers,
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Profile updated successfully!');
        onUpdateSuccess(result.user);
      } else {
        toast.error(result.error || 'Update failed');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Profile Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Update your account information
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100/50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="pl-10 pr-4 py-2 w-full border-2 border-gray-300/50 bg-white/50 backdrop-blur-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white/80 transition-all text-gray-900"
                  placeholder="Your full name"
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  {...register('email')}
                  className="pl-10 pr-4 py-2 w-full border-2 border-gray-300/50 bg-white/50 backdrop-blur-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white/80 transition-all text-gray-900"
                  placeholder="your@example.com"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  {...register('department')}
                  className="pl-10 pr-4 py-2 w-full border-2 border-gray-300/50 bg-white/50 backdrop-blur-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white/80 transition-all text-gray-900"
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>

            {/* Role Display (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="px-4 py-2 bg-gray-50/50 backdrop-blur-sm border-2 border-gray-200/50 rounded-lg text-gray-600 capitalize">
                {user?.role || 'Student'}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Contact an administrator to change your role
              </p>
            </div>

            {/* Note about authentication */}
            <div className="p-4 bg-blue-50/50 backdrop-blur-sm border border-blue-200/50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">
                Authentication
              </p>
              <p className="text-xs text-blue-700">
                Your account is secured by Privy. To change your password or
                authentication method, please use the Privy login settings.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300/50 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
