import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const privyUserId = request.headers.get('x-privy-user-id');

    if (!privyUserId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { name, email, department, role } = await request.json();

    if (!name || !role) {
      return NextResponse.json(
        { success: false, error: 'Name and role are required' },
        { status: 400 }
      );
    }

    // Update user profile in database
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        email: email || null,
        department: department || null,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('privy_id', privyUserId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Remove sensitive data before sending response
    const { password_hash, ...userResponse } = updatedUser;

    return NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


