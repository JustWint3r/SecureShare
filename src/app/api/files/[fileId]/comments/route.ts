import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch comments for a file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  try {
    const { data: comments, error } = await supabaseAdmin
      .from('file_comments')
      .select(`
        *,
        user:users!file_comments_user_id_fkey(id, name, email)
      `)
      .eq('file_id', fileId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comments: comments || [],
    });
  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a comment to a file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  try {
    const { comment, userId } = await request.json();

    if (!comment || comment.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Try to get user from auth cookie first
    let user = await verifyAuth(request);
    let actualUserId = user?.id;

    // If no auth cookie, use the provided userId from the request
    if (!actualUserId && userId) {
      actualUserId = userId;
    }

    if (!actualUserId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Insert comment
    const { data: newComment, error: insertError } = await supabaseAdmin
      .from('file_comments')
      .insert({
        file_id: fileId,
        user_id: actualUserId,
        comment: comment.trim(),
      })
      .select(`
        *,
        user:users!file_comments_user_id_fkey(id, name, email)
      `)
      .single();

    if (insertError) {
      console.error('Error adding comment:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to add comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
      message: 'Comment added successfully',
    });
  } catch (error) {
    console.error('Add comment API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
