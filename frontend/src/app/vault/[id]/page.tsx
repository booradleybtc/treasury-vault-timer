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
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button 
                variant="outline" 
                onClick={() => router.push('/vaults')}
                className="flex items-center space-x-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back to Vaults</span>
              </Button>
              
              <div className="flex items-center space-x-6">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-white text-3xl font-bold">
                    {data.vaultConfig?.name?.charAt(0) || 'V'}
                  </span>
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {data.vaultConfig?.name || 'Vault'}
                    <span className="ml-3 text-lg font-semibold text-orange-400 align-middle bg-orange-900/30 px-3 py-1 rounded-full">
                      {data.vaultConfig?.airdropAsset || 'TOKEN'}
                    </span>
                  </h1>
                  <p className="text-gray-300 text-lg">
                    {data.vaultConfig?.description || 'Dynamic exploding treasury vault'}
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-300">Live Trading</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Created {data.vaultConfig ? new Date(data.vaultConfig.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-2">Vault Status</div>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                data.vaultConfig?.status === 'active' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  data.vaultConfig?.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`}></div>
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
            <Card className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white">Vault Timer</h2>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-8 h-8 text-orange-400" />
                  <div className={`w-3 h-3 rounded-full ${data.timer.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                </div>
              </div>
              
              <div className="text-center mb-8">
                <motion.div 
                  className="text-8xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-4"
                  animate={{ 
                    scale: data.timer.isActive ? [1, 1.02, 1] : 1,
                    textShadow: data.timer.isActive ? [
                      "0 0 20px rgba(251, 146, 60, 0.5)",
                      "0 0 30px rgba(251, 146, 60, 0.8)",
                      "0 0 20px rgba(251, 146, 60, 0.5)"
                    ] : "0 0 0px rgba(251, 146, 60, 0)"
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: data.timer.isActive ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                >
                  {formatTime(currentTime)}
                </motion.div>
                <motion.p 
                  className="text-xl text-gray-300"
                  animate={{ opacity: data.timer.isActive ? [0.7, 1, 0.7] : 1 }}
                  transition={{ 
                    duration: 1.5,
                    repeat: data.timer.isActive ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                >
                  {data.timer.isActive ? 'Timer Active - Buy to Reset!' : 'Timer Inactive'}
                </motion.p>
                {data.timer.isActive && (
                  <motion.div 
                    className="mt-4 text-sm text-orange-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ 
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    ⚡ Timer resets with each purchase!
                  </motion.div>
                )}
              </div>
              
              {data.timer.lastBuyerAddress && (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="font-semibold text-white mb-4 text-lg">Last Purchase</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Buyer</p>
                      <p className="font-mono text-sm text-orange-400">{formatAddress(data.timer.lastBuyerAddress)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Amount</p>
                      <p className="font-semibold text-green-400 text-lg">{data.timer.lastPurchaseAmount.toFixed(2)} SOL</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Vault Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Treasury Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-6 bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-500/30 backdrop-blur-sm hover:border-green-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Treasury</h3>
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <CurrencyDollarIcon className="w-8 h-8 text-green-400" />
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <motion.div 
                      className="text-4xl font-bold text-green-400 mb-2"
                      animate={{ 
                        textShadow: [
                          "0 0 10px rgba(34, 197, 94, 0.3)",
                          "0 0 20px rgba(34, 197, 94, 0.6)",
                          "0 0 10px rgba(34, 197, 94, 0.3)"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {data.vault.treasury.amount.toFixed(2)} {data.vault.treasury.asset}
                    </motion.div>
                    <div className="text-2xl text-white font-semibold">
                      ${data.vault.treasury.usdValue.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-300 mt-2">
                      Growing with each purchase
                    </div>
                    <div className="mt-3 text-xs text-green-400">
                      💰 Tax feeds treasury automatically
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Potential Winnings Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Potential Winnings</h3>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <GiftIcon className="w-8 h-8 text-purple-400" />
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <motion.div 
                      className="text-4xl font-bold text-purple-400 mb-2"
                      animate={{ 
                        textShadow: [
                          "0 0 10px rgba(168, 85, 247, 0.3)",
                          "0 0 20px rgba(168, 85, 247, 0.6)",
                          "0 0 10px rgba(168, 85, 247, 0.3)"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {data.vault.potentialWinnings.multiplier}x
                    </motion.div>
                    <div className="text-2xl text-white font-semibold">
                      ${data.vault.potentialWinnings.usdValue.toFixed(2)}
                    </div>
                    <div className="text-sm text-purple-300 mt-2">
                      Last buyer wins all
                    </div>
                    <div className="mt-3 text-xs text-purple-400">
                      🎯 Winner takes the entire treasury
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Endgame Days Left Card */}
              <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/30 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Endgame Days Left</h3>
                  <ChartBarIcon className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {data.vault.endgame.daysLeft}
                  </div>
                  <div className="text-lg text-white font-semibold">
                    Days until endgame
                  </div>
                  <div className="text-sm text-blue-300 mt-2">
                    Distribution period begins
                  </div>
                </div>
              </Card>

              {/* Airdrop Countdown Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-6 bg-gradient-to-br from-indigo-900/20 to-indigo-800/20 border-indigo-500/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Next Airdrop</h3>
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <CloudArrowDownIcon className="w-8 h-8 text-indigo-400" />
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <motion.div 
                      className="text-4xl font-bold text-indigo-400 mb-2 font-mono"
                      animate={{ 
                        textShadow: [
                          "0 0 10px rgba(99, 102, 241, 0.3)",
                          "0 0 20px rgba(99, 102, 241, 0.6)",
                          "0 0 10px rgba(99, 102, 241, 0.3)"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {formatTime(airdropTime)}
                    </motion.div>
                    <div className="text-lg text-white font-semibold">
                      Daily at 12 PM ET
                    </div>
                    <div className="text-sm text-indigo-300 mt-2">
                      Hold {data.vaultConfig?.minHoldAmount?.toLocaleString() || '200,000'} tokens
                    </div>
                    <div className="mt-3 text-xs text-indigo-400">
                      🎁 Automatic distribution to holders
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Token Price Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-6 bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-500/30 backdrop-blur-sm hover:border-yellow-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Token Price</h3>
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      <ChartBarIcon className="w-8 h-8 text-yellow-400" />
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <motion.div 
                      className="text-4xl font-bold text-yellow-400 mb-2"
                      animate={{ 
                        textShadow: [
                          "0 0 10px rgba(234, 179, 8, 0.3)",
                          "0 0 20px rgba(234, 179, 8, 0.6)",
                          "0 0 10px rgba(234, 179, 8, 0.3)"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      ${data.token?.price ? data.token.price.toFixed(6) : 'N/A'}
                    </motion.div>
                    <div className="text-lg text-white font-semibold">
                      Market Cap: ${data.token?.marketCap ? (data.token.marketCap / 1000000).toFixed(1) + 'M' : 'N/A'}
                    </div>
                    <div className="text-sm text-yellow-300 mt-2">
                      24h Volume: ${data.token?.volume24h ? (data.token.volume24h / 1000).toFixed(1) + 'K' : 'N/A'}
                    </div>
                    <div className="mt-3 text-xs text-yellow-400">
                      📈 Real-time price updates
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Vault Activity Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-6 bg-gradient-to-br from-pink-900/20 to-pink-800/20 border-pink-500/30 backdrop-blur-sm hover:border-pink-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Vault Activity</h3>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <BoltIcon className="w-8 h-8 text-pink-400" />
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-pink-400 mb-2">
                      {recentBuys.length}
                    </div>
                    <div className="text-lg text-white font-semibold">
                      Recent Purchases
                    </div>
                    <div className="text-sm text-pink-300 mt-2">
                      Last 24 hours
                    </div>
                    <div className="mt-3 text-xs text-pink-400">
                      🔥 High activity = more competition
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Recent Buys */}
            <Card className="p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-6">Recent Buys</h3>
              {recentBuys.length > 0 ? (
                <div className="space-y-4">
                  {recentBuys.map((buy, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-mono text-sm text-orange-400">{formatAddress(buy.address)}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(buy.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-400 text-lg">{buy.amount.toFixed(2)} SOL</p>
                        <p className="text-xs text-gray-400">Purchase #{index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChartBarIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-lg">No recent purchases</p>
                  <p className="text-gray-500 text-sm mt-2">Be the first to buy and reset the timer!</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Trade Widget */}
          <div className="space-y-6">
            
            {/* Trade Widget */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700 shadow-2xl backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Trade {data.vaultConfig?.airdropAsset || 'TOKEN'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <motion.div 
                      className="w-2 h-2 bg-green-400 rounded-full"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    ></motion.div>
                    <span className="text-sm text-green-400 font-medium">Live Trading</span>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-300 text-sm mb-2">Buy to reset the timer and win the vault!</p>
                  <motion.div 
                    className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3"
                    animate={{ 
                      borderColor: [
                        "rgba(249, 115, 22, 0.3)",
                        "rgba(249, 115, 22, 0.6)",
                        "rgba(249, 115, 22, 0.3)"
                      ]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <p className="text-orange-300 text-sm font-medium">
                      ⚡ Last buyer wins {data.vault.potentialWinnings.multiplier}x the treasury!
                    </p>
                  </motion.div>
                </div>
                <JupiterWidget 
                  tokenAddress={data.vaultConfig?.tokenMint || data.token?.address || "9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p"}
                  tokenSymbol={data.vaultConfig?.airdropAsset || "TOKEN"}
                />
              </Card>
            </motion.div>

            {/* Vault Info */}
            <Card className="p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-6">Vault Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Vault Asset:</span>
                  <span className="font-semibold text-white">{data.vaultConfig?.vaultAsset || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Airdrop Asset:</span>
                  <span className="font-semibold text-orange-400">{data.vaultConfig?.airdropAsset || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Min Hold Amount:</span>
                  <span className="font-semibold text-white">{data.vaultConfig?.minHoldAmount?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Timer Duration:</span>
                  <span className="font-semibold text-blue-400">{data.vaultConfig ? Math.floor(data.vaultConfig.timerDuration / 3600) + 'h' : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Created:</span>
                  <span className="font-semibold text-white">{data.vaultConfig ? new Date(data.vaultConfig.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Whitelisted Addresses:</span>
                  <span className="font-semibold text-purple-400">{data.vaultConfig?.whitelistedAddresses?.length || 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
