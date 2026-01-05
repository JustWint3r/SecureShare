'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { apiGet, apiPost } from '@/lib/api-client';
import { FileText, Download, ArrowLeft, Loader2, CheckCircle, Send, Share2, Copy, Check } from 'lucide-react';
import { formatFileSize, formatDate, getFileIconComponent } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SharedFileData {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SharedFilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: privyUser, authenticated, ready, login } = usePrivy();
  const [file, setFile] = useState<SharedFileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionLevel, setPermissionLevel] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [resharePermission, setResharePermission] = useState<'view' | 'comment' | 'full'>('view');
  const [reshareLink, setReshareLink] = useState('');
  const [generatingReshare, setGeneratingReshare] = useState(false);
  const [copiedReshare, setCopiedReshare] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      // User needs to login to access shared file
      login();
    } else if (ready && authenticated && privyUser) {
      handleFileAccess();
      fetchCurrentUser();
    }
  }, [ready, authenticated, privyUser]);

  const fetchCurrentUser = async () => {
    try {
      console.log('[SharedFile] Fetching current user...');
      const response = await apiGet('/api/auth/me', privyUser || undefined);
      const data = await response.json();
      console.log('[SharedFile] Current user response:', data);
      if (data.success) {
        setCurrentUser(data.user);
        console.log('[SharedFile] Current user set:', data.user);
      } else {
        console.error('[SharedFile] Failed to fetch user:', data.error);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const handleFileAccess = async () => {
    try {
      setLoading(true);
      setError('');

      const token = params.token as string;
      const response = await apiGet(`/api/shared/${token}`, privyUser || undefined);
      const data = await response.json();

      if (data.success) {
        setFile(data.file);
        setPermissionLevel(data.permission_level);
        setAccessGranted(true);
        toast.success('Access granted! You can now view this file from your Shared Files page.');
      } else {
        setError(data.error || 'Failed to access shared file');
        toast.error(data.error || 'Failed to access shared file');
      }
    } catch (error) {
      console.error('Error accessing shared file:', error);
      setError('An error occurred while accessing the file');
      toast.error('An error occurred while accessing the file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    try {
      const response = await apiGet(`/api/files/${file.id}/download`, privyUser || undefined);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to download file');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('File downloaded successfully!');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleGoToDashboard = () => {
    router.push('/');
  };

  const fetchComments = async () => {
    if (!file) return;
    setLoadingComments(true);
    try {
      const response = await apiGet(`/api/files/${file.id}/comments`, privyUser || undefined);
      const data = await response.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    console.log('[SharedFile] Submit comment clicked', { file, newComment, currentUser });
    if (!file || !newComment.trim() || !currentUser) {
      console.log('[SharedFile] Submit blocked:', {
        hasFile: !!file,
        hasComment: !!newComment.trim(),
        hasUser: !!currentUser
      });
      return;
    }
    setSubmittingComment(true);
    try {
      console.log('[SharedFile] Submitting comment:', {
        comment: newComment,
        userId: currentUser.id
      });
      const response = await fetch(`/api/files/${file.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          comment: newComment,
          userId: currentUser.id // Send the user ID
        }),
      });
      const data = await response.json();
      console.log('[SharedFile] Comment response:', data);
      if (data.success) {
        setComments([...comments, data.comment]);
        setNewComment('');
        toast.success('Comment added successfully!');
      } else {
        toast.error(data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleGenerateReshare = async () => {
    if (!file) return;
    setGeneratingReshare(true);
    try {
      const response = await apiPost(
        `/api/files/${file.id}/reshare`,
        { permission: resharePermission },
        privyUser || undefined
      );
      const data = await response.json();
      if (data.success) {
        setReshareLink(data.shareUrl);
        toast.success('Reshare link generated!');
      } else {
        toast.error(data.error || 'Failed to generate reshare link');
      }
    } catch (error) {
      console.error('Error generating reshare:', error);
      toast.error('Failed to generate reshare link');
    } finally {
      setGeneratingReshare(false);
    }
  };

  const copyReshareLink = async () => {
    try {
      await navigator.clipboard.writeText(reshareLink);
      setCopiedReshare(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedReshare(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  useEffect(() => {
    if (file && (permissionLevel === 'comment' || permissionLevel === 'full')) {
      fetchComments();
    }
  }, [file, permissionLevel]);

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading shared file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleGoToDashboard}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!file) {
    return null;
  }

  const FileIcon = getFileIconComponent(file.type);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoToDashboard}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Shared File</h1>
                <p className="text-sm text-gray-500">Access a file shared with you</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {accessGranted && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">Access Granted</h3>
              <p className="text-sm text-green-700 mt-1">
                This file has been added to your Shared Files. You can access it anytime from your dashboard.
              </p>
            </div>
          </div>
        )}

        {/* File Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <FileIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{file.name}</h2>
                <p className="text-indigo-100">
                  Shared by {file.owner.name} • {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* File Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">File Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">File Name</p>
                  <p className="text-base font-medium text-gray-900">{file.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Size</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Type</p>
                  <p className="text-base font-medium text-gray-900">{file.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Uploaded</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatDate(file.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="text-base font-medium text-gray-900">{file.owner.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Permission Level</p>
                  <p className="text-base font-medium text-gray-900 capitalize">
                    {permissionLevel === 'view' && 'Can View Only'}
                    {permissionLevel === 'comment' && 'Can View + Comment'}
                    {permissionLevel === 'full' && 'Full Access'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <button
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Download className="w-5 h-5 mr-2" />
                Download File
              </button>
              <button
                onClick={handleGoToDashboard}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Go to Shared Files
              </button>
            </div>

            {/* Comments Section - Only for 'comment' and 'full' permissions */}
            {(permissionLevel === 'comment' || permissionLevel === 'full') && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>

                {/* Comment Input */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={submittingComment}
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={submittingComment || !newComment.trim() || !currentUser}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      title={!currentUser ? 'Loading user data...' : 'Send comment'}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {loadingComments ? (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                      <p className="text-sm">No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{comment.user?.name || 'Unknown User'}</p>
                            <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                          </div>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Reshare Section - Only for 'full' permission */}
            {permissionLevel === 'full' && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reshare File</h3>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-700 mb-4">
                    You have full access to this file. You can reshare it with others.
                  </p>

                  {!reshareLink ? (
                    <>
                      {/* Permission Selector */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Permission Level
                        </label>
                        <select
                          value={resharePermission}
                          onChange={(e) => setResharePermission(e.target.value as 'view' | 'comment' | 'full')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="view">Can View Only</option>
                          <option value="comment">Can View + Comment</option>
                          <option value="full">Full Access</option>
                        </select>
                      </div>

                      <button
                        onClick={handleGenerateReshare}
                        disabled={generatingReshare}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {generatingReshare ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4 mr-2" />
                            Generate Reshare Link
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Reshare Link Display */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reshare Link
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={reshareLink}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                          />
                          <button
                            onClick={copyReshareLink}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                          >
                            {copiedReshare ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setReshareLink('');
                          setResharePermission('view');
                        }}
                        className="w-full px-4 py-2 text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Generate Another Link
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Information Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>This file has been added to your "Shared Files" section</li>
            <li>You can download it anytime from your dashboard</li>
            <li>Your access is logged for security and audit purposes</li>
            <li>The file owner can revoke your access at any time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
