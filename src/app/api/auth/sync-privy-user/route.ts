import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { privyId, email, walletAddress } = await request.json();

    if (!privyId) {
      return NextResponse.json(
        { success: false, error: 'Privy ID is required' },
        { status: 400 }
      );
    }

    // Ensure we have either email or wallet address
    if (!email && !walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Either email or wallet address is required' },
        { status: 400 }
      );
    }

    // First, check if user already exists by Privy ID
    const { data: existingUserByPrivy, error: fetchPrivyError } =
      await supabaseAdmin
        .from('users')
        .select('*')
        .eq('privy_id', privyId)
        .single();

    if (fetchPrivyError && fetchPrivyError.code !== 'PGRST116') {
      console.error('Database fetch error:', fetchPrivyError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    // If user exists by Privy ID, update and return
    if (existingUserByPrivy) {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (email && existingUserByPrivy.email !== email?.toLowerCase()) {
        updateData.email = email.toLowerCase();
      }

      if (
        walletAddress &&
        existingUserByPrivy.wallet_address !== walletAddress
      ) {
        updateData.wallet_address = walletAddress;
      }

      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', existingUserByPrivy.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update user' },
          { status: 500 }
        );
      }

      const { password_hash, ...userResponse } = updatedUser;
      return NextResponse.json({
        success: true,
        user: userResponse,
        message: 'User synced successfully',
      });
    }

    // If no user by Privy ID, check if there's an existing user by email (for admin/lecturer accounts)
    let existingUserByEmail = null;
    if (email) {
      const { data: emailUser, error: emailError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Email lookup error:', emailError);
        return NextResponse.json(
          { success: false, error: 'Database error' },
          { status: 500 }
        );
      }

      existingUserByEmail = emailUser;
    }

    let user;

    if (existingUserByEmail) {
      // Update existing user (admin/lecturer) with Privy ID
      const updateData: any = {
        privy_id: privyId,
        updated_at: new Date().toISOString(),
      };

      if (walletAddress) {
        updateData.wallet_address = walletAddress;
      }

      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', existingUserByEmail.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update existing user error:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update existing user' },
          { status: 500 }
        );
      }

      user = updatedUser;
    } else {
      // Create new user
      const defaultName = email
        ? email.split('@')[0]
        : walletAddress
        ? `User_${walletAddress.slice(-6)}`
        : 'Anonymous User';

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: email ? email.toLowerCase() : null,
          privy_id: privyId,
          wallet_address: walletAddress || null,
          name: defaultName,
          role: 'student', // Default role
          password_hash: null, // No password hash for Privy users
        })
        .select()
        .single();

      if (createError) {
        console.error('Create error:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create user' },
          { status: 500 }
        );
      }

      user = newUser;
    }

    // Remove sensitive data before sending response
    const { password_hash, ...userResponse } = user;

    return NextResponse.json({
      success: true,
      user: userResponse,
      message: 'User synced successfully',
    });
  } catch (error) {
    console.error('Sync user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
