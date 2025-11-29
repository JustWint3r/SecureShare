// Environment Configuration Example
// Copy this file to .env.local and fill in your actual values

module.exports = {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: 'your_supabase_url',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your_supabase_anon_key',
  SUPABASE_SERVICE_ROLE_KEY: 'your_supabase_service_role_key',

  // Ethereum Configuration
  NEXT_PUBLIC_ETHEREUM_RPC_URL: 'http://localhost:8545',
  NEXT_PUBLIC_CONTRACT_ADDRESS: 'your_contract_address',
  PRIVATE_KEY: 'your_private_key',

  // IPFS Configuration
  NEXT_PUBLIC_IPFS_GATEWAY: 'http://localhost:5001',
  IPFS_API_URL: 'http://localhost:5001',

  // Encryption
  ENCRYPTION_SECRET_KEY: 'your_32_character_secret_key',

  // Application
  NEXTAUTH_SECRET: 'your_nextauth_secret',
  NEXTAUTH_URL: 'http://localhost:3000',
};

