import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Only allow administrators to update inquiries
  if (user.role?.toLowerCase() !== 'administrator') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { admin_response, status } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (admin_response !== undefined) {
      updateData.admin_response = admin_response;
      updateData.responded_by = user.id;
      updateData.responded_at = new Date().toISOString();
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const { data: updatedInquiry, error } = await supabaseAdmin
      .from('admin_inquiries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update inquiry:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update inquiry' },
        { status: 500 }
      );
    }

    // Log the inquiry update
    await supabaseAdmin.from('access_logs').insert({
      file_id: null,
      user_id: user.id,
      action: 'inquiry_updated',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: { inquiry_id: id, status: updateData.status },
    });

    return NextResponse.json({
      success: true,
      inquiry: updatedInquiry,
      message: 'Inquiry updated successfully',
    });
  } catch (error) {
    console.error('Update inquiry API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
