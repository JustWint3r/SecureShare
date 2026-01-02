import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { BlockchainService, PermissionType } from '@/lib/blockchain';

// Grant file permissions
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const fileId = request.url.split('/').slice(-2, -1)[0]; // Extract fileId from URL
    const { user_id, permission_type } = await request.json();

    if (!fileId || !user_id || !permission_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'File ID, user ID, and permission type are required',
        },
        { status: 400 }
      );
    }

    // Validate permission type
    const validPermissions = ['read', 'write', 'share'];
    if (!validPermissions.includes(permission_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid permission type' },
        { status: 400 }
      );
    }

    // Check if current user owns the file or is an administrator
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('owner_id')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    if (file.owner_id !== user.id && user.role !== 'administrator') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only file owner or administrator can grant permissions',
        },
        { status: 403 }
      );
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', user_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Check if permission already exists
    const { data: existingPermission } = await supabase
      .from('file_permissions')
      .select('id, is_active')
      .eq('file_id', fileId)
      .eq('user_id', user_id)
      .single();

    if (existingPermission) {
      if (existingPermission.is_active) {
        // Update existing permission
        const { error: updateError } = await supabase
          .from('file_permissions')
          .update({
            permission_type,
            granted_by: user.id,
            granted_at: new Date().toISOString(),
          })
          .eq('id', existingPermission.id);

        if (updateError) {
          console.error('Permission update error:', updateError);
          return NextResponse.json(
            { success: false, error: 'Failed to update permission' },
            { status: 500 }
          );
        }
      } else {
        // Reactivate revoked permission
        const { error: reactivateError } = await supabase
          .from('file_permissions')
          .update({
            permission_type,
            granted_by: user.id,
            granted_at: new Date().toISOString(),
            revoked_at: null,
            is_active: true,
          })
          .eq('id', existingPermission.id);

        if (reactivateError) {
          console.error('Permission reactivation error:', reactivateError);
          return NextResponse.json(
            { success: false, error: 'Failed to reactivate permission' },
            { status: 500 }
          );
        }
      }
    } else {
      // Create new permission
      const { error: insertError } = await supabase
        .from('file_permissions')
        .insert({
          file_id: fileId,
          user_id: user_id,
          permission_type,
          granted_by: user.id,
          is_active: true,
        });

      if (insertError) {
        console.error('Permission creation error:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to grant permission' },
          { status: 500 }
        );
      }
    }

    // Get user's wallet address for blockchain
    const { data: targetUserWallet } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', user_id)
      .single();

    // Log to blockchain
    let transactionHash: string | null = null;
    if (targetUserWallet?.wallet_address) {
      try {
        const blockchain = new BlockchainService({
          rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'http://localhost:8545',
          contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
          privateKey: process.env.PRIVATE_KEY || '',
        });

        // Map permission type string to enum
        const permissionTypeEnum =
          permission_type === 'read' ? PermissionType.READ :
          permission_type === 'write' ? PermissionType.WRITE :
          PermissionType.SHARE;

        const tx = await blockchain.grantPermission(
          fileId,
          targetUserWallet.wallet_address,
          permissionTypeEnum
        );
        const receipt = await tx.wait();
        transactionHash = receipt?.hash || null;
        console.log('[Permission] Blockchain transaction:', transactionHash);
      } catch (blockchainError) {
        console.error('Blockchain permission grant error:', blockchainError);
        // Don't fail the permission grant if blockchain logging fails
      }
    }

    // Log the permission grant
    await supabaseAdmin.from('access_logs').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'share',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      transaction_hash: transactionHash,
    });

    return NextResponse.json({
      success: true,
      message: `${permission_type} permission granted to ${targetUser.name}`,
      permission: {
        user: targetUser,
        permission_type,
        granted_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Grant permission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Revoke file permissions
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    const fileId = request.url.split('/').slice(-2, -1)[0]; // Extract fileId from URL
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    if (!fileId || !userId) {
      return NextResponse.json(
        { success: false, error: 'File ID and user ID are required' },
        { status: 400 }
      );
    }

    // Check if current user owns the file or is an administrator
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('owner_id')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    if (file.owner_id !== user.id && user.role !== 'administrator') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only file owner or administrator can revoke permissions',
        },
        { status: 403 }
      );
    }

    // Revoke permission by setting is_active to false
    const { error: revokeError } = await supabase
      .from('file_permissions')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('file_id', fileId)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (revokeError) {
      console.error('Permission revocation error:', revokeError);
      return NextResponse.json(
        { success: false, error: 'Failed to revoke permission' },
        { status: 500 }
      );
    }

    // Get user's wallet address for blockchain
    const { data: targetUserWallet } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', userId)
      .single();

    // Log to blockchain
    let transactionHash: string | null = null;
    if (targetUserWallet?.wallet_address) {
      try {
        const blockchain = new BlockchainService({
          rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'http://localhost:8545',
          contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
          privateKey: process.env.PRIVATE_KEY || '',
        });

        const tx = await blockchain.revokePermission(fileId, targetUserWallet.wallet_address);
        const receipt = await tx.wait();
        transactionHash = receipt?.hash || null;
        console.log('[Revoke] Blockchain transaction:', transactionHash);
      } catch (blockchainError) {
        console.error('Blockchain permission revoke error:', blockchainError);
        // Don't fail the revocation if blockchain logging fails
      }
    }

    // Log the permission revocation
    await supabaseAdmin.from('access_logs').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'revoke',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      transaction_hash: transactionHash,
    });

    return NextResponse.json({
      success: true,
      message: 'Permission revoked successfully',
    });
  } catch (error) {
    console.error('Revoke permission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Get file permissions
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const fileId = request.url.split('/').slice(-2, -1)[0]; // Extract fileId from URL

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to view permissions
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('owner_id')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    if (file.owner_id !== user.id && user.role !== 'administrator') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only file owner or administrator can view permissions',
        },
        { status: 403 }
      );
    }

    // Get all permissions for the file
    const { data: permissions, error: permissionsError } = await supabase
      .from('file_permissions')
      .select(
        `
        id,
        permission_type,
        granted_at,
        revoked_at,
        is_active,
        users!user_id(id, name, email, role),
        granted_by_user:users!granted_by(id, name, email)
      `
      )
      .eq('file_id', fileId)
      .order('granted_at', { ascending: false });

    if (permissionsError) {
      console.error('Permissions fetch error:', permissionsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch permissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permissions: permissions || [],
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});







