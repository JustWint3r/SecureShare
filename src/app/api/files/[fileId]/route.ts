import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';

// Delete a file
export async function DELETE(
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

  try {
    const { fileId } = await params;

    // First, check if the file exists and if the user owns it
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('id, name, owner_id')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if the user owns the file
    if (file.owner_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own files' },
        { status: 403 }
      );
    }

    // Delete the file from the database
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete file' },
        { status: 500 }
      );
    }

    // Log the deletion in access logs
    await supabase.from('access_logs').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'delete',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    // TODO: In a real implementation, also delete from IPFS
    // TODO: In a real implementation, also log to blockchain

    return NextResponse.json({
      success: true,
      message: `File "${file.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
