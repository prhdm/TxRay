"use client";

import { 
  Header,
  Footer
} from "@txray/ui";
import Image from "next/image";
import { NavigationProvider, useNavigation } from "../contexts/NavigationContext";
import InventoryPage from "./InventoryPage";
import AnalyticsPage from "./AnalyticsPage";

function AppContent() {
  const { currentPage, setCurrentPage } = useNavigation();

  const handleWalletConnect = () => {
    console.log("Wallet connect button clicked");
    // RainbowKit will handle the actual connection via the custom button
  };


  const handleSubscribe = (email: string) => {
    console.log(`Subscribing email: ${email}`);
    // Add your newsletter subscription logic here
  };

  const handlePrivacyPolicyClick = () => {
    console.log("Privacy Policy clicked");
    // Add your privacy policy navigation logic here
  };

  const handleNavigationChange = (page: string) => {
    setCurrentPage(page as 'inventory' | 'analytics');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'inventory':
        return <InventoryPage />;
      case 'analytics':
        return <AnalyticsPage />;
      default:
        return <InventoryPage />;
    }
  };

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
        activeNavigation={currentPage === 'inventory' ? 'Inventory' : 'Analytics'}
        onNavigationChange={handleNavigationChange}
        onWalletConnect={handleWalletConnect}
      />

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
