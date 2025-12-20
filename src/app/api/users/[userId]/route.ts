import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Only administrators can update user roles
  if (user.role !== 'administrator') {
    return NextResponse.json(
      { success: false, error: 'Access denied. Administrator privileges required.' },
      { status: 403 }
    );
  }

  try {
    const { userId } = params;
    const body = await request.json();
    const { role, department, name } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['student', 'lecturer', 'administrator'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be student, lecturer, or administrator.' },
        { status: 400 }
      );
    }

    // Prevent user from removing their own admin role
    if (userId === user.id && role && role !== 'administrator') {
      return NextResponse.json(
        { success: false, error: 'You cannot remove your own administrator role.' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (role) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (name) updateData.name = name;

    // Update user
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Log the action
    await supabaseAdmin.from('access_logs').insert({
      user_id: user.id,
      action: 'update',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        action_type: 'user_role_update',
        updated_user_id: userId,
        old_role: role ? 'changed' : 'unchanged',
        new_role: role || 'unchanged',
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        department: updatedUser.department,
        updated_at: updatedUser.updated_at,
      },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Only administrators can delete users
  if (user.role !== 'administrator') {
    return NextResponse.json(
      { success: false, error: 'Access denied. Administrator privileges required.' },
      { status: 403 }
    );
  }

  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account.' },
        { status: 400 }
      );
    }

    // Delete user (cascading deletes will handle files and permissions)
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Log the deletion
    await supabaseAdmin.from('access_logs').insert({
      user_id: user.id,
      action: 'delete',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        action_type: 'user_deletion',
        deleted_user_id: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
