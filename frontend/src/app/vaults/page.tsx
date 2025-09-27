"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StreamHeader } from "@/components/darwin/StreamHeader";
import { FeaturedVaultCard } from "@/components/darwin/FeaturedVaultCard";
import { VaultRow } from "@/components/darwin/VaultRow";
import { VaultFilters } from "@/components/darwin/VaultFilters";
import { SiteFooter } from "@/components/darwin/SiteFooter";
import { TallVaultCard } from "@/components/darwin/TallVaultCard";
import { StatusAwareVaultCard } from "@/components/darwin/StatusAwareVaultCard";
import { VaultDetailOverlay } from "@/components/darwin/VaultDetailOverlay";

interface VaultConfig {
  id: string;
  name: string;
  description: string;
  tokenMint: string;
  distributionWallet: string;
  treasuryWallet: string;
  devWallet: string;
  startDate: string;
  endgameDate: string;
  timerDuration: number;
  distributionInterval: number;
  minHoldAmount: number;
  taxSplit: { dev: number; holders: number };
  vaultAsset: string;
  airdropAsset: string;
  status: 'draft' | 'active' | 'paused' | 'ended' | 'pre_ico' | 'ico' | 'ico_pending' | 'pre_launch' | 'live' | 'winner_confirmation' | 'endgame_processing' | 'extinct';
  meta?: {
    ticker?: string;
    logoUrl?: string;
    bannerUrl?: string;
    icoProposedAt?: string;
    icoEndsAt?: string;
    supplyIntended?: string;
    bidMultiplier?: number;
    vaultLifespanDays?: number;
    minBuyToReset?: number;
    airdropInterval?: number;
    airdropMode?: string;
    splits?: {
      creator?: number;
      treasury?: number;
      airdrops?: number;
      darwin?: number;
    };
    links?: {
      x?: string;
      website?: string;
    };
    icoThresholdUsd?: number;
  };
  whitelistedAddresses: string[];
  createdAt: string;
  updatedAt: string;
}

export default function Page() {
  const router = useRouter();
  const [vaults, setVaults] = useState<VaultConfig[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [sort, setSort] = useState<string>("Time Remaining");
  const [showToast, setShowToast] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selectedVault, setSelectedVault] = useState<VaultConfig | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [visibleVaults, setVisibleVaults] = useState(10); // Limit initial render for performance
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com';
  
  // Cache duration: 5 seconds to reduce API calls
  const CACHE_DURATION = 5000;

  useEffect(() => {
    loadVaults();
    loadDashboardData();
    
    // Listen for mobile menu How it Works trigger
    const handleShowHowItWorks = () => setShowHowItWorksModal(true);
    window.addEventListener('showHowItWorks', handleShowHowItWorks);
    
    return () => {
      window.removeEventListener('showHowItWorks', handleShowHowItWorks);
    };
  }, []);

  // Featured card rotation every 5 seconds
  useEffect(() => {
    if (vaults.length > 1) {
      const timer = setInterval(() => {
        setFeaturedIndex((prev) => (prev + 1) % vaults.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [vaults.length]);

  // Real-time timer updates - reduced frequency to prevent crashes
  useEffect(() => {
    if (!dashboardData?.timer?.timeLeft && !dashboardData?.vault?.airdrop?.nextAirdropIn) return;
    
    const interval = setInterval(() => {
      setDashboardData((prevData: any) => {
        if (!prevData) return prevData;
        
        let updates = {};
        
        // Update main timer
        if (prevData.timer?.timeLeft) {
          const newTimeLeft = Math.max(0, prevData.timer.timeLeft - 1);
          updates = {
            ...updates,
            timer: {
              ...prevData.timer,
              timeLeft: newTimeLeft
            }
          };
        }
        
        // Update airdrop countdown
        if (prevData.vault?.airdrop?.nextAirdropIn) {
          const newAirdropTime = Math.max(0, prevData.vault.airdrop.nextAirdropIn - 1);
          updates = {
            ...updates,
            vault: {
              ...prevData.vault,
              airdrop: {
                ...prevData.vault.airdrop,
                nextAirdropIn: newAirdropTime
              }
            }
          };
        }
        
        return {
          ...prevData,
          ...updates
        };
      });
    }, 5000); // Reduced from 1000ms to 5000ms to prevent crashes

    return () => clearInterval(interval);
  }, [dashboardData?.timer?.timeLeft, dashboardData?.vault?.airdrop?.nextAirdropIn]);

  const loadVaults = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/vaults`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        setVaults(data.vaults);
        setError(null);
      } else {
        setError(`Failed to load vaults: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to load vaults:', error);
      setError(`Failed to load vaults: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/dashboard`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } else {
        setError(`Failed to load dashboard data: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const featuredVault = vaults[featuredIndex] || vaults[0];

  // Handle vault view actions
  const handleVaultView = (vault: VaultConfig) => {
    if (vault.status === 'active') {
      // For live vaults, navigate to separate page
      router.push(`/vault/${vault.id}`);
    } else {
      // For non-live vaults, show overlay
      setSelectedVault(vault);
      setIsOverlayOpen(true);
    }
  };

  const closeOverlay = () => {
    setIsOverlayOpen(false);
    setSelectedVault(null);
  };

  // Format timer for display
  const formatTimer = (timeLeft: number) => {
    if (!timeLeft || isNaN(timeLeft)) return "00:00";
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format treasury for display
  const formatTreasury = (treasury: number) => {
    if (!treasury || isNaN(treasury) || treasury <= 0) return "N/A";
    return `$${(treasury / 1000000).toFixed(1)}M`;
  };

  // Format price for display
  const formatPrice = (price: number) => {
    if (!price || isNaN(price) || price <= 0) return "N/A";
    return `$${price.toFixed(4)}`;
  };

  // Format airdrop time
  const formatAirdropTime = (timeLeft: number) => {
    if (!timeLeft || isNaN(timeLeft)) return "00:00";
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center"
        style={{
          background: "radial-gradient(1100px 520px at 50% -8%, rgba(92,120,255,.14), transparent 60%), radial-gradient(900px 420px at 90% 6%, rgba(28,189,136,.10), transparent 55%), rgb(8,10,22)",
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading vaults...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center"
        style={{
          background: "radial-gradient(1100px 520px at 50% -8%, rgba(92,120,255,.14), transparent 60%), radial-gradient(900px 420px at 90% 6%, rgba(28,189,136,.10), transparent 55%), rgb(8,10,22)",
        }}
      >
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={loadVaults} className="text-white border border-white/20 px-4 py-2 rounded">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        background:
          "linear-gradient(180deg, rgba(6,24,18,.55) 0%, rgba(4,20,16,.65) 45%, rgba(3,15,12,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed",
      }}
    >
      <StreamHeader />

      {/* Mobile: Darwin Vaults Section with Pill Filters */}
      <div className="mx-auto max-w-7xl px-4 pt-6 mb-6 lg:hidden">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-white">Darwin Vaults</h2>
          </div>
          
          {/* Mobile: Filter buttons with glowing underline */}
          <div className="flex flex-wrap gap-2">
            {["All", "Live Vaults", "ICO Live", "Pre-ICO", "Pre-Launch", "Winner", "Endgame", "Extinct"].map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 relative ${
                  filter === option
                    ? 'text-white border-b-2 border-emerald-500'
                    : 'text-white/70 hover:text-white hover:border-b-2 hover:border-white/30'
                }`}
                style={{
                  textShadow: filter === option ? '0 0 12px rgba(52,211,153,0.8)' : 'none',
                  backgroundColor: 'transparent',
                  boxShadow: 'none'
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Featured Card - Original */}
      <section className="mx-auto max-w-7xl px-4 pt-6 hidden lg:block">
        {featuredVault && (
          <StatusAwareVaultCard
            vault={featuredVault}
            variant="featured"
            onClickTitle={() => handleVaultView(featuredVault)}
            onTrade={() => handleVaultView(featuredVault)}
          />
        )}
      </section>

      {/* Desktop: Darwin Vaults controls (below featured only on desktop) */}
      <div className="mx-auto max-w-7xl px-4 mt-12 mb-6 hidden lg:block">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold tracking-tight text-white">Darwin Vaults</h2>
          {/* Desktop: Filter buttons with glowing underline */}
          <div className="flex flex-wrap gap-2">
            {["All", "Live Vaults", "ICO Live", "Pre-ICO", "Pre-Launch", "Winner", "Endgame", "Extinct"].map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 relative ${
                  filter === option
                    ? 'text-white border-b-2 border-emerald-500'
                    : 'text-white/70 hover:text-white hover:border-b-2 hover:border-white/30'
                }`}
                style={{
                  textShadow: filter === option ? '0 0 12px rgba(52,211,153,0.8)' : 'none',
                  backgroundColor: 'transparent',
                  boxShadow: 'none'
                }}
              >
                {option}
              </button>
            ))}
          </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-none bg-white/10 p-1 ring-1 ring-white/10 h-[36px]">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="2"/><rect x="2" y="7" width="12" height="2"/><rect x="2" y="11" width="12" height="2"/></svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="4" height="4"/><rect x="10" y="2" width="4" height="4"/><rect x="2" y="10" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Featured Card - New Style */}
      <section className="px-4 mb-6 lg:hidden">
        {featuredVault && (
          <StatusAwareVaultCard
            vault={featuredVault}
            variant="featured"
            onClickTitle={() => handleVaultView(featuredVault)}
            onTrade={() => handleVaultView(featuredVault)}
          />
        )}
      </section>

      {/* Mobile Vault List */}
      <div className="px-4 mb-6 lg:hidden space-y-4">
        {vaults
          .filter(v => {
            if (filter === 'All') return true;
            if (filter === 'Live Vaults') return (v.status as any) === 'active';
            if (filter === 'ICO Live') return (v.status as any) === 'ico';
            if (filter === 'Pre-ICO') return (v.status as any) === 'pre_ico' || (v.status as any) === 'draft';
            if (filter === 'Pre-Launch') return (v.status as any) === 'pre_launch' || (v.status as any) === 'countdown';
            if (filter === 'Winner') return (v.status as any) === 'winner_confirmation';
            if (filter === 'Endgame') return (v.status as any) === 'endgame_processing';
            if (filter === 'Extinct') return (v.status as any) === 'extinct' || (v.status as any) === 'ended';
            return true;
          })
          .slice(0, visibleVaults)
          .map((vault) => (
          <StatusAwareVaultCard
            key={vault.id}
            vault={vault}
            variant="row"
            onTrade={() => handleVaultView(vault)}
            onClickTitle={() => handleVaultView(vault)}
          />
        ))}
      </div>


      {/* Desktop Vault List - Hidden on Mobile */}
      <div className={`mx-auto max-w-7xl px-4 hidden lg:block ${viewMode==='grid' ? 'grid grid-cols-3 gap-4' : 'space-y-3 sm:space-y-4'}`} style={{ display: viewMode === 'grid' ? 'grid' : 'block' }}>
        {vaults
          .filter(v => {
            if (filter === 'All') return true;
            if (filter === 'Live Vaults') return (v.status as any) === 'active';
            if (filter === 'ICO Live') return (v.status as any) === 'ico';
            if (filter === 'Pre-ICO') return (v.status as any) === 'pre_ico' || (v.status as any) === 'draft';
            if (filter === 'Pre-Launch') return (v.status as any) === 'pre_launch' || (v.status as any) === 'countdown';
            if (filter === 'Winner') return (v.status as any) === 'winner_confirmation';
            if (filter === 'Endgame') return (v.status as any) === 'endgame_processing';
            if (filter === 'Extinct') return (v.status as any) === 'extinct' || (v.status as any) === 'ended';
            return true;
          })
          .slice(0, visibleVaults)
          .map((vault) => (
          <StatusAwareVaultCard
            key={vault.id}
            vault={vault}
            variant={viewMode === 'list' ? 'row' : 'tall'}
            onTrade={() => handleVaultView(vault)}
            onClickTitle={() => handleVaultView(vault)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {vaults.filter(v => {
        if (filter === 'All') return true;
        if (filter === 'Live Vaults') return (v.status as any) === 'active';
        if (filter === 'ICO Live') return (v.status as any) === 'ico';
        if (filter === 'Pre-ICO') return (v.status as any) === 'pre_ico' || (v.status as any) === 'draft';
        if (filter === 'Pre-Launch') return (v.status as any) === 'pre_launch' || (v.status as any) === 'countdown';
        if (filter === 'Extinct') return (v.status as any) === 'extinct' || (v.status as any) === 'ended';
        return true;
      }).length > visibleVaults && (
        <div className="text-center mt-8">
          <button
            onClick={() => setVisibleVaults(prev => prev + 10)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-500 transition-all duration-200"
          >
            Load More Vaults
          </button>
        </div>
      )}

      <SiteFooter />


      {/* Modal overlay */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70" onClick={() => setShowHowItWorksModal(false)}>
          <div className="relative w-[90vw] max-w-2xl rounded-none ring-1 ring-white/10 bg-white/5 backdrop-blur-[12px] p-6 text-white" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-3 top-3 rounded-none bg-white/10 px-2 py-1 text-sm hover:bg-white/15" onClick={() => setShowHowItWorksModal(false)}>✕</button>
            <div className="text-2xl font-bold">How it Works</div>
            <p className="mt-3 text-white/85">Each vault runs a countdown. Any valid buy resets the timer and grows the treasury. When the timer hits zero, the last buyer wins the endgame. Holders share airdrops along the way.</p>
          </div>
        </div>
      )}
      
      {/* Vault Detail Overlay */}
      <VaultDetailOverlay 
        vault={selectedVault}
        isOpen={isOverlayOpen}
        onClose={closeOverlay}
      />
    </div>
  );
}