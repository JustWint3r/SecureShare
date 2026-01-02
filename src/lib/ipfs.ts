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

// Server-side IPFS functions for API routes
export class ServerIPFS {
  private static instance: ServerIPFS;
  private helia: any = null;
  private fs: any = null;

  static getInstance(): ServerIPFS {
    if (!ServerIPFS.instance) {
      ServerIPFS.instance = new ServerIPFS();
    }
    return ServerIPFS.instance;
  }

  async initialize() {
    if (this.helia) return;

    try {
      // Use HTTP API client for server-side operations
      const { create } = await import('ipfs-http-client');
      
      // Fallback to local IPFS node
      const ipfsApiUrl = process.env.IPFS_API_URL || 'http://localhost:5001';
      this.helia = create({ url: ipfsApiUrl });
      
      console.log('Server IPFS client initialized');
    } catch (error) {
      console.error('Failed to initialize server IPFS:', error);
      throw error;
    }
  }

  async uploadFile(buffer: Buffer): Promise<{ hash: string; size: number }> {
    await this.initialize();
    
    try {
      const result = await this.helia.add(buffer);
      return {
        hash: result.cid.toString(),
        size: buffer.length
      };
    } catch (error) {
      console.error('Failed to upload to IPFS:', error);
      throw error;
    }
  }

  async downloadFile(hash: string): Promise<Buffer> {
    await this.initialize();
    
    try {
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of this.helia.cat(hash)) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Failed to download from IPFS:', error);
      throw error;
    }
  }

  async getFileStats(hash: string): Promise<{ size: number } | null> {
    await this.initialize();

    try {
      const stats = await this.helia.files.stat(`/ipfs/${hash}`);
      return {
        size: stats.size
      };
    } catch (error) {
      console.error('Failed to get file stats:', error);
      return null;
    }
  }
}

