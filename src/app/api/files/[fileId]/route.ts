import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { BlockchainService } from '@/lib/blockchain';

// Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  console.log('[DELETE] Handler called!');
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const { fileId } = await params;

    // First, check if the file exists and if the user owns it
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('files')
      .select('id, name, owner_id')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if the user owns the file
    if (file.owner_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own files' },
        { status: 403 }
      );
    }

    // Log to blockchain before deletion
    let transactionHash: string | null = null;
    try {
      const blockchain = new BlockchainService({
        rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'http://localhost:8545',
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        privateKey: process.env.PRIVATE_KEY || '',
      });

      const tx = await blockchain.deleteFile(fileId);
      const receipt = await tx.wait();
      transactionHash = receipt?.hash || null;
      console.log('[Delete] Blockchain transaction:', transactionHash);
    } catch (blockchainError) {
      console.error('Blockchain delete error:', blockchainError);
      // Don't fail the deletion if blockchain logging fails
    }

    // IMPORTANT: Log the deletion BEFORE deleting the file
    // This way the file_id foreign key is still valid when we insert the log
    const { error: logError } = await supabaseAdmin.from('access_logs').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'delete',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      transaction_hash: transactionHash,
      metadata: {
        file_name: file.name,
        deleted: true,
      },
    });

    if (logError) {
      console.error('Failed to log delete action:', logError);
      // Continue with deletion even if logging fails
    }

    // Delete the file from the database
    // The foreign key SET NULL will automatically set file_id to NULL in the audit log
    const { error: deleteError } = await supabaseAdmin
      .from('files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `File "${file.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
