import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { PermissionType } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Find the share token
    const { data: shareToken, error: tokenError } = await supabaseAdmin
      .from('share_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !shareToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired share link' },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (shareToken.expires_at) {
      const expiryDate = new Date(shareToken.expires_at);
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { success: false, error: 'Share link has expired' },
          { status: 410 }
        );
      }
    }

    // Check if max access count is reached
    if (
      shareToken.max_access_count &&
      shareToken.access_count >= shareToken.max_access_count
    ) {
      return NextResponse.json(
        { success: false, error: 'Share link access limit reached' },
        { status: 410 }
      );
    }

    // Get file details
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*, owner:users!files_owner_id_fkey(id, name, email)')
      .eq('id', shareToken.file_id)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if user already has permission
    const { data: existingPermission } = await supabaseAdmin
      .from('file_permissions')
      .select('*')
      .eq('file_id', shareToken.file_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    // If no permission exists, create one based on share permission level
    if (!existingPermission && user.id !== file.owner_id) {
      let permissionType: PermissionType;

      switch (shareToken.permission_level) {
        case 'view':
          permissionType = PermissionType.READ;
          break;
        case 'comment':
          permissionType = PermissionType.READ;
          break;
        case 'full':
          permissionType = PermissionType.WRITE;
          break;
        default:
          permissionType = PermissionType.READ;
      }

      // Grant permission to the user
      await supabaseAdmin.from('file_permissions').insert({
        file_id: shareToken.file_id,
        user_id: user.id,
        permission_type: permissionType,
        granted_by: shareToken.created_by,
        is_active: true,
      });

      // Log the permission grant
      await supabaseAdmin.from('access_logs').insert({
        file_id: shareToken.file_id,
        user_id: shareToken.created_by,
        shared_with_user_id: user.id,
        action: 'permission_granted',
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          permission_type: permissionType,
          via: 'share_link',
        },
      });

      // Log the access via link
      await supabaseAdmin.from('access_logs').insert({
        file_id: shareToken.file_id,
        user_id: user.id,
        action: 'access_via_link',
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });
    }

    // Increment access count
    await supabaseAdmin
      .from('share_tokens')
      .update({
        access_count: shareToken.access_count + 1,
      })
      .eq('id', shareToken.id);

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        created_at: file.created_at,
        owner: file.owner,
      },
      permission_level: shareToken.permission_level,
      message: 'File access granted successfully',
    });
  } catch (error) {
    console.error('Shared file access error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
