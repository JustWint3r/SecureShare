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

  // Only allow administrators to view inquiries
  if (user.role?.toLowerCase() !== 'administrator') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('admin_inquiries')
      .select(`
        *,
        users!admin_inquiries_user_id_fkey (
          name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error('Failed to fetch inquiries:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch inquiries' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedInquiries = inquiries?.map((inquiry: any) => ({
      ...inquiry,
      user_name: inquiry.users?.name,
      user_email: inquiry.users?.email,
      user_role: inquiry.users?.role,
    }));

    return NextResponse.json({
      success: true,
      inquiries: formattedInquiries || [],
    });
  } catch (error) {
    console.error('Get inquiries API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
