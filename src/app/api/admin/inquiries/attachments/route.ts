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

  // Only administrators can access attachments
  if (user.role?.toLowerCase() !== 'administrator') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 403 }
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
    console.error('Get attachment API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
