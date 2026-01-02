import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptFileData, generateEncryptionKey } from '@/lib/encryption';
import { generateFileId, BlockchainService } from '@/lib/blockchain';
import { ServerIPFS } from '@/lib/ipfs';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 500MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'File type not supported. Only PDF, Word, Excel, and PowerPoint files are allowed.',
        },
        { status: 400 }
      );
    }

    // Convert file to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // Generate encryption key and encrypt file data
    const encryptionKey = generateEncryptionKey();
    console.log('[Upload] Original file size:', fileData.length);
    const { encryptedData, iv } = encryptFileData(fileData, encryptionKey);
    console.log('[Upload] Encrypted file size:', encryptedData.length);

    // Generate unique file ID
    const fileId = generateFileId();

    // Upload encrypted file to IPFS
    let ipfsHash: string;
    try {
      const ipfs = ServerIPFS.getInstance();
      const buffer = Buffer.from(encryptedData);
      const ipfsResult = await ipfs.uploadFile(buffer);
      ipfsHash = ipfsResult.hash;
      console.log('[Upload] File uploaded to IPFS:', ipfsHash);
    } catch (ipfsError) {
      console.error('IPFS upload error:', ipfsError);
      // Fallback to Supabase storage if IPFS fails
      const encryptedBlob = new Blob([Buffer.from(encryptedData)], {
        type: 'application/octet-stream',
      });
      const storagePath = `encrypted-files/${user.id}/${fileId}`;

      const { error: storageError } = await supabaseAdmin.storage
        .from('files')
        .upload(storagePath, encryptedBlob, {
          contentType: 'application/octet-stream',
          upsert: false,
        });

      if (storageError) {
        console.error('Storage error:', storageError);
        return NextResponse.json(
          { success: false, error: 'Failed to store encrypted file' },
          { status: 500 }
        );
      }

      ipfsHash = storagePath;
      console.log('[Upload] Fallback: File stored in Supabase storage');
    }

    // Store file metadata in database
    const { data: fileRecord, error: dbError} = await supabaseAdmin
      .from('files')
      .insert({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        ipfs_hash: ipfsHash,
        encrypted_key: JSON.stringify({ key: encryptionKey, iv }),
        owner_id: user.id,
        description: description || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save file metadata' },
        { status: 500 }
      );
    }

    // Log to blockchain
    let transactionHash: string | null = null;
    try {
      const blockchain = new BlockchainService({
        rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'http://localhost:8545',
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        privateKey: process.env.PRIVATE_KEY || '',
      });

      const tx = await blockchain.uploadFile(fileId, ipfsHash, file.name, file.size);
      const receipt = await tx.wait();
      transactionHash = receipt?.hash || null;
      console.log('[Upload] Blockchain transaction:', transactionHash);
    } catch (blockchainError) {
      console.error('Blockchain logging error:', blockchainError);
      // Don't fail the upload if blockchain logging fails
    }

    // Log the upload in access logs
    const { error: logError } = await supabaseAdmin.from('access_logs').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'upload',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      transaction_hash: transactionHash,
    });

    if (logError) {
      console.error('Failed to log upload action:', logError);
      // Don't fail the upload if logging fails
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        name: fileRecord.name,
        size: fileRecord.size,
        type: fileRecord.type,
        ipfs_hash: fileRecord.ipfs_hash,
        created_at: fileRecord.created_at,
      },
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
