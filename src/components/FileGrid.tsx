'use client';

import { useState, useRef, useEffect } from 'react';
import { FileMetadata } from '@/types';
import { formatFileSize, formatDate, getFileIcon } from '@/lib/utils';
import {
  Download,
  Share2,
  MoreVertical,
  Eye,
  Trash2,
  RefreshCw,
  FileText,
  Edit3,
  History,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ShareModal from './ShareModal';
import FileAuditLogModal from './FileAuditLogModal';

interface FileGridProps {
  files: FileMetadata[];
  loading: boolean;
  onRefresh: () => void;
  isOwnedFiles: boolean;
  user?: any; // Privy user object for authentication
}

export default function FileGrid({
  files,
  loading,
  onRefresh,
  isOwnedFiles,
  user,
}: FileGridProps) {
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
    new Set()
  );
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [shareModalFile, setShareModalFile] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [auditLogModalFile, setAuditLogModalFile] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (fileId: string, fileName: string) => {
    setDownloadingFiles((prev) => new Set(prev).add(fileId));

    try {
      const headers: any = {};
      if (user?.id) {
        headers['x-privy-user-id'] = user.id;
      }

      const response = await fetch(`/api/files/${fileId}/download`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Download failed');
        return;
      }

      // Get the actual file blob from the response
      const blob = await response.blob();

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${fileName}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    } finally {
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const handleShare = (fileId: string, fileName: string) => {
    setShareModalFile({ id: fileId, name: fileName });
    setOpenDropdown(null);
  };

  const handleRename = async (fileId: string, currentName: string) => {
    const newName = prompt('Enter new file name:', currentName);
    if (!newName || newName === currentName) return;

    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-privy-user-id'] = user.id;
      }

      const response = await fetch(`/api/files/${fileId}/rename`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ newName }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('File renamed successfully');
        onRefresh();
      } else {
        toast.error(data.error || 'Failed to rename file');
      }
    } catch (error) {
      console.error('Rename error:', error);
      toast.error('Failed to rename file');
    }
    setOpenDropdown(null);
  };

  const handleViewAuditLog = (fileId: string, fileName: string) => {
    setAuditLogModalFile({ id: fileId, name: fileName });
    setOpenDropdown(null);
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-privy-user-id'] = user.id;
      }

      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('File deleted successfully');
        onRefresh();
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isOwnedFiles ? 'No files uploaded yet' : 'No files shared with you'}
        </h3>
        <p className="text-gray-500 mb-6">
          {isOwnedFiles
            ? 'Upload your first document to get started with secure sharing.'
            : 'Files shared with you will appear here.'}
        </p>
        {isOwnedFiles && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </p>
        <button
          onClick={onRefresh}
          className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* File Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                {getFileIcon(file.type)}
              </div>
              <div
                className="relative"
                ref={openDropdown === file.id ? dropdownRef : null}
              >
                <button
                  onClick={() =>
                    setOpenDropdown(openDropdown === file.id ? null : file.id)
                  }
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors hover:bg-gray-100"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                {/* Dropdown Menu */}
                {openDropdown === file.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 py-1 z-10">
                    <button
                      onClick={() => handleRename(file.id, file.name)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Rename
                    </button>
                    <button
                      onClick={() => handleViewAuditLog(file.id, file.name)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <History className="h-4 w-4 mr-2" />
                      View Audit Log
                    </button>
                    {isOwnedFiles && (
                      <>
                        <button
                          onClick={() => handleShare(file.id, file.name)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </button>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={() => handleDelete(file.id, file.name)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* File Info */}
            <div className="mb-4">
              <h3
                className="font-medium text-gray-900 truncate mb-1"
                title={file.name}
              >
                {file.name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(file.created_at)}
              </p>
            </div>

            {/* File Actions */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(file.id, file.name)}
                  disabled={downloadingFiles.has(file.id)}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>

                {isOwnedFiles && (
                  <button
                    onClick={() => handleShare(file.id, file.name)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isOwnedFiles && (
                <button
                  onClick={() => handleDelete(file.id, file.name)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Indicator */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {isOwnedFiles ? 'Owned' : 'Shared'}
                </span>
                <div className="flex items-center text-green-600">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                  Encrypted
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      {shareModalFile && (
        <ShareModal
          file={shareModalFile}
          onClose={() => setShareModalFile(null)}
          user={user}
        />
      )}

      {/* Audit Log Modal */}
      {auditLogModalFile && (
        <FileAuditLogModal
          fileId={auditLogModalFile.id}
          fileName={auditLogModalFile.name}
          onClose={() => setAuditLogModalFile(null)}
          privyUser={user}
        />
      )}
    </div>
  );
}
