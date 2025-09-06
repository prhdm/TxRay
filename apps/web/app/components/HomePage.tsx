"use client";

import React from 'react';
import { Button } from '@txray/ui';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { setCurrentPage } = useNavigation();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      setCurrentPage('inventory');
    } else {
      // You could trigger wallet connection here, but for now just go to inventory
      setCurrentPage('inventory');
    }
  };

  const handleExploreFeatures = () => {
    setCurrentPage('inventory');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Welcome to <span className="text-[#B9FF66]">TxRay</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover, collect, and upgrade your rare digital assets in the ultimate NFT rarity collection experience.
              Mint, burn, and evolve your cards to unlock their full potential.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              onClick={handleGetStarted}
              className="px-8 py-4 text-lg font-semibold bg-[#B9FF66] text-black hover:bg-[#a8e85a] transition-all duration-200 shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5"
            >
              {user ? 'View Your Collection' : 'Get Started'}
            </Button>
            <Button
              onClick={handleExploreFeatures}
              variant="outline"
              className="px-8 py-4 text-lg font-semibold border-2 border-foreground hover:bg-foreground hover:text-background transition-all duration-200"
            >
              Explore Features
            </Button>
          </div>

          {/* Hero Image Placeholder */}
          <div className="relative max-w-md mx-auto">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#B9FF66]/20 to-[#191A23]/20 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden shadow-2xl">
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">🎴</div>
                <div className="text-lg font-medium">Your NFT Collection</div>
                <div className="text-sm opacity-75">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of NFT rarity collection with our cutting-edge features designed for collectors and traders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#B9FF66] rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Smart Minting</h3>
              <p className="text-muted-foreground">
                Mint rare NFTs with intelligent algorithms that ensure fair distribution and unique rarity combinations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#B9FF66] rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Token Upgrades</h3>
              <p className="text-muted-foreground">
                Combine and upgrade your tokens to unlock higher rarity levels and increase their value in the ecosystem.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#B9FF66] rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                Track your collection&apos;s performance, rarity distribution, and market trends with comprehensive analytics.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#B9FF66] rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Dynamic Theming</h3>
              <p className="text-muted-foreground">
                Experience cards with unique color schemes based on their rarity levels, making each token visually distinct.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#B9FF66] rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Secure Wallet Integration</h3>
              <p className="text-muted-foreground">
                Connect your wallet securely and manage your NFTs with industry-standard security protocols and SIWE authentication.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#B9FF66] rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">User Profiles</h3>
              <p className="text-muted-foreground">
                Create and customize your profile, showcase your collection, and connect with other collectors in the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#B9FF66]/10 to-[#191A23]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Start Your Collection?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of collectors who are already building their rare NFT portfolios with TxRay.
            Start minting, upgrading, and trading today.
          </p>
          <Button
            onClick={handleGetStarted}
            className="px-10 py-4 text-xl font-semibold bg-[#191A23] text-white hover:bg-[#2a2b2e] transition-all duration-200 shadow-[0_4px_0_0_#B9FF66] hover:shadow-[0_6px_0_0_#B9FF66] hover:-translate-y-0.5"
          >
            {user ? 'Explore Your Collection' : 'Start Collecting'}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
