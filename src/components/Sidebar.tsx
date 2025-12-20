'use client';

import { cn } from '@/lib/utils';
import {
  FileText,
  Share2,
  Activity,
  Users,
  Settings,
  LogOut,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  user: any;
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
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const navigation = [
    {
      id: 'my-files',
      name: 'My Files',
      icon: FileText,
      description: 'Documents you own',
    },
    {
      id: 'shared-files',
      name: 'Shared Files',
      icon: Share2,
      description: 'Shared with you',
    },
    {
      id: 'audit-logs',
      name: 'Audit Logs',
      icon: Activity,
      description: 'Activity history',
    },
  ];

  const userRole = user?.role?.toLowerCase();
  if (userRole === 'administrator') {
    navigation.push({
      id: 'user-management',
      name: 'User Management',
      icon: Users,
      description: 'Manage accounts',
    });
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'administrator':
        return 'badge-secondary';
      case 'lecturer':
        return 'badge-primary';
      case 'student':
        return 'badge-success';
      default:
        return 'badge-primary';
    }
  };

  const sidebarVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      className="w-80 flex flex-col"
      style={{
        background: 'var(--surface-white)',
        borderRight: '1px solid var(--border-subtle)',
      }}
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      {/* Logo and Brand */}
      <motion.div
        className="p-6 pb-5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        variants={itemVariants}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: 'var(--accent-primary)' }}>
            <Shield className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1
              className="text-xl font-semibold"
              style={{ fontFamily: 'Crimson Pro, serif', color: 'var(--text-primary)' }}
            >
              SecureShare
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Document Management
            </p>
          </div>
        </div>
      </motion.div>

      {/* User Profile */}
      <motion.div
        className="p-6 py-5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        variants={itemVariants}
      >
        <div className="flex items-center gap-3 mb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--accent-primary)',
              }}
            >
              <span className="text-lg font-semibold text-white">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
              style={{
                background: 'var(--success)',
                borderColor: 'var(--surface-white)',
              }}
            />
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate mb-0.5" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'User'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)', fontFamily: 'Fira Code, monospace' }}>
              {user?.email || (user?.wallet_address ? formatWalletAddress(user.wallet_address) : 'No email')}
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2">
          <div className={`badge ${getRoleBadgeClass(user?.role)}`}>
            <GraduationCap className="h-3 w-3 mr-1.5" />
            <span className="capitalize">{user?.role || 'User'}</span>
          </div>
          {user?.department && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              • {user.department}
            </span>
          )}
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.nav className="flex-1 p-4" variants={itemVariants}>
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left',
                )}
                style={{
                  background: isActive ? 'var(--bg-secondary)' : 'transparent',
                  border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                }}
                whileHover={{
                  backgroundColor: isActive ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                }}
                whileTap={{ scale: 0.98 }}
                variants={itemVariants}
              >
                <div className="relative flex items-center gap-3 flex-1">
                  <Icon
                    className="h-5 w-5 flex-shrink-0"
                    style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                    strokeWidth={1.5}
                  />

                  <div className="flex-1">
                    <div
                      className="text-sm font-medium mb-0.5"
                      style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {item.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      {/* Footer Actions */}
      <motion.div
        className="p-4 space-y-2"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
        variants={itemVariants}
      >
        <motion.button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all"
          style={{
            border: '1px solid var(--border-default)',
            background: 'transparent',
          }}
          whileHover={{
            borderColor: 'var(--accent-primary)',
            backgroundColor: 'var(--bg-tertiary)',
          }}
          whileTap={{ scale: 0.98 }}
        >
          <Settings className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} strokeWidth={1.5} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Settings
          </span>
        </motion.button>

        <motion.button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all"
          style={{
            border: '1px solid var(--border-default)',
            background: 'transparent',
          }}
          whileHover={{
            borderColor: 'var(--error)',
            backgroundColor: 'rgba(139, 58, 58, 0.05)',
          }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} strokeWidth={1.5} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Sign Out
          </span>
        </motion.button>
      </motion.div>

      {/* Version indicator */}
      <div
        className="px-6 py-3 text-center text-xs"
        style={{
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          fontFamily: 'Fira Code, monospace',
        }}
      >
        SecureShare v2.0 • Secure
      </div>
    </motion.div>
  );
}
