// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  created_at: string;
  updated_at: string;
}

export enum UserRole {
  STUDENT = 'student',
  LECTURER = 'lecturer',
  ADMINISTRATOR = 'administrator',
}

// File Types
export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  ipfs_hash: string;
  encrypted_key: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface FilePermission {
  id: string;
  file_id: string;
  user_id: string;
  permission_type: PermissionType;
  granted_by: string;
  granted_at: string;
  revoked_at?: string;
  is_active: boolean;
}

export enum PermissionType {
  READ = 'read',
  WRITE = 'write',
  SHARE = 'share',
}

export interface ShareToken {
  id: string;
  token: string;
  file_id: string;
  created_by: string;
  permission_level: 'view' | 'comment' | 'full';
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  access_count: number;
  max_access_count?: number;
}

// Access Log Types
export interface AccessLog {
  id: string;
  file_id: string;
  user_id: string;
  action: AccessAction;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  transaction_hash?: string;
}

export enum AccessAction {
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  VIEW = 'view',
  SHARE = 'share',
  REVOKE = 'revoke',
  DELETE = 'delete',
}

// Smart Contract Types
export interface ContractEvent {
  event: string;
  args: any;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  department?: string;
}

export interface FileUploadForm {
  file: File;
  description?: string;
  permissions?: {
    user_ids: string[];
    permission_type: PermissionType;
  }[];
}

// IPFS Types
export interface IPFSUploadResult {
  hash: string;
  size: number;
  path: string;
}

// Component Props Types
export interface FileCardProps {
  file: FileMetadata;
  onShare: (fileId: string) => void;
  onDownload: (fileId: string) => void;
  onRevoke: (fileId: string) => void;
  permissions: FilePermission[];
}

export interface UserTableProps {
  users: User[];
  onRoleChange: (userId: string, newRole: UserRole) => void;
  currentUserId: string;
}

// Context Types (now using Privy instead of custom AuthContext)

export interface FileContextType {
  files: FileMetadata[];
  loading: boolean;
  uploadFile: (file: File, description?: string) => Promise<boolean>;
  downloadFile: (fileId: string) => Promise<void>;
  shareFile: (
    fileId: string,
    userIds: string[],
    permissionType: PermissionType
  ) => Promise<boolean>;
  revokeAccess: (fileId: string, userId: string) => Promise<boolean>;
  refreshFiles: () => Promise<void>;
}
