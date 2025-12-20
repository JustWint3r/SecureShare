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

  // Only administrators can view all users
  if (user.role !== 'administrator') {
    return NextResponse.json(
      { success: false, error: 'Access denied. Administrator privileges required.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select('id, email, name, role, department, created_at, updated_at, privy_id')
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply role filter
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Get file counts for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (u) => {
        const { count: fileCount } = await supabaseAdmin
          .from('files')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', u.id);

        const { count: sharedCount } = await supabaseAdmin
          .from('file_permissions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', u.id)
          .eq('is_active', true);

        return {
          ...u,
          file_count: fileCount || 0,
          shared_files_count: sharedCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithStats,
      total: usersWithStats.length,
    });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
