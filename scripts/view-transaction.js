const { ethers } = require('hardhat');

async function main() {
  const txHash = process.argv[2] || '0xdb241959fa4da9893ade29c5276dd930d0f7635f6edede671b21332d083054e3';

  console.log('🔍 Transaction Details\n');
  console.log('Transaction Hash:', txHash);
  console.log();

  const provider = new ethers.JsonRpcProvider('http://localhost:8545');

  try {
    // Get transaction
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      console.log('❌ Transaction not found');
      return;
    }

    console.log('📋 Transaction Info:');
    console.log('   From:', tx.from);
    console.log('   To:', tx.to);
    console.log('   Block Number:', tx.blockNumber);
    console.log('   Gas Used:', tx.gasLimit.toString());
    console.log('   Gas Price:', ethers.formatUnits(tx.gasPrice, 'gwei'), 'gwei');
    console.log('   Nonce:', tx.nonce);
    console.log();

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt) {
      console.log('✅ Transaction Receipt:');
      console.log('   Status:', receipt.status === 1 ? 'Success ✓' : 'Failed ✗');
      console.log('   Block Number:', receipt.blockNumber);
      console.log('   Gas Used:', receipt.gasUsed.toString());
      console.log('   Cumulative Gas:', receipt.cumulativeGasUsed.toString());
      console.log('   Contract Address:', receipt.contractAddress || 'N/A');
      console.log();

      // Decode logs/events
      if (receipt.logs && receipt.logs.length > 0) {
        console.log('📝 Events Emitted:');

        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
        const FileAccessControl = await ethers.getContractFactory('FileAccessControl');
        const contract = FileAccessControl.attach(contractAddress);

        for (let i = 0; i < receipt.logs.length; i++) {
          const log = receipt.logs[i];
          try {
            // Try to decode the event
            const parsedLog = contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });

            console.log(`\n   Event ${i + 1}: ${parsedLog.name}`);
            console.log('   Arguments:');
            for (const [key, value] of Object.entries(parsedLog.args)) {
              if (isNaN(Number(key))) { // Skip numeric indices
                console.log(`      ${key}:`, value.toString());
              }
            }
          } catch (e) {
            console.log(`   Event ${i + 1}: [Unable to decode]`);
          }
        }
      }

      // Get block info
      const block = await provider.getBlock(receipt.blockNumber);
      console.log('\n📦 Block Info:');
      console.log('   Block Number:', block.number);
      console.log('   Block Hash:', block.hash);
      console.log('   Timestamp:', new Date(block.timestamp * 1000).toLocaleString());
      console.log('   Transactions:', block.transactions.length);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
