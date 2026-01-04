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

  console.log('[Audit Logs] Authenticated user:', { id: user.id, email: user.email, role: user.role });

  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query - use LEFT JOIN to include logs for deleted files
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

    // For non-admin users, show logs for:
    // 1. Files they currently own or have access to
    // 2. Any action they performed (including on deleted files)
    if (user.role !== 'administrator') {
      // Simply filter by user_id - show all logs where this user was the actor
      // This includes uploads, deletes, shares, etc. on both existing and deleted files
      query = query.eq('user_id', user.id);
    }

    // Get total count (need a separate query with count option)
    const countQuery = supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true });

    // Apply same filters for count
    if (fileId) {
      countQuery.eq('file_id', fileId);
    }
    if (action) {
      countQuery.eq('action', action);
    }
    if (user.role !== 'administrator') {
      countQuery.eq('user_id', user.id);
    }

    const { count } = await countQuery;

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
