# SecureShare - Blockchain-Based Document Sharing System

> Enhancing Document Sharing System Using Blockchain and IPFS Among University Students in Malaysia

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636)](https://soliditylang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Smart Contracts](#smart-contracts)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

SecureShare is a decentralized document sharing platform designed specifically for university students in Malaysia. It addresses critical limitations in existing academic file-sharing systems by leveraging blockchain technology and IPFS (InterPlanetary File System) to provide:

- **End-to-End Encryption** using AES-256-CBC
- **Decentralized Storage** via IPFS (Storacha/Web3.Storage)
- **Immutable Audit Trail** on Ethereum blockchain
- **Smart Contract-Based Access Control**
- **Complete Traceability** for all file operations

### SDG Alignment

This project contributes to **UN Sustainable Development Goal 9: Industry, Innovation and Infrastructure** by enhancing educational infrastructure through innovative blockchain technology.

## ✨ Features

### Core Functionality

- **Secure File Upload & Storage**
  - AES-256-CBC encryption before upload
  - Decentralized storage on IPFS
  - Support for PDF, Word, Excel, PowerPoint files
  - Maximum file size: 500MB

- **Advanced Sharing Capabilities**
  - Granular permission levels (Read, Write, Share)
  - Tokenized share links
  - Direct user-to-user sharing
  - Permission revocation

- **Blockchain Integration**
  - All operations logged on-chain
  - Immutable transaction history
  - Smart contract-enforced access control
  - On-chain file metadata

- **Comprehensive Audit Logs**
  - Complete activity tracking
  - Persistent logs (survive file deletion)
  - Filter by action, user, file
  - Export capabilities

### User Roles

1. **Student**
   - Upload and manage personal files
   - Share files with peers
   - Access shared files
   - View personal audit logs

2. **Lecturer**
   - All student capabilities
   - Share course materials
   - Manage department files
   - View department activity

3. **Administrator**
   - Full system access
   - User management
   - System-wide audit logs
   - Inquiry management

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Headless UI, Lucide Icons
- **State Management**: React Hooks
- **Authentication**: Privy (Web3 Auth)

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **File Storage**: IPFS (Storacha) + Supabase Storage (fallback)
- **Encryption**: Node.js Crypto (AES-256-CBC)

### Blockchain
- **Smart Contracts**: Solidity 0.8.19
- **Development Framework**: Hardhat
- **Libraries**: OpenZeppelin Contracts
- **Blockchain**: Ethereum (Local Hardhat / Sepolia Testnet)
- **Web3 Provider**: ethers.js v6

### Development Tools
- **Package Manager**: npm
- **Linter**: ESLint
- **Code Formatter**: Prettier (via ESLint)
- **Version Control**: Git

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  File Grid   │  │  Audit Logs  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  /api/files  │  │ /api/users   │  │/api/audit-logs│     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────┬────────────────────┬─────────────────┬──────────────┘
        │                    │                 │
        ▼                    ▼                 ▼
┌──────────────┐    ┌──────────────┐   ┌─────────────────┐
│   Supabase   │    │     IPFS     │   │   Blockchain    │
│  (Database)  │    │  (Storacha)  │   │   (Ethereum)    │
│              │    │              │   │                 │
│ - Users      │    │ - Encrypted  │   │ - Smart         │
│ - Files      │    │   Files      │   │   Contracts     │
│ - Logs       │    │ - CID Refs   │   │ - Events        │
│ - Permissions│    │              │   │ - Transactions  │
└──────────────┘    └──────────────┘   └─────────────────┘
```

### Data Flow: File Upload

```
1. User selects file → 2. Frontend validates (size, type)
                              ↓
3. Generate AES-256 key → 4. Encrypt file data
                              ↓
5. Upload to IPFS → 6. Receive CID (Content Identifier)
                              ↓
7. Store metadata in Supabase (CID + encrypted key)
                              ↓
8. Log transaction on blockchain → 9. Return success to user
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Supabase account
- Storacha/Web3.Storage account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/secureshare.git
   cd secureshare
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your credentials (see [Environment Variables](#environment-variables))

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the database schema setup (available in your Supabase dashboard)
   - Tables needed: `users`, `files`, `access_logs`, `file_permissions`, `share_tokens`, `admin_inquiries`, `inquiry_replies`

5. **Start local blockchain (optional for development)**
   ```bash
   npx hardhat node
   ```

6. **Deploy smart contracts**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   # Or for Sepolia testnet:
   # npx hardhat run scripts/deploy.js --network sepolia
   ```
   Copy the contract address to your `.env.local`

7. **Run development server**
   ```bash
   npm run dev
   ```

8. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Blockchain Configuration
NEXT_PUBLIC_ETHEREUM_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
PRIVATE_KEY=your_wallet_private_key

# IPFS Configuration (Storacha)
STORACHA_EMAIL=your_email@example.com
NEXT_PUBLIC_IPFS_GATEWAY=https://w3s.link/ipfs

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Required Services Setup

1. **Supabase**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Get API keys from Settings → API

2. **Privy**
   - Sign up at [privy.io](https://privy.io)
   - Create a new app
   - Get App ID from dashboard

3. **Storacha (IPFS)**
   - Sign up at [web3.storage](https://web3.storage)
   - Verify your email
   - Use your email in `STORACHA_EMAIL`

## 📖 Usage

### For Students

1. **Upload a File**
   - Click "Upload File" button
   - Select a document (PDF, Word, Excel, PowerPoint)
   - Add optional description
   - File is automatically encrypted and uploaded to IPFS

2. **Share a File**
   - Click the share icon on any file
   - Choose permission level (Read/Write/Share)
   - Generate a share link or select specific users
   - Share the link via any channel

3. **Download a File**
   - Click the download icon
   - File is automatically decrypted after download

4. **View Audit Logs**
   - Navigate to "Audit Logs" in sidebar
   - See all your file operations
   - Filter by action type or search

### For Administrators

1. **User Management**
   - Navigate to "User Management"
   - View all registered users
   - Change user roles
   - Search and filter users

2. **System Audit Logs**
   - View all system-wide activity
   - Filter by user, file, or action
   - Export logs for compliance

3. **Inquiry Management**
   - Review user inquiries
   - Respond to questions
   - Track inquiry status

## 📜 Smart Contracts

### FileAccessControl.sol

Main smart contract managing file operations and access control.

**Key Functions:**

```solidity
// Register a new user
function registerUser(
    address userAddress,
    UserRole role,
    string memory email,
    string memory name
) external onlyOwner

// Upload a file
function uploadFile(
    string memory fileId,
    string memory ipfsHash,
    string memory fileName,
    uint256 fileSize
) external onlyRegisteredUser

// Grant file permission
function grantPermission(
    string memory fileId,
    address user,
    PermissionType permissionType
) external

// Revoke file permission
function revokePermission(
    string memory fileId,
    address user
) external

// Log file access
function logFileAccess(
    string memory fileId,
    AccessAction action,
    string memory ipAddress,
    string memory userAgent
) external

// Delete a file
function deleteFile(string memory fileId) external
```

**Events:**

```solidity
event UserRegistered(address indexed userAddress, UserRole role, string email, string name);
event FileUploaded(string indexed fileId, string ipfsHash, address indexed owner, string fileName, uint256 fileSize);
event PermissionGranted(string indexed fileId, address indexed user, PermissionType permissionType, address indexed grantedBy);
event PermissionRevoked(string indexed fileId, address indexed user, address indexed revokedBy);
event AccessLogged(uint256 indexed logId, string indexed fileId, address indexed user, AccessAction action, uint256 timestamp);
event FileDeleted(string indexed fileId, address indexed owner);
```

### Deployment

```bash
# Local development
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

## 🔒 Security

### Encryption

- **Algorithm**: AES-256-CBC
- **Key Management**: Unique key per file, stored encrypted in database
- **IV**: Random 16-byte initialization vector per file
- **Key Derivation**: Cryptographically secure random generation

### Access Control

- **Authentication**: Privy Web3 authentication
- **Authorization**: Role-based access control (RBAC)
- **Database**: Row Level Security (RLS) policies
- **Smart Contracts**: On-chain permission validation

### Data Protection

- **Files**: Encrypted before IPFS upload
- **Metadata**: Stored in secure Supabase database
- **Logs**: Immutable blockchain records
- **API**: Server-side validation and sanitization

### Best Practices

- Never commit `.env.local` file
- Rotate private keys regularly
- Use strong Supabase RLS policies
- Validate all user inputs
- Sanitize file uploads
- Implement rate limiting for production

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- audit-logs

# Run with coverage
npm run test:coverage

# Smart contract tests
npx hardhat test

# Smart contract test coverage
npx hardhat coverage
```

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Deploy to Other Platforms

The project can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- Render
- DigitalOcean App Platform

Ensure all environment variables are configured on your deployment platform.

## 📁 Project Structure

```
secureshare/
├── contracts/              # Solidity smart contracts
│   └── FileAccessControl.sol
├── scripts/               # Deployment and utility scripts
│   ├── deploy.js
│   └── register-user.js
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/         # API routes
│   │   ├── page.tsx     # Home page
│   │   └── layout.tsx   # Root layout
│   ├── components/       # React components
│   │   ├── Dashboard.tsx
│   │   ├── FileGrid.tsx
│   │   ├── AuditLogsPage.tsx
│   │   └── ...
│   ├── lib/             # Utility libraries
│   │   ├── blockchain.ts
│   │   ├── encryption.ts
│   │   ├── ipfs.ts
│   │   └── supabase.ts
│   └── types/           # TypeScript types
├── public/              # Static assets
├── hardhat.config.ts    # Hardhat configuration
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Use meaningful variable and function names
- Write clear comments for complex logic
- Ensure all tests pass before submitting PR
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Wint3r** - *Initial work* - [GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- **OpenZeppelin** - Smart contract libraries
- **Supabase** - Database and authentication
- **IPFS/Storacha** - Decentralized storage
- **Privy** - Web3 authentication
- **Hardhat** - Ethereum development environment
- **Next.js Team** - Amazing React framework
- **Vercel** - Deployment platform

## 📞 Support

For support, email justwint3r@gmail.com or create an issue in the GitHub repository.

## 🗺 Roadmap

- [ ] Mobile app (React Native)
- [ ] File versioning
- [ ] Collaborative editing
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with university LMS
- [ ] Automated backup system
- [ ] File expiry and auto-delete
- [ ] Email notifications
- [ ] Advanced search with filters

## 📊 Project Status

**Current Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: January 2026

---

**Built with ❤️ for University Students in Malaysia**
