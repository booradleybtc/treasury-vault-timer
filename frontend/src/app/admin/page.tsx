'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CogIcon, 
  PlayIcon, 
  StopIcon, 
  PlusIcon,
  EyeIcon,
  WalletIcon,
  ExclamationTriangleIcon
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
  timerDuration: number; // seconds
  distributionInterval: number; // seconds
  minHoldAmount: number;
  taxSplit: { dev: number; holders: number };
  status: 'draft' | 'active' | 'paused' | 'ended';
  // New fields
  vaultAsset: string; // SOL, zBTC, Scratchers, etc.
  airdropAsset: string; // What gets airdropped
  timerStartedAt: string | null; // When timer actually started
  currentTimerEndsAt: string | null; // When current timer expires
  whitelistedAddresses: string[]; // Addresses exempt from timer resets
  lastPurchaseSignature: string | null;
  totalPurchases: number;
  totalVolume: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [vaults, setVaults] = useState<VaultConfig[]>([]);
  const [selectedVault, setSelectedVault] = useState<VaultConfig | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock admin wallets (in production, this would be in environment variables)
  const ADMIN_WALLETS = [
    '6voY...ytKW', // Your wallet from the screenshots
    // Add more admin wallets as needed
  ];

  useEffect(() => {
    // Check if user is authenticated
    checkAuth();
    // Load existing vaults
    loadVaults();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if wallet is connected
      if (typeof window !== 'undefined' && window.solana?.isPhantom) {
        const response = await window.solana.connect();
        const address = response.publicKey.toString();
        setWalletAddress(address);
        
        // Check if wallet is in admin list
        const isAdmin = ADMIN_WALLETS.some(admin => address.includes(admin.split('...')[0]));
        setIsAuthenticated(isAdmin);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && window.solana?.isPhantom) {
        const response = await window.solana.connect();
        const address = response.publicKey.toString();
        setWalletAddress(address);
        
        // Check if wallet is in admin list
        const isAdmin = ADMIN_WALLETS.some(admin => address.includes(admin.split('...')[0]));
        setIsAuthenticated(isAdmin);
        
        if (!isAdmin) {
          alert('This wallet is not authorized for admin access.');
        }
      } else {
        alert('Please install Phantom wallet to access admin dashboard.');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const loadVaults = async () => {
    try {
      // Mock data for now - in production, this would fetch from backend
      const mockVaults: VaultConfig[] = [
        {
          id: 'revs-vault-001',
          name: 'REVS Treasury Vault',
          description: 'Test vault using REVS token for dynamic treasury mechanics',
          tokenMint: '9VxExA1iRPbuLLdSJ2rBxsyLReT4aqzZBMaBaY1p',
          distributionWallet: '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE',
          treasuryWallet: 'i35RYnCTa7xjs7U1hByCDFE37HwLNuZsUNHmmT4cYUH',
          devWallet: '6voYG6Us...ZtLMytKW',
          startDate: '2025-09-15T12:00:00Z',
          endgameDate: '2025-12-24T12:00:00Z',
          timerDuration: 3600, // 1 hour
          distributionInterval: 300, // 5 minutes
          minHoldAmount: 200000,
          taxSplit: { dev: 50, holders: 50 },
          status: 'active',
          // New fields
          vaultAsset: 'SOL',
          airdropAsset: 'REVS',
          timerStartedAt: '2025-09-18T15:30:00Z',
          currentTimerEndsAt: '2025-09-18T16:30:00Z',
          whitelistedAddresses: [
            '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE', // Distribution wallet
            'i35RYnCTa7xjs7U1hByCDFE37HwLNuZsUNHmmT4cYUH'  // Treasury wallet
          ],
          lastPurchaseSignature: '3JQijH41SGrSbGG9v4fSd6iREVbV1Fa1XQJkMjvfhAobVd9fPeRwiFzPfZrFo2hsqtxpzmoonJKVazWnkpznmFGS',
          totalPurchases: 47,
          totalVolume: 125000,
          createdAt: '2025-09-15T10:00:00Z',
          updatedAt: '2025-09-18T15:30:00Z'
        }
      ];
      setVaults(mockVaults);
    } catch (error) {
      console.error('Failed to load vaults:', error);
    }
  };

  const startVault = async (vaultId: string) => {
    setLoading(true);
    try {
      // API call to start vault
      console.log(`Starting vault: ${vaultId}`);
      // Update local state
      setVaults(prev => prev.map(v => 
        v.id === vaultId ? { ...v, status: 'active' as const } : v
      ));
    } catch (error) {
      console.error('Failed to start vault:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopVault = async (vaultId: string) => {
    setLoading(true);
    try {
      // API call to stop vault
      console.log(`Stopping vault: ${vaultId}`);
      // Update local state
      setVaults(prev => prev.map(v => 
        v.id === vaultId ? { ...v, status: 'paused' as const } : v
      ));
    } catch (error) {
      console.error('Failed to stop vault:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <WalletIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
            <p className="text-gray-600 mb-6">
              Connect your wallet to access the Darwin Vaults admin dashboard.
            </p>
            <button
              onClick={connectWallet}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
            {walletAddress && (
              <p className="text-sm text-gray-500 mt-4">
                Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Darwin Vaults Admin</h1>
              <p className="text-sm text-gray-600">Manage your dynamic treasury vaults</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>New Vault</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vaults Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((vault) => (
            <motion.div
              key={vault.id}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{vault.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{vault.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  vault.status === 'active' ? 'bg-green-100 text-green-800' :
                  vault.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                  vault.status === 'ended' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {vault.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="text-gray-500">Token:</span>
                  <span className="ml-2 font-mono text-xs">{vault.tokenMint.slice(0, 8)}...</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Vault Asset:</span>
                  <span className="ml-2">{vault.vaultAsset}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Airdrop Asset:</span>
                  <span className="ml-2">{vault.airdropAsset}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Timer:</span>
                  <span className="ml-2">{vault.timerDuration / 60} minutes</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Min Hold:</span>
                  <span className="ml-2">{vault.minHoldAmount.toLocaleString()} tokens</span>
                </div>
                {vault.timerStartedAt && (
                  <div className="text-sm">
                    <span className="text-gray-500">Started:</span>
                    <span className="ml-2">{new Date(vault.timerStartedAt).toLocaleString()}</span>
                  </div>
                )}
                {vault.currentTimerEndsAt && (
                  <div className="text-sm">
                    <span className="text-gray-500">Ends:</span>
                    <span className="ml-2">{new Date(vault.currentTimerEndsAt).toLocaleString()}</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-gray-500">Purchases:</span>
                  <span className="ml-2">{vault.totalPurchases}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Whitelisted:</span>
                  <span className="ml-2">{vault.whitelistedAddresses.length} addresses</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedVault(vault)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>View</span>
                </button>
                {vault.status === 'active' ? (
                  <button
                    onClick={() => stopVault(vault.id)}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    <StopIcon className="h-4 w-4" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => startVault(vault.id)}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    <PlayIcon className="h-4 w-4" />
                    <span>Start</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {vaults.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CogIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Vaults Yet</h3>
            <p className="text-gray-600 mb-6">Create your first dynamic treasury vault to get started.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Vault
            </button>
          </motion.div>
        )}
      </div>

      {/* Vault Detail Modal */}
      {selectedVault && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedVault.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedVault.description}</p>
                </div>
                <button
                  onClick={() => setSelectedVault(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Configuration</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Token Mint:</span>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                        {selectedVault.tokenMint}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Distribution Wallet:</span>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                        {selectedVault.distributionWallet}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Treasury Wallet:</span>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                        {selectedVault.treasuryWallet}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Dev Wallet:</span>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                        {selectedVault.devWallet}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Vault Asset:</span>
                      <span className="ml-2 font-semibold">{selectedVault.vaultAsset}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Airdrop Asset:</span>
                      <span className="ml-2 font-semibold">{selectedVault.airdropAsset}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Settings & Status</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Timer Duration:</span>
                      <span className="ml-2">{selectedVault.timerDuration / 60} minutes</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Distribution Interval:</span>
                      <span className="ml-2">{selectedVault.distributionInterval / 60} minutes</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Min Hold Amount:</span>
                      <span className="ml-2">{selectedVault.minHoldAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tax Split:</span>
                      <span className="ml-2">{selectedVault.taxSplit.dev}% dev, {selectedVault.taxSplit.holders}% holders</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <span className="ml-2">{new Date(selectedVault.startDate).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Endgame Date:</span>
                      <span className="ml-2">{new Date(selectedVault.endgameDate).toLocaleString()}</span>
                    </div>
                    {selectedVault.timerStartedAt && (
                      <div>
                        <span className="text-gray-500">Timer Started:</span>
                        <span className="ml-2">{new Date(selectedVault.timerStartedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedVault.currentTimerEndsAt && (
                      <div>
                        <span className="text-gray-500">Timer Ends:</span>
                        <span className="ml-2">{new Date(selectedVault.currentTimerEndsAt).toLocaleString()}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Total Purchases:</span>
                      <span className="ml-2">{selectedVault.totalPurchases}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Volume:</span>
                      <span className="ml-2">{selectedVault.totalVolume.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Whitelisted Addresses Section */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Whitelisted Addresses</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedVault.whitelistedAddresses.length > 0 ? (
                    <div className="space-y-2">
                      {selectedVault.whitelistedAddresses.map((address, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="font-mono text-xs bg-white p-2 rounded border">
                            {address}
                          </div>
                          <button className="text-red-600 hover:text-red-800 text-xs">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No whitelisted addresses</p>
                  )}
                  <button className="mt-3 text-blue-600 hover:text-blue-800 text-sm">
                    + Add Whitelisted Address
                  </button>
                </div>
              </div>

              {/* Last Purchase Section */}
              {selectedVault.lastPurchaseSignature && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Last Purchase</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-mono text-xs bg-white p-2 rounded border">
                      {selectedVault.lastPurchaseSignature}
                    </div>
                    <button 
                      onClick={() => window.open(`https://solscan.io/tx/${selectedVault.lastPurchaseSignature}`, '_blank')}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View on Solscan →
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t">
                <div className="flex space-x-3">
                  <button
                    onClick={() => window.open(`/?vault=${selectedVault.id}`, '_blank')}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Live Vault
                  </button>
                  {selectedVault.status === 'active' ? (
                    <button
                      onClick={() => stopVault(selectedVault.id)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Stop Vault
                    </button>
                  ) : (
                    <button
                      onClick={() => startVault(selectedVault.id)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Start Vault
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
