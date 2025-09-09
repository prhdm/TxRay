"use client";

import { 
  Header,
  Footer
} from "@/ui";
import Image from "next/image";
import { NavigationProvider, useNavigation, type NavigationPage } from "@/features/navigation/lib/NavigationContext";
import { useAuth } from "@/features/auth/lib/AuthContext";
import { useNetworkSwitch } from "@/hooks/useNetworkSwitch";
import InventoryPage from "@/features/inventory/components/InventoryPage";
import AnalyticsPage from "@/features/analytics/components/AnalyticsPage";
import ProfilePage from "@/features/profile/components/ProfilePage";
import { useState, useRef, useCallback } from "react";

function AppContent() {
  const { currentPage, setCurrentPage } = useNavigation();
  const { authenticate, user, signOut, authFlowState, resetAuthFlow, startConnectionAttempt } = useAuth();
  const {
    switchToCorrectNetwork,
    isCorrectNetwork,
    isSwitching,
    targetChainName
  } = useNetworkSwitch();
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const lastAuthAttemptRef = useRef<number>(0);
  const authInProgressRef = useRef<boolean>(false);

  const handleWalletConnect = useCallback(() => {
    console.log("Wallet connect button clicked");
    // RainbowKit will handle the actual connection via the custom button
  }, []);

  const handleNetworkSwitch = useCallback(async () => {
    try {
      console.log("Switching to correct network...");
      setShowNetworkModal(false);
      const result = await switchToCorrectNetwork();
      if (result.success) {
        console.log("Network switched successfully!");
        // Continue with authentication after successful network switch
        // The useEffect in header will trigger handleAuthenticated again
      } else {
        console.error("Network switch failed:", result.error);
        // Reset auth flow on failure - no alert shown
        resetAuthFlow();
      }
    } catch (error) {
      console.error("Network switch error:", error);
      // Reset auth flow on error - no alert shown
      resetAuthFlow();
    }
  }, [switchToCorrectNetwork, resetAuthFlow]);

  const handleCancelNetworkSwitch = useCallback(() => {
    console.log("User cancelled network switch, current authFlowState:", authFlowState);
    setShowNetworkModal(false);
    console.log("Calling resetAuthFlow...");
    resetAuthFlow();
    console.log("resetAuthFlow called, authFlowState should now be 'idle'");
  }, [authFlowState, resetAuthFlow]);

  const handleAuthenticated = useCallback(async (address: string) => {
    const now = Date.now();
    console.log("🔍 handleAuthenticated called with address:", address, "authFlowState:", authFlowState, "user:", user, "isCorrectNetwork:", isCorrectNetwork);

    // Prevent multiple concurrent authentication attempts
    if (authInProgressRef.current) {
      console.log("❌ Authentication already in progress, skipping...");
      return;
    }

    // Prevent rapid successive calls (debounce)
    if (now - lastAuthAttemptRef.current < 2000) { // 2 second debounce
      console.log("❌ Too soon since last authentication attempt, skipping...");
      return;
    }
    lastAuthAttemptRef.current = now;

    // Prevent multiple simultaneous authentication attempts based on authFlowState
    if (authFlowState !== 'idle' && authFlowState !== 'connecting') {
      console.log("❌ Authentication already in progress (flow state), skipping...");
      return;
    }

    authInProgressRef.current = true;

    // Prevent authentication if user is already authenticated
    if (user && user.wallet_address === address) {
      console.log("✅ User already authenticated with this address, skipping...");
      authInProgressRef.current = false;
      return;
    }

    try {
      console.log("✅ Starting authentication flow for address:", address);

      // Update flow state to network check
      // Note: authFlowState is already 'connecting' from startConnectionAttempt

      // First check if we're on the correct network
      console.log("🔍 Checking network...", { isCorrectNetwork, targetChainName });
      if (!isCorrectNetwork) {
        console.log("Wrong network detected, showing network switch modal...");
        setShowNetworkModal(true);
        return;
      }

      console.log("🔐 Network correct, starting SIWE authentication...", address);
      const authResult = await authenticate(address);

      console.log("📋 Authentication result:", authResult);

      if (authResult.success) {
        console.log("🎉 Authentication successful!");
      } else {
        console.log("❌ Authentication failed:", authResult.error);
        // No alert shown for any authentication failure
        if (authResult.error && !authResult.error.includes('User cancelled') && !authResult.error.includes('User rejected') && !authResult.error.includes('User denied')) {
          console.log("🚨 Authentication error (no alert shown):", authResult.error);
        } else {
          console.log("👤 User cancelled/rejected authentication");
        }
        // Always reset auth flow on failure
        resetAuthFlow();
      }
    } catch (error) {
      console.error("💥 Authentication failed with error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log("🔍 Error message:", errorMessage);

      const isUserCancellation =
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('User cancelled') ||
        errorMessage.includes('User canceled') ||
        errorMessage.includes('rejected') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('canceled') ||
        errorMessage.includes('4001') ||
        errorMessage.includes('ACTION_REJECTED') ||
        errorMessage.includes('User rejected the request') ||
        errorMessage.includes('The user rejected the request');

      console.log("🔍 Is user cancellation:", isUserCancellation);

      // No alerts shown for any error - just log and reset
      if (isUserCancellation) {
        console.log("👤 User cancelled authentication");
      } else {
        console.log("🚨 Authentication error (no alert shown):", errorMessage);
      }

      // Always reset auth flow on error
      resetAuthFlow();
    } finally {
      authInProgressRef.current = false;
    }
  }, [authFlowState, user, isCorrectNetwork, authenticate, resetAuthFlow, targetChainName]);

  const handleLogout = useCallback(async () => {
    try {
      console.log("Logging out user...");
      await signOut();
      console.log("Logout successful!");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [signOut]);

  const handleProfileClick = useCallback(() => {
    console.log("Profile clicked - navigating to profile page");
    setCurrentPage('profile');
  }, [setCurrentPage]);


  const handleSubscribe = useCallback((email: string) => {
    console.log(`Subscribing email: ${email}`);
    // Add your newsletter subscription logic here
  }, []);

  const handlePrivacyPolicyClick = useCallback(() => {
    console.log("Privacy Policy clicked");
    // Add your privacy policy navigation logic here
  }, []);


  const handleNavigationChange = useCallback((page: string) => {
    setCurrentPage(page.toLowerCase() as NavigationPage);
  }, [setCurrentPage]);

  const renderCurrentPage = useCallback(() => {
    switch (currentPage) {
      case 'inventory':
        return <InventoryPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <InventoryPage />;
    }
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header
        logo={
          <Image
            src="/logo.svg"
            alt="Logo"
            width={100}
            height={100}
            className="w-12 h-12"
          />
        }
        brandName="logoipsum"
        navigationItems={[
          { label: "Inventory" },
          { label: "Analytics" }
        ]}
        activeNavigation={
          currentPage === 'inventory' ? 'Inventory' :
          currentPage === 'analytics' ? 'Analytics' :
          currentPage === 'profile' ? 'Profile' : undefined
        }
        onNavigationChange={handleNavigationChange}
        onWalletConnect={handleWalletConnect}
        onAuthenticated={handleAuthenticated}
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
        user={user ? {
          address: user.wallet_address || '',
          username: user.username
        } : null}
        authFlowState={authFlowState}
        onResetAuthFlow={resetAuthFlow}
        onStartConnectionAttempt={startConnectionAttempt}
      />

      {/* Network Switch Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background border border-foreground rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Switch Network</h3>
            <p className="text-foreground mb-6">
              To use this application, you need to switch to {targetChainName}. Would you like to switch now?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleCancelNetworkSwitch}
                className="flex-1 px-4 py-2 border border-foreground rounded-md bg-background text-foreground hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleNetworkSwitch}
                disabled={isSwitching}
                className="flex-1 px-4 py-2 bg-[#B9FF66] text-black rounded-md hover:bg-[#a8e85a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSwitching ? 'Switching...' : 'Switch Network'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Dynamic Page Content */}
      <div className="flex-1">
        {renderCurrentPage()}
      </div>

      {/* Footer */}
      <Footer
        logoText="logoipsum"
        contactEmail="info@txray.xyz"
        onSubscribe={handleSubscribe}
        onPrivacyPolicyClick={handlePrivacyPolicyClick}
      />
    </div>
  );
}

export default function RarityCollection() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}
