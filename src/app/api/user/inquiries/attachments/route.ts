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
    const storagePath = searchParams.get('path');

    if (!storagePath) {
      return NextResponse.json(
        { success: false, error: 'Storage path is required' },
        { status: 400 }
      );
    }

    // Verify that the file belongs to the requesting user
    // Storage path format: user_id/inquiry_id/filename
    const pathUserId = storagePath.split('/')[0];

    if (pathUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You can only access your own files' },
        { status: 403 }
      );
    }

    // Get signed URL for the file (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from('inquiry-attachments')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Failed to generate signed URL:', signedUrlError);
      return NextResponse.json(
        { success: false, error: 'Failed to access file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: signedUrlData.signedUrl,
    });
  } catch (error) {
    console.error('Get user attachment API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
