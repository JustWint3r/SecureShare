import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  privy_id: string;
}

export async function verifyAuth(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    // Get Privy user ID from request headers (sent by client)
    const privyUserId = request.headers.get('x-privy-user-id');

    if (!privyUserId) {
      return null;
    }

    // Get user from database using Privy ID
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, department, privy_id')
      .eq('privy_id', privyUserId)
      .single();

    if (error || !user) {
      console.error('User not found in database:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export function requireAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const user = await verifyAuth(request);

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(request, user);
  };
}

export function requireRole(roles: string[]) {
  return function (
    handler: (
      request: NextRequest,
      user: AuthenticatedUser
    ) => Promise<Response>
  ) {
    return async (request: NextRequest) => {
      const user = await verifyAuth(request);

      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (!roles.includes(user.role)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Insufficient permissions' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return handler(request, user);
    };
  };
}
