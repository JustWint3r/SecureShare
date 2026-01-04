import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptFileData } from '@/lib/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { fileId } = await params;

  try {
    // First, check if the file exists
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('files')
      .select('id, name, size, type, ipfs_hash, encrypted_key, owner_id')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      console.error('File fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or has permission
    const isOwner = file.owner_id === user.id;
    let hasPermission = false;

    if (!isOwner) {
      // Check if user has permission to access this file
      const { data: permission } = await supabaseAdmin
        .from('file_permissions')
        .select('id')
        .eq('file_id', fileId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      hasPermission = !!permission;
    }

    if (!isOwner && !hasPermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this file' },
        { status: 403 }
      );
    }

    // Retrieve encrypted file from IPFS or Supabase Storage
    let encryptedBytes: Uint8Array;

    // Check if ipfs_hash is an IPFS CID (starts with 'baf' or 'Qm') or a storage path
    const isIPFS = file.ipfs_hash.startsWith('baf') || file.ipfs_hash.startsWith('Qm');

    if (isIPFS) {
      // Download from IPFS
      try {
        const { ServerIPFS } = await import('@/lib/ipfs');
        const ipfs = ServerIPFS.getInstance();
        const buffer = await ipfs.downloadFile(file.ipfs_hash);
        encryptedBytes = new Uint8Array(buffer);
        console.log('[Download] Retrieved from IPFS:', file.ipfs_hash);
      } catch (ipfsError) {
        console.error('IPFS download error:', ipfsError);
        return NextResponse.json(
          { success: false, error: 'Failed to retrieve file from IPFS' },
          { status: 500 }
        );
      }
    } else {
      // Download from Supabase Storage (fallback)
      const storagePath = file.ipfs_hash;
      const { data: encryptedFileData, error: downloadError } =
        await supabaseAdmin.storage.from('files').download(storagePath);

      if (downloadError || !encryptedFileData) {
        console.error('Storage download error:', downloadError);
        return NextResponse.json(
          { success: false, error: 'Failed to retrieve encrypted file' },
          { status: 500 }
        );
      }

      // Convert blob to Uint8Array
      const encryptedArrayBuffer = await encryptedFileData.arrayBuffer();
      encryptedBytes = new Uint8Array(encryptedArrayBuffer);
      console.log('[Download] Retrieved from Supabase Storage');
    }

    // Parse encryption key and IV
    const { key, iv } = JSON.parse(file.encrypted_key);

    console.log('[Download] File metadata:', {
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      encryptedSize: encryptedBytes.length,
      keyLength: key?.length,
      ivLength: iv?.length,
    });

    // Decrypt the file
    let decryptedData: Uint8Array;
    try {
      decryptedData = decryptFileData(encryptedBytes, key, iv);
      console.log('[Download] Decryption successful:', {
        originalSize: file.size,
        decryptedSize: decryptedData.length,
        matches: decryptedData.length === file.size,
      });
    } catch (decryptError) {
      console.error('Decryption error:', decryptError);
      return NextResponse.json(
        { success: false, error: 'Failed to decrypt file' },
        { status: 500 }
      );
    }

    // Log the download with file metadata
    await supabaseAdmin.from('access_logs').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'download',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      },
    });

    // Return the decrypted file as a binary response
    // Convert Uint8Array to Buffer for proper binary handling
    const buffer = Buffer.from(decryptedData);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(
          file.name
        )}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download file API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
