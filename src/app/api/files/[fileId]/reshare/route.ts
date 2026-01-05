import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// POST - Reshare a file (create new share token)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  console.log('[Reshare API] Starting reshare request');
  console.log('[Reshare API] Headers:', {
    privyUserId: request.headers.get('x-privy-user-id'),
    contentType: request.headers.get('content-type')
  });

  const user = await verifyAuth(request);
  const { fileId } = await params;

  console.log('[Reshare API] Auth result:', { user: user ? { id: user.id, email: user.email } : null, fileId });

  if (!user) {
    console.log('[Reshare API] Authentication failed');
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const { permission } = await request.json();
    console.log('[Reshare API] Permission requested:', permission);

    if (!permission) {
      return NextResponse.json(
        { success: false, error: 'Permission level is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this file
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('files')
      .select('id, owner_id, name')
      .eq('id', fileId)
      .single();

    console.log('[Reshare API] File fetch result:', { file, fetchError });

    if (fetchError || !file) {
      console.log('[Reshare API] File not found');
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to reshare (must have 'full' access or be owner)
    const isOwner = file.owner_id === user.id;
    let hasFullAccess = false;

    console.log('[Reshare API] Checking permissions:', { isOwner, userId: user.id, ownerId: file.owner_id });

    if (!isOwner) {
      const { data: permissions } = await supabaseAdmin
        .from('file_permissions')
        .select('permission_type')
        .eq('file_id', fileId)
        .eq('user_id', user.id)
        .single();

      console.log('[Reshare API] User permissions:', permissions);
      // 'full' permission level maps to 'write' permission_type in the database
      hasFullAccess = permissions?.permission_type === 'write';
    }

    console.log('[Reshare API] Final permission check:', { isOwner, hasFullAccess });

    if (!isOwner && !hasFullAccess) {
      console.log('[Reshare API] User does not have permission to reshare');
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to reshare this file',
        },
        { status: 403 }
      );
    }

    // Generate unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    console.log('[Reshare API] Generated share token');

    // Create share record
    const { error: shareError } = await supabaseAdmin
      .from('share_tokens')
      .insert({
        token: shareToken,
        file_id: fileId,
        created_by: user.id,
        permission_level: permission,
        is_active: true,
      });

    if (shareError) {
      console.error('[Reshare API] Error creating reshare token:', shareError);
      return NextResponse.json(
        { success: false, error: 'Failed to create reshare link' },
        { status: 500 }
      );
    }

    console.log('[Reshare API] Share token created successfully');

    // Log the reshare action
    await supabaseAdmin.from('access_logs').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'share',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        file_name: file.name,
        permission_level: permission,
        reshared: true,
      },
    });

    // Generate share URL
    const shareUrl = `${request.nextUrl.origin}/shared/${shareToken}`;
    console.log('[Reshare API] Success! Share URL:', shareUrl);

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl,
      permission,
      message: 'File reshared successfully',
    });
  } catch (error) {
    console.error('[Reshare API] Reshare API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
