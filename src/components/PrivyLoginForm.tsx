'use client';

import { Shield, FileText, Users, Lock, Wallet, Mail } from 'lucide-react';

interface PrivyLoginFormProps {
  onLogin: () => void;
}

export default function PrivyLoginForm({ onLogin }: PrivyLoginFormProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Panel - Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex-col justify-center">
          <div className="text-white">
            <div className="flex items-center mb-8">
              <Shield className="h-10 w-10 mr-3" />
              <h1 className="text-3xl font-bold">SecureShare</h1>
            </div>

            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Blockchain-Powered Document Sharing
            </h2>

            <p className="text-xl mb-8 text-indigo-100 leading-relaxed">
              Experience the future of secure document sharing with
              decentralized storage, smart contract access control, and Web3
              authentication.
            </p>

            <div className="space-y-6">
              <div className="flex items-start">
                <FileText className="h-6 w-6 mr-4 mt-1 text-indigo-200" />
                <div>
                  <h3 className="font-semibold text-lg">IPFS Storage</h3>
                  <p className="text-indigo-200">
                    Decentralized file storage with AES encryption
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Lock className="h-6 w-6 mr-4 mt-1 text-indigo-200" />
                <div>
                  <h3 className="font-semibold text-lg">Smart Contracts</h3>
                  <p className="text-indigo-200">
                    Blockchain-based access control and permissions
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Users className="h-6 w-6 mr-4 mt-1 text-indigo-200" />
                <div>
                  <h3 className="font-semibold text-lg">Role-Based Access</h3>
                  <p className="text-indigo-200">
                    Student, Lecturer, and Administrator roles
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Wallet className="h-6 w-6 mr-4 mt-1 text-indigo-200" />
                <div>
                  <h3 className="font-semibold text-lg">Web3 Authentication</h3>
                  <p className="text-indigo-200">
                    Secure login with email or crypto wallet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to SecureShare
              </h2>
              <p className="text-gray-600">
                Sign in with your email or connect your wallet to get started
              </p>
            </div>

            {/* Login Options */}
            <div className="space-y-4">
              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center px-6 py-4 border-2 border-indigo-600 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 hover:border-indigo-700 transition-colors font-medium shadow-md"
              >
                <Mail className="h-5 w-5 mr-3" />
                Sign in with Email
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium shadow-sm"
              >
                <Wallet className="h-5 w-5 mr-3" />
                Connect Wallet
              </button>
            </div>

            {/* Features List */}
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Powered by Web3 Technology</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Privy authentication for secure login</li>
                    <li>• Files encrypted with AES-256 encryption</li>
                    <li>• Stored on decentralized IPFS network</li>
                    <li>• Access control via Ethereum smart contracts</li>
                    <li>• Complete audit trail on blockchain</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* University Notice */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Designed for university document sharing</p>
              <p className="mt-1">Students • Lecturers • Administrators</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






