const { ethers } = require('hardhat');

async function main() {
  console.log('Starting deployment...');

  // Get the contract factory
  const FileAccessControl = await ethers.getContractFactory(
    'FileAccessControl'
  );

  // Deploy the contract
  console.log('Deploying FileAccessControl contract...');
  const contract = await FileAccessControl.deploy();

  // Wait for deployment to finish
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log('FileAccessControl deployed to:', contractAddress);

  // Verify deployment
  console.log('Verifying deployment...');
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log('Deployed at block number:', blockNumber);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    blockNumber: blockNumber,
    network: network.name,
    deployedAt: new Date().toISOString(),
  };

  console.log('Deployment successful!');
  console.log('Contract Address:', contractAddress);
  console.log('Network:', network.name);
  console.log('Block Number:', blockNumber);

  // Instructions for environment setup
  console.log('\n🔧 Next Steps:');
  console.log('1. Update your .env.local file with:');
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(
    '2. Make sure IPFS node is running (or update IPFS configuration)'
  );
  console.log('3. Configure Supabase database with the provided schema');
  console.log('4. Start the development server: npm run dev');

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });


