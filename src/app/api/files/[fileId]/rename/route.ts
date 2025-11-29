import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { fileId } = await params;

  try {
    const { newName } = await request.json();

    if (!newName) {
      return NextResponse.json(
        { success: false, error: 'New file name is required' },
        { status: 400 }
      );
    }

    // Verify file ownership
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('files')
      .select('id, owner_id, name')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    if (file.owner_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to rename this file',
        },
        { status: 403 }
      );
    }

    // Update file name
    const { error: updateError } = await supabaseAdmin
      .from('files')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', fileId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to rename file' },
        { status: 500 }
      );
    }

    // Log the rename action
    await supabaseAdmin.from('access_logs').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'rename',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'File renamed successfully',
    });
  } catch (error) {
    console.error('Rename file API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
