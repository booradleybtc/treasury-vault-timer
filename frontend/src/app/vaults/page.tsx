'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { motion } from 'framer-motion';
import { StreamHeader } from '@/components/layout/StreamHeader';
import { Rail } from '@/components/stream/Rail';
import { PosterCard } from '@/components/stream/PosterCard';
import { GlassPanel } from '@/components/stream/GlassPanel';
import { LiveDot, TimerBadge } from '@/components/stream/LiveTimer';
import { 
  ClockIcon,
  CurrencyDollarIcon,
  GiftIcon,
  ChartBarIcon,
  ArrowRightIcon,
  PlusIcon,
  BoltIcon,
  DocumentTextIcon
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

  const featuredVault = vaults.find(vault => vault.status === 'active') || vaults[0];

  if (loading) {
    return (
      <div className="theme-stream min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading vaults...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theme-stream min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadVaults}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-stream min-h-screen">
      <StreamHeader 
        onSearch={(q) => console.log('Search:', q)}
        activeTab="vaults"
        onTabChange={(v) => {
          if (v === 'home') window.location.href = '/';
          if (v === 'admin') window.location.href = '/admin';
        }}
        rightAction={
          <Button 
            onClick={() => window.location.href = '/admin'}
            className="bg-primary hover:bg-primary/90"
          >
            Launch Vault
          </Button>
        }
      />

      <main className="mx-auto max-w-7xl px-4 pb-24">
        {/* Featured Vaults Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Vaults</h2>
            <Button variant="outline" className="text-gray-600 border-gray-300">
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Featured Vault Card */}
            <div className="lg:col-span-3">
              <Card className="p-8 h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {featuredVault?.name?.charAt(0) || 'R'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">
                        {featuredVault?.name || 'REVS Vault'}
                      </h3>
                      <p className="text-lg text-gray-600">The OG Vault</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-green-600 font-medium">Live</span>
                    </div>
                    <div className="text-4xl font-mono font-bold text-gray-900">00:32</div>
                  </div>
                </div>

                {/* Vault Image Placeholder */}
                <div className="bg-gray-100 rounded-xl h-64 mb-6 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">🏦</span>
                    </div>
                    <p className="text-gray-500">Vault Image</p>
                  </div>
                </div>

                {/* Vault Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">APY</p>
                    <p className="text-xl font-bold text-gray-900">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Treasury</p>
                    <p className="text-xl font-bold text-gray-900">$1,234,567</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Last Buyer</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xl font-bold text-gray-900">0x123...abc</p>
                      <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Timer</p>
                    <p className="text-xl font-bold text-gray-900">00:00:00</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Endgame</p>
                    <p className="text-xl font-bold text-gray-900">Sept 15, 2025</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Airdrop</p>
                    <p className="text-xl font-bold text-gray-900">00:00:00</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Button className="bg-orange-500 text-white hover:bg-orange-600 px-8 py-3">
                    Trade REVS
                  </Button>
                </div>
              </Card>
            </div>

            {/* Game Rules Card */}
            <div className="lg:col-span-1">
              <Card className="p-6 h-full">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Trade to Win Vault</h3>
                <p className="text-gray-600 mb-6">
                  Every day 10,000+ potential clients visit our website. Hire exclusive talent by posting your job today.
                </p>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Game Rules</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <p className="text-sm text-gray-600">Buy REVS to Reset Timer</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <p className="text-sm text-gray-600">Win Half the Treasury</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <p className="text-sm text-gray-600">Claim Airdrops & Treasury</p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full border-gray-300 text-gray-600">
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Read Docs
                </Button>
              </Card>
            </div>
          </div>
        </div>

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
                <Button 
                  onClick={() => window.location.href = '/admin'}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Vault
                </Button>
              </div>
            </nav>
          </div>

          {/* Vaults Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vault
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    APY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Treasury
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                          <div className="text-xs text-gray-500">{vault.airdropAsset}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      N/A
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      $1.2M
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      00:00:00
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vault.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : vault.status === 'ended'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {vault.status === 'active' ? 'Live' : vault.status}
                      </span>
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
      </main>
    </div>
  );
}

function Stat({ label, value, copyable=false }:{label:string; value:string; copyable?:boolean}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-white/60">{label}</div>
      <div className="mt-1 font-medium flex items-center gap-2">
        <span>{value}</span>
        {copyable ? <span className="text-white/50 text-xs">⧉</span> : null}
      </div>
    </div>
  )
}