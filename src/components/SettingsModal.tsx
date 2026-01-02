'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Mail, Building2, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  user: any;
  privyUser: any;
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
        // Department is not included - can only be changed by admins in User Management
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
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      onClick={onClose}
    >
      <div
        className="card-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 pb-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div>
            <h2
              className="text-2xl font-semibold mb-1"
              style={{ fontFamily: 'Crimson Pro, serif', color: 'var(--text-primary)' }}
            >
              Profile Settings
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              Update your account information
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-all"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Full Name *
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 h-5 w-5 pointer-events-none"
                  style={{
                    color: 'var(--text-muted)',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }}
                />
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="input-field"
                  placeholder="Your full name"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm" style={{ color: 'var(--error)' }}>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 h-5 w-5 pointer-events-none"
                  style={{
                    color: 'var(--text-muted)',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }}
                />
                <input
                  type="email"
                  {...register('email')}
                  className="input-field"
                  placeholder="your@example.com"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Department
              </label>
              <div className="relative">
                <Building2
                  className="absolute left-3 top-1/2 h-5 w-5 pointer-events-none"
                  style={{
                    color: 'var(--text-muted)',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }}
                />
                <input
                  type="text"
                  {...register('department')}
                  className="input-field"
                  placeholder="e.g., Computer Science"
                  disabled
                  style={{
                    paddingLeft: '2.5rem',
                    background: 'var(--bg-secondary)',
                    cursor: 'not-allowed',
                    opacity: 0.7,
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                Contact an administrator to change your department
              </p>
            </div>

            {/* Role Display (Read-only) */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Role
              </label>
              <div
                className="px-4 py-2.5 rounded-lg capitalize"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                {user?.role || 'Student'}
              </div>
              <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                Contact an administrator to change your role
              </p>
            </div>

            {/* Authentication Notice */}
            <div
              className="p-4 rounded-lg"
              style={{
                background: 'rgba(26, 77, 128, 0.08)',
                border: '1px solid rgba(26, 77, 128, 0.15)',
              }}
            >
              <div className="flex items-start gap-3">
                <Shield
                  className="h-5 w-5 flex-shrink-0 mt-0.5"
                  style={{ color: 'var(--accent-primary)' }}
                />
                <div>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: 'var(--accent-primary-dark)' }}
                  >
                    Authentication
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Your account is secured by Privy. To change your password or
                    authentication method, please use the Privy login settings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="flex items-center justify-end space-x-3 mt-6 pt-5"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
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
