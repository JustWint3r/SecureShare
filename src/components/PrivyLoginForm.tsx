'use client';

import { Shield, BookOpen, Lock, Users, Mail, Wallet, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface PrivyLoginFormProps {
  onLogin: () => void;
}

export default function PrivyLoginForm({ onLogin }: PrivyLoginFormProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const features = [
    {
      icon: Lock,
      title: 'AES-256 Encryption',
      description: 'Military-grade security for all documents',
    },
    {
      icon: Shield,
      title: 'Blockchain Verified',
      description: 'Immutable audit trail on Ethereum',
    },
    {
      icon: BookOpen,
      title: 'Distributed Storage',
      description: 'IPFS decentralized file system',
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Tailored permissions for your institution',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="min-h-screen flex">
        {/* Left Panel - Branding & Information */}
        <motion.div
          className="hidden lg:flex lg:w-2/5 xl:w-1/2 flex-col justify-center p-16 relative"
          style={{ background: 'var(--accent-primary)' }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Decorative element */}
          <div
            className="absolute top-0 right-0 w-64 h-64 opacity-10"
            style={{
              background: 'radial-gradient(circle, white 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 max-w-xl">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Shield className="h-10 w-10 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h1
                  className="text-3xl font-semibold text-white"
                  style={{ fontFamily: 'Crimson Pro, serif' }}
                >
                  SecureShare
                </h1>
                <p className="text-white/70 text-sm mt-1">
                  Academic Document Management
                </p>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h2
              className="text-5xl font-semibold text-white mb-6 leading-tight"
              style={{ fontFamily: 'Crimson Pro, serif' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Secure Document Sharing
              <br />
              for Higher Education
            </motion.h2>

            <motion.p
              className="text-xl text-white/80 mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              Powered by blockchain technology and distributed storage,
              SecureShare provides unparalleled security and transparency for
              academic institutions.
            </motion.p>

            {/* Features */}
            <motion.div
              className="space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                >
                  <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-white/70 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Institution badge */}
            <motion.div
              className="mt-16 pt-8 border-t border-white/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.6 }}
            >
              <p className="text-white/60 text-sm">
                Trusted by universities worldwide
              </p>
              <p className="text-white/80 text-sm mt-2">
                Students • Lecturers • Administrators
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Authentication */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            className="w-full max-w-md"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile Logo */}
            <motion.div
              className="lg:hidden flex items-center justify-center gap-3 mb-12"
              variants={itemVariants}
            >
              <Shield className="h-10 w-10" style={{ color: 'var(--accent-primary)' }} />
              <h1
                className="text-3xl font-semibold"
                style={{ fontFamily: 'Crimson Pro, serif', color: 'var(--text-primary)' }}
              >
                SecureShare
              </h1>
            </motion.div>

            {/* Welcome Text */}
            <motion.div className="text-center mb-10" variants={itemVariants}>
              <h2
                className="text-3xl font-semibold mb-3"
                style={{ fontFamily: 'Crimson Pro, serif', color: 'var(--text-primary)' }}
              >
                Welcome Back
              </h2>
              <p style={{ color: 'var(--text-tertiary)' }}>
                Sign in to access your secure document vault
              </p>
            </motion.div>

            {/* Auth Card */}
            <motion.div className="card-elevated" variants={itemVariants}>
              {/* Login Methods */}
              <div className="space-y-4 mb-8">
                <motion.button
                  onClick={onLogin}
                  className="btn-primary w-full flex items-center justify-center gap-3 py-3.5"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">Continue with Email</span>
                </motion.button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full" style={{ borderTop: '1px solid var(--border-default)' }} />
                  </div>
                  <div className="relative flex justify-center">
                    <span
                      className="px-4 text-sm"
                      style={{
                        background: 'var(--surface-white)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      or
                    </span>
                  </div>
                </div>

                <motion.button
                  onClick={onLogin}
                  className="btn-secondary w-full flex items-center justify-center gap-3 py-3.5"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Wallet className="h-5 w-5" />
                  <span className="font-medium">Connect Wallet</span>
                </motion.button>
              </div>

              {/* Security Features */}
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-1.5 rounded-md flex-shrink-0"
                    style={{ background: 'rgba(26, 77, 128, 0.1)' }}
                  >
                    <Shield
                      className="h-5 w-5"
                      style={{ color: 'var(--accent-primary)' }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Enterprise Security Standards
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        'End-to-end AES-256 encryption',
                        'Ethereum blockchain verification',
                        'Immutable audit logging',
                        'Granular access controls',
                      ].map((item, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <Check
                            className="h-3.5 w-3.5 flex-shrink-0"
                            style={{ color: 'var(--success)' }}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="mt-8 text-center text-sm"
              style={{ color: 'var(--text-muted)' }}
              variants={itemVariants}
            >
              <p>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
              <p className="mt-3">
                Powered by{' '}
                <span style={{ color: 'var(--text-tertiary)' }}>Privy × Ethereum × IPFS</span>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
