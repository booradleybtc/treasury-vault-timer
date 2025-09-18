'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { 
  ClockIcon,
  CurrencyDollarIcon,
  GiftIcon,
  ChartBarIcon,
  ArrowRightIcon,
  PlusIcon
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

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async () => {
    try {
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
    if (filter === 'all') return true;
    return vault.status === filter;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Darwin Vaults
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Launch and participate in dynamic exploding treasuries on-chain
          </p>
        </div>

        {/* Featured Vaults */}
        {featuredVaults.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Vaults</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVaults.slice(0, 3).map((vault) => (
                <Link href={`/vault/${vault.id}`} key={vault.id}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{vault.name}</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {vault.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{vault.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{vault.vaultAsset} / {vault.airdropAsset}</span>
                      <span>Created: {new Date(vault.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {(['all', 'active', 'draft', 'ended'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Vaults Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVaults.map((vault) => (
            <Link href={`/vault/${vault.id}`} key={vault.id}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{vault.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    vault.status === 'active' ? 'bg-green-100 text-green-800' :
                    vault.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {vault.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{vault.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{vault.vaultAsset} / {vault.airdropAsset}</span>
                  <span>Created: {new Date(vault.createdAt).toLocaleDateString()}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredVaults.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GiftIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vaults found</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? 'No vaults have been created yet.' 
                : `No ${filter} vaults found.`}
            </p>
            <Button className="inline-flex items-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>Create Vault</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}