'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LaunchWizardPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tokenMint: '',
    distributionWallet: '',
    treasuryWallet: '',
    devWallet: '',
    startDate: '',
    endgameDate: '',
    timerDuration: 3600,
    distributionInterval: 3600,
    minHoldAmount: 0,
    taxSplitDev: 0,
    taxSplitHolders: 0,
    vaultAsset: 'SOL',
    airdropAsset: 'REVS'
  });
  const [submitting, setSubmitting] = useState(false);
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload = {
        id: `${formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        tokenMint: formData.tokenMint,
        distributionWallet: formData.distributionWallet,
        treasuryWallet: formData.treasuryWallet,
        devWallet: formData.devWallet,
        startDate: new Date(formData.startDate).toISOString(),
        endgameDate: new Date(formData.endgameDate).toISOString(),
        timerDuration: Number(formData.timerDuration),
        distributionInterval: Number(formData.distributionInterval),
        minHoldAmount: Number(formData.minHoldAmount),
        taxSplit: {
          dev: Number(formData.taxSplitDev),
          holders: Number(formData.taxSplitHolders)
        },
        vaultAsset: formData.vaultAsset,
        airdropAsset: formData.airdropAsset,
        status: 'draft'
      };

      const res = await fetch(`${BACKEND_URL}/api/admin/vaults`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`${res.status} ${detail}`);
      }

      const json = await res.json();
      if (json?.vault?.id) {
        router.push(`/admin/preview/${json.vault.id}`);
      } else {
        router.push('/admin/index');
      }
    } catch (e) {
      alert(`Failed to create vault. ${e instanceof Error ? e.message : ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed" }}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Create New Vault</h1>
          <button 
            onClick={() => router.push('/admin')}
            className="bg-white/10 text-white px-4 py-2 ring-1 ring-white/10 hover:bg-white/20"
          >
            Back to Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Vault Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Token Mint Address *</label>
                <input
                  type="text"
                  name="tokenMint"
                  value={formData.tokenMint}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Wallets</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Treasury Wallet *</label>
                <input
                  type="text"
                  name="treasuryWallet"
                  value={formData.treasuryWallet}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Distribution Wallet *</label>
                <input
                  type="text"
                  name="distributionWallet"
                  value={formData.distributionWallet}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Dev Wallet *</label>
                <input
                  type="text"
                  name="devWallet"
                  value={formData.devWallet}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Timing & Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Start Date *</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Endgame Date *</label>
                <input
                  type="datetime-local"
                  name="endgameDate"
                  value={formData.endgameDate}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Timer Duration (seconds)</label>
                <input
                  type="number"
                  name="timerDuration"
                  value={formData.timerDuration}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Distribution Interval (seconds)</label>
                <input
                  type="number"
                  name="distributionInterval"
                  value={formData.distributionInterval}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Assets & Tax Split</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Vault Asset</label>
                <select
                  name="vaultAsset"
                  value={formData.vaultAsset}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                >
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                  <option value="BTC">BTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Airdrop Asset</label>
                <input
                  type="text"
                  name="airdropAsset"
                  value={formData.airdropAsset}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Dev Tax Split (%)</label>
                <input
                  type="number"
                  name="taxSplitDev"
                  value={formData.taxSplitDev}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Holders Tax Split (%)</label>
                <input
                  type="number"
                  name="taxSplitHolders"
                  value={formData.taxSplitHolders}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="bg-white/10 text-white px-6 py-3 ring-1 ring-white/10 hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#58A6FF] hover:bg-[#4a95e6] text-white px-6 py-3 shadow-[0_0_18px_rgba(88,166,255,0.45)] font-semibold disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}