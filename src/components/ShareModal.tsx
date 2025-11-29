'use client';

import { useState } from 'react';
import {
  X,
  Link2,
  QrCode,
  Copy,
  Check,
  Users,
  Eye,
  Edit,
  FileKey,
} from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

interface ShareModalProps {
  file: {
    id: string;
    name: string;
  };
  onClose: () => void;
  user?: any;
}

type PermissionType = 'view' | 'comment' | 'full';

export default function ShareModal({ file, onClose, user }: ShareModalProps) {
  const [shareMethod, setShareMethod] = useState<'link' | 'qr'>('link');
  const [permission, setPermission] = useState<PermissionType>('view');
  const [shareLink, setShareLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-privy-user-id'] = user.id;
      }

      const response = await fetch('/api/files/share', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileId: file.id,
          permission,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const link = `${window.location.origin}/shared/${data.shareToken}`;
        setShareLink(link);

        // Generate QR code
        if (shareMethod === 'qr') {
          const qrUrl = await QRCode.toDataURL(link);
          setQrCodeUrl(qrUrl);
        }

        toast.success('Share link generated!');
      } else {
        toast.error(data.error || 'Failed to generate share link');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-${file.name}.png`;
    link.click();
    toast.success('QR code downloaded!');
  };

  const getPermissionDescription = (perm: PermissionType) => {
    switch (perm) {
      case 'view':
        return 'Recipients can only view the file';
      case 'comment':
        return 'Recipients can view and add comments';
      case 'full':
        return 'Recipients can view, edit, and reshare';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Share File</h2>
            <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">
              {file.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100/50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Method Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Share Method
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setShareMethod('link')}
                className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg transition-all ${
                  shareMethod === 'link'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Link2 className="h-5 w-5 mr-2" />
                Share Link
              </button>
              <button
                onClick={() => setShareMethod('qr')}
                className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg transition-all ${
                  shareMethod === 'qr'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <QrCode className="h-5 w-5 mr-2" />
                QR Code
              </button>
            </div>
          </div>

          {/* Permission Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Access Level
            </label>
            <div className="space-y-2">
              {/* View Only */}
              <button
                onClick={() => setPermission('view')}
                className={`w-full flex items-start p-4 border-2 rounded-lg transition-all ${
                  permission === 'view'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`mt-0.5 ${
                    permission === 'view' ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  <Eye className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1 text-left">
                  <p
                    className={`font-medium ${
                      permission === 'view'
                        ? 'text-indigo-900'
                        : 'text-gray-900'
                    }`}
                  >
                    Can View Only
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Recipients can only view the file
                  </p>
                </div>
              </button>

              {/* View + Comment */}
              <button
                onClick={() => setPermission('comment')}
                className={`w-full flex items-start p-4 border-2 rounded-lg transition-all ${
                  permission === 'comment'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`mt-0.5 ${
                    permission === 'comment'
                      ? 'text-indigo-600'
                      : 'text-gray-400'
                  }`}
                >
                  <Edit className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1 text-left">
                  <p
                    className={`font-medium ${
                      permission === 'comment'
                        ? 'text-indigo-900'
                        : 'text-gray-900'
                    }`}
                  >
                    Can View + Comment
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Recipients can view and add comments
                  </p>
                </div>
              </button>

              {/* Full Access */}
              <button
                onClick={() => setPermission('full')}
                className={`w-full flex items-start p-4 border-2 rounded-lg transition-all ${
                  permission === 'full'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`mt-0.5 ${
                    permission === 'full' ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  <FileKey className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1 text-left">
                  <p
                    className={`font-medium ${
                      permission === 'full'
                        ? 'text-indigo-900'
                        : 'text-gray-900'
                    }`}
                  >
                    Full Access
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Recipients can view, edit, and reshare
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Generated Link/QR */}
          {shareLink && (
            <div className="space-y-4">
              {shareMethod === 'link' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                    >
                      {copied ? (
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
              ) : (
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    QR Code
                  </label>
                  {qrCodeUrl && (
                    <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  )}
                  <button
                    onClick={downloadQRCode}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Download QR Code
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Security Info */}
          <div className="p-4 bg-blue-50/50 backdrop-blur-sm border border-blue-200/50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-1">
              🔒 Secure Sharing
            </p>
            <p className="text-xs text-blue-700">
              All shared files are encrypted and access is logged on the
              blockchain for audit purposes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generateShareLink}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Generate Share Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
