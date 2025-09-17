'use client';

import { useState, useEffect } from 'react';

interface VaultData {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  timer: {
    timeLeft: number;
    isActive: boolean;
    lastPurchaseTime: string | null;
    lastBuyerAddress: string;
    lastPurchaseAmount: number;
  };
  token: {
    address: string;
    price: number;
    marketCap: number;
    volume24h: number;
    lastUpdated: string;
  };
  treasury: {
    amount: number;
    asset: string;
    usdValue: number;
  };
  metrics: {
    potentialWinnings: number;
    apy: number;
    airdrop: {
      frequency: string;
      requirement: number;
    };
    endgame: {
      hours: number;
      description: string;
    };
  };
}

export default function Home() {
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Countdown');

  useEffect(() => {
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
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Transform backend data to match our vault structure
        const vaultData: VaultData = {
          id: 'rayscratch',
          name: 'MicroScratchety',
          symbol: 'SCRATCH',
          logo: 'B',
          timer: result.timer,
          token: result.token,
          treasury: {
            amount: 2.52,
            asset: 'zBTC',
            usdValue: 239192
          },
          metrics: {
            potentialWinnings: 100000000,
            apy: 464,
            airdrop: {
              frequency: 'Daily',
              requirement: 100000
            },
            endgame: {
              hours: 88,
              description: 'Until Distribution'
            }
          }
        };
        
        setData(vaultData);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading Treasury Vault Data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-xl text-gray-600 mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex items-center space-x-8 py-4">
            {['Countdown', 'Shifter (copy)', 'Darwin Presale'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium pb-2 border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* Main Header */}
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                Show UI
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">D</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Darwin</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Q Search Vaults"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center space-x-2">
                <span>Browse by Asset</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium">
                Launch Vault
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Vault Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Vault Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{data.logo}</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
                    <p className="text-lg text-gray-600">{data.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-mono font-bold text-gray-900">
                    {formatTime(data.timer.timeLeft)}
                  </div>
                  <div className="flex items-center justify-end space-x-2 mt-2">
                    <div className={`w-3 h-3 rounded-full ${data.timer.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">{data.timer.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>

              {/* Vault Graphic */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-8 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏦</div>
                    <p className="text-gray-600">Vault Door & {data.symbol} Stacks</p>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">B</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{data.treasury.amount} {data.treasury.asset}</div>
                  <div className="text-sm text-gray-600">${data.treasury.usdValue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">Treasury</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.metrics.potentialWinnings.toLocaleString()}x</div>
                  <div className="text-sm text-gray-600">$11,049,394,242</div>
                  <div className="text-xs text-gray-500 mt-1">Potential Winnings</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">1 Hour</div>
                  <div className="text-sm text-gray-600">Alive 12 Days</div>
                  <div className="text-xs text-gray-500 mt-1">Timer</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">B</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{data.metrics.airdrop.frequency}</div>
                  <div className="text-sm text-gray-600">Must Hold {data.metrics.airdrop.requirement.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">Airdrop</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{data.metrics.apy}%</div>
                  <div className="text-sm text-gray-600">Since Launch</div>
                  <div className="text-xs text-gray-500 mt-1">APY</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{data.metrics.endgame.hours} Hour</div>
                  <div className="text-sm text-gray-600">{data.metrics.endgame.description}</div>
                  <div className="text-xs text-gray-500 mt-1">Endgame</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trade to Win Vault */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Trade to Win Vault</h3>
              <p className="text-gray-600 mb-4">
                Everyday 10,000+ potential clients visit our website. Hire exclusive talent by posting your job today.
              </p>
              <button className="w-full bg-black text-white py-3 rounded-lg font-medium">
                Post a Job on Shifter
              </button>
            </div>

            {/* Last Buyer Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Last Buyer</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-mono text-gray-900">{formatAddress(data.timer.lastBuyerAddress)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SOL Spent</p>
                  <p className="text-2xl font-bold text-green-600">{data.timer.lastPurchaseAmount.toFixed(4)} SOL</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Vaults Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Top Vaults</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Time Remaining</span>
                <span className="text-sm text-gray-600">Trade: Win</span>
              </div>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center space-x-2">
                <span>Filter by Treasury Asset</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Vaults List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vault</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treasury</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade: Win</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hold: Earn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Must Hold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">⚡</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Dontechi</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {formatTime(data.timer.timeLeft)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">4.52 zBTC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1,000x</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">164%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">100,000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Dec 25</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}