'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Button, Card, Input } from '@/components/ui';
import { io, Socket } from 'socket.io-client';
// Load Jupiter client-only to avoid SSR/react default import issues
const JupiterWidget = dynamic(() => import('@/components/JupiterWidget'), { ssr: false });
import { 
  MagnifyingGlassIcon, 
  ChevronDownIcon,
  CurrencyDollarIcon,
  ClockIcon,
  GiftIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  CloudArrowDownIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

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

export default function Home() {
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [airdropTime, setAirdropTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'vault' | 'airdrop'>('vault');
  const [socket, setSocket] = useState<Socket | null>(null);
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  // Redirect to vaults page on mount
  useEffect(() => {
    window.location.href = '/vaults';
  }, []);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    const newSocket = io(BACKEND, {
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('🔌 Connected to backend via Socket.IO');
    });
    
    newSocket.on('vaultConfigUpdated', (updateData) => {
      console.log('🔄 Vault config updated:', updateData);
      // Refresh data when vault config changes
      fetchData();
    });
    
    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from backend');
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [BACKEND]);

  // Real-time countdown timer
  useEffect(() => {
    if (!data) return;

    setCurrentTime(data.timer.timeLeft);
    
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev <= 1) {
          fetchData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  // Airdrop countdown timer -> next 12:00 PM America/New_York daily
  useEffect(() => {
    const computeSecondsToNextNoonNY = () => {
      const now = new Date();
      const nyNow = new Date(
        new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
      );
      const target = new Date(nyNow);
      target.setHours(12, 0, 0, 0); // 12:00:00 local NY time
      if (nyNow >= target) {
        target.setDate(target.getDate() + 1);
      }
      // Convert target NY time back to UTC milliseconds via timezone trick
      const targetUTC = new Date(
        target.toLocaleString('en-US', { timeZone: 'UTC' })
      );
      return Math.max(0, Math.floor((targetUTC.getTime() - now.getTime()) / 1000));
    };

    setAirdropTime(computeSecondsToNextNoonNY());
    const interval = setInterval(() => {
      setAirdropTime((prev) => (prev > 0 ? prev - 1 : computeSecondsToNextNoonNY()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching data from backend...');
      
      // Use configured backend URL (with local fallback)
      const backendUrls = [`${BACKEND}/api/dashboard`];
      
      let response = null;
      let lastError = null;
      
      for (const url of backendUrls) {
        try {
          console.log(`🔄 Trying: ${url}`);
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'cors',
            // Add timeout
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });

          if (response.ok) {
            console.log(`✅ Successfully connected to: ${url}`);
            break;
          } else {
            console.log(`❌ HTTP ${response.status} from: ${url}`);
            lastError = new Error(`HTTP ${response.status} from ${url}`);
          }
        } catch (error) {
          console.log(`❌ Failed to connect to: ${url}`, error.message);
          lastError = error;
          response = null;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error('All backend URLs failed');
      }

      const result = await response.json();
      // Never trust dashboard.buyLog (may contain seed data). Start empty.
      result.buyLog = [];
      // If purchases endpoint exists, hydrate buyLog with it to ensure live last 3
      try {
        const purchasesRaw = await fetch(`${BACKEND}/api/purchases`).catch(() => null);
        const purchasesRes = purchasesRaw && purchasesRaw.ok ? await purchasesRaw.json() : null;
        if (purchasesRes?.purchases) {
          result.buyLog = purchasesRes.purchases.map((p: any) => ({
            address: p.buyer || p.address,
            amount: Number(p.amount || 0),
            txSignature: p.signature || p.txSignature,
            timestamp: p.timestamp || Date.now()
          }));
        }
      } catch {}
      console.log('✅ Data fetched successfully:', result);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Backend unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

const formatAddress = (address: string | null) => {
  if (!address) return 'N/A';
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading Treasury Vault Data...</p>
        </motion.div>
      </div>
    );
  }

  // Show error banner if backend is unavailable
  const showErrorBanner = error && error.includes('Backend unavailable');

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-xl text-gray-600 mb-8">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Error Banner */}
      {showErrorBanner && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Demo Mode:</strong> Backend is currently unavailable. Showing sample data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <img 
                  src="/images/darwin-logo.png" 
                  alt="Darwin Logo" 
                  className="w-8 h-8"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center hidden">
                  <span className="text-white text-sm font-bold">D</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Darwin</span>
              </div>
              <Input
                placeholder="Q Search Vaults"
                className="w-64"
                icon={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
              />
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="flex items-center space-x-2">
                <span>Browse by Asset</span>
                <ChevronDownIcon className="w-4 h-4" />
              </Button>
              <Button>Launch Vault</Button>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Vault Content */}
          <div className="lg:col-span-2">
            {/* Vault Header */}
            <Card className="p-6 bg-white border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="w-16 h-16 rounded-lg shadow-lg overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <img 
                      src="/images/vault-profile.png" 
                      alt="Vault Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center hidden">
                      <span className="text-white text-2xl font-bold">B</span>
                    </div>
                  </motion.div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {data.vaultConfig?.name || 'RevShare'} 
                      <span className="ml-2 text-sm font-semibold text-gray-600 align-middle">
                        {data.vaultConfig?.airdropAsset || 'REVS'}
                      </span>
                    </h1>
                    {/* Token address under name, small */}
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-mono text-gray-500">
                          {data.vaultConfig?.tokenMint ? `${data.vaultConfig.tokenMint.slice(0, 8)}...${data.vaultConfig.tokenMint.slice(-8)}` : 
                           data.token?.address ? `${data.token.address.slice(0, 8)}...${data.token.address.slice(-8)}` : '9VxExA1i...BMaBaY1p'}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(data.vaultConfig?.tokenMint || data.token?.address || '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p');
                            // You could add a toast notification here
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* Price & Market Cap */}
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Price:</span>
                        <span className="text-sm font-semibold text-gray-900">{typeof data.token?.price === 'number' && data.token.price > 0 ? `$${data.token.price.toFixed(6)}` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">MC:</span>
                        <span className="text-sm font-semibold text-gray-900">{typeof data.token?.marketCap === 'number' && data.token.marketCap > 0 ? `$${(data.token.marketCap / 1000000).toFixed(1)}M` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {/* Timer */}
                  <motion.div
                    className="text-5xl font-mono font-bold text-gray-900"
                    key={currentTime}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formatTime(currentTime)}
                  </motion.div>
                  {/* Last Buyer Info */}
                  <div className="mt-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <p className="text-sm text-gray-500">Last Buyer:</p>
                      <p className="text-sm font-mono text-gray-700">{formatAddress(data.timer.lastBuyerAddress)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Vault Door & Stream Area */}
            <Card className="p-6 bg-white border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="rounded-xl h-80 relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold">B</span>
                  </div>
                  <p className="text-xl font-semibold mb-2">Vault Door & Stream</p>
                  <p className="text-sm opacity-80 mb-3">Live stream will appear here</p>
                  <div className="flex items-center justify-center space-x-2 text-xs opacity-60">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Live Stream Coming Soon</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Buys Section */}
            <Card className="p-6 bg-white border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Buys</h3>
              <div className="space-y-3">
                {data.buyLog && data.buyLog.length > 0 ? data.buyLog.slice(0, 3).map((buy, index) => (
                  <motion.div
                    key={buy.txSignature}
                    className={`flex justify-between items-center p-4 rounded-lg border ${
                      index === 0 
                        ? 'bg-green-50 border-green-200 shadow-sm' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        <span className={`text-xs font-bold ${
                          index === 0 ? 'text-white' : 'text-gray-600'
                        }`}>
                          {index === 0 ? '★' : index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-mono text-gray-700">{formatAddress(buy.address)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(buy.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{buy.amount.toFixed(2)} REVS</p>
                      {data.token?.price ? (
                        <p className="text-xs text-gray-500">${(buy.amount * data.token.price).toFixed(2)}</p>
                      ) : null}
                    </div>
                  </motion.div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent purchases</p>
                  </div>
                )}
              </div>
            </Card>

            {/* How it Works Section */}
            <Card className="p-6 bg-white border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>How it Works</span>
                </h3>
                <Button variant="outline" size="sm">
                  Read Docs
                </Button>
              </div>
              <div className="rounded-xl h-48 bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-2">🐢</div>
                  <p className="text-lg font-semibold">Jungle Treasury Hunt</p>
                  <p className="text-sm opacity-80">Navigate the vault to win big!</p>
                </div>
              </div>
            </Card>

          </div>

          {/* Sidebar - Tab-based Content */}
          <div className="space-y-6">
            {/* Tab Navigation - Only Above Sidebar */}
            <div className="flex space-x-2">
              <motion.button
                onClick={() => setActiveTab('vault')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTab === 'vault'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Vault</span>
                </div>
              </motion.button>
              
              <motion.button
                onClick={() => setActiveTab('airdrop')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTab === 'airdrop'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Airdrop</span>
                </div>
              </motion.button>
            </div>
            {activeTab === 'vault' ? (
              /* Vault Tab Sidebar */
              <div className="space-y-6">
                {/* Large Treasury Card */}
                <Card className="p-6 bg-white border-gray-200 shadow-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <CurrencyDollarIcon className="w-8 h-8 text-gray-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Treasury Vault</h3>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {data.vault?.treasury?.amount ? 
                        (data.vault.treasury.amount > 1000000 ? 
                          `${(data.vault.treasury.amount / 1000000).toFixed(1)}M` : 
                          data.vault.treasury.amount.toLocaleString()
                        ) : '0'} {data.vault?.treasury?.asset || 'REVS'}
                    </div>
                    <div className="text-sm text-gray-600">${(data.vault?.treasury?.usdValue || 0).toLocaleString()}</div>
                  </div>
                </Card>

                {/* Vault Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <BoltIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      ${(data.vault?.treasury?.usdValue ? (data.vault.treasury.usdValue * 100).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0')}
                    </div>
                    <div className="text-xs text-gray-500">Potential Winnings (USD)</div>
                  </motion.div>

                  <motion.div
                    className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">{data.vault?.endgame?.daysLeft ?? 0} Days</div>
                    <div className="text-xs text-gray-500">Endgame</div>
                  </motion.div>

                  <motion.div
                    className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <ClockIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      Min Buy: 1 REVS*
                    </div>
                    <div className="text-xs text-gray-500">To Reset Timer</div>
                  </motion.div>

                  <motion.div
                    className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <UserGroupIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatAddress(data.timer.lastBuyerAddress)}
                    </div>
                    <div className="text-xs text-gray-500">Current Winner</div>
                  </motion.div>
                </div>
              </div>
            ) : (
              /* Airdrop Tab Sidebar */
              <div className="space-y-6">
                {/* Large Airdrop Card */}
                <Card className="p-6 bg-white border-gray-200 shadow-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <CloudArrowDownIcon className="w-8 h-8 text-gray-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Next Airdrop</h3>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{formatTime(airdropTime)}</div>
                    <div className="text-sm text-gray-600">
                      {data.vault?.airdrop?.amount ? 
                        (data.vault.airdrop.amount > 1000000 ? 
                          `${(data.vault.airdrop.amount / 1000000).toFixed(1)}M` : 
                          data.vault.airdrop.amount.toLocaleString()
                        ) : '0'} REVS
                    </div>
                  </div>
                </Card>

                {/* Airdrop Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <GiftIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {data.vault?.airdrop?.totalAirdroppedSOL !== undefined ? 
                        `${data.vault.airdrop.totalAirdroppedSOL.toFixed(1)} SOL` : 
                        'N/A'
                      }
                    </div>
                    <div className="text-xs text-gray-500">Total Airdropped</div>
                  </motion.div>

                  <motion.div
                    className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <UserGroupIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {data.vault?.airdrop?.eligibleHolders !== undefined ? data.vault.airdrop.eligibleHolders.toLocaleString() : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Eligible Holders</div>
                  </motion.div>

                  <motion.div
                    className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">200K*</div>
                    <div className="text-xs text-gray-500">Must Hold</div>
                  </motion.div>

                  <motion.div
                    className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <ChartBarIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">143%*</div>
                    <div className="text-xs text-gray-500">APY</div>
                  </motion.div>
                </div>
              </div>
            )}


            {/* Trade REVS to Win Vault Card */}
            <Card className="p-6 bg-white border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Trade {data.vaultConfig?.airdropAsset || 'REVS'} to Win Vault
              </h3>
              <JupiterWidget 
                tokenAddress={data.vaultConfig?.tokenMint || data.token?.address || "9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p"}
                tokenSymbol={data.vaultConfig?.airdropAsset || "REVS"}
              />
            </Card>

            {/* Mock Data Legend */}
            <div className="text-xs text-gray-500 text-center">
              * = Mock data (not live)
            </div>
          </div>
        </div>

        {/* Darwin Vaults Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Darwin Vaults</h2>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="flex items-center space-x-2">
                <span>Filter by Treasury Asset</span>
                <ChevronDownIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Vaults List - Modern Horizontal Cards */}
          <div className="space-y-4">
            <motion.div
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-lg">B</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">RevShare</h3>
                    <p className="text-sm text-gray-500">REVS • Active</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Timer</p>
                    <p className="text-lg font-mono font-bold text-gray-900">{formatTime(currentTime)}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Treasury</p>
                    <p className="text-lg font-bold text-gray-900">{(data.vault?.treasury?.amount || 0).toFixed(2)} REVS</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Potential</p>
                    <p className="text-lg font-bold text-gray-900">{(data.vault?.potentialWinnings?.multiplier || 100)}x</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Days Left</p>
                    <p className="text-lg font-bold text-gray-900">{data.vault?.endgame?.daysLeft || 88}*</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Must Hold</p>
                    <p className="text-lg font-bold text-gray-900">{(data.vault?.airdrop?.minimumHold || 200000).toLocaleString()}*</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

