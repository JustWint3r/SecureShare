import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';

// Get user's files
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'owned'; // 'owned' or 'accessible'

    let query = supabase.from('files').select(`
        id,
        name,
        size,
        type,
        ipfs_hash,
        created_at,
        updated_at,
        owner_id,
        users!owner_id(name, email)
      `);

    if (type === 'owned') {
      // Get files owned by the user
      query = query.eq('owner_id', user.id);
    } else if (type === 'accessible') {
      // Get files the user has access to (through permissions)
      query = query
        .select(
          `
          id,
          name,
          size,
          type,
          ipfs_hash,
          created_at,
          updated_at,
          owner_id,
          users!owner_id(name, email),
          file_permissions!inner(
            permission_type,
            is_active
          )
        `
        )
        .eq('file_permissions.user_id', user.id)
        .eq('file_permissions.is_active', true);
    }

    const { data: files, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch files' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files: files || [],
    });
  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
