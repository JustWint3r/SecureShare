import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const { fileId, permission } = await request.json();

    if (!fileId || !permission) {
      return NextResponse.json(
        { success: false, error: 'File ID and permission are required' },
        { status: 400 }
      );
    }

    // Verify file ownership
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('files')
      .select('id, owner_id, name')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    if (file.owner_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to share this file',
        },
        { status: 403 }
      );
    }

    // Generate unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');

    // Create share record in database
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
      console.error('Error creating share token:', shareError);
      return NextResponse.json(
        { success: false, error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    // Log the share action
    await supabaseAdmin.from('access_logs').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'share',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    // Generate share URL
    const shareUrl = `${request.nextUrl.origin}/shared/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl,
      permission,
      message: 'Share link generated successfully',
    });
  } catch (error) {
    console.error('Share file API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}





















