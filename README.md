# SecureShare - Blockchain Document Sharing System

A comprehensive document sharing platform built with Next.js, featuring blockchain-based access control, IPFS storage, and role-based permissions for university environments.

## 🚀 Features

- **Blockchain Security**: Smart contract-based access control using Solidity
- **Decentralized Storage**: IPFS integration for distributed file storage
- **AES Encryption**: Files encrypted before storage for maximum security
- **Role-Based Access**: Student, Lecturer, and Administrator roles
- **Audit Logging**: On-chain access logs for transparency and accountability
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **Real-time Updates**: Live file sharing and permission management

## 🛠 Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form validation and handling
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Notifications

### Backend

- **Next.js API Routes** - Server-side functionality
- **Supabase** - PostgreSQL database and authentication
- **JWT** - Secure session management

### Blockchain

- **Solidity** - Smart contract development
- **Hardhat** - Ethereum development environment
- **Ethers.js** - Blockchain interaction library
- **OpenZeppelin** - Secure smart contract templates

### Storage & Security

- **Helia (IPFS)** - Decentralized file storage
- **CryptoJS** - File encryption (AES-256)
- **Multer** - File upload handling

## 📋 Prerequisites

- Node.js (v18 or later)
- NPM or Yarn
- Git
- IPFS node (optional - for local development)
- Ethereum wallet with testnet ETH (for deployment)

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd ipfs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env.local` file:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Ethereum Configuration
   NEXT_PUBLIC_ETHEREUM_RPC_URL=http://localhost:8545
   NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
   PRIVATE_KEY=your_private_key

   # IPFS Configuration
   NEXT_PUBLIC_IPFS_GATEWAY=http://localhost:5001
   IPFS_API_URL=http://localhost:5001

   # Application
   NEXTAUTH_SECRET=your_secure_random_string
   NEXTAUTH_URL=http://localhost:3000
   ```

## 🗄 Database Setup

1. **Create Supabase Project**

   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Copy the URL and anon key to your `.env.local`

2. **Run Database Schema**

   Execute this SQL in your Supabase SQL editor:

   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     name TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'administrator')),
     department TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Files table
   CREATE TABLE files (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     size BIGINT NOT NULL,
     type TEXT NOT NULL,
     ipfs_hash TEXT NOT NULL,
     encrypted_key TEXT NOT NULL,
     owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
     description TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- File permissions table
   CREATE TABLE file_permissions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     file_id UUID REFERENCES files(id) ON DELETE CASCADE,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'write', 'share')),
     granted_by UUID REFERENCES users(id),
     granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     revoked_at TIMESTAMP WITH TIME ZONE,
     is_active BOOLEAN DEFAULT TRUE
   );

   -- Access logs table
   CREATE TABLE access_logs (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     file_id UUID REFERENCES files(id) ON DELETE CASCADE,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     action TEXT NOT NULL CHECK (action IN ('upload', 'download', 'view', 'share', 'revoke', 'delete')),
     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     ip_address INET,
     user_agent TEXT,
     transaction_hash TEXT
   );

   -- Create indexes for better performance
   CREATE INDEX idx_files_owner_id ON files(owner_id);
   CREATE INDEX idx_file_permissions_file_id ON file_permissions(file_id);
   CREATE INDEX idx_file_permissions_user_id ON file_permissions(user_id);
   CREATE INDEX idx_access_logs_file_id ON access_logs(file_id);
   CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
   CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
   ```

## ⛓ Blockchain Setup

1. **Local Development (Hardhat Network)**

   ```bash
   # Start local blockchain
   npx hardhat node

   # Deploy contracts (in another terminal)
   npx hardhat run scripts/deploy.js --network localhost
   ```

2. **Testnet Deployment (Sepolia)**

   ```bash
   # Deploy to Sepolia testnet
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. **Update Environment**

   After deployment, update `.env.local` with the contract address from the deployment output.

## 🚀 Development

1. **Start the development server**

   ```bash
   npm run dev
   ```

2. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Create an account or login
   - Start uploading and sharing files!

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── files/         # File management endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── FileGrid.tsx       # File display grid
│   ├── FileUploadModal.tsx# File upload modal
│   ├── LoginForm.tsx      # Authentication form
│   └── Sidebar.tsx        # Navigation sidebar
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── auth-middleware.ts # Authentication middleware
│   ├── blockchain.ts      # Blockchain interactions
│   ├── encryption.ts      # File encryption utilities
│   ├── ipfs.ts           # IPFS client
│   ├── supabase.ts       # Database client
│   └── utils.ts          # General utilities
└── types/                # TypeScript type definitions
    └── index.ts          # Application types

contracts/                # Smart contracts
├── FileAccessControl.sol # Main access control contract

scripts/                  # Deployment scripts
└── deploy.js            # Contract deployment script
```

## 🔒 Security Features

- **AES-256 Encryption**: All files encrypted before storage
- **Smart Contract Access Control**: Blockchain-based permissions
- **JWT Authentication**: Secure session management
- **Role-Based Authorization**: Granular access control
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Parameterized queries
- **HTTPS Enforcement**: Secure data transmission

## 📊 User Roles

### Student

- Upload personal documents
- Share files with lecturers
- View files shared with them
- Download accessible files

### Lecturer

- All student permissions
- Share files with students in their courses
- Access department files
- Manage student submissions

### Administrator

- All lecturer permissions
- User management capabilities
- System-wide file access
- Audit log viewing
- Permission management

## 🧪 Testing

```bash
# Run tests
npm test

# Run smart contract tests
npx hardhat test

# Code coverage
npm run coverage
```

## 📦 Deployment

### Frontend (Vercel)

1. Connect your repository to Vercel
2. Add environment variables
3. Deploy automatically on push

### Smart Contracts

```bash
# Deploy to mainnet (production)
npx hardhat run scripts/deploy.js --network mainnet
```

## 🐛 Troubleshooting

### Common Issues

1. **IPFS Connection Error**

   - Ensure IPFS node is running
   - Check IPFS configuration in `.env.local`

2. **Database Connection Error**

   - Verify Supabase credentials
   - Check database schema is created

3. **Smart Contract Deployment Failed**

   - Ensure you have sufficient testnet ETH
   - Check network configuration

4. **File Upload Fails**
   - Verify file size < 500MB
   - Check file type is supported
   - Ensure encryption is working

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review troubleshooting guide

## 🎯 Future Enhancements

- [ ] Mobile application
- [ ] Advanced audit dashboard
- [ ] File versioning system
- [ ] Collaborative editing
- [ ] Integration with university systems
- [ ] Advanced analytics
- [ ] Multi-language support

## 🏆 Project Goals Achieved

✅ **Blockchain Integration**: Smart contracts for access control  
✅ **IPFS Storage**: Decentralized file storage  
✅ **AES Encryption**: File security before upload  
✅ **Role-Based Access**: Student, Lecturer, Administrator roles  
✅ **Audit Logging**: On-chain activity tracking  
✅ **Modern UI**: Responsive, accessible interface  
✅ **File Management**: Upload, share, download, revoke  
✅ **Security**: Multiple layers of protection

---

**Built with ❤️ for secure, decentralized document sharing in educational institutions.**
# SecureShare
