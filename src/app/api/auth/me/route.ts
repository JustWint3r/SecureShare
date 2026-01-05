import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Try Privy authentication first (via header)
    const privyUserId = request.headers.get('x-privy-user-id');

    if (privyUserId) {
      // Get user from database using Privy ID
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, department, created_at, updated_at')
        .eq('privy_id', privyUserId)
        .single();

      if (!error && user) {
        return NextResponse.json({
          success: true,
          user,
        });
      }
    }

    // Fallback to JWT cookie authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token.value,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as { userId: string; email: string; role: string };

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, department, created_at, updated_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      // Clear invalid token
      const cookieStore2 = await cookies();
      cookieStore2.delete('auth-token');
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Auth verification error:', error);

    // Clear invalid token
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');

    return NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 }
    );
  }
}






