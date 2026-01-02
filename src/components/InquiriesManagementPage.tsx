'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api-client';
import {
  MessageCircle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  X,
  User,
  Mail,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  Download,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AttachmentMetadata {
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface Reply {
  id: string;
  inquiry_id: string;
  user_id: string;
  message: string;
  created_at: string;
  users?: {
    id: string;
    name: string;
    role: string;
  };
}

interface Inquiry {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  attachments: (AttachmentMetadata | string)[] | null; // Support both new and old formats
  status: 'pending' | 'resolved' | 'closed';
  admin_response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
}

interface InquiriesManagementPageProps {
  user: any;
  privyUser: any;
}

export default function InquiriesManagementPage({ user, privyUser }: InquiriesManagementPageProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    fileName: string;
    mimeType: string;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await apiGet(`/api/admin/inquiries${statusParam}`, privyUser);
      const data = await res.json();

      if (data.success) {
        setInquiries(data.inquiries || []);
      } else {
        toast.error(data.error || 'Failed to fetch inquiries');
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Error loading inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInquiry = async (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setResponse('');
    await fetchReplies(inquiry.id);
  };

  const handleCloseModal = () => {
    setSelectedInquiry(null);
    setResponse('');
    setReplies([]);
  };

  const fetchReplies = async (inquiryId: string) => {
    try {
      setLoadingReplies(true);
      const headers: any = {};
      if (privyUser?.id) {
        headers['x-privy-user-id'] = privyUser.id;
      }

      const res = await fetch(`/api/inquiries/${inquiryId}/replies`, { headers });
      const data = await res.json();

      if (data.success) {
        setReplies(data.replies || []);
      } else {
        toast.error(data.error || 'Failed to fetch conversation');
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast.error('Failed to load conversation');
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleViewAttachment = async (attachment: AttachmentMetadata) => {
    try {
      setLoadingPreview(true);
      const headers: any = {};
      if (privyUser?.id) {
        headers['x-privy-user-id'] = privyUser.id;
      }

      const res = await fetch(
        `/api/admin/inquiries/attachments?path=${encodeURIComponent(attachment.storagePath)}`,
        { headers }
      );
      const data = await res.json();

      if (data.success && data.signedUrl) {
        const fileExt = attachment.fileName.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
        const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileExt);

        // For images and videos, show in preview modal
        if (isImage || isVideo) {
          setPreviewAttachment({
            url: data.signedUrl,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
          });
        } else {
          // For other files, download directly
          window.open(data.signedUrl, '_blank');
        }
      } else {
        toast.error(data.error || 'Failed to access file');
      }
    } catch (error) {
      console.error('Error accessing attachment:', error);
      toast.error('Failed to access file');
    } finally {
      setLoadingPreview(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmitResponse = async () => {
    if (!selectedInquiry || !response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setResponding(true);
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (privyUser?.id) {
        headers['x-privy-user-id'] = privyUser.id;
      }

      const res = await fetch(`/api/inquiries/${selectedInquiry.id}/replies`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: response,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Reply sent successfully');
        setResponse('');
        await fetchReplies(selectedInquiry.id);
      } else {
        toast.error(data.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setResponding(false);
    }
  };

  const handleUpdateStatus = async (inquiryId: string, newStatus: 'pending' | 'resolved' | 'closed') => {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (privyUser?.id) {
        headers['x-privy-user-id'] = privyUser.id;
      }

      const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Status updated');
        fetchInquiries();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'closed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      inquiry.subject.toLowerCase().includes(searchLower) ||
      inquiry.message.toLowerCase().includes(searchLower) ||
      (inquiry.user_name && inquiry.user_name.toLowerCase().includes(searchLower)) ||
      (inquiry.user_email && inquiry.user_email.toLowerCase().includes(searchLower))
    );
  });

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i) => i.status === 'pending').length,
    resolved: inquiries.filter((i) => i.status === 'resolved').length,
    closed: inquiries.filter((i) => i.status === 'closed').length,
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="p-3 rounded-lg"
              style={{ background: 'rgba(26, 77, 128, 0.1)' }}
            >
              <MessageCircle
                className="w-8 h-8"
                style={{ color: 'var(--accent-primary)' }}
              />
            </div>
            <div>
              <h1
                className="text-3xl font-semibold mb-1"
                style={{
                  fontFamily: 'Crimson Pro, serif',
                  color: 'var(--text-primary)',
                }}
              >
                Inquiries Management
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Review and respond to user inquiries
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Total Inquiries
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {stats.total}
                </p>
              </div>
              <MessageCircle className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Pending
                </p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Resolved
                </p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Closed
                </p>
                <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-5 w-5 pointer-events-none"
                style={{
                  color: 'var(--text-muted)',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                }}
              />
              <input
                type="text"
                placeholder="Search by subject, message, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 h-5 w-5 pointer-events-none"
                style={{
                  color: 'var(--text-muted)',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field w-full"
                style={{ paddingLeft: '2.5rem' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiries List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: 'var(--accent-primary)' }}
            ></div>
            <p style={{ color: 'var(--text-tertiary)' }}>Loading inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              No Inquiries Found
            </h3>
            <p style={{ color: 'var(--text-tertiary)' }}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No inquiries available'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="p-6 hover:bg-opacity-50 transition-colors cursor-pointer"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => handleViewInquiry(inquiry)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-primary)', fontFamily: 'Crimson Pro, serif' }}
                      >
                        {inquiry.subject}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBadge(inquiry.status)}`}>
                        {getStatusIcon(inquiry.status)}
                        {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                      </span>
                    </div>
                    <p
                      className="text-sm mb-3 line-clamp-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {inquiry.message}
                    </p>
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{inquiry.user_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{inquiry.user_email || 'No email'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(inquiry.created_at)}</span>
                      </div>
                      {inquiry.attachments && inquiry.attachments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{inquiry.attachments.length} attachment(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn-secondary flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewInquiry(inquiry);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View/Response Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(0, 0, 0, 0.4)' }}
          onClick={handleCloseModal}
        >
          <div
            className="card-elevated max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between p-6 pb-5"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div>
                <h2
                  className="text-2xl font-semibold mb-1"
                  style={{ fontFamily: 'Crimson Pro, serif', color: 'var(--text-primary)' }}
                >
                  {selectedInquiry.subject}
                </h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                  From: {selectedInquiry.user_name} ({selectedInquiry.user_email})
                </p>
              </div>
              <button
                onClick={handleCloseModal}
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

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Inquiry Details */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Message
                </label>
                <div
                  className="p-4 rounded-lg"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Attachments */}
              {selectedInquiry.attachments && selectedInquiry.attachments.length > 0 && (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Attachments ({selectedInquiry.attachments.length})
                  </label>
                  <div
                    className="p-4 rounded-lg space-y-2"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    {selectedInquiry.attachments.map((attachment, index) => {
                      // Handle both old format (string) and new format (AttachmentMetadata)
                      const isOldFormat = typeof attachment === 'string';

                      if (isOldFormat) {
                        // Old format: "filename.jpg (123.4 KB)"
                        const fileName = attachment.split('(')[0].trim();
                        const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
                        const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileExt);

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg transition-colors"
                            style={{ background: 'var(--surface-white)' }}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
                                style={{ background: 'var(--bg-tertiary)' }}
                              >
                                {isImage ? (
                                  <ImageIcon className="w-5 h-5" style={{ color: 'var(--accent-tertiary)' }} />
                                ) : isVideo ? (
                                  <Video className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
                                ) : (
                                  <FileText className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-medium truncate"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {fileName}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: 'var(--text-tertiary)' }}
                                >
                                  {attachment.includes('(') ? attachment.split('(')[1].replace(')', '') : 'Unknown size'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <div
                                className="px-3 py-1.5 rounded text-xs font-medium"
                                style={{
                                  background: 'rgba(139, 58, 58, 0.1)',
                                  color: 'var(--accent-secondary)',
                                }}
                                title="Old format - file not available"
                              >
                                Legacy
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // New format: AttachmentMetadata object
                      const fileExt = attachment.fileName.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
                      const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileExt);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg transition-colors"
                          style={{ background: 'var(--surface-white)' }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
                              style={{ background: 'var(--bg-tertiary)' }}
                            >
                              {isImage ? (
                                <ImageIcon className="w-5 h-5" style={{ color: 'var(--accent-tertiary)' }} />
                              ) : isVideo ? (
                                <Video className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
                              ) : (
                                <FileText className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {attachment.fileName}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                {formatFileSize(attachment.fileSize)} • {attachment.mimeType}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <button
                              className="px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5"
                              style={{
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--accent-primary)';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-tertiary)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                              }}
                              onClick={() => handleViewAttachment(attachment)}
                              title="View or download file"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {isImage || isVideo ? 'View' : 'Download'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conversation Thread */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Conversation
                </label>

                {/* Replies List */}
                <div
                  className="mb-4 rounded-lg overflow-hidden"
                  style={{
                    background: 'var(--bg-secondary)',
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }}
                >
                  {loadingReplies ? (
                    <div className="p-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
                      Loading conversation...
                    </div>
                  ) : replies.length === 0 ? (
                    <div className="p-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No replies yet. Start the conversation below.</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {replies.map((reply) => {
                        const isAdmin = reply.users?.role?.toLowerCase() === 'administrator';
                        return (
                          <div
                            key={reply.id}
                            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className="max-w-[80%] rounded-lg p-3"
                              style={{
                                background: isAdmin
                                  ? 'var(--accent-primary)'
                                  : 'var(--surface-white)',
                                color: isAdmin ? 'white' : 'var(--text-primary)',
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <p
                                  className="text-xs font-medium"
                                  style={{
                                    color: isAdmin ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)',
                                  }}
                                >
                                  {reply.users?.name || 'Unknown'} •{' '}
                                  <span className="capitalize">
                                    {reply.users?.role || 'user'}
                                  </span>
                                </p>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                              <p
                                className="text-xs mt-1"
                                style={{
                                  color: isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)',
                                }}
                              >
                                {formatDate(reply.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Reply Input */}
                <div>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="input-field w-full resize-none"
                    rows={4}
                    placeholder="Type your reply here..."
                    style={{ fontFamily: 'Work Sans, sans-serif' }}
                  />
                </div>
              </div>

              {/* Status Update */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Update Status
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedInquiry.id, 'pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedInquiry.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedInquiry.id, 'resolved')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedInquiry.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Resolved
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedInquiry.id, 'closed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedInquiry.status === 'closed'
                        ? 'bg-gray-300 text-gray-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Closed
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="flex items-center justify-end gap-3 p-6 pt-5"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <button onClick={handleCloseModal} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={responding || !response.trim()}
                className="btn-primary"
              >
                {responding ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="relative max-w-6xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 rounded-t-xl"
              style={{ background: 'var(--surface-white)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  {previewAttachment.mimeType.startsWith('image/') ? (
                    <ImageIcon className="w-5 h-5" style={{ color: 'var(--accent-tertiary)' }} />
                  ) : (
                    <Video className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
                  )}
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {previewAttachment.fileName}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {previewAttachment.mimeType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.fileName}
                  className="px-3 py-2 rounded text-sm font-medium transition-all flex items-center gap-2"
                  style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--accent-primary)';
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-2 rounded transition-colors"
                  style={{ background: 'var(--bg-tertiary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }}
                >
                  <X className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div
              className="rounded-b-xl overflow-hidden"
              style={{ background: 'var(--bg-secondary)', maxHeight: 'calc(90vh - 80px)' }}
            >
              {previewAttachment.mimeType.startsWith('image/') ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.fileName}
                  className="w-full h-full object-contain"
                  style={{ maxHeight: 'calc(90vh - 80px)' }}
                />
              ) : previewAttachment.mimeType.startsWith('video/') ? (
                <video
                  src={previewAttachment.url}
                  controls
                  className="w-full h-full"
                  style={{ maxHeight: 'calc(90vh - 80px)' }}
                >
                  Your browser does not support video playback.
                </video>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
