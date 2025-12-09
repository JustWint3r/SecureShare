'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api-client';
import {
  Activity,
  Upload,
  Download,
  Eye,
  Share2,
  Trash2,
  Edit,
  FileText,
  Users,
  Shield,
  Clock,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  file_id: string;
  user_id: string;
  action: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  transaction_hash: string | null;
  metadata: any;
  shared_with_user_id: string | null;
  file: {
    id: string;
    name: string;
    type: string;
  };
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

interface AuditLogsPageProps {
  user: any;
  privyUser: any;
}

export default function AuditLogsPage({ user, privyUser }: AuditLogsPageProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 20;

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedAction, currentPage]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * logsPerPage;
      const actionParam = selectedAction !== 'all' ? `&action=${selectedAction}` : '';
      const response = await apiGet(
        `/api/audit-logs?limit=${logsPerPage}&offset=${offset}${actionParam}`,
        privyUser
      );
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        setTotalLogs(data.total || 0);
      } else {
        toast.error('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Error loading audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upload':
        return <Upload className="w-5 h-5 text-blue-600" />;
      case 'download':
        return <Download className="w-5 h-5 text-green-600" />;
      case 'view':
      case 'access_via_link':
        return <Eye className="w-5 h-5 text-purple-600" />;
      case 'share':
      case 'permission_granted':
        return <Share2 className="w-5 h-5 text-indigo-600" />;
      case 'revoke':
      case 'permission_revoked':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'delete':
        return <Trash2 className="w-5 h-5 text-red-700" />;
      case 'update':
      case 'rename':
        return <Edit className="w-5 h-5 text-orange-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upload':
        return 'bg-blue-100 text-blue-800';
      case 'download':
        return 'bg-green-100 text-green-800';
      case 'view':
      case 'access_via_link':
        return 'bg-purple-100 text-purple-800';
      case 'share':
      case 'permission_granted':
        return 'bg-indigo-100 text-indigo-800';
      case 'revoke':
      case 'permission_revoked':
        return 'bg-red-100 text-red-800';
      case 'delete':
        return 'bg-red-200 text-red-900';
      case 'update':
      case 'rename':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      upload: 'File Uploaded',
      download: 'File Downloaded',
      view: 'File Viewed',
      share: 'File Shared',
      revoke: 'Access Revoked',
      delete: 'File Deleted',
      update: 'File Updated',
      rename: 'File Renamed',
      permission_granted: 'Permission Granted',
      permission_revoked: 'Permission Revoked',
      access_via_link: 'Accessed via Share Link',
    };
    return labels[action] || action.charAt(0).toUpperCase() + action.slice(1);
  };

  const filteredLogs = logs.filter((log) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      log.file?.name?.toLowerCase().includes(searchLower) ||
      log.user?.name?.toLowerCase().includes(searchLower) ||
      log.user?.email?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(totalLogs / logsPerPage);

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'upload', label: 'Uploads' },
    { value: 'download', label: 'Downloads' },
    { value: 'view', label: 'Views' },
    { value: 'share', label: 'Shares' },
    { value: 'permission_granted', label: 'Permissions Granted' },
    { value: 'permission_revoked', label: 'Permissions Revoked' },
    { value: 'delete', label: 'Deletions' },
  ];

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Activity className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600">View system activity logs</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Entries</p>
            <p className="text-2xl font-bold text-indigo-600">{totalLogs}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          All file activities are logged on the blockchain for transparency and accountability.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by file name, user, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
            >
              {actionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Audit Logs Found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search criteria' : 'No activity has been logged yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {getActionIcon(log.action)}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(
                            log.action
                          )}`}
                        >
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {log.file?.name || 'Unknown File'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.user?.name}</div>
                        <div className="text-sm text-gray-500">{log.user?.email}</div>
                        {log.shared_with && (
                          <div className="text-xs text-indigo-600 mt-1 flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>Shared with: {log.shared_with.name}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-sm text-gray-900">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedLog(expandedLog === log.id ? null : log.id);
                        }}
                      >
                        {expandedLog === log.id ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            <span className="text-sm">Less</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            <span className="text-sm">More</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLogs.map(
                  (log) =>
                    expandedLog === log.id && (
                      <tr key={`${log.id}-details`} className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 font-medium mb-1">IP Address</p>
                              <p className="text-gray-900">{log.ip_address || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-medium mb-1">User Agent</p>
                              <p className="text-gray-900 truncate" title={log.user_agent}>
                                {log.user_agent || 'N/A'}
                              </p>
                            </div>
                            {log.transaction_hash && (
                              <div className="col-span-2">
                                <p className="text-gray-500 font-medium mb-1">
                                  Blockchain Transaction
                                </p>
                                <p className="text-gray-900 font-mono text-xs break-all">
                                  {log.transaction_hash}
                                </p>
                              </div>
                            )}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div className="col-span-2">
                                <p className="text-gray-500 font-medium mb-1">Additional Details</p>
                                <pre className="text-gray-900 text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-32">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * logsPerPage + 1} to{' '}
              {Math.min(currentPage * logsPerPage, totalLogs)} of {totalLogs} entries
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
