'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import JupiterWidget from '../components/JupiterWidget';
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
}

export default function Home() {
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [airdropTime, setAirdropTime] = useState(86400); // 24 hours in seconds
  const [activeTab, setActiveTab] = useState<'vault' | 'airdrop'>('vault');

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

  // Airdrop countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setAirdropTime(prev => {
        if (prev <= 1) {
          return 86400; // Reset to 24 hours
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('https://treasury-vault-timer-backend.onrender.com/api/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
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

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          <motion.button
            onClick={() => setActiveTab('vault')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'vault'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Hunt the Treasury</span>
            </div>
          </motion.button>
          
          <motion.button
            onClick={() => setActiveTab('airdrop')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'airdrop'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Farm Daily Airdrops</span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Vault Content */}
          <div className="lg:col-span-2">
            {/* Vault Header */}
            <Card className="p-8 bg-white border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-8">
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
                    <h1 className="text-3xl font-bold text-gray-900">MicroScratchety</h1>
                    <p className="text-lg text-gray-700">REVS</p>
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
            <Card className="p-6 bg-white border-gray-200 shadow-lg">
              <div className="rounded-xl h-64 relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
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
            <Card className="p-6 bg-white border-gray-200 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Buys</h3>
              <div className="space-y-3">
                {data.buyLog?.slice(0, 5).map((buy, index) => (
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
                      <p className="text-xs text-gray-500">{(buy.amount * 0.000711).toFixed(4)} SOL</p>
                    </div>
                  </motion.div>
                ))}
                {(!data.buyLog || data.buyLog.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent purchases</p>
                    <p className="text-sm mt-1">Start trading REVS to see your recent buys here!</p>
                  </div>
                )}
              </div>
            </Card>

            {/* How it Works Section */}
            <Card className="p-6 bg-white border-gray-200 shadow-lg">
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
                      {(data.vault?.potentialWinnings?.multiplier || 100).toLocaleString()}x
                    </div>
                    <div className="text-xs text-gray-500">Potential Winnings</div>
                  </motion.div>

                  <motion.div
                    className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {data.vault?.endgame?.daysLeft || 98} Days
                    </div>
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
                      Min Buy: 1 REVS
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
                    <div className="text-sm font-bold text-gray-900">1,250.5 SOL</div>
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
                    <div className="text-sm font-bold text-gray-900">1,103</div>
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
                    <div className="text-sm font-bold text-gray-900">200K</div>
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
                    <div className="text-sm font-bold text-gray-900">143%</div>
                    <div className="text-xs text-gray-500">APY</div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Jupiter Trading Widget */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Trade REVS</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Token Price</span>
                    <span className="text-sm font-medium text-gray-900">${data.token.price.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Market Cap</span>
                    <span className="text-sm font-medium text-gray-900">${data.token.marketCap.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Jupiter Widget */}
                <JupiterWidget 
                  tokenAddress={data.token.address}
                  tokenSymbol="REVS"
                />
              </div>
            </Card>
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
                    <h3 className="text-lg font-semibold text-gray-900">MicroScratchety</h3>
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
                    <p className="text-lg font-bold text-gray-900">{data.vault?.endgame?.daysLeft || 88}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Must Hold</p>
                    <p className="text-lg font-bold text-gray-900">{(data.vault?.airdrop?.minimumHold || 200000).toLocaleString()}</p>
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

