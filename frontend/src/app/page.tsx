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
  CloudArrowDownIcon
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Modern Header */}
      <div className="bg-black/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
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
                <span className="text-xl font-bold text-white">Darwin</span>
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
          {/* Main Vault Card */}
          <div className="lg:col-span-2">
            <Card className="p-8 bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              {/* Vault Header */}
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
                  <h1 className="text-3xl font-bold text-white">MicroScratchety</h1>
                  <p className="text-lg text-gray-300">REVS</p>
                  </div>
                </div>
                <div className="text-right">
                  {/* Active Status */}
                  <div className="flex items-center justify-end space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${data.timer.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">{data.timer.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
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
                    <p className="text-sm text-gray-500">Last Buyer</p>
                    <p className="text-sm font-mono text-gray-700">{formatAddress(data.timer.lastBuyerAddress)}</p>
                    <p className="text-lg font-bold text-green-600">{data.timer.lastPurchaseAmount.toFixed(4)} SOL</p>
                  </div>
                </div>
              </div>

              {/* Buy Log */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Buys</h3>
                <div className="space-y-2">
                  {data.buyLog?.slice(0, 5).map((buy, index) => (
                    <motion.div
                      key={buy.txSignature}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-xs font-bold">{index + 1}</span>
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
                      </div>
                    </motion.div>
                  ))}
                  {(!data.buyLog || data.buyLog.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No recent purchases</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vault Banner Image */}
              <div className="mb-8">
                <div className="rounded-xl h-64 relative overflow-hidden">
                  <img 
                    src="/images/vault-banner.png" 
                    alt="Vault Banner" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center relative overflow-hidden hidden">
                    <div className="absolute inset-0 bg-black opacity-20"></div>
                    <div className="relative text-center text-white">
                      <div className="text-8xl mb-4">🏦</div>
                      <p className="text-2xl font-bold mb-2">Vault Door & SCRATCH Stacks</p>
                      <p className="text-orange-100">Secure Treasury Vault</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Grid - Improved Hierarchy */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <motion.div
                  className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200"
                  whileHover={{ scale: 1.02, shadow: 'lg' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center mb-3">
                    <CurrencyDollarIcon className="w-8 h-8 text-gray-700" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.vault?.treasury?.amount ? 
                      (data.vault.treasury.amount > 1000000 ? 
                        `${(data.vault.treasury.amount / 1000000).toFixed(1)}M` : 
                        data.vault.treasury.amount.toLocaleString()
                      ) : '0'} {data.vault?.treasury?.asset || 'REVS'}
                  </div>
                  <div className="text-sm text-gray-600">${(data.vault?.treasury?.usdValue || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">Treasury</div>
                </motion.div>

                <motion.div
                  className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200"
                  whileHover={{ scale: 1.02, shadow: 'lg' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center mb-3">
                    <BoltIcon className="w-8 h-8 text-gray-700" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{(data.vault?.potentialWinnings?.multiplier || 100).toLocaleString()}x</div>
                  <div className="text-sm text-gray-600">${(data.vault?.potentialWinnings?.usdValue || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">Potential Winnings</div>
                </motion.div>

                <motion.div
                  className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200"
                  whileHover={{ scale: 1.02, shadow: 'lg' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center mb-3">
                    <ClockIcon className="w-8 h-8 text-gray-700" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{data.vault?.timer?.hoursLeft || 1} Hour</div>
                  <div className="text-sm text-gray-600">Alive {data.vault?.timer?.daysAlive || 12} Days</div>
                  <div className="text-xs text-gray-500 mt-1">Timer</div>
                </motion.div>

                <motion.div
                  className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200"
                  whileHover={{ scale: 1.02, shadow: 'lg' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center mb-3">
                    <CloudArrowDownIcon className="w-8 h-8 text-gray-700" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{formatTime(airdropTime)}</div>
                  <div className="text-sm text-gray-600">
                    {data.vault?.airdrop?.amount ? 
                      (data.vault.airdrop.amount > 1000000 ? 
                        `${(data.vault.airdrop.amount / 1000000).toFixed(1)}M` : 
                        data.vault.airdrop.amount.toLocaleString()
                      ) : '0'} REVS
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Next Airdrop • Noon Eastern</div>
                </motion.div>

                <motion.div
                  className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200"
                  whileHover={{ scale: 1.02, shadow: 'lg' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center mb-3">
                    <ChartBarIcon className="w-8 h-8 text-gray-700" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{data.vault?.apy?.percentage || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Since Launch</div>
                  <div className="text-xs text-gray-500 mt-1">APY</div>
                </motion.div>

                <motion.div
                  className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200"
                  whileHover={{ scale: 1.02, shadow: 'lg' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center mb-3">
                    <ExclamationTriangleIcon className="w-8 h-8 text-gray-700" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{data.vault?.endgame?.daysLeft || 88} Days</div>
                  <div className="text-sm text-gray-600">Until Distribution</div>
                  <div className="text-xs text-gray-500 mt-1">Endgame</div>
                </motion.div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Jupiter Trading Widget */}
          <div className="space-y-6">
            {/* Jupiter Trading Widget */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Trade SCRATCH</h3>
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

        {/* Top Vaults Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Top Vaults</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Time Remaining</span>
                <span className="text-sm text-gray-600">Trade: Win</span>
              </div>
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

