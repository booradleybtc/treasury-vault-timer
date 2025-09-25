 'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { SiteFooter } from '@/components/darwin/SiteFooter';
import { VaultRow } from '@/components/darwin/VaultRow';
import { GlassPanel } from '@/components/darwin/GlassPanel';
import { FeaturedVaultCard } from '@/components/darwin/FeaturedVaultCard';
import { ArrowLeft, Clock, CurrencyDollar, Gift, ChartBar, CloudArrowDown } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';

// Helper function to get token symbol from address
const getTokenSymbol = (address: string): string => {
  const tokenMap: { [key: string]: string } = {
    'So11111111111111111111111111111111111111112': 'SOL',
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
    '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETH',
  };
  
  return tokenMap[address] || address.slice(0, 4) + '...';
};

// Helper function to get token image from address
const getTokenImage = (address: string): string => {
  const tokenImages: { [key: string]: string } = {
    'So11111111111111111111111111111111111111112': '/images/Solana_logo.png',
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': '/images/token.png', // Using generic token image since USDC.png doesn't exist
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': '/images/token.png', // Using generic token image since USDT.png doesn't exist
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': '/images/token.png', // Using generic token image since mSOL.png doesn't exist
    '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': '/images/token.png', // Using generic token image since ETH.png doesn't exist
  };
  
  return tokenImages[address] || '/images/token.png';
};

// Dynamically import JupiterWidget to avoid SSR issues
const JupiterWidget = dynamic(() => import('@/components/JupiterWidget'), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">Loading trading widget...</div>
});

interface VaultData {
  timer: {
    isActive: boolean;
    timeLeft: number;
    lastBuyerAddress?: string;
    lastPurchaseAmount: number;
  };
  buyLog: Array<{
    buyerAddress: string;
    amount: number;
    timestamp: string;
  }>;
  token: {
    address: string;
    price: number;
    marketCap: number;
    volume24h: number;
    lastUpdated: string;
  };
  vault: {
    treasury: {
      amount: number;
      asset: string;
      usdValue: number;
    };
    potentialWinnings: {
      multiplier: number;
      usdValue: number;
    };
    endgame: {
      daysLeft: number;
      endDate: string;
    };
    airdrop: {
      nextAirdrop: string;
      totalAirdropped: number;
      eligibleHolders: number;
    };
  };
  vaultConfig: {
    id: string;
    name: string;
    description: string;
    tokenMint: string;
    airdropAsset: string;
    vaultAsset: string;
    minHoldAmount: number;
    timerDuration: number;
    status: string;
    createdAt: string;
    whitelistedAddresses: string[];
  } | null;
}

export default function VaultPage() {
  const router = useRouter();
  const routeParams = useParams();
  const idParam = Array.isArray(routeParams?.id) ? routeParams.id[0] : (routeParams?.id as string);
  const [data, setData] = useState<VaultData | null>(null);
  const [vaultConfig, setVaultConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [airdropTime, setAirdropTime] = useState(0);
  const [showHuntModal, setShowHuntModal] = useState(false);

  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  const fetchData = async () => {
    try {
      const response = await fetch(`${BACKEND}/api/dashboard`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setCurrentTime(result.timer.timeLeft);
      } else {
        console.error('Failed to fetch data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVaultConfig = async () => {
    try {
      if (!idParam) return;
      const res = await fetch(`${BACKEND}/api/vault/${idParam}/config`);
      if (res.ok) {
        const js = await res.json();
        setVaultConfig(js.vault);
      }
    } catch (e) {
      console.error('Failed to load vault config', e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchVaultConfig();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [idParam]);

  useEffect(() => {
    if (data?.timer.isActive) {
      const timer = setInterval(() => {
        setCurrentTime(prev => {
          if (prev <= 0) {
            fetchData(); // Refresh when timer hits 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [data?.timer.isActive]);

  useEffect(() => {
    // Hourly airdrop countdown
    setAirdropTime(60 * 60);
    const airdropTimer = setInterval(() => {
      setAirdropTime(prev => {
        if (prev <= 0) {
          return 60 * 60; // Reset to 1 hour
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(airdropTimer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vault data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load vault data</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const recentBuys = data.buyLog.slice(0, 3);

  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        background:
          "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/ChatGPT Image Aug 13, 2025, 05_54_57 PM.png') center 70% / cover fixed",
      }}
    >
      {/* Keep custom header below; no global StreamHeader here */}
      {/* Custom Header for Vault Page */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/20 border-b border-white/10 ring-0">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 flex items-center justify-between">
          {/* Left: Back Button */}
          <button 
          onClick={() => router.push('/vaults')}
            className="inline-flex items-center gap-2 rounded-none bg-white/10 backdrop-blur-[10px] ring-1 ring-white/10 text-white px-4 py-2 text-sm font-semibold hover:bg-white/20"
        >
            <ArrowLeft className="w-4 h-4" />
          <span>Back to Vaults</span>
          </button>

          {/* Center spacer (no dropdown) */}
          <div className="hidden sm:block" />

          {/* Right: Buy CTA */}
          <button 
            onClick={() => setShowHuntModal(true)}
            className="inline-flex items-center gap-2 justify-center px-4 sm:px-5 py-2.5 text-sm sm:text-base font-semibold rounded-none text-white bg-[#58A6FF] hover:bg-[#6fb3ff] shadow-[0_0_28px_rgba(88,166,255,0.45)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <img src="/images/78.png" alt="Darwin" className="h-5 w-5 object-contain" />
            Buy Vault
          </button>
        </div>
      </header>
      

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Hero Section */}
        <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6 mb-6">
          <div className="relative bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 overflow-hidden">
            {/* Banner Background */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: vaultConfig?.meta?.bannerUrl ? `url('${vaultConfig.meta.bannerUrl}')` : "url('/images/ChatGPT Image Aug 13, 2025, 05_54_57 PM.png')"
              }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/70" />
            
            {/* ICO Date Card on top of banner */}
            {vaultConfig?.status === 'pre_ico' && vaultConfig?.meta?.icoProposedAt && (
              <div className="relative z-10 p-6">
                <div className="max-w-2xl mx-auto">
                  <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-[10px] ring-1 ring-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.3)] px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-cyan-300 mb-2">ICO Date & Time</div>
                        <div className="text-xl font-bold text-white">{new Date(vaultConfig.meta.icoProposedAt).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</div>
                        <div className="text-lg text-cyan-200">{new Date(vaultConfig.meta.icoProposedAt).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          timeZoneName: 'short'
                        })}</div>
                      </div>
                      <a 
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=ICO: ${vaultConfig.name}&details=ICO fundraise for ${vaultConfig.name} vault&location=Online`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-300 hover:text-cyan-200 transition-colors text-2xl"
                        title="Add to Calendar"
                      >
                        📅
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="relative p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                
                {/* Left Side - Vault Info */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row items-center gap-6 mb-4">
                    <img 
                      src={vaultConfig?.meta?.logoUrl || "/images/token.png"} 
                      alt={vaultConfig?.meta?.ticker || "REVS"} 
                      className="h-20 w-20 rounded-[8px] object-cover ring-2 ring-white/20 bg-white p-1" 
                    />
                    <div className="flex flex-col items-center lg:items-start">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl lg:text-4xl font-bold text-white">{vaultConfig?.name || 'Vault'}</h1>
                        {vaultConfig?.status === 'pre_ico' && (
                          <div className="inline-flex items-center gap-2 rounded-[8px] bg-cyan-500/20 backdrop-blur-[10px] ring-1 ring-cyan-400/30 px-3 py-1 text-sm text-cyan-300 font-semibold">
                            Pre-ICO
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-[10px] ring-1 ring-white/10 px-3 py-1 text-sm text-white/90 rounded-[8px]">
                          <button 
                            onClick={() => navigator.clipboard.writeText(vaultConfig?.tokenMint || '')}
                            className="text-white/50 hover:text-white transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <span className="font-mono text-sm text-white/70">
                            {vaultConfig?.meta?.ticker || vaultConfig?.airdropAsset || 'REVS'}
                          </span>
                        </div>
                        {vaultConfig?.meta?.links?.x && (
                        <a 
                            href={vaultConfig.meta.links.x} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-white/60 hover:text-white transition-colors inline-flex items-center"
                          aria-label="View on X"
                        >
                            <img src="/images/X_logo_2023_(white).svg.png" alt="X" className="h-4 w-4 object-contain" />
                          </a>
                        )}
                        {vaultConfig?.meta?.links?.website && (
                          <a 
                            href={vaultConfig.meta.links.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-white/60 hover:text-white transition-colors inline-flex items-center"
                            aria-label="Website"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Center - Timer or ICO Countdown */}
                <div className="text-center flex flex-col items-center justify-center">
                  {vaultConfig?.status === 'pre_ico' ? (
                    <div className="tabular-nums text-5xl lg:text-6xl font-extrabold leading-none tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,.6)] text-white mb-4">
                      {vaultConfig?.meta?.icoProposedAt ? 
                        Math.max(0, Math.floor((new Date(vaultConfig.meta.icoProposedAt).getTime() - new Date().getTime()) / 1000))
                        : 0
                      }
                    </div>
                  ) : (
                  <div className="tabular-nums text-5xl lg:text-6xl font-extrabold leading-none tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,.6)] text-white mb-4">
                    {formatTime(currentTime)}
                  </div>
                  )}
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-[10px] ring-1 ring-white/10 px-3 py-1 text-sm text-white/90 rounded-[8px]">
                    {vaultConfig?.status === 'pre_ico' ? 
                      `ICO Begins in ${Math.floor((new Date(vaultConfig?.meta?.icoProposedAt || Date.now()).getTime() - new Date().getTime()) / (1000 * 60 * 60))} hours` :
                      `Endgame ${data.vault.endgame.daysLeft} Days`
                    }
                  </div>
                </div>
              </div>
            </div>
                </div>
              </div>
              
        {/* Details Section */}
        {vaultConfig?.status === 'pre_ico' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Vault Details Card */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Vault Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Vault Name</span>
                  <span className="text-white font-semibold">{vaultConfig?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Timer Duration</span>
                  <span className="text-white font-semibold">{Math.floor((vaultConfig?.timerDuration || 3600) / 3600)} Hour{(Math.floor((vaultConfig?.timerDuration || 3600) / 3600)) !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Vault Lifespan</span>
                  <span className="text-white font-semibold">{vaultConfig?.meta?.vaultLifespanDays || 100} Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">BID:WIN Ratio</span>
                  <span className="text-white font-semibold">{vaultConfig?.meta?.bidMultiplier || 100}×</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Minimum Buy to Reset</span>
                  <span className="text-white font-semibold">{vaultConfig?.meta?.minimumBuyToResetTimer || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Assets Card */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Assets</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Vault Asset</span>
                  <div className="flex items-center gap-2">
                    <img src={getTokenImage(vaultConfig?.vaultAsset || 'So11111111111111111111111111111111111111112')} alt={getTokenSymbol(vaultConfig?.vaultAsset || 'So11111111111111111111111111111111111111112')} className="h-5 w-5 object-contain" />
                    <span className="text-white font-semibold">{getTokenSymbol(vaultConfig?.vaultAsset || 'So11111111111111111111111111111111111111112')}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Airdrop Asset</span>
                  <div className="flex items-center gap-2">
                    <img src={getTokenImage(vaultConfig?.airdropAsset || '')} alt={getTokenSymbol(vaultConfig?.airdropAsset || '')} className="h-5 w-5 object-contain" />
                    <span className="text-white font-semibold">{getTokenSymbol(vaultConfig?.airdropAsset || '')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Airdrop Details Card */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Airdrop Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Type</span>
                  <span className="text-white font-semibold">{vaultConfig?.meta?.airdropType || 'Rewards'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Frequency</span>
                  <span className="text-white font-semibold">{vaultConfig?.meta?.airdropIntervals || '1 hour'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Minimum Hold</span>
                  <span className="text-white font-semibold">{vaultConfig?.meta?.minimumHoldForAirdrop || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Trade Fee Splits Card */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Trade Fee Splits</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Creator</span>
                  <span className="text-white font-semibold">{vaultConfig?.meta?.splits?.creator || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Treasury</span>
                  <span className="text-white font-semibold">{vaultConfig?.meta?.splits?.treasury || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Airdrops</span>
                  <span className="text-white font-semibold">{vaultConfig?.meta?.splits?.airdrops || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Darwin Builder Fund</span>
                  <span className="text-white font-semibold">{vaultConfig?.meta?.splits?.darwin || 0}%</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/10 pt-2">
                  <span className="text-white/70 font-semibold">Total Tax</span>
                  <span className="text-white font-bold">{(vaultConfig?.meta?.splits?.creator || 0) + (vaultConfig?.meta?.splits?.treasury || 0) + (vaultConfig?.meta?.splits?.airdrops || 0) + (vaultConfig?.meta?.splits?.darwin || 0)}%</span>
                </div>
              </div>
            </div>

            {/* Disclaimer Card */}
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Disclaimer</h3>
              <div className="text-white/70 text-sm space-y-2">
                <p>This vault is currently in the Pre-ICO stage. The ICO will begin on the specified date and time above.</p>
                <p>During the ICO, participants can contribute SOL or USDC to the treasury wallet. Darwin platform takes 5% of the total raise.</p>
                <p>If the ICO raises less than $1000 USD, the vault may be marked as extinct. If it raises $1000 or more, it will proceed to the live trading stage.</p>
                <p>Please conduct your own research before participating in any ICO or trading activities.</p>
              </div>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Vault Details & Chart */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Vault Card */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Exploding Vault</h2>
                <div className="inline-flex items-center gap-2 bg-[#58A6FF]/15 backdrop-blur-[12px] ring-1 ring-[#58A6FF]/40 px-3 py-1.5 text-sm text-white rounded-[8px] shadow-[0_0_18px_rgba(88,166,255,0.35)]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#58A6FF] shadow-[0_0_10px_rgba(88,166,255,0.8)]"></span>
                  <span className="font-semibold">Current winner</span>
                  <span className="font-mono text-white/90">{data.timer.lastBuyerAddress ? formatAddress(data.timer.lastBuyerAddress) : 'N/A'}</span>
                </div>
              </div>
              {/* Total Vault Value with nested REVS and SOL cards */}
              <div className="bg-black/20 ring-1 ring-white/10 p-6 mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-white/90">Total Vault Value</h3>
                    <span className="text-base font-semibold text-white/85">${(data.vault.treasury.amount * 0.0007).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-[10px] ring-1 ring-white/10 px-2.5 py-0.5 text-xs text-white/85 rounded-[8px]">Total Assets <strong className="font-semibold">2</strong></span>
                    <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-[10px] ring-1 ring-white/10 px-2.5 py-0.5 text-xs text-white/85 rounded-[8px]">Vault Type <strong className="font-semibold">DAT</strong></span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-1">
                  <div className="bg-white/5 ring-1 ring-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <img src="/images/token.png" alt="REVS" className="h-10 w-10 rounded-full object-cover" />
                      <div className="flex flex-col">
                        <div className="text-2xl font-bold text-white">{Number(data.vault.treasury.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {data.vaultConfig?.airdropAsset || 'REVS'}</div>
                        <div className="text-sm text-white/70">${(data.vault.treasury.amount * 0.0007).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 ring-1 ring-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <img src="/images/Solana_logo.png" alt="SOL" className="h-10 w-10 rounded-full object-contain" />
                      <div className="flex flex-col">
                        <div className="text-2xl font-bold text-white">87.39 SOL</div>
                        <div className="text-sm text-white/70">$12,345.00</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* total value moved to header */}
              </div>
              
              {/* Vault Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                <div className="bg-black/20 ring-1 ring-white/10 p-3 text-center">
                  <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">BID PRICE</div>
                  <div className="text-base font-semibold text-white tabular-nums">$0.0007</div>
                </div>
                <div className="bg-black/20 ring-1 ring-white/10 p-3 text-center">
                  <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">BID:WIN</div>
                  <div className="text-base font-semibold text-white tabular-nums">{data.vault.potentialWinnings.multiplier}x</div>
                </div>
                <div className="bg-black/20 ring-1 ring-white/10 p-3 text-center">
                  <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">WINNER'S TAKE</div>
                  <div className="text-base font-semibold text-white">50% of Vault</div>
                </div>
                <div className="bg-black/20 ring-1 ring-white/10 p-3 text-center">
                  <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">TRADE FEE</div>
                  <div className="text-base font-semibold text-white">10%</div>
                </div>
                <div className="bg-black/20 ring-1 ring-white/10 p-3 text-center">
                  <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">ENDGAME</div>
                  <div className="text-base font-semibold text-white">{data.vault.endgame.daysLeft} Days</div>
                </div>
                <div className="bg-black/20 ring-1 ring-white/10 p-3 text-center">
                  <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">TIMER</div>
                  <div className="text-base font-semibold text-white">1 Hour</div>
                </div>
              </div>

              {/* Hunt the Vault button matching header */}
              <div className="flex">
                <button onClick={() => setShowHuntModal(true)} className="inline-flex items-center gap-2 justify-center w-full px-4 sm:px-5 py-2.5 text-sm sm:text-base font-semibold rounded-none text-white bg-[#58A6FF] hover:bg-[#6fb3ff] shadow-[0_0_28px_rgba(88,166,255,0.45)]">
                  <img src="/images/78.png" alt="Darwin" className="h-5 w-5 object-contain" />
                  Hunt the Vault
                </button>
              </div>
              
              {/* Hunt the Vault Button removed per request */}
            </div>

            {/* CHART (Birdeye) */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Chart</h2>
                <span className="text-xs text-white/60 bg-white/10 px-3 py-1">REVS</span>
              </div>
              <div className="ring-1 ring-white/10 p-0 h-[420px] bg-white">
                <iframe
                  src="https://www.geckoterminal.com/solana/pools/8pN9qCiZg3KPg79R5cL4AF9xXVTWoJPxaVWf5ormvCwa?embed=1&info=0&swaps=0&grayscale=0&light_chart=1&chart_type=price&resolution=15m"
                  width="100%"
                  height="100%"
                  style={{ border: 'none', borderRadius: '0' }}
                  title="REVS Chart"
                />
              </div>
            </div>
                  </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Airdrops Section */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Airdrops</h3>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-[10px] ring-1 ring-white/10 px-3 py-1 text-xs text-white/90 rounded-[8px]">
                    50 winners/hour
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-[10px] ring-1 ring-white/10 px-3 py-1 text-xs text-white/90 rounded-[8px]">
                    <img 
                      src="/images/token.png" 
                      alt="REVS" 
                      className="h-4 w-4 object-contain rounded-full" 
                    />
                    {data.vaultConfig?.airdropAsset || 'REVS'}
                  </div>
                </div>
              </div>
              
              <div className="bg-black/20 ring-1 ring-white/10 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">NEXT DROP</span>
                  <span className="text-sm font-bold text-white">{formatTime(airdropTime)}</span>
                </div>
                <div className="w-full bg-white/10 h-2">
                  <div className="bg-[#58A6FF] h-2" style={{width: `${Math.max(0, Math.min(100, (1 - (airdropTime / 3600)) * 100))}%`}}></div>
                  </div>
                  </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/20 ring-1 ring-white/10 p-4 text-center">
                  <div className="text-xs text-white/60 uppercase tracking-wider mb-1">HOURLY POOL</div>
                  <div className="text-lg font-bold text-white">$42,560</div>
                  </div>
                <div className="bg-black/20 ring-1 ring-white/10 p-4 text-center">
                  <div className="text-xs text-white/60 uppercase tracking-wider mb-1">MUST HOLD</div>
                  <div className="text-lg font-bold text-white">200,000</div>
                </div>
                <div className="bg-black/20 ring-1 ring-white/10 p-4 text-center">
                  <div className="text-xs text-white/60 uppercase tracking-wider mb-1">TOTAL AIRDROPPED</div>
                  <div className="text-lg font-bold text-white">$1.23M</div>
                </div>
                <div className="bg-black/20 ring-1 ring-white/10 p-4 text-center">
                  <div className="text-xs text-white/60 uppercase tracking-wider mb-1">APY*</div>
                  <div className="text-lg font-bold text-white">164%</div>
                </div>
            </div>

              <div className="text-center mb-4">
                <p className="text-sm text-white/70">Daily pool randomly awarded to eligible holders.</p>
          </div>

              <div>
                <a 
                  href="#" 
                  className="w-full inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90"
                >
                  View all airdrops
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* How it Works Section */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6 min-h-[420px]">
              <h3 className="text-lg font-bold text-white mb-4">How it Works</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-black/20 ring-1 ring-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-6 w-6 aspect-square rounded-full bg-white/10 text-white text-xs leading-none shrink-0">1</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Buy REVS to reset timer</h4>
                      <p className="text-xs text-white/70 mt-1">Each purchase resets the vault timer.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/20 ring-1 ring-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-6 w-6 aspect-square rounded-full bg-white/10 text-white text-xs leading-none shrink-0">2</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Win half the treasury</h4>
                      <p className="text-xs text-white/70 mt-1">If timer hits zero, last buyer takes the pot.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/20 ring-1 ring-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-6 w-6 aspect-square rounded-full bg-white/10 text-white text-xs leading-none shrink-0">3</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Holders stack with daily airdrops</h4>
                      <p className="text-xs text-white/70 mt-1">Everyday there are 50 winners who receive a portion of trading volume</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/20 ring-1 ring-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-6 w-6 aspect-square rounded-full bg-white/10 text-white text-xs leading-none shrink-0">4</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Holders receive the vault if endgame is reached</h4>
                      <p className="text-xs text-white/70 mt-1">If the timer stays alive until endgame, the vault is distribued to holders pro-rata</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trade REVS and Vault Information removed per request */}
                    </div>
                  </div>
        )}
      </div>
                
      {/* Footer */}
      {/* Trending Vaults - list view, vertical scroll */}
      <div className="mx-auto max-w-7xl px-4 pb-8">
        <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-4 mb-6">
          <h3 className="text-lg font-bold text-white mb-3">Trending Vaults</h3>
          <div className="max-h-[520px] overflow-y-auto pr-2">
            <div className="space-y-3">
              {[1,2,3,4,5,6,7,8,9,10].map((i) => (
                <VaultRow
                  key={i}
                  name={`Vault ${i}`}
                  timer={formatTime(currentTime)}
                  pfp="/images/token.png"
                  price={"$0.0007"}
                  baseAsset={i % 2 === 0 ? "SOL" : "REVS"}
                  treasury={`$${(data.vault.treasury.amount/1000000).toFixed(1)}M`}
                  potentialWin={`${data.vault.potentialWinnings.multiplier}×`}
                  apy="N/A"
                  endgame={`${data.vault.endgame.daysLeft}d`}
                  onTrade={() => {}}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />

      {/* Hunt Modal */}
      {showHuntModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">Hunt the Vault</h3>
                      <button 
                onClick={() => setShowHuntModal(false)}
                className="text-gray-500 hover:text-gray-700"
                      >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
            <div className="bg-white">
              <JupiterWidget 
                tokenAddress={data?.vaultConfig?.tokenMint || 'So11111111111111111111111111111111111111112'}
                tokenSymbol={data?.vaultConfig?.airdropAsset || 'REVS'}
              />
              </div>
          </div>
        </div>
      )}
    </div>
  );
}