'use client';

import { useState, useEffect } from 'react';
import { FileMetadata } from '@/types';
import { apiGet } from '@/lib/api-client';
import {
  FileText,
  Search,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import FileUploadModal from '@/components/FileUploadModal';
import FileGrid from '@/components/FileGrid';
import Sidebar from '@/components/Sidebar';
import SettingsModal from '@/components/SettingsModal';
import AuditLogsPage from '@/components/AuditLogsPage';
import UserManagementPage from '@/components/UserManagementPage';
import ContactAdminPage from '@/components/ContactAdminPage';
import InquiriesManagementPage from '@/components/InquiriesManagementPage';
import MyInquiriesPage from '@/components/MyInquiriesPage';

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
      // Add timestamp to bust cache
      const cacheBuster = `_t=${Date.now()}`;
      const response = await apiGet(`/api/files?type=${type}&${cacheBuster}`, privyUser);
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
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
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
        <header
          className="px-8 py-6"
          style={{
            background: 'var(--surface-white)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-3xl font-semibold mb-2"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'Crimson Pro, serif',
                }}
              >
                {activeTab === 'my-files'
                  ? 'My Files'
                  : activeTab === 'shared-files'
                  ? 'Shared with Me'
                  : activeTab === 'audit-logs'
                  ? 'Audit Logs'
                  : activeTab === 'user-management'
                  ? 'User Management'
                  : activeTab === 'my-inquiries'
                  ? 'My Inquiries'
                  : activeTab === 'contact-admin'
                  ? 'Contact Administrator'
                  : activeTab === 'inquiries-management'
                  ? 'Inquiries Management'
                  : 'Dashboard'}
              </h1>
              <p style={{ color: 'var(--text-tertiary)' }}>
                {activeTab === 'my-files'
                  ? 'Manage your encrypted documents'
                  : activeTab === 'shared-files'
                  ? 'Access files shared with you'
                  : activeTab === 'audit-logs'
                  ? 'View complete system activity trail'
                  : activeTab === 'user-management'
                  ? 'Manage users and permissions'
                  : activeTab === 'my-inquiries'
                  ? 'View your inquiry history and responses'
                  : activeTab === 'contact-admin'
                  ? 'Send inquiries or requests to administrators'
                  : activeTab === 'inquiries-management'
                  ? 'Review and respond to user inquiries'
                  : 'SecureShare Dashboard'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {(activeTab === 'my-files' || activeTab === 'shared-files') && (
                <>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 h-5 w-5 pointer-events-none"
                      style={{
                        color: 'var(--text-muted)',
                        transform: 'translateY(-50%)',
                        zIndex: 10
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field w-64"
                      style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                    />
                  </div>

                  {activeTab === 'my-files' && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Upload File</span>
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
            <div className="p-8">
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
            <UserManagementPage user={currentUser} privyUser={privyUser} />
          ) : activeTab === 'my-inquiries' ? (
            <MyInquiriesPage user={currentUser} privyUser={privyUser} />
          ) : activeTab === 'contact-admin' ? (
            <ContactAdminPage user={currentUser} privyUser={privyUser} />
          ) : activeTab === 'inquiries-management' ? (
            <InquiriesManagementPage user={currentUser} privyUser={privyUser} />
          ) : (
            <div className="flex items-center justify-center min-h-full">
              <div
                className="card-elevated p-12 text-center max-w-md"
              >
                <FileText
                  className="h-16 w-16 mx-auto mb-6"
                  style={{ color: 'var(--text-muted)' }}
                />
                <h3
                  className="text-xl font-bold mb-3"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'IBM Plex Mono, monospace',
                  }}
                >
                  WELCOME TO SECURESHARE
                </h3>
                <p style={{ color: 'var(--text-tertiary)' }}>
                  Select a section from the sidebar to get started.
                </p>
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
