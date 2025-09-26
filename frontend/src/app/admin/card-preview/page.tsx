'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VaultCardPreview } from '@/components/admin/VaultCardPreview';

export default function CardPreviewPage() {
  const router = useRouter();
  const [vaults, setVaults] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('pre_ico');
  const [selectedVault, setSelectedVault] = useState<any>(null);
  
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    loadVaults();
  }, []);

  useEffect(() => {
    // Set selected vault when status changes
    const vault = vaults.find(v => v.status === selectedStatus) || vaults[0];
    setSelectedVault(vault);
  }, [selectedStatus, vaults]);

  const loadVaults = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/admin/vaults`);
      const js = await res.json();
      setVaults(js.vaults || []);
    } catch (error) {
      console.error('Failed to load vaults:', error);
    }
  };

  if (!selectedVault) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{
        background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed",
      }}>
        <div className="text-white">Loading vault data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{
      background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed",
    }}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/admin/index')}
            className="text-white/70 hover:text-white flex items-center gap-2"
          >
            ← Back to Vault Management
          </button>
          
          <div className="flex items-center gap-4">
            <select 
              className="bg-white/10 text-white px-4 py-2 rounded" 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="pre_ico">Pre‑ICO</option>
              <option value="ico">ICO Live</option>
              <option value="pending">Pending</option>
              <option value="prelaunch">Pre-Launch</option>
              <option value="active">Live</option>
              <option value="winner_confirmation">Winner Confirmation</option>
              <option value="endgame_processing">Endgame Processing</option>
              <option value="extinct">Extinct</option>
            </select>
            
            <button 
              onClick={() => router.push(`/vault/${selectedVault.id}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Open Vault Page
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-8 text-center">Vault Card Preview</h1>

        {/* Main Featured Card */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Featured Card</h2>
          <div className="max-w-5xl mx-auto">
            <VaultCardPreview 
              vault={selectedVault} 
              variant="featured" 
              className="scale-100"
            />
          </div>
        </div>

        {/* Secondary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Tall Card</h2>
            <div className="max-w-sm">
              <VaultCardPreview 
                vault={selectedVault} 
                variant="tall" 
                className="scale-100"
              />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">List Card</h2>
            <div className="max-w-2xl">
              <VaultCardPreview 
                vault={selectedVault} 
                variant="row" 
                className="scale-100"
              />
            </div>
          </div>
        </div>

        {/* Vault Details Section */}
        <div className="bg-white/5 p-8 rounded-lg border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-6">Vault Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Vault Information</h3>
              <div className="space-y-2 text-white/80">
                <div><span className="font-semibold">Name:</span> {selectedVault.name}</div>
                <div><span className="font-semibold">Status:</span> <span className="capitalize">{selectedVault.status}</span></div>
                <div><span className="font-semibold">ID:</span> {selectedVault.id}</div>
                <div><span className="font-semibold">Created:</span> {new Date(selectedVault.createdAt).toLocaleDateString()}</div>
                {selectedVault.meta?.ticker && (
                  <div><span className="font-semibold">Ticker:</span> {selectedVault.meta.ticker}</div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Configuration</h3>
              <div className="space-y-2 text-white/80">
                <div><span className="font-semibold">Timer Duration:</span> {selectedVault.timerDuration ? `${Math.floor(selectedVault.timerDuration / 60)} minutes` : 'N/A'}</div>
                <div><span className="font-semibold">Vault Asset:</span> {selectedVault.vaultAsset || 'N/A'}</div>
                <div><span className="font-semibold">Airdrop Asset:</span> {selectedVault.airdropAsset || 'N/A'}</div>
                <div><span className="font-semibold">Treasury Wallet:</span> {selectedVault.treasuryWallet ? `${selectedVault.treasuryWallet.slice(0, 8)}...${selectedVault.treasuryWallet.slice(-8)}` : 'N/A'}</div>
              </div>
            </div>
          </div>
          
          {selectedVault.meta && (
            <div className="mt-8">
              <h3 className="text-white font-semibold mb-4">Meta Configuration</h3>
              <div className="bg-white/5 p-4 rounded border border-white/10">
                <pre className="text-white/80 text-sm overflow-x-auto">
                  {JSON.stringify(selectedVault.meta, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
