'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  ClockIcon,
  CurrencyDollarIcon,
  GiftIcon,
  ChartBarIcon,
  ArrowRightIcon,
  PlusIcon,
  FireIcon
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
        console.error('Failed to fetch vaults:', response.statusText);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FireIcon className="w-4 h-4" />;
      case 'draft': return <ClockIcon className="w-4 h-4" />;
      case 'paused': return <ClockIcon className="w-4 h-4" />;
      case 'ended': return <ChartBarIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vaults...</p>
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
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Darwin Vaults</h1>
              <p className="text-xl text-gray-300">Dynamic exploding treasuries on-chain</p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">Live Platform</span>
                </div>
                <div className="text-sm text-gray-400">
                  {vaults.length} vault{vaults.length !== 1 ? 's' : ''} available
                </div>
              </div>
            </div>
            <Button className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-0">
              <PlusIcon className="w-5 h-5" />
              <span>Create Vault</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Vault Carousel */}
      {vaults.filter(v => v.status === 'active').length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Vaults</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaults.filter(v => v.status === 'active').slice(0, 3).map((vault) => (
              <motion.div
                key={vault.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {vault.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{vault.name}</h3>
                        <p className="text-sm text-gray-600">{vault.airdropAsset}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vault.status)}`}>
                      {vault.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{vault.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Vault Asset</p>
                      <p className="font-semibold text-gray-900">{vault.vaultAsset}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Airdrop Asset</p>
                      <p className="font-semibold text-gray-900">{vault.airdropAsset}</p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full flex items-center justify-center space-x-2"
                    onClick={() => window.location.href = `/vault/${vault.id}`}
                  >
                    <span>Enter Vault</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Vaults Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Vaults</h2>
          
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'draft', label: 'Draft' },
              { key: 'ended', label: 'Ended' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredVaults.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vaults found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? 'No vaults have been created yet.' 
                : `No ${filter} vaults found.`
              }
            </p>
            <Button className="flex items-center space-x-2 mx-auto">
              <PlusIcon className="w-5 h-5" />
              <span>Create First Vault</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVaults.map((vault) => (
              <motion.div
                key={vault.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-6 bg-white border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {vault.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{vault.name}</h3>
                        <p className="text-sm text-gray-600">{vault.airdropAsset}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(vault.status)}`}>
                      {getStatusIcon(vault.status)}
                      <span>{vault.status}</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{vault.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Vault Asset</p>
                      <p className="font-semibold text-gray-900">{vault.vaultAsset}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Min Hold</p>
                      <p className="font-semibold text-gray-900">{vault.minHoldAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Timer Duration</p>
                      <p className="font-semibold text-gray-900">{Math.floor(vault.timerDuration / 3600)}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(vault.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1 flex items-center justify-center space-x-2"
                      onClick={() => window.location.href = `/vault/${vault.id}`}
                    >
                      <span>View Vault</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                    {vault.status === 'draft' && (
                      <Button 
                        variant="outline"
                        onClick={() => window.location.href = `/admin`}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
