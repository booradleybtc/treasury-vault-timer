'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { ArrowLeftIcon, ClockIcon, CurrencyDollarIcon, GiftIcon, ChartBarIcon, CloudArrowDownIcon, BoltIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

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

export default function VaultPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [airdropTime, setAirdropTime] = useState(0);

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

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
    // Calculate next airdrop time (daily at 12 PM ET)
    const now = new Date();
    const et = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const nextAirdrop = new Date(et);
    nextAirdrop.setHours(12, 0, 0, 0);
    
    if (et.getHours() >= 12) {
      nextAirdrop.setDate(nextAirdrop.getDate() + 1);
    }
    
    const timeUntilAirdrop = Math.floor((nextAirdrop.getTime() - et.getTime()) / 1000);
    setAirdropTime(timeUntilAirdrop);
    
    const airdropTimer = setInterval(() => {
      setAirdropTime(prev => {
        if (prev <= 0) {
          return 24 * 60 * 60; // Reset to 24 hours
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/vaults')}
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back to Vaults</span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">D</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Darwin</h1>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                data.vaultConfig?.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {data.vaultConfig?.status || 'unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Timer, Livestream, and Data Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Vault Info & Timer Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                {/* Left Side - Vault Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {data.vaultConfig?.name?.charAt(0) || 'V'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {data.vaultConfig?.name || 'Vault'}
                      <span className="ml-3 text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        {data.vaultConfig?.airdropAsset || 'TOKEN'}
                      </span>
                    </h1>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-mono text-sm text-gray-600">
                        {data.vaultConfig?.tokenMint ? 
                          `${data.vaultConfig.tokenMint.slice(0, 4)}...${data.vaultConfig.tokenMint.slice(-4)}` : 
                          'N/A'
                        }
                      </span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(data.vaultConfig?.tokenMint || '')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Right Side - Timer */}
                <div className="text-right">
                  <div className="text-4xl font-mono font-bold text-gray-900 mb-1">
                    {formatTime(currentTime)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Livestream Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Live Stream</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-600 font-medium">Live</span>
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">📺</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Stream Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  Watch live trading activity, vault updates, and community discussions
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-orange-700 text-sm">
                    🎥 Stream will show real-time vault activity and trading events
                  </p>
                </div>
              </div>
            </Card>

            {/* Last Buyer Section */}
            {data.timer.lastBuyerAddress && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Last Buyer</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Buyer Address</p>
                      <p className="font-mono text-sm text-gray-900">{formatAddress(data.timer.lastBuyerAddress)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-semibold text-green-600 text-lg">{data.timer.lastPurchaseAmount.toFixed(2)} SOL</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Vault Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Treasury Card */}
              <Card className="p-6 bg-gray-900 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Treasury</h3>
                  <CurrencyDollarIcon className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {data.vault.treasury.amount.toFixed(2)} {data.vault.treasury.asset}
                  </div>
                  <div className="text-xl text-gray-300 font-semibold">
                    ${data.vault.treasury.usdValue.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Growing with each purchase
                  </div>
                </div>
              </Card>

              {/* Potential Winnings Card */}
              <Card className="p-6 bg-gray-800 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Potential Winnings</h3>
                  <GiftIcon className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {data.vault.potentialWinnings.multiplier}x
                  </div>
                  <div className="text-xl text-gray-300 font-semibold">
                    ${data.vault.potentialWinnings.usdValue.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Last buyer wins all
                  </div>
                </div>
              </Card>

              {/* Endgame Days Left Card */}
              <Card className="p-6 bg-gray-900 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Endgame Days Left</h3>
                  <ChartBarIcon className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {data.vault.endgame.daysLeft}
                  </div>
                  <div className="text-lg text-gray-300 font-semibold">
                    Days until endgame
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Distribution period begins
                  </div>
                </div>
              </Card>

              {/* Airdrop Countdown Card */}
              <Card className="p-6 bg-gray-800 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Next Airdrop</h3>
                  <CloudArrowDownIcon className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2 font-mono">
                    {formatTime(airdropTime)}
                  </div>
                  <div className="text-lg text-gray-300 font-semibold">
                    Daily at 12 PM ET
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Hold {data.vaultConfig?.minHoldAmount?.toLocaleString() || '200,000'} tokens
                  </div>
                </div>
              </Card>
            </div>

          </div>

          {/* Right Column - How it Works and Trade Widget */}
          <div className="space-y-6">
            
            {/* How it Works - Now at the top */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">How it Works</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Buy {data.vaultConfig?.airdropAsset || 'TOKEN'} to Reset Timer</h4>
                    <p className="text-sm text-gray-600">Purchase 1 token to reset the vault timer</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Win Half the Treasury</h4>
                    <p className="text-sm text-gray-600">If the timer expires before endgame, the last buyer wins half the scratcher winnings</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Claim Airdrops & Treasury</h4>
                    <p className="text-sm text-gray-600">Hold {data.vaultConfig?.airdropAsset || 'TOKEN'} for chance to win daily airdrops & have a claim on your portion of the scratcher winnings if endgame is reached</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open('https://docs.darwinvaults.com', '_blank')}
                  >
                    Read Full Documentation
                  </Button>
                </div>
              </div>
            </Card>

            {/* Trade Widget */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Trade {data.vaultConfig?.airdropAsset || 'TOKEN'}
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-green-600">Live</span>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 text-sm mb-2">Buy to reset the timer and win the vault!</p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p className="text-orange-700 text-sm font-medium">
                    ⚡ Last buyer wins {data.vault.potentialWinnings.multiplier}x the treasury!
                  </p>
                </div>
              </div>
              <div className="overflow-hidden">
                <JupiterWidget 
                  tokenAddress={data.vaultConfig?.tokenMint || data.token?.address || "9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p"}
                  tokenSymbol={data.vaultConfig?.airdropAsset || "TOKEN"}
                />
              </div>
            </Card>

            {/* Vault Info - Expanded */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Vault Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Vault Asset:</span>
                    <div className="font-medium">{data.vaultConfig?.vaultAsset || 'SOL'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Airdrop Asset:</span>
                    <div className="font-medium">{data.vaultConfig?.airdropAsset || 'REVS'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Min Hold Amount:</span>
                    <div className="font-medium">{data.vaultConfig?.minHoldAmount?.toLocaleString() || '200,000'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Timer Duration:</span>
                    <div className="font-medium">{data.vaultConfig?.timerDuration ? `${data.vaultConfig.timerDuration / 3600}h` : '1h'}</div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Start Date:</span>
                      <span className="font-medium">{data.vaultConfig ? new Date(data.vaultConfig.startDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Endgame Date:</span>
                      <span className="font-medium">{data.vaultConfig ? new Date(data.vaultConfig.endgameDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Distribution Interval:</span>
                      <span className="font-medium">{data.vaultConfig ? `${data.vaultConfig.distributionInterval / 60}min` : '5min'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Token Address:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-mono text-xs text-gray-700 break-all">
                        {data.vaultConfig?.tokenMint || 'N/A'}
                      </span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(data.vaultConfig?.tokenMint || '')}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}