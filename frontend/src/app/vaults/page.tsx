'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { motion } from 'framer-motion';
import { 
  ClockIcon,
  CurrencyDollarIcon,
  GiftIcon,
  ChartBarIcon,
  ArrowRightIcon,
  PlusIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

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

export default function VaultsPage() {
  const [vaults, setVaults] = useState<VaultConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'ended'>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const filteredVaults = vaults.filter(vault => {
    const statusMatch = filter === 'all' || vault.status === filter;
    const assetMatch = assetFilter === 'all' || vault.vaultAsset === assetFilter;
    return statusMatch && assetMatch;
  });

  const featuredVaults = vaults.filter(vault => vault.status === 'active');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vaults...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadVaults}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">D</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Darwin</h1>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Q Search Vaults"
                  className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Browse by Asset</option>
                <option value="SOL">SOL</option>
                <option value="USDC">USDC</option>
                <option value="zBTC">zBTC</option>
              </select>
              
              <Button 
                onClick={() => window.location.href = '/admin'}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Launch Vault
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Vaults Section */}
        {featuredVaults.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Vaults</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Live</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVaults.slice(0, 3).map((vault) => (
                <Link href={`/vault/${vault.id}`} key={vault.id}>
                  <motion.div
                    className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xl font-bold">
                            {vault.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{vault.name}</h3>
                          <p className="text-sm text-gray-600">{vault.airdropAsset}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-orange-600">00:32</div>
                        <p className="text-xs text-gray-500">Timer</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Treasury</span>
                        <span className="font-semibold text-gray-900">2.52 {vault.vaultAsset}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Trade : Win</span>
                        <span className="font-semibold text-green-600">1,000x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Hold : Earn</span>
                        <span className="font-semibold text-blue-600">164%</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button className="w-full bg-orange-500 text-white hover:bg-orange-600">
                        <BoltIcon className="w-4 h-4 mr-2" />
                        Trade Now
                      </Button>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Vaults Section */}
        <div className="bg-white rounded-xl shadow-sm border">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'Top Vaults' },
                { key: 'active', label: 'Time Remaining' },
                { key: 'draft', label: 'Trade : Win' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              
              <div className="ml-auto flex items-center space-x-4 py-4">
                <select 
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Filter by Treasury Asset ▾</option>
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                  <option value="zBTC">zBTC</option>
                </select>
              </div>
            </nav>
          </div>

          {/* Vaults Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vault Name & Timer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Treasury
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trade : Win
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hold : Earn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Must Hold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVaults.map((vault) => (
                  <tr key={vault.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/vault/${vault.id}`} className="flex items-center space-x-3 hover:opacity-80">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {vault.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{vault.name}</div>
                          <div className="text-xs text-gray-500">00:00:32</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-red-500 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      4.52 {vault.vaultAsset}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      1,000x
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      164%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      164%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      164%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button 
                        size="sm"
                        className="bg-orange-500 text-white hover:bg-orange-600"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/vault/${vault.id}`;
                        }}
                      >
                        Trade
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredVaults.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <ChartBarIcon className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vaults found</h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all' 
                  ? 'No vaults have been created yet.' 
                  : `No ${filter} vaults found.`
                }
              </p>
              <Button 
                onClick={() => window.location.href = '/admin'}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Vault
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            See All Job Posts →
          </p>
        </div>
      </div>
    </div>
  );
}