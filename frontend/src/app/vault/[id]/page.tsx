'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ArrowLeftIcon, ClockIcon, CurrencyDollarIcon, GiftIcon, ChartBarIcon, CloudArrowDownIcon, BoltIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

// Dynamically import JupiterWidget to avoid SSR issues
const JupiterWidget = dynamic(() => import('../../../components/JupiterWidget'), {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {data.vaultConfig?.name?.charAt(0) || 'V'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {data.vaultConfig?.name || 'Vault'}
                    <span className="ml-2 text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      {data.vaultConfig?.airdropAsset || 'TOKEN'}
                    </span>
                  </h1>
                  <p className="text-gray-600">
                    {data.vaultConfig?.description || 'Dynamic exploding treasury vault'}
                  </p>
                </div>
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
          
          {/* Left Column - Timer and Stats */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Timer Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Vault Timer</h2>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                  <div className={`w-2 h-2 rounded-full ${data.timer.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-6xl font-mono font-bold text-gray-900 mb-2">
                  {formatTime(currentTime)}
                </div>
                <p className="text-lg text-gray-600">
                  {data.timer.isActive ? 'Timer Active - Buy to Reset!' : 'Timer Inactive'}
                </p>
              </div>
              
              {data.timer.lastBuyerAddress && (
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h3 className="font-semibold text-gray-900 mb-3">Last Purchase</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Buyer</p>
                      <p className="font-mono text-sm text-gray-900">{formatAddress(data.timer.lastBuyerAddress)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-semibold text-green-600 text-lg">{data.timer.lastPurchaseAmount.toFixed(2)} SOL</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Vault Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Treasury Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Treasury</h3>
                  <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {data.vault.treasury.amount.toFixed(2)} {data.vault.treasury.asset}
                  </div>
                  <div className="text-xl text-gray-900 font-semibold">
                    ${data.vault.treasury.usdValue.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Growing with each purchase
                  </div>
                </div>
              </Card>

              {/* Potential Winnings Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Potential Winnings</h3>
                  <GiftIcon className="w-6 h-6 text-purple-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {data.vault.potentialWinnings.multiplier}x
                  </div>
                  <div className="text-xl text-gray-900 font-semibold">
                    ${data.vault.potentialWinnings.usdValue.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Last buyer wins all
                  </div>
                </div>
              </Card>

              {/* Endgame Days Left Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Endgame Days Left</h3>
                  <ChartBarIcon className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {data.vault.endgame.daysLeft}
                  </div>
                  <div className="text-lg text-gray-900 font-semibold">
                    Days until endgame
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Distribution period begins
                  </div>
                </div>
              </Card>

              {/* Airdrop Countdown Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Next Airdrop</h3>
                  <CloudArrowDownIcon className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2 font-mono">
                    {formatTime(airdropTime)}
                  </div>
                  <div className="text-lg text-gray-900 font-semibold">
                    Daily at 12 PM ET
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Hold {data.vaultConfig?.minHoldAmount?.toLocaleString() || '200,000'} tokens
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Buys */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Buys</h3>
              {recentBuys.length > 0 ? (
                <div className="space-y-3">
                  {recentBuys.map((buy, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-mono text-sm text-gray-900">{formatAddress(buy.buyerAddress)}</p>
                          <p className="text-xs text-gray-500">{new Date(buy.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{buy.amount.toFixed(2)} SOL</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BoltIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent purchases</p>
                  <p className="text-sm text-gray-400 mt-1">Be the first to buy and reset the timer!</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Trade Widget */}
          <div className="space-y-6">
            
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
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-orange-700 text-sm font-medium">
                    ⚡ Last buyer wins {data.vault.potentialWinnings.multiplier}x the treasury!
                  </p>
                </div>
              </div>
              <JupiterWidget 
                tokenAddress={data.vaultConfig?.tokenMint || data.token?.address || "9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p"}
                tokenSymbol={data.vaultConfig?.airdropAsset || "TOKEN"}
              />
            </Card>

            {/* Vault Info */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Vault Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vault Asset:</span>
                  <span className="font-medium">{data.vaultConfig?.vaultAsset || 'SOL'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Airdrop Asset:</span>
                  <span className="font-medium">{data.vaultConfig?.airdropAsset || 'REVS'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Hold Amount:</span>
                  <span className="font-medium">{data.vaultConfig?.minHoldAmount?.toLocaleString() || '200,000'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timer Duration:</span>
                  <span className="font-medium">{data.vaultConfig?.timerDuration || 1}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{data.vaultConfig ? new Date(data.vaultConfig.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Whitelisted Addresses:</span>
                  <span className="font-medium">{data.vaultConfig?.whitelistedAddresses?.length || 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}