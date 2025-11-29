'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Building2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfileSetupProps {
  user: any; // Privy user object
  onComplete: (updatedUser: any) => void;
}

interface ProfileFormData {
  name: string;
  email?: string;
  department?: string;
}

export default function UserProfileSetup({
  user,
  onComplete,
}: UserProfileSetupProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name:
        user?.email?.address?.split('@')[0] ||
        user?.wallet?.address?.slice(-6) ||
        '',
      email: user?.email?.address || '',
      department: '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-privy-user-id': user.id,
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          department: data.department,
          role: 'student', // Always default to student role
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Profile setup completed!');
        onComplete(result.user);
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600">
            Set up your profile to get started with SecureShare
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
                placeholder="Enter your full name"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field (if not from Privy) */}
          {!user?.email?.address && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
                  placeholder="Enter your email address"
                />
              </div>
            </div>
          )}

          {/* Department Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department (Optional)
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                {...register('department')}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
                placeholder="e.g., Computer Science, Business"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Setting up...
              </div>
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          You can update your profile information later in settings.
        </p>
      </div>
    </div>
  );
}
