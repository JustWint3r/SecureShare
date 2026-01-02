import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Fetch all replies for an inquiry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const inquiryId = params.id;

    // Verify user has access to this inquiry
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('admin_inquiries')
      .select('user_id')
      .eq('id', inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        { success: false, error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Check if user is the inquiry owner or an administrator
    const isOwner = inquiry.user_id === user.id;
    const isAdmin = user.role?.toLowerCase() === 'administrator';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch replies with user information
    const { data: replies, error: repliesError } = await supabaseAdmin
      .from('inquiry_replies')
      .select(`
        *,
        users!inquiry_replies_user_id_fkey (
          id,
          name,
          role
        )
      `)
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.error('Failed to fetch replies:', repliesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch replies' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      replies: replies || [],
    });
  } catch (error) {
    console.error('Get replies API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add a new reply to an inquiry
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const inquiryId = params.id;
    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this inquiry
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('admin_inquiries')
      .select('user_id, status')
      .eq('id', inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        { success: false, error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Check if user is the inquiry owner or an administrator
    const isOwner = inquiry.user_id === user.id;
    const isAdmin = user.role?.toLowerCase() === 'administrator';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Create the reply
    const { data: reply, error: replyError } = await supabaseAdmin
      .from('inquiry_replies')
      .insert({
        inquiry_id: inquiryId,
        user_id: user.id,
        message: message.trim(),
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        users!inquiry_replies_user_id_fkey (
          id,
          name,
          role
        )
      `)
      .single();

    if (replyError) {
      console.error('Failed to create reply:', replyError);
      return NextResponse.json(
        { success: false, error: 'Failed to create reply' },
        { status: 500 }
      );
    }

    // Update inquiry's updated_at timestamp
    await supabaseAdmin
      .from('admin_inquiries')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', inquiryId);

    // Log the reply
    await supabaseAdmin.from('access_logs').insert({
      file_id: null,
      user_id: user.id,
      action: 'inquiry_reply',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        inquiry_id: inquiryId,
        is_admin: isAdmin,
      },
    });

    return NextResponse.json({
      success: true,
      reply,
      message: 'Reply added successfully',
    });
  } catch (error) {
    console.error('Create reply API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
