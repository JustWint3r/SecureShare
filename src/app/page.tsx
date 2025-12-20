'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import PrivyLoginForm from '@/components/PrivyLoginForm';
import Dashboard from '@/components/Dashboard';
import UserProfileSetup from '@/components/UserProfileSetup';

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [userProfile, setUserProfile] = useState(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [syncRetries, setSyncRetries] = useState(0);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    // When user authenticates with Privy, we might want to sync with our database
    if (authenticated && user) {
      setSyncRetries(0); // Reset retry count
      setSyncError(null); // Reset error state
      syncUserWithDatabase();
    } else if (!authenticated) {
      // Clear user profile when logged out
      setUserProfile(null);
      setNeedsProfileSetup(false);
    }
  }, [authenticated, user]);

  const syncUserWithDatabase = async () => {
    try {
      console.log('Syncing user with database:', user?.id);

      // Sync Privy user with our Supabase database
      const response = await fetch('/api/auth/sync-privy-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privyId: user?.id,
          email: user?.email?.address,
          walletAddress: user?.wallet?.address,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User sync successful:', data.user);
        setUserProfile(data.user);

        // Check if user needs to complete profile setup
        // New users will have default names like email prefix or wallet suffix
        const isNewUser =
          !data.user.name ||
          data.user.name === user?.email?.address?.split('@')[0] ||
          data.user.name.startsWith('User_');

        setNeedsProfileSetup(isNewUser);
      } else {
        console.error(
          'User sync failed:',
          response.status,
          response.statusText
        );
        const errorData = await response.json();
        console.error('Error details:', errorData);

        // If sync fails, retry up to 3 times
        if (syncRetries < 3) {
          setSyncRetries((prev) => prev + 1);
          setTimeout(() => {
            console.log(`Retrying user sync... (attempt ${syncRetries + 1})`);
            syncUserWithDatabase();
          }, 2000);
        } else {
          setSyncError('Failed to sync user account. Please refresh the page.');
        }
      }
    } catch (error) {
      console.error('Error syncing user:', error);

      // Retry on network error
      if (syncRetries < 3) {
        setSyncRetries((prev) => prev + 1);
        setTimeout(() => {
          console.log(
            `Retrying user sync after error... (attempt ${syncRetries + 1})`
          );
          syncUserWithDatabase();
        }, 2000);
      } else {
        setSyncError(
          'Network error. Please check your connection and refresh the page.'
        );
      }
    }
  };

  const handleProfileSetupComplete = (updatedUser: any) => {
    setUserProfile(updatedUser);
    setNeedsProfileSetup(false);
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-3" style={{ borderColor: 'var(--border-default)' }}></div>
            <div className="absolute inset-0 rounded-full border-3 border-t-0 border-r-0 border-b-0 animate-spin" style={{ borderLeftColor: 'var(--accent-primary)' }}></div>
          </div>
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'Crimson Pro, serif' }}>Loading SecureShare</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>Initializing your secure workspace</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <PrivyLoginForm onLogin={login} />;
  }

  if (needsProfileSetup) {
    return (
      <UserProfileSetup user={user} onComplete={handleProfileSetupComplete} />
    );
  }

  // Show error state if sync failed
  if (syncError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center max-w-md card-elevated">
          <div className="relative w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(139, 58, 58, 0.1)' }}>
            <svg className="w-12 h-12" style={{ color: 'var(--error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Crimson Pro, serif' }}>Connection Error</h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>{syncError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-danger w-full"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Only render Dashboard when user is synced to database
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-3" style={{ borderColor: 'var(--border-default)' }}></div>
            <div className="absolute inset-0 rounded-full border-3 border-t-0 border-r-0 border-b-0 animate-spin" style={{ borderLeftColor: 'var(--accent-primary)' }}></div>
          </div>
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'Crimson Pro, serif' }}>
            Setting up your account
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Preparing your secure workspace
          </p>
          {syncRetries > 0 && (
            <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              Retry attempt {syncRetries}/3
            </p>
          )}
        </div>
      </div>
    );
  }

  return <Dashboard user={userProfile} privyUser={user} onLogout={logout} />;
}
