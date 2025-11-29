'use client';

// import { User } from '@/types'; // Using Privy user instead
import { cn } from '@/lib/utils';
import {
  FileText,
  Share2,
  Activity,
  Users,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  user: any; // Database user object
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  user,
  activeTab,
  onTabChange,
  onLogout,
  onOpenSettings,
}: SidebarProps) {
  // Format wallet address to show first 4 and last 3 characters
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-3)}`;
  };

  const navigation = [
    {
      id: 'my-files',
      name: 'My Files',
      icon: FileText,
      description: 'Files you own',
    },
    {
      id: 'shared-files',
      name: 'Shared Files',
      icon: Share2,
      description: 'Files shared with you',
    },
    {
      id: 'audit-logs',
      name: 'Audit Logs',
      icon: Activity,
      description: 'System activity logs',
    },
  ];

  // Add user management only for lecturers and administrators
  const userRole = user?.role?.toLowerCase();
  if (userRole === 'lecturer' || userRole === 'administrator') {
    navigation.push({
      id: 'user-management',
      name: 'User Management',
      icon: Users,
      description: 'Manage users and roles',
    });
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'bg-purple-100 text-purple-800';
      case 'lecturer':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-indigo-100 text-indigo-800'; // Default for Privy users
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-indigo-600 mr-3" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">SecureShare</h1>
            <p className="text-xs text-gray-500">Blockchain Document Sharing</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email ||
                (user?.wallet_address
                  ? formatWalletAddress(user.wallet_address)
                  : 'No email')}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
              getRoleBadgeColor(user?.role || 'user')
            )}
          >
            {user?.role || 'User'}
          </span>
          {user?.department && (
            <p className="text-xs text-gray-500 mt-1">{user.department}</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <div>{item.name}</div>
                  <div
                    className={cn(
                      'text-xs',
                      isActive ? 'text-indigo-600' : 'text-gray-500'
                    )}
                  >
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
