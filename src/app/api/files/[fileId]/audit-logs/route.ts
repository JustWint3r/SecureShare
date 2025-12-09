import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this file
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('id, name, owner_id')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or has permission (or is admin)
    const isOwner = file.owner_id === user.id;
    const isAdmin = user.role === 'administrator';

    if (!isOwner && !isAdmin) {
      // Check if user has permission to this file
      const { data: permission } = await supabaseAdmin
        .from('file_permissions')
        .select('id')
        .eq('file_id', fileId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!permission) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Fetch all audit logs for this file
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('access_logs')
      .select(`
        *,
        user:users!access_logs_user_id_fkey(id, name, email, role),
        shared_with:users!access_logs_shared_with_user_id_fkey(id, name, email)
      `)
      .eq('file_id', fileId)
      .order('timestamp', { ascending: false });

    if (logsError) {
      console.error('Error fetching file audit logs:', logsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        name: file.name,
      },
      logs: logs || [],
      total: logs?.length || 0,
    });
  } catch (error) {
    console.error('File audit logs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
