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

  // Only allow students and lecturers (not administrators)
  if (user.role?.toLowerCase() === 'administrator') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is for students and lecturers only' },
      { status: 403 }
    );
  }

  try {
    // Fetch user's own inquiries
    const { data: inquiries, error } = await supabaseAdmin
      .from('admin_inquiries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch user inquiries:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch inquiries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inquiries: inquiries || [],
    });
  } catch (error) {
    console.error('Get user inquiries API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
