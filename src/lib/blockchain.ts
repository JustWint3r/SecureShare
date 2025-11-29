import { ethers } from 'ethers';
import { randomUUID } from 'crypto';

// Contract ABI (will be updated after compilation)
const CONTRACT_ABI = [
  // This will be populated with the actual ABI after contract compilation
  'function registerUser(address userAddress, uint8 role, string email, string name) external',
  'function uploadFile(string fileId, string ipfsHash, string fileName, uint256 fileSize) external',
  'function grantPermission(string fileId, address user, uint8 permissionType) external',
  'function revokePermission(string fileId, address user) external',
  'function logFileAccess(string fileId, uint8 action, string ipAddress, string userAgent) external',
  'function deleteFile(string fileId) external',
  'function getFileMetadata(string fileId) external view returns (string, string, uint256, address, uint256)',
  'function hasFilePermission(string fileId, address user, uint8 requiredPermission) external view returns (bool)',
  'function getUserFiles(address user) external view returns (string[])',
  'function getAccessibleFiles(address user) external view returns (string[])',
  'function getFileAccessLogs(string fileId) external view returns (tuple(uint256,string,address,uint8,uint256,string,string)[])',
  'function getUserInfo(address userAddress) external view returns (uint8, string, string, bool)',
  'function getTotalAccessLogs() external view returns (uint256)',
  'event UserRegistered(address indexed userAddress, uint8 role, string email, string name)',
  'event FileUploaded(string indexed fileId, string ipfsHash, address indexed owner, string fileName, uint256 fileSize)',
  'event PermissionGranted(string indexed fileId, address indexed user, uint8 permissionType, address indexed grantedBy)',
  'event PermissionRevoked(string indexed fileId, address indexed user, address indexed revokedBy)',
  'event AccessLogged(uint256 indexed logId, string indexed fileId, address indexed user, uint8 action, uint256 timestamp)',
  'event FileDeleted(string indexed fileId, address indexed owner)',
];

// Enums matching the smart contract
export enum UserRole {
  STUDENT = 0,
  LECTURER = 1,
  ADMINISTRATOR = 2,
}

export enum PermissionType {
  READ = 0,
  WRITE = 1,
  SHARE = 2,
}

export enum AccessAction {
  UPLOAD = 0,
  DOWNLOAD = 1,
  VIEW = 2,
  SHARE = 3,
  REVOKE = 4,
  DELETE = 5,
}

export interface ContractConfig {
  rpcUrl: string;
  contractAddress: string;
  privateKey: string;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private signer: ethers.Wallet;

  constructor(config: ContractConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.signer = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      config.contractAddress,
      CONTRACT_ABI,
      this.signer
    );
  }

  // Get read-only contract instance for queries
  getReadOnlyContract(): ethers.Contract {
    return new ethers.Contract(
      this.contract.target,
      CONTRACT_ABI,
      this.provider
    );
  }

  // User Management
  async registerUser(
    userAddress: string,
    role: UserRole,
    email: string,
    name: string
  ): Promise<ethers.TransactionResponse> {
    try {
      const tx = await this.contract.registerUser(
        userAddress,
        role,
        email,
        name
      );
      return tx;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  async getUserInfo(userAddress: string): Promise<{
    role: UserRole;
    email: string;
    name: string;
    isRegistered: boolean;
  }> {
    try {
      const readOnlyContract = this.getReadOnlyContract();
      const [role, email, name, isRegistered] =
        await readOnlyContract.getUserInfo(userAddress);
      return { role, email, name, isRegistered };
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }

  // File Management
  async uploadFile(
    fileId: string,
    ipfsHash: string,
    fileName: string,
    fileSize: number
  ): Promise<ethers.TransactionResponse> {
    try {
      const tx = await this.contract.uploadFile(
        fileId,
        ipfsHash,
        fileName,
        fileSize
      );
      return tx;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async getFileMetadata(fileId: string): Promise<{
    ipfsHash: string;
    fileName: string;
    fileSize: number;
    owner: string;
    createdAt: number;
  }> {
    try {
      const readOnlyContract = this.getReadOnlyContract();
      const [ipfsHash, fileName, fileSize, owner, createdAt] =
        await readOnlyContract.getFileMetadata(fileId);
      return {
        ipfsHash,
        fileName,
        fileSize: Number(fileSize),
        owner,
        createdAt: Number(createdAt),
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<ethers.TransactionResponse> {
    try {
      const tx = await this.contract.deleteFile(fileId);
      return tx;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Permission Management
  async grantPermission(
    fileId: string,
    userAddress: string,
    permissionType: PermissionType
  ): Promise<ethers.TransactionResponse> {
    try {
      const tx = await this.contract.grantPermission(
        fileId,
        userAddress,
        permissionType
      );
      return tx;
    } catch (error) {
      console.error('Error granting permission:', error);
      throw error;
    }
  }

  async revokePermission(
    fileId: string,
    userAddress: string
  ): Promise<ethers.TransactionResponse> {
    try {
      const tx = await this.contract.revokePermission(fileId, userAddress);
      return tx;
    } catch (error) {
      console.error('Error revoking permission:', error);
      throw error;
    }
  }

  async hasFilePermission(
    fileId: string,
    userAddress: string,
    requiredPermission: PermissionType
  ): Promise<boolean> {
    try {
      const readOnlyContract = this.getReadOnlyContract();
      return await readOnlyContract.hasFilePermission(
        fileId,
        userAddress,
        requiredPermission
      );
    } catch (error) {
      console.error('Error checking file permission:', error);
      throw error;
    }
  }

  // File Queries
  async getUserFiles(userAddress: string): Promise<string[]> {
    try {
      const readOnlyContract = this.getReadOnlyContract();
      return await readOnlyContract.getUserFiles(userAddress);
    } catch (error) {
      console.error('Error getting user files:', error);
      throw error;
    }
  }

  async getAccessibleFiles(userAddress: string): Promise<string[]> {
    try {
      const readOnlyContract = this.getReadOnlyContract();
      return await readOnlyContract.getAccessibleFiles(userAddress);
    } catch (error) {
      console.error('Error getting accessible files:', error);
      throw error;
    }
  }

  // Access Logging
  async logFileAccess(
    fileId: string,
    action: AccessAction,
    ipAddress: string = '',
    userAgent: string = ''
  ): Promise<ethers.TransactionResponse> {
    try {
      const tx = await this.contract.logFileAccess(
        fileId,
        action,
        ipAddress,
        userAgent
      );
      return tx;
    } catch (error) {
      console.error('Error logging file access:', error);
      throw error;
    }
  }

  async getFileAccessLogs(fileId: string): Promise<
    Array<{
      id: number;
      fileId: string;
      user: string;
      action: AccessAction;
      timestamp: number;
      ipAddress: string;
      userAgent: string;
    }>
  > {
    try {
      const readOnlyContract = this.getReadOnlyContract();
      const logs = await readOnlyContract.getFileAccessLogs(fileId);

      return logs.map((log: any) => ({
        id: Number(log[0]),
        fileId: log[1],
        user: log[2],
        action: Number(log[3]),
        timestamp: Number(log[4]),
        ipAddress: log[5],
        userAgent: log[6],
      }));
    } catch (error) {
      console.error('Error getting file access logs:', error);
      throw error;
    }
  }

  async getTotalAccessLogs(): Promise<number> {
    try {
      const readOnlyContract = this.getReadOnlyContract();
      const total = await readOnlyContract.getTotalAccessLogs();
      return Number(total);
    } catch (error) {
      console.error('Error getting total access logs:', error);
      throw error;
    }
  }

  // Event Listeners
  onUserRegistered(
    callback: (
      userAddress: string,
      role: UserRole,
      email: string,
      name: string
    ) => void
  ) {
    this.contract.on('UserRegistered', callback);
  }

  onFileUploaded(
    callback: (
      fileId: string,
      ipfsHash: string,
      owner: string,
      fileName: string,
      fileSize: number
    ) => void
  ) {
    this.contract.on('FileUploaded', callback);
  }

  onPermissionGranted(
    callback: (
      fileId: string,
      user: string,
      permissionType: PermissionType,
      grantedBy: string
    ) => void
  ) {
    this.contract.on('PermissionGranted', callback);
  }

  onPermissionRevoked(
    callback: (fileId: string, user: string, revokedBy: string) => void
  ) {
    this.contract.on('PermissionRevoked', callback);
  }

  onAccessLogged(
    callback: (
      logId: number,
      fileId: string,
      user: string,
      action: AccessAction,
      timestamp: number
    ) => void
  ) {
    this.contract.on('AccessLogged', callback);
  }

  onFileDeleted(callback: (fileId: string, owner: string) => void) {
    this.contract.on('FileDeleted', callback);
  }

  // Utility functions
  removeAllListeners() {
    this.contract.removeAllListeners();
  }

  async waitForTransaction(
    txHash: string
  ): Promise<ethers.TransactionReceipt | null> {
    return await this.provider.waitForTransaction(txHash);
  }

  async getTransactionReceipt(
    txHash: string
  ): Promise<ethers.TransactionReceipt | null> {
    return await this.provider.getTransactionReceipt(txHash);
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  // Network validation
  async validateNetwork(): Promise<boolean> {
    try {
      const network = await this.provider.getNetwork();
      return network.chainId !== 0n;
    } catch (error) {
      console.error('Error validating network:', error);
      return false;
    }
  }
}

// Singleton instance for the application
let blockchainService: BlockchainService | null = null;

export function initializeBlockchainService(
  config: ContractConfig
): BlockchainService {
  if (!blockchainService) {
    blockchainService = new BlockchainService(config);
  }
  return blockchainService;
}

export function getBlockchainService(): BlockchainService {
  if (!blockchainService) {
    throw new Error(
      'Blockchain service not initialized. Call initializeBlockchainService first.'
    );
  }
  return blockchainService;
}

// Helper functions for browser environment
export function getDefaultConfig(): ContractConfig {
  return {
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'http://localhost:8545',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
    privateKey: process.env.PRIVATE_KEY || '',
  };
}

// Address validation
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

// Generate random file ID (UUID format for database compatibility)
export function generateFileId(): string {
  return randomUUID();
}
