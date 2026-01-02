'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api-client';
import {
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  Download,
  Send,
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
  attachments: (AttachmentMetadata | string)[] | null;
  status: 'pending' | 'resolved' | 'closed';
  admin_response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
}

interface MyInquiriesPageProps {
  user: any;
  privyUser: any;
}

export default function MyInquiriesPage({ user, privyUser }: MyInquiriesPageProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    fileName: string;
    mimeType: string;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  useEffect(() => {
    fetchMyInquiries();
  }, []);

  const fetchMyInquiries = async () => {
    try {
      setLoading(true);
      const res = await apiGet('/api/user/inquiries', privyUser);
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
    setFollowUpMessage('');
    await fetchReplies(inquiry.id);
  };

  const handleCloseModal = () => {
    setSelectedInquiry(null);
    setFollowUpMessage('');
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

  const handleSendFollowUp = async () => {
    if (!selectedInquiry || !followUpMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSendingFollowUp(true);
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
          message: followUpMessage,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Follow-up sent successfully');
        setFollowUpMessage('');
        await fetchReplies(selectedInquiry.id);
      } else {
        toast.error(data.error || 'Failed to send follow-up');
      }
    } catch (error) {
      console.error('Error sending follow-up:', error);
      toast.error('Failed to send follow-up');
    } finally {
      setSendingFollowUp(false);
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
        `/api/user/inquiries/attachments?path=${encodeURIComponent(attachment.storagePath)}`,
        { headers }
      );
      const data = await res.json();

      if (data.success && data.signedUrl) {
        const fileExt = attachment.fileName.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
        const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileExt);

        if (isImage || isVideo) {
          setPreviewAttachment({
            url: data.signedUrl,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
          });
        } else {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" style={{ color: 'var(--accent-tertiary)' }} />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5" style={{ color: '#059669' }} />;
      case 'closed':
        return <XCircle className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'var(--accent-tertiary)';
      case 'resolved':
        return '#059669';
      case 'closed':
        return 'var(--accent-secondary)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i) => i.status === 'pending').length,
    resolved: inquiries.filter((i) => i.status === 'resolved').length,
    closed: inquiries.filter((i) => i.status === 'closed').length,
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Total
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
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

      {/* Inquiries List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">All Inquiries</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
            Loading inquiries...
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No inquiries submitted yet</p>
            <p className="text-sm mt-1">Go to Contact Admin to submit your first inquiry</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="p-4 hover:bg-opacity-50 transition-colors cursor-pointer"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => handleViewInquiry(inquiry)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3
                        className="font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {inquiry.subject}
                      </h3>
                      <div
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: `${getStatusColor(inquiry.status)}15`,
                          color: getStatusColor(inquiry.status),
                        }}
                      >
                        {getStatusIcon(inquiry.status)}
                        <span className="capitalize">{inquiry.status}</span>
                      </div>
                    </div>

                    <p
                      className="text-sm mb-3 line-clamp-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {inquiry.message}
                    </p>

                    <div
                      className="flex flex-wrap items-center gap-4 text-xs"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Submitted {formatDate(inquiry.created_at)}</span>
                      </div>
                      {inquiry.attachments && inquiry.attachments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{inquiry.attachments.length} attachment(s)</span>
                        </div>
                      )}
                      {inquiry.admin_response && (
                        <div
                          className="flex items-center gap-1"
                          style={{ color: '#059669' }}
                        >
                          <Send className="w-4 h-4" />
                          <span>Response received</span>
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

      {/* View Inquiry Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl"
            style={{ background: 'var(--surface-white)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
              style={{
                background: 'var(--surface-white)',
                borderColor: 'var(--border-primary)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <MessageCircle className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Inquiry Details
                  </h2>
                  <div
                    className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit"
                    style={{
                      background: `${getStatusColor(selectedInquiry.status)}15`,
                      color: getStatusColor(selectedInquiry.status),
                    }}
                  >
                    {getStatusIcon(selectedInquiry.status)}
                    <span className="capitalize">{selectedInquiry.status}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg transition-colors"
                style={{ background: 'var(--bg-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Subject */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Subject
                </label>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>
                  {selectedInquiry.subject}
                </p>
              </div>

              {/* Message */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Message
                </label>
                <div
                  className="p-4 rounded-lg text-sm whitespace-pre-wrap"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Submitted Date */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Submitted On
                </label>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {formatDate(selectedInquiry.created_at)}
                </p>
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
                      const isOldFormat = typeof attachment === 'string';

                      if (isOldFormat) {
                        const fileName = attachment.split('(')[0].trim();
                        const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
                        const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileExt);

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg"
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
                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                  {attachment.includes('(') ? attachment.split('(')[1].replace(')', '') : 'Unknown size'}
                                </p>
                              </div>
                            </div>
                            <div
                              className="px-3 py-1.5 rounded text-xs font-medium"
                              style={{
                                background: 'rgba(139, 58, 58, 0.1)',
                                color: 'var(--accent-secondary)',
                              }}
                            >
                              Legacy
                            </div>
                          </div>
                        );
                      }

                      const fileExt = attachment.fileName.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
                      const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileExt);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg"
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
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {formatFileSize(attachment.fileSize)} • {attachment.mimeType}
                              </p>
                            </div>
                          </div>
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
                          >
                            <Download className="w-3.5 h-3.5" />
                            {isImage || isVideo ? 'View' : 'Download'}
                          </button>
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
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No responses yet</p>
                      <p className="text-xs mt-1">
                        An administrator will review your inquiry and respond soon
                      </p>
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

                {/* Follow-up Input */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Send Follow-up
                  </label>
                  <textarea
                    value={followUpMessage}
                    onChange={(e) => setFollowUpMessage(e.target.value)}
                    className="input-field w-full resize-none"
                    rows={3}
                    placeholder="Type your follow-up message here..."
                    style={{ fontFamily: 'Work Sans, sans-serif' }}
                  />
                  <button
                    onClick={handleSendFollowUp}
                    disabled={sendingFollowUp || !followUpMessage.trim()}
                    className="btn-primary mt-2"
                  >
                    {sendingFollowUp ? 'Sending...' : 'Send Follow-up'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="sticky bottom-0 flex justify-end gap-3 p-6 border-t"
              style={{
                background: 'var(--surface-white)',
                borderColor: 'var(--border-primary)',
              }}
            >
              <button onClick={handleCloseModal} className="btn-secondary">
                Close
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
                >
                  <X className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </button>
              </div>
            </div>

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
