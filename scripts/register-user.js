const { ethers } = require('hardhat');

async function main() {
  // Load .env.local manually
  require('dotenv').config({ path: '.env.local' });

  // Get the contract
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const FileAccessControl = await ethers.getContractFactory('FileAccessControl');
  const contract = FileAccessControl.attach(contractAddress);

  // User details - replace with actual user data
  const userAddress = '0x6FdD539fe0F9bCA4C81d9361929d31a23C006CDD'; // Your actual wallet from Privy
  const userRole = 2; // 0 = Student, 1 = Lecturer, 2 = Administrator
  const email = 'justwint3r@gmail.com';
  const name = 'Wint3r';

  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Registering user: ${name} (${email})`);
  console.log(`Wallet address: ${userAddress}`);
  console.log(`Role: ${userRole === 0 ? 'Student' : userRole === 1 ? 'Lecturer' : 'Administrator'}`);

  try {
    const tx = await contract.registerUser(userAddress, userRole, email, name);
    console.log('Transaction submitted:', tx.hash);

    const receipt = await tx.wait();
    console.log('✅ User registered successfully!');
    console.log('Transaction hash:', receipt.hash);
    console.log('Gas used:', receipt.gasUsed.toString());
  } catch (error) {
    if (error.message.includes('User already registered')) {
      console.log('ℹ️  User is already registered');
    } else {
      console.error('❌ Error registering user:', error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
