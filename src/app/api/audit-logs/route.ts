import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabaseAdmin
      .from('access_logs')
      .select(`
        *,
        file:files(id, name, type),
        user:users!access_logs_user_id_fkey(id, name, email, role),
        shared_with:users!access_logs_shared_with_user_id_fkey(id, name, email)
      `)
      .order('timestamp', { ascending: false });

    // Apply filters
    if (fileId) {
      query = query.eq('file_id', fileId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    // For non-admin users, only show logs for files they own or have access to
    if (user.role !== 'administrator') {
      // Get user's file IDs (owned + accessible)
      const { data: userFiles } = await supabaseAdmin
        .from('files')
        .select('id')
        .eq('owner_id', user.id);

      const { data: accessibleFiles } = await supabaseAdmin
        .from('file_permissions')
        .select('file_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const fileIds = [
        ...(userFiles?.map((f) => f.id) || []),
        ...(accessibleFiles?.map((f) => f.file_id) || []),
      ];

      if (fileIds.length > 0) {
        query = query.in('file_id', fileIds);
      } else {
        // User has no files, return empty array
        return NextResponse.json({
          success: true,
          logs: [],
          total: 0,
        });
      }
    }

    // Get total count
    const { count } = await query.range(0, 0);

    // Apply pagination
    const { data: logs, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
