'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
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
  const [editingVault, setEditingVault] = useState<VaultConfig | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

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
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
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
      }
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

  // Define which fields are editable vs immutable
  const getFieldEditability = (field: string) => {
    const immutableFields = [
      'tokenMint', 'distributionWallet', 'treasuryWallet', 'devWallet',
      'startDate', 'endgameDate', 'timerDuration', 'distributionInterval',
      'minHoldAmount', 'taxSplit', 'vaultAsset', 'airdropAsset',
      'createdAt', 'updatedAt'
    ];
    
    const semiEditableFields = [
      'name', 'description' // Can edit but only when vault is draft
    ];
    
    const fullyEditableFields = [
      'whitelistedAddresses' // Can always edit
    ];
    
    return {
      isImmutable: immutableFields.includes(field),
      isSemiEditable: semiEditableFields.includes(field),
      isFullyEditable: fullyEditableFields.includes(field)
    };
  };

  const handleFieldEdit = (vault: VaultConfig, field: string, value: any) => {
    setVaults(prev => prev.map(v => 
      v.id === vault.id ? { ...v, [field]: value, updatedAt: new Date().toISOString() } : v
    ));
    setEditingField(null);
  };

  const addWhitelistedAddress = async (vault: VaultConfig, address: string) => {
    if (address.trim() && !vault.whitelistedAddresses.includes(address.trim())) {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${BACKEND_URL}/api/admin/vaults/${vault.id}/whitelisted-addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: address.trim() }),
          mode: 'cors'
        });
        
        if (response.ok) {
          // Reload vaults to get updated data
          await loadVaults();
        } else {
          console.error('Failed to add whitelisted address:', response.statusText);
        }
      } catch (error) {
        console.error('Error adding whitelisted address:', error);
      }
    }
  };

  const removeWhitelistedAddress = async (vault: VaultConfig, address: string) => {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${BACKEND_URL}/api/admin/vaults/${vault.id}/whitelisted-addresses/${encodeURIComponent(address)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      if (response.ok) {
        // Reload vaults to get updated data
        await loadVaults();
      } else {
        console.error('Failed to remove whitelisted address:', response.statusText);
      }
    } catch (error) {
      console.error('Error removing whitelisted address:', error);
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
          <div className="text-center mb-6">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/vaults'}
              className="mb-4"
            >
              ← Back to Vaults
            </Button>
          </div>
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
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/vaults'}
                className="flex items-center space-x-2"
              >
                <span>← Back to Vaults</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Darwin Vaults Admin</h1>
                <p className="text-sm text-gray-600">Manage your dynamic treasury vaults</p>
              </div>
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
                <div className="flex-1">
                  {editingField === 'name' ? (
                    <input
                      type="text"
                      defaultValue={selectedVault.name}
                      className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none"
                      onBlur={(e) => {
                        if (e.target.value !== selectedVault.name) {
                          handleFieldEdit(selectedVault, 'name', e.target.value);
                        }
                        setEditingField(null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedVault.name}</h2>
                      {selectedVault.status === 'draft' && (
                        <button
                          onClick={() => setEditingField('name')}
                          className="text-gray-400 hover:text-gray-600 text-sm"
                          title="Edit name"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  )}
                  
                  {editingField === 'description' ? (
                    <textarea
                      defaultValue={selectedVault.description}
                      className="text-gray-600 mt-1 bg-transparent border-b-2 border-blue-500 outline-none w-full resize-none"
                      rows={2}
                      onBlur={(e) => {
                        if (e.target.value !== selectedVault.description) {
                          handleFieldEdit(selectedVault, 'description', e.target.value);
                        }
                        setEditingField(null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          e.currentTarget.blur();
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-start space-x-2">
                      <p className="text-gray-600 mt-1">{selectedVault.description}</p>
                      {selectedVault.status === 'draft' && (
                        <button
                          onClick={() => setEditingField('description')}
                          className="text-gray-400 hover:text-gray-600 text-sm mt-1"
                          title="Edit description"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedVault(null)}
                  className="text-gray-400 hover:text-gray-600 ml-4"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Configuration <span className="text-xs text-gray-500">(Immutable)</span></h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Token Mint:</span>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 border-l-4 border-red-200">
                        {selectedVault.tokenMint}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Distribution Wallet:</span>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 border-l-4 border-red-200">
                        {selectedVault.distributionWallet}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Treasury Wallet:</span>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 border-l-4 border-red-200">
                        {selectedVault.treasuryWallet}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Dev Wallet:</span>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 border-l-4 border-red-200">
                        {selectedVault.devWallet}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Vault Asset:</span>
                      <span className="ml-2 font-semibold bg-red-50 px-2 py-1 rounded text-red-700">{selectedVault.vaultAsset}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Airdrop Asset:</span>
                      <span className="ml-2 font-semibold bg-red-50 px-2 py-1 rounded text-red-700">{selectedVault.airdropAsset}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Settings & Status</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Timer Duration:</span>
                      <span className="ml-2 bg-red-50 px-2 py-1 rounded text-red-700">{selectedVault.timerDuration / 60} minutes</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Distribution Interval:</span>
                      <span className="ml-2 bg-red-50 px-2 py-1 rounded text-red-700">{selectedVault.distributionInterval / 60} minutes</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Min Hold Amount:</span>
                      <span className="ml-2 bg-red-50 px-2 py-1 rounded text-red-700">{selectedVault.minHoldAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tax Split:</span>
                      <span className="ml-2 bg-red-50 px-2 py-1 rounded text-red-700">{selectedVault.taxSplit.dev}% dev, {selectedVault.taxSplit.holders}% holders</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <span className="ml-2 bg-red-50 px-2 py-1 rounded text-red-700">{new Date(selectedVault.startDate).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Endgame Date:</span>
                      <span className="ml-2 bg-red-50 px-2 py-1 rounded text-red-700">{new Date(selectedVault.endgameDate).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <div className="w-3 h-3 bg-red-200 rounded"></div>
                      <span>Immutable (set at launch)</span>
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
                          <div className="font-mono text-xs bg-white p-2 rounded border flex-1 mr-2">
                            {address}
                          </div>
                          <button 
                            onClick={() => removeWhitelistedAddress(selectedVault, address)}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No whitelisted addresses</p>
                  )}
                  
                  {/* Add new address form */}
                  <div className="mt-3 flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter wallet address..."
                      className="flex-1 text-xs p-2 border rounded"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addWhitelistedAddress(selectedVault, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button 
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addWhitelistedAddress(selectedVault, input.value);
                        input.value = '';
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs px-3 py-2 rounded hover:bg-blue-50"
                    >
                      Add
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Whitelisted addresses won't reset the timer when they make purchases
                  </p>
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
