'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { 
  ArrowLeftIcon,
  ClockIcon,
  CurrencyDollarIcon,
  GiftIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  CloudArrowDownIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Load Jupiter client-only to avoid SSR/react default import issues
const JupiterWidget = dynamic(() => import('../../../components/JupiterWidget'), { ssr: false });

interface BuyLogEntry {
  address: string;
  amount: number;
  timestamp: string;
  txSignature: string;
}

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

interface VaultData {
  timer: {
    timeLeft: number;
    isActive: boolean;
    lastPurchaseTime: string | null;
    lastBuyerAddress: string;
    lastPurchaseAmount: number;
  };
  buyLog: BuyLogEntry[];
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
    timer: {
      hoursLeft: number;
      daysAlive: number;
      gameStartDate: string;
    };
    endgame: {
      endDate: string;
      daysLeft: number;
    };
    airdrop: {
      nextAirdropTime: string;
      dailyTime: string;
      minimumHold: number;
      amount: number;
    };
    apy: {
      percentage: string | number;
      calculatedFrom: string;
    };
  };
  vaultConfig: VaultConfig | null;
}

export default function VaultPage() {
  const params = useParams();
  const router = useRouter();
  const vaultId = params.id as string;
  
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [airdropTime, setAirdropTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'vault' | 'airdrop'>('vault');
  const [recentBuys, setRecentBuys] = useState<BuyLogEntry[]>([]);
  
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    if (vaultId) {
      fetchData();
    }
  }, [vaultId]);

  useEffect(() => {
    if (!data) return;

    setCurrentTime(data.timer.timeLeft);
    
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev <= 1) {
          // Timer expired, refresh data
          fetchData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  useEffect(() => {
    if (!data) return;

    // Calculate next airdrop time (12 PM ET daily)
    const now = new Date();
    const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const nextAirdrop = new Date(etTime);
    nextAirdrop.setHours(12, 0, 0, 0);
    
    if (nextAirdrop <= etTime) {
      nextAirdrop.setDate(nextAirdrop.getDate() + 1);
    }
    
    const timeUntilAirdrop = Math.floor((nextAirdrop.getTime() - etTime.getTime()) / 1000);
    setAirdropTime(timeUntilAirdrop);
    
    const airdropInterval = setInterval(() => {
      setAirdropTime(prev => {
        if (prev <= 1) {
          // Airdrop time reached, refresh data
          fetchData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(airdropInterval);
  }, [data]);

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching data for vault:', vaultId);
      
      // Fetch main dashboard data
      const response = await fetch(`${BACKEND_URL}/api/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Dashboard data received:', result);
      setData(result);

      // Fetch recent purchases separately
      const purchasesResponse = await fetch(`${BACKEND_URL}/api/purchases`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        signal: AbortSignal.timeout(5000)
      });
      
      if (purchasesResponse.ok) {
        const purchasesResult = await purchasesResponse.json();
        setRecentBuys(purchasesResult.purchases);
      } else {
        setRecentBuys([]);
      }

    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vault...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Vault not found'}</p>
          <Button onClick={() => router.push('/vaults')}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Vaults
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
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
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-white text-2xl font-bold">
                    {data.vaultConfig?.name?.charAt(0) || 'V'}
                  </span>
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {data.vaultConfig?.name || 'Vault'}
                    <span className="ml-2 text-sm font-semibold text-gray-600 align-middle">
                      {data.vaultConfig?.airdropAsset || 'TOKEN'}
                    </span>
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {data.vaultConfig?.description || 'Dynamic exploding treasury vault'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Vault Status</div>
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
          
          {/* Left Column - Vault Stats */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Timer Card */}
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Vault Timer</h2>
                <ClockIcon className="w-8 h-8 text-orange-600" />
              </div>
              
              <div className="text-center mb-6">
                <div className="text-6xl font-mono font-bold text-orange-600 mb-2">
                  {formatTime(currentTime)}
                </div>
                <p className="text-gray-600">
                  {data.timer.isActive ? 'Timer Active' : 'Timer Inactive'}
                </p>
              </div>
              
              {data.timer.lastBuyerAddress && (
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Last Purchase</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Buyer</p>
                      <p className="font-mono text-sm">{formatAddress(data.timer.lastBuyerAddress)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold">{data.timer.lastPurchaseAmount.toFixed(2)} SOL</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Vault Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Treasury Card */}
              <Card className="p-6 bg-white border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Treasury</h3>
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {data.vault.treasury.amount.toFixed(2)} {data.vault.treasury.asset}
                  </div>
                  <div className="text-lg text-green-600 font-semibold">
                    ${data.vault.treasury.usdValue.toFixed(2)}
                  </div>
                </div>
              </Card>

              {/* Potential Winnings Card */}
              <Card className="p-6 bg-white border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Potential Winnings</h3>
                  <GiftIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {data.vault.potentialWinnings.multiplier}x
                  </div>
                  <div className="text-lg text-purple-600 font-semibold">
                    ${data.vault.potentialWinnings.usdValue.toFixed(2)}
                  </div>
                </div>
              </Card>

              {/* Endgame Days Left Card */}
              <Card className="p-6 bg-white border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Endgame Days Left</h3>
                  <ChartBarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {data.vault.endgame.daysLeft}
                  </div>
                  <div className="text-sm text-gray-600">
                    Days until endgame
                  </div>
                </div>
              </Card>

              {/* Airdrop Countdown Card */}
              <Card className="p-6 bg-white border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Next Airdrop</h3>
                  <CloudArrowDownIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatTime(airdropTime)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Daily at 12 PM ET
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Buys */}
            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Buys</h3>
              {recentBuys.length > 0 ? (
                <div className="space-y-3">
                  {recentBuys.map((buy, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-mono text-sm text-gray-900">{formatAddress(buy.address)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(buy.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{buy.amount.toFixed(2)} SOL</p>
                        <p className="text-xs text-gray-500">#{index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent purchases</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Trade Widget */}
          <div className="space-y-6">
            
            {/* Trade Widget */}
            <Card className="p-6 bg-white border-gray-200 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Trade {data.vaultConfig?.airdropAsset || 'TOKEN'} to Win Vault
              </h3>
              <JupiterWidget 
                tokenAddress={data.vaultConfig?.tokenMint || data.token?.address || "9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p"}
                tokenSymbol={data.vaultConfig?.airdropAsset || "TOKEN"}
              />
            </Card>

            {/* Vault Info */}
            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vault Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vault Asset:</span>
                  <span className="font-semibold">{data.vaultConfig?.vaultAsset || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Airdrop Asset:</span>
                  <span className="font-semibold">{data.vaultConfig?.airdropAsset || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Hold Amount:</span>
                  <span className="font-semibold">{data.vaultConfig?.minHoldAmount?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timer Duration:</span>
                  <span className="font-semibold">{data.vaultConfig ? Math.floor(data.vaultConfig.timerDuration / 3600) + 'h' : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-semibold">{data.vaultConfig ? new Date(data.vaultConfig.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
