"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StreamHeader } from "@/components/darwin/StreamHeader";
import { FeaturedVaultCard } from "@/components/darwin/FeaturedVaultCard";
import { VaultRow } from "@/components/darwin/VaultRow";
import { VaultFilters } from "@/components/darwin/VaultFilters";
import { SiteFooter } from "@/components/darwin/SiteFooter";
import { TallVaultCard } from "@/components/darwin/TallVaultCard";

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
  status: 'draft' | 'active' | 'paused' | 'ended';
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

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com';

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

  // Real-time timer updates
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
    }, 1000);

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
      } else {
        setError('Failed to load vaults');
      }
    } catch (error) {
      console.error('Failed to load vaults:', error);
      setError('Failed to load vaults');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data from:', `${BACKEND_URL}/api/dashboard`);
      
      const response = await fetch(`${BACKEND_URL}/api/dashboard`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard data loaded:', data);
        console.log('Timer data:', data.timer);
        console.log('Vault data:', data.vault);
        console.log('Token data:', data.token);
        console.log('Full data structure:', JSON.stringify(data, null, 2));
        setDashboardData(data);
        setError(null);
      } else {
        console.error('Failed to load dashboard data:', response.status, response.statusText);
        setError(`Failed to load dashboard data: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const featuredVault = vaults.find(vault => (vault.status as any) === 'active' || (vault.status as any) === 'pre_ico') || vaults[0];

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
          
          {/* Mobile: Pill-shaped filter buttons */}
          <div className="flex flex-wrap gap-2">
            {["All", "Live Vaults", "ICO in Progress", "ICO Now", "Countdown", "Extinct Vaults"].map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  filter === option
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
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
          <FeaturedVaultCard
            imageUrl="/images/ChatGPT Image Aug 13, 2025, 05_54_57 PM.png"
            title={featuredVault.name}
            subtitle="The OG Vault — precision chaos in every scratch"
            tokenTicker={featuredVault.airdropAsset || "REVS"}
            addressShort={featuredVault.tokenMint ? `${featuredVault.tokenMint.slice(0, 6)}...${featuredVault.tokenMint.slice(-4)}` : "07xbv8..."}
            tokenPfpUrl="/images/token.png"
            vaultAssetIconSrc="/images/Solana_logo.png"
            tokenBadgeText="REVS"
            tokenBadgeClassName="bg-emerald-500 text-black"
            stats={[
              { label: "Price", value: formatPrice(dashboardData?.token?.price || dashboardData?.vault?.tokenPrice) },
              { label: "Vault Asset", value: featuredVault.vaultAsset || "REVS" },
              { label: "Treasury", value: formatTreasury(dashboardData?.vault?.treasury) },
              { label: "Potential Win", value: dashboardData?.vault?.potentialWinnings?.multiplier ? `${dashboardData.vault.potentialWinnings.multiplier}×` : "100×" },
              { label: "APY*", value: "N/A" },
            ]}
            timer={{ value: formatTimer(dashboardData?.timer?.timeLeft) }}
            winnerAddressShort={dashboardData?.timer?.lastBuyerAddress ? `${dashboardData.timer.lastBuyerAddress.slice(0, 6)}...${dashboardData.timer.lastBuyerAddress.slice(-4)}` : undefined}
            endgameDays={dashboardData?.vault?.endgame?.daysLeft}
            xUrl="https://x.com/elonmusk"
            aspect="3/1"
            onClickTitle={() => router.push(`/vault/${featuredVault.id}`)}
            onTrade={() => router.push(`/vault/${featuredVault.id}`)}
          />
        )}
      </section>

      {/* Desktop: Darwin Vaults controls (below featured only on desktop) */}
      <div className="mx-auto max-w-7xl px-4 mt-12 mb-6 hidden lg:block">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold tracking-tight text-white">Darwin Vaults</h2>
          <VaultFilters active={filter} onChange={setFilter} />
          <div className="text-white/70 text-sm">{filter === 'ICO in Progress' ? 'Pre‑ICO' : ''}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                className="rounded-none bg-white/10 text-white/90 text-sm pl-3 pr-8 py-2 ring-1 ring-white/10 appearance-none h-[36px]"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {(["Time Remaining","Largest Treasury","Highest APY","Highest BID:WIN","Highest Volume","Nearest Endgame","Trade Fee"]
                  .filter(opt => !["ICO in Progress","Extinct Vaults"].includes(filter) || ["Largest Treasury","Trade Fee"].includes(opt))
                  .map(opt => (<option key={opt}>{opt}</option>)))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-white/60">
                  <path d="M6 8L2 4h8L6 8z"/>
                </svg>
              </div>
            </div>
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
          <div className="relative w-full h-[75vh] sm:h-[70vh] md:h-[65vh] max-w-[1100px] mx-auto rounded-lg ring-1 ring-white/10 overflow-hidden">
            {/* Top: PFP, title, address, ticker, and timer */}
            <div className="relative p-3 sm:p-4 bg-white/5 backdrop-blur-[10px] border-b border-white/10">
              {/* Banner image behind top section */}
              <div className="absolute inset-0">
                <img 
                  src="/images/ChatGPT Image Aug 13, 2025, 05_54_57 PM.png" 
                  alt={featuredVault.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
              </div>
              
              {/* Content overlay */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <img 
                    src="/images/token.png" 
                    alt={featuredVault.name} 
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-md object-cover border border-white/10 bg-white flex-shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-lg font-bold text-white truncate">{featuredVault.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-white/70 truncate">
                        {featuredVault.tokenMint ? `${featuredVault.tokenMint.slice(0, 6)}...${featuredVault.tokenMint.slice(-4)}` : "07xbv8..."}
                      </p>
                      <span className="px-2 py-0.5 bg-emerald-500 text-black text-xs font-semibold rounded flex-shrink-0">
                        {featuredVault.airdropAsset || "REVS"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Timer in top right */}
                <div className="inline-flex items-center gap-2 rounded-[8px] bg-white/15 backdrop-blur-[15px] ring-1 ring-white/20 px-2 sm:px-3 py-1.5 sm:py-2 text-white/95 font-bold tabular-nums flex-shrink-0">
                  <span className="text-sm sm:text-lg">{formatTimer(dashboardData?.timer?.timeLeft)}</span>
                </div>
              </div>
            </div>
            
            {/* Middle: Swipe indicator */}
            <div className="flex justify-center py-2 bg-white/5 backdrop-blur-[10px] border-b border-white/10">
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1L3 6h3v4h4V6h3L8 1z"/>
                </svg>
                <span>Swipe to see more vaults</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1L13 6h-3v4H6V6H3L8 1z"/>
                </svg>
              </div>
            </div>
            
            {/* Bottom: Stats grid - 2 columns, 3 rows */}
            <div className="p-3 sm:p-4 bg-white/5 backdrop-blur-[10px] flex-1">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 h-full">
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/60">Price</div>
                  <div className="text-lg sm:text-xl text-white font-semibold">{formatPrice(dashboardData?.token?.price || dashboardData?.vault?.tokenPrice)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/60">Treasury</div>
                  <div className="text-lg sm:text-xl text-white font-semibold">{formatTreasury(dashboardData?.vault?.treasury)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/60">Potential Win</div>
                  <div className="text-lg sm:text-xl text-white font-semibold">{dashboardData?.vault?.potentialWinnings?.multiplier ? `${dashboardData.vault.potentialWinnings.multiplier}×` : "100×"}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/60">Vault Asset</div>
                  <div className="text-base sm:text-lg text-white font-semibold inline-flex items-center justify-center gap-1">
                    <img src="/images/Solana_logo.png" alt="Solana" className="h-3 w-3 sm:h-4 sm:w-4 object-contain" />
                    {featuredVault.vaultAsset || "REVS"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/60">APY</div>
                  <div className="text-lg sm:text-xl text-white font-semibold">N/A</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/60">Endgame</div>
                  <div className="text-lg sm:text-xl text-white font-semibold">{dashboardData?.vault?.endgame?.daysLeft ? `${dashboardData.vault.endgame.daysLeft}d` : "92d"}</div>
                </div>
              </div>

              {/* Trade button */}
              <button 
                onClick={() => router.push(`/vault/${featuredVault.id}`)}
                className="w-full inline-flex items-center justify-center rounded-none bg-white text-black px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold hover:bg-white/90"
              >
                Trade
              </button>
            </div>
          </div>
        )}
      </section>


      {/* Desktop Vault List - Hidden on Mobile */}
      <div className={`mx-auto max-w-7xl px-4 hidden lg:block ${viewMode==='grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4' : 'space-y-3 sm:space-y-4'}`}>
        {vaults
          .filter(v => {
            if (filter === 'All') return true;
            if (filter === 'Live Vaults') return (v.status as any) === 'active';
            if (filter === 'ICO in Progress') return (v.status as any) === 'ico';
            if (filter === 'ICO Now') return (v.status as any) === 'ico';
            if (filter === 'Countdown') return (v.status as any) === 'countdown';
            if (filter === 'Pre-ICO') return (v.status as any) === 'pre_ico' || (v.status as any) === 'draft';
            if (filter === 'Extinct Vaults') return (v.status as any) === 'extinct' || (v.status as any) === 'ended';
            return true;
          })
          .map((vault) => (
          viewMode === 'list' ? (
          <VaultRow
            key={vault.id}
            name={vault.name}
            timer={formatTimer(dashboardData?.timer?.timeLeft)}
              pfp="/images/token.png"
              price={formatPrice(dashboardData?.token?.price || dashboardData?.vault?.tokenPrice)}
            baseAsset={vault.vaultAsset || "REVS"}
            treasury={formatTreasury(dashboardData?.vault?.treasury)}
              potentialWin={dashboardData?.vault?.potentialWinnings?.multiplier ? `${dashboardData.vault.potentialWinnings.multiplier}×` : "100×"}
            apy="N/A"
            endgame={dashboardData?.vault?.endgame?.daysLeft ? `${dashboardData.vault.endgame.daysLeft}d` : "95d"}
            onTrade={() => router.push(`/vault/${vault.id}`)}
          />
          ) : (
            <TallVaultCard
              key={vault.id}
              name={vault.name}
              timer={formatTimer(dashboardData?.timer?.timeLeft)}
              imageUrl="/images/ChatGPT Image Aug 13, 2025, 05_54_57 PM.png"
              pfp="/images/token.png"
              price={formatPrice(dashboardData?.token?.price || dashboardData?.vault?.tokenPrice)}
              baseAsset={vault.vaultAsset || "REVS"}
              treasury={formatTreasury(dashboardData?.vault?.treasury)}
              potentialWin={dashboardData?.vault?.potentialWinnings?.multiplier ? `${dashboardData.vault.potentialWinnings.multiplier}×` : "100×"}
              apy="N/A"
              endgame={dashboardData?.vault?.endgame?.daysLeft ? `${dashboardData.vault.endgame.daysLeft}d` : "95d"}
              tokenTicker={featuredVault?.airdropAsset || "REVS"}
              addressShort={featuredVault?.tokenMint ? `${featuredVault.tokenMint.slice(0, 6)}...${featuredVault.tokenMint.slice(-4)}` : undefined}
              onTrade={() => router.push(`/vault/${vault.id}`)}
            />
          )
        ))}
      </div>

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
    </div>
  );
}