import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, department, newPassword } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Update profile fields if provided
    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      updateData.email = email || null;
    }

    if (department !== undefined) {
      updateData.department = department || null;
    }

    // Update password if provided
    if (newPassword) {
      // Hash the new password using SHA-256
      const passwordHash = crypto
        .createHash('sha256')
        .update(newPassword)
        .digest('hex');

      updateData.password_hash = passwordHash;
    }

    // Update user in database
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update settings error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    // Remove sensitive data before sending response
    const { password_hash, ...userResponse } = updatedUser;

    // Log the settings update
    await supabaseAdmin.from('access_logs').insert({
      file_id: null,
      user_id: user.id,
      action: newPassword ? 'password_change' : 'profile_update',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}













