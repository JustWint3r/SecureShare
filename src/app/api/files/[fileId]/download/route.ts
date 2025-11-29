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

    // Retrieve encrypted file from Supabase Storage
    const storagePath = file.ipfs_hash; // This is the storage path we saved earlier
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
    const encryptedBytes = new Uint8Array(encryptedArrayBuffer);

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

    // Log the download
    await supabaseAdmin.from('access_logs').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'download',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
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
