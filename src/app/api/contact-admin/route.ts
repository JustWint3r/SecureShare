import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';

interface AttachmentMetadata {
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Only allow students and lecturers to contact admin
  if (user.role?.toLowerCase() === 'administrator') {
    return NextResponse.json(
      { success: false, error: 'Administrators cannot use this feature' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // First, create the inquiry to get its ID
    const { data: inquiry, error: insertError } = await supabaseAdmin
      .from('admin_inquiries')
      .insert({
        user_id: user.id,
        subject,
        message,
        attachments: null,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create inquiry:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to submit inquiry' },
        { status: 500 }
      );
    }

    // Upload files to Supabase Storage and collect metadata
    const attachments: AttachmentMetadata[] = [];
    let fileIndex = 0;
    const uploadErrors: string[] = [];

    while (formData.has(`file_${fileIndex}`)) {
      const file = formData.get(`file_${fileIndex}`) as File;
      if (file && file.size > 0) {
        try {
          // Generate unique file path: user_id/inquiry_id/timestamp_filename
          const timestamp = Date.now();
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storagePath = `${user.id}/${inquiry.id}/${timestamp}_${sanitizedFileName}`;

          // Convert File to ArrayBuffer
          const arrayBuffer = await file.arrayBuffer();
          const fileBuffer = Buffer.from(arrayBuffer);

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from('inquiry-attachments')
            .upload(storagePath, fileBuffer, {
              contentType: file.type || 'application/octet-stream',
              upsert: false,
            });

          if (uploadError) {
            console.error('Failed to upload file:', uploadError);
            uploadErrors.push(`${file.name}: ${uploadError.message}`);
          } else {
            // Store file metadata
            attachments.push({
              fileName: file.name,
              storagePath: storagePath,
              fileSize: file.size,
              mimeType: file.type || 'application/octet-stream',
              uploadedAt: new Date().toISOString(),
            });
          }
        } catch (fileError) {
          console.error('Error processing file:', fileError);
          uploadErrors.push(`${file.name}: Processing error`);
        }
      }
      fileIndex++;
    }

    // Update inquiry with attachment metadata
    if (attachments.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('admin_inquiries')
        .update({ attachments: attachments })
        .eq('id', inquiry.id);

      if (updateError) {
        console.error('Failed to update inquiry with attachments:', updateError);
        // Don't fail the entire request, just log the error
      }
    }

    // Log the inquiry submission
    await supabaseAdmin.from('access_logs').insert({
      file_id: null,
      user_id: user.id,
      action: 'contact_admin',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        subject,
        attachments_count: attachments.length,
        upload_errors: uploadErrors.length > 0 ? uploadErrors : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      inquiry: {
        ...inquiry,
        attachments: attachments,
      },
      message: 'Inquiry submitted successfully',
      warnings: uploadErrors.length > 0 ? `Some files failed to upload: ${uploadErrors.join(', ')}` : undefined,
    });
  } catch (error) {
    console.error('Contact admin API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
