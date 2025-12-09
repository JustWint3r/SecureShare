'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Activity,
  Upload,
  Download,
  Eye,
  Share2,
  Trash2,
  Edit,
  Clock,
  User,
  FileText,
  Shield,
} from 'lucide-react';
import { apiGet } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface FileAuditLogModalProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
  privyUser: any;
}

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  transaction_hash: string | null;
  metadata: any;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  shared_with: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function FileAuditLogModal({
  fileId,
  fileName,
  onClose,
  privyUser,
}: FileAuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFileLogs();
  }, [fileId]);

  const fetchFileLogs = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/api/files/${fileId}/audit-logs`, privyUser);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
      } else {
        toast.error(data.error || 'Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching file audit logs:', error);
      toast.error('Error loading audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upload':
        return <Upload className="w-4 h-4" />;
      case 'download':
        return <Download className="w-4 h-4" />;
      case 'view':
      case 'access_via_link':
        return <Eye className="w-4 h-4" />;
      case 'share':
      case 'permission_granted':
        return <Share2 className="w-4 h-4" />;
      case 'revoke':
      case 'permission_revoked':
        return <Shield className="w-4 h-4" />;
      case 'delete':
        return <Trash2 className="w-4 h-4" />;
      case 'update':
      case 'rename':
        return <Edit className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upload':
        return 'text-blue-600 bg-blue-100';
      case 'download':
        return 'text-green-600 bg-green-100';
      case 'view':
      case 'access_via_link':
        return 'text-purple-600 bg-purple-100';
      case 'share':
      case 'permission_granted':
        return 'text-indigo-600 bg-indigo-100';
      case 'revoke':
      case 'permission_revoked':
        return 'text-red-600 bg-red-100';
      case 'delete':
        return 'text-red-700 bg-red-200';
      case 'update':
      case 'rename':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      upload: 'Uploaded',
      download: 'Downloaded',
      view: 'Viewed',
      share: 'Shared',
      revoke: 'Access Revoked',
      delete: 'Deleted',
      update: 'Updated',
      rename: 'Renamed',
      permission_granted: 'Permission Granted',
      permission_revoked: 'Permission Revoked',
      access_via_link: 'Accessed via Link',
    };
    return labels[action] || action;
  };

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, AuditLog[]>);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">File Activity History</h2>
              <p className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="truncate max-w-md">{fileName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading activity history...</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
              <p className="text-gray-600">No actions have been logged for this file</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center mb-4">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-4 text-sm font-medium text-gray-500">{date}</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-4">
                    {dateLogs.map((log, index) => (
                      <div key={log.id} className="relative pl-8">
                        {/* Timeline line */}
                        {index < dateLogs.length - 1 && (
                          <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                        )}

                        {/* Timeline dot */}
                        <div
                          className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white ${getActionColor(
                            log.action
                          )}`}
                        ></div>

                        {/* Log content */}
                        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1.5 rounded ${getActionColor(log.action)}`}>
                                {getActionIcon(log.action)}
                              </div>
                              <span className="font-medium text-gray-900">
                                {getActionLabel(log.action)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(log.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                            <User className="w-4 h-4" />
                            <span>
                              {log.user.name} ({log.user.role})
                            </span>
                          </div>

                          {log.shared_with && (
                            <div className="text-sm text-indigo-600 mb-2">
                              → Shared with: {log.shared_with.name} ({log.shared_with.email})
                            </div>
                          )}

                          {log.ip_address && (
                            <div className="text-xs text-gray-500">
                              IP: {log.ip_address}
                            </div>
                          )}

                          {log.transaction_hash && (
                            <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                              <p className="text-xs font-medium text-gray-600 mb-1">
                                Blockchain Transaction:
                              </p>
                              <p className="text-xs font-mono text-gray-900 break-all">
                                {log.transaction_hash}
                              </p>
                            </div>
                          )}

                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                              <p className="text-xs font-medium text-gray-600 mb-1">Details:</p>
                              <pre className="text-xs text-gray-900 overflow-auto max-h-20">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {logs.length} {logs.length === 1 ? 'activity' : 'activities'} logged
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
