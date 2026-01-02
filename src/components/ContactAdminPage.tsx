'use client';

import { useState } from 'react';
import { Send, Upload, X, FileText, Image as ImageIcon, Video, File, HelpCircle, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface ContactAdminPageProps {
  user: any;
  privyUser: any;
}

interface AttachedFile {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'document';
}

export default function ContactAdminPage({ user, privyUser }: ContactAdminPageProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [sending, setSending] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (attachedFiles.length + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    const newFiles: AttachedFile[] = files.map(file => {
      let type: 'image' | 'video' | 'document' = 'document';
      let preview: string | undefined;

      if (file.type.startsWith('image/')) {
        type = 'image';
        preview = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        type = 'video';
        preview = URL.createObjectURL(file);
      }

      return { file, preview, type };
    });

    setAttachedFiles([...attachedFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const file = attachedFiles[index];
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }

    setSending(true);

    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      formData.append('userId', user.id);
      formData.append('userName', user.name);
      formData.append('userEmail', user.email);
      formData.append('userRole', user.role);

      attachedFiles.forEach((attachedFile, index) => {
        formData.append(`file_${index}`, attachedFile.file);
      });

      const headers: any = {};
      if (privyUser?.id) {
        headers['x-privy-user-id'] = privyUser.id;
      }

      const response = await fetch('/api/contact-admin', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Message sent successfully! An administrator will review your inquiry.');
        setSubject('');
        setMessage('');
        setAttachedFiles([]);
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact admin error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div
            className="p-3 rounded-lg"
            style={{ background: 'rgba(26, 77, 128, 0.1)' }}
          >
            <HelpCircle
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
              Contact Administrator
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              Send inquiries or requests to administrators
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-4xl">
        <div
          className="card-elevated"
          style={{ background: 'var(--surface-white)' }}
        >
          <form onSubmit={handleSubmit}>
            {/* Form Header */}
            <div
              className="p-6 pb-5"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail
                  className="w-5 h-5"
                  style={{ color: 'var(--accent-primary)' }}
                />
                <h2
                  className="text-xl font-semibold"
                  style={{
                    fontFamily: 'Crimson Pro, serif',
                    color: 'var(--text-primary)',
                  }}
                >
                  New Inquiry
                </h2>
              </div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                Fill out the form below to contact an administrator
              </p>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-5">
              {/* Subject */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-field w-full"
                  placeholder="Brief description of your inquiry"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input-field w-full resize-none"
                  rows={8}
                  placeholder="Provide detailed information about your inquiry..."
                  required
                  style={{ fontFamily: 'Work Sans, sans-serif' }}
                />
              </div>

              {/* File Attachments */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Attachments (Optional)
                </label>
                <p
                  className="text-xs mb-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  You can attach up to 5 files (images, videos, documents)
                </p>

                {/* Upload Button */}
                <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Choose Files
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={attachedFiles.length >= 5}
                  />
                </label>

                {/* Attached Files List */}
                {attachedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachedFiles.map((attachedFile, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {/* File Preview/Icon */}
                        <div
                          className="flex-shrink-0 w-12 h-12 rounded flex items-center justify-center overflow-hidden"
                          style={{ background: 'var(--bg-tertiary)' }}
                        >
                          {attachedFile.preview && attachedFile.type === 'image' ? (
                            <img
                              src={attachedFile.preview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : attachedFile.preview && attachedFile.type === 'video' ? (
                            <video
                              src={attachedFile.preview}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div style={{ color: 'var(--text-tertiary)' }}>
                              {getFileIcon(attachedFile.type)}
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {attachedFile.file.name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            {formatFileSize(attachedFile.file.size)}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg transition-all"
                          style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--error-bg)';
                            e.currentTarget.style.color = 'var(--error)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                          }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(26, 77, 128, 0.08)',
                  border: '1px solid rgba(26, 77, 128, 0.15)',
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--accent-primary-dark)' }}
                >
                  <strong>Note:</strong> Your inquiry will be reviewed by an administrator.
                  You will receive a response via your registered email address (
                  {user.email || 'Not provided'}).
                </p>
              </div>
            </div>

            {/* Form Footer */}
            <div
              className="p-6 pt-5 flex items-center justify-end gap-3"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setSubject('');
                  setMessage('');
                  setAttachedFiles([]);
                }}
                className="btn-secondary"
                disabled={sending}
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={sending || !subject.trim() || !message.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Inquiry
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
