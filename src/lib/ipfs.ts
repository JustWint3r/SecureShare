import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { MemoryBlockstore } from 'blockstore-core';
import { MemoryDatastore } from 'datastore-core';
import { createLibp2p } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { webSockets } from '@libp2p/websockets';
import * as filters from '@libp2p/websockets/filters';

let heliaNode: any = null;
let unixfsInstance: any = null;

// Initialize Helia node for browser environment
export async function initializeIPFS() {
  if (heliaNode) {
    return { helia: heliaNode, fs: unixfsInstance };
  }

  try {
    // Create libp2p node for browser
    const libp2p = await createLibp2p({
      datastore: new MemoryDatastore(),
      transports: [
        webSockets({
          filter: filters.all
        })
      ],
      connectionEncryption: [noise()],
      streamMuxers: [yamux()],
      connectionGater: {
        denyDialMultiaddr: () => false
      }
    });

    // Create Helia node
    heliaNode = await createHelia({
      libp2p,
      blockstore: new MemoryBlockstore()
    });

    // Create UnixFS instance
    unixfsInstance = unixfs(heliaNode);

    console.log('IPFS node initialized successfully');
    return { helia: heliaNode, fs: unixfsInstance };
  } catch (error) {
    console.error('Failed to initialize IPFS:', error);
    throw error;
  }
}

// Upload file to IPFS
export async function uploadToIPFS(file: File): Promise<{ hash: string; size: number }> {
  try {
    const { fs } = await initializeIPFS();
    
    // Convert file to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Add file to IPFS
    const cid = await fs.addBytes(uint8Array);
    
    return {
      hash: cid.toString(),
      size: file.size
    };
  } catch (error) {
    console.error('Failed to upload to IPFS:', error);
    throw error;
  }
}

// Download file from IPFS
export async function downloadFromIPFS(hash: string): Promise<Uint8Array> {
  try {
    const { fs } = await initializeIPFS();
    
    // Get file from IPFS
    const bytes = await fs.cat(hash);
    
    // Convert AsyncIterable to Uint8Array
    const chunks: Uint8Array[] = [];
    for await (const chunk of bytes) {
      chunks.push(chunk);
    }
    
    // Combine all chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  } catch (error) {
    console.error('Failed to download from IPFS:', error);
    throw error;
  }
}

// Check if file exists on IPFS
export async function checkIPFSFile(hash: string): Promise<boolean> {
  try {
    const { helia } = await initializeIPFS();
    
    // Try to get the block to check if it exists
    const block = await helia.blockstore.get(hash);
    return !!block;
  } catch (error) {
    console.error('File not found on IPFS:', error);
    return false;
  }
}

// Get file stats from IPFS
export async function getIPFSFileStats(hash: string): Promise<{ size: number } | null> {
  try {
    const { fs } = await initializeIPFS();
    
    const stats = await fs.stat(hash);
    return {
      size: Number(stats.fileSize)
    };
  } catch (error) {
    console.error('Failed to get file stats:', error);
    return null;
  }
}

// Clean up IPFS node
export async function stopIPFS() {
  if (heliaNode) {
    await heliaNode.stop();
    heliaNode = null;
    unixfsInstance = null;
    console.log('IPFS node stopped');
  }
}

// Server-side IPFS functions using Storacha
export class ServerIPFS {
  private static instance: ServerIPFS;
  private client: any = null;

  static getInstance(): ServerIPFS {
    if (!ServerIPFS.instance) {
      ServerIPFS.instance = new ServerIPFS();
    }
    return ServerIPFS.instance;
  }

  async initialize() {
    if (this.client) return;

    try {
      const { create } = await import('@storacha/client');
      const { StoreConf } = await import('@storacha/client/stores/conf');
      const path = await import('path');
      const os = await import('os');

      // Use persistent storage in user's home directory
      const storePath = path.join(os.homedir(), '.storacha-secureshare');
      const store = new StoreConf({ profile: storePath });

      // Create a new client with persistent store
      this.client = await create({ store });

      // Login with email
      const email = process.env.STORACHA_EMAIL || 'justwint3r@gmail.com';

      try {
        await this.client.login(email);
      } catch (loginError) {
        // If login fails, user might need to verify email
        console.log('Login failed, may need email verification:', loginError);
      }

      // Create or get existing space
      const spaces = await this.client.spaces();

      if (spaces.length === 0) {
        // Create a new space if none exists
        const space = await this.client.createSpace('SecureShare');
        await this.client.setCurrentSpace(space.did());
        console.log('Created new Storacha space:', space.did());
      } else {
        // Use the first available space
        await this.client.setCurrentSpace(spaces[0].did());
        console.log('Using existing Storacha space:', spaces[0].did());
      }

      console.log('Storacha IPFS client initialized with email:', email);

    } catch (error) {
      console.error('Failed to initialize Storacha IPFS:', error);
      throw error;
    }
  }

  async uploadFile(buffer: Buffer): Promise<{ hash: string; size: number }> {
    await this.initialize();

    try {
      // Convert buffer to Blob then to File
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const file = new File([blob], 'file', { type: 'application/octet-stream' });

      // Upload to Storacha (IPFS)
      const cid = await this.client.uploadFile(file);

      console.log('[Storacha] File uploaded to IPFS with CID:', cid.toString());

      return {
        hash: cid.toString(),
        size: buffer.length
      };
    } catch (error) {
      console.error('Failed to upload to Storacha IPFS:', error);
      throw error;
    }
  }

  async downloadFile(hash: string): Promise<Buffer> {
    // For downloading, we'll use a public IPFS gateway
    try {
      const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://w3s.link/ipfs';
      const url = `${gateway}/${hash}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS gateway: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Failed to download from IPFS:', error);
      throw error;
    }
  }

  async getFileStats(hash: string): Promise<{ size: number } | null> {
    try {
      const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://w3s.link/ipfs';
      const url = `${gateway}/${hash}`;

      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        return null;
      }

      const contentLength = response.headers.get('content-length');
      return {
        size: contentLength ? parseInt(contentLength) : 0
      };
    } catch (error) {
      console.error('Failed to get file stats:', error);
      return null;
    }
  }
}

