const { ethers } = require('hardhat');

async function main() {
  // Load .env.local manually
  require('dotenv').config({ path: '.env.local' });

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const FileAccessControl = await ethers.getContractFactory('FileAccessControl');
  const contract = FileAccessControl.attach(contractAddress);

  console.log('📊 Blockchain Verification\n');
  console.log('Contract Address:', contractAddress);
  console.log('Network: Hardhat Local\n');

  // Check user registration
  const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const userInfo = await contract.getUserInfo(userAddress);
  console.log('✅ User Registration:');
  console.log('   Address:', userAddress);
  console.log('   Name:', userInfo.name);
  console.log('   Email:', userInfo.email);
  console.log('   Role:', userInfo.role === 0n ? 'Student' : userInfo.role === 1n ? 'Lecturer' : 'Administrator');
  console.log('   Registered:', userInfo.isRegistered);
  console.log();

  // Get all files for this user
  const userFiles = await contract.getUserFiles(userAddress);
  console.log(`📁 Files on Blockchain: ${userFiles.length}`);
  console.log();

  // Get details of each file
  for (let i = 0; i < userFiles.length; i++) {
    const fileId = userFiles[i];
    const metadata = await contract.getFileMetadata(fileId);

    console.log(`File ${i + 1}:`);
    console.log('   File ID:', fileId);
    console.log('   File Name:', metadata.fileName);
    console.log('   IPFS/Storage Hash:', metadata.ipfsHash);
    console.log('   File Size:', metadata.fileSize.toString(), 'bytes');
    console.log('   Owner:', metadata.owner);
    console.log('   Created:', new Date(Number(metadata.createdAt) * 1000).toLocaleString());
    console.log();
  }

  // Get total access logs
  const totalLogs = await contract.getTotalAccessLogs();
  console.log(`📝 Total Access Logs: ${totalLogs.toString()}`);
  console.log();

  // Show recent access logs
  if (totalLogs > 0) {
    console.log('Recent Activity:');
    const recentCount = totalLogs > 5n ? 5 : Number(totalLogs);
    for (let i = Number(totalLogs); i > Number(totalLogs) - recentCount; i--) {
      const log = await contract.accessLogs(i);
      const actionNames = ['Upload', 'Download', 'View', 'Share', 'Revoke', 'Delete'];
      console.log(`   ${actionNames[log.action]} - File: ${log.fileId.substring(0, 8)}... at ${new Date(Number(log.timestamp) * 1000).toLocaleString()}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
