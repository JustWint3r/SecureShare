'use client';

import { useState, useEffect } from 'react';
import { FileMetadata, User } from '@/types';
import { apiGet } from '@/lib/api-client';
import {
  FileText,
  Upload,
  Download,
  Share2,
  Shield,
  Activity,
  Users,
  Settings,
  LogOut,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import { formatFileSize, formatDate, getFileIcon } from '@/lib/utils';
import toast from 'react-hot-toast';
import FileUploadModal from '@/components/FileUploadModal';
import FileGrid from '@/components/FileGrid';
import Sidebar from '@/components/Sidebar';
import SettingsModal from '@/components/SettingsModal';
import AuditLogsPage from '@/components/AuditLogsPage';

interface DashboardProps {
  user: any; // Database user object
  privyUser: any; // Privy user object
  onLogout: () => void;
}

export default function Dashboard({
  user,
  privyUser,
  onLogout,
}: DashboardProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-files');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    fetchFiles();
  }, [activeTab]);

  useEffect(() => {
    // Update currentUser when user prop changes
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const type = activeTab === 'my-files' ? 'owned' : 'accessible';
      const response = await apiGet(`/api/files?type=${type}`, privyUser);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files || []);
      } else {
        toast.error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Error loading files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = () => {
    fetchFiles();
    setShowUploadModal(false);
    toast.success('File uploaded successfully!');
  };

  const handleLogout = async () => {
    onLogout();
    toast.success('Logged out successfully');
  };

  const handleSettingsUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser);
    toast.success('Settings updated successfully!');
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'my-files'
                  ? 'My Files'
                  : activeTab === 'shared-files'
                  ? 'Shared with Me'
                  : activeTab === 'audit-logs'
                  ? 'Audit Logs'
                  : 'User Management'}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeTab === 'my-files'
                  ? 'Manage your uploaded documents'
                  : activeTab === 'shared-files'
                  ? 'Access files shared with you'
                  : activeTab === 'audit-logs'
                  ? 'View system activity logs'
                  : 'Manage users and permissions'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {(activeTab === 'my-files' || activeTab === 'shared-files') && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  {activeTab === 'my-files' && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Upload File
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          {activeTab === 'my-files' || activeTab === 'shared-files' ? (
            <div className="p-6">
              <FileGrid
                files={filteredFiles}
                loading={loading}
                onRefresh={fetchFiles}
                isOwnedFiles={activeTab === 'my-files'}
                user={privyUser}
              />
            </div>
          ) : activeTab === 'audit-logs' ? (
            <AuditLogsPage user={currentUser} privyUser={privyUser} />
          ) : activeTab === 'user-management' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">User Management</h3>
                <p>User management functionality will be implemented here.</p>
                <p className="text-sm mt-2">
                  Administrators can manage user roles and permissions.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Welcome to SecureShare
                </h3>
                <p>Select a section from the sidebar to get started.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* File Upload Modal */}
      {showUploadModal && (
        <FileUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleFileUploaded}
          user={privyUser}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          user={currentUser}
          privyUser={privyUser}
          onClose={() => setShowSettingsModal(false)}
          onUpdateSuccess={handleSettingsUpdate}
        />
      )}
    </div>
  );
}
