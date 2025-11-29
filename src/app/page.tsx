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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading SecureShare...</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full h-32 w-32 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Sync Error</h2>
          <p className="text-red-600 mb-4">{syncError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">
            Setting up your account...
          </p>
          {syncRetries > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Retry attempt {syncRetries}/3
            </p>
          )}
        </div>
      </div>
    );
  }

  return <Dashboard user={userProfile} privyUser={user} onLogout={logout} />;
}
