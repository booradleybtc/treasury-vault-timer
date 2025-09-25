'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TokenSelector } from '@/components/ui/TokenSelector';

export default function LaunchWizardPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Stage 1 core
    name: '',
    description: '',
    ticker: '',
    treasuryWallet: '',
    icoAsset: 'So11111111111111111111111111111111111111112', // SOL address
    icoProposedAt: '',
    supplyIntended: '',
    bidMultiplier: 100,
    timerDuration: 3600,
    vaultLifespanDays: 100,
    minBuyToReset: 0,
    minHoldAmount: 0,
    airdropInterval: 3600,
    airdropMode: 'rewards', // rewards | jackpot | lottery | powerball | none
    vaultAsset: 'So11111111111111111111111111111111111111112', // SOL address
    airdropAsset: '', // Will be populated by user
    // Trade Fee
    totalTradeFee: 5, // Default 5%
    // Splits (percentages of total trade fee)
    splitCreator: 0,
    splitTreasury: 0,
    splitAirdrops: 0,
    splitDarwin: 0,
    // Links
    xUrl: '',
    websiteUrl: '',
    // Images (uploaded URLs)
    logoUrl: '',
    bannerUrl: '',
    // File uploads
    logoFile: null as File | null,
    bannerFile: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Upload logo and banner files if provided
      let logoUrl = formData.logoUrl;
      let bannerUrl = formData.bannerUrl;
      
      if (formData.logoFile) {
        logoUrl = await uploadFile(formData.logoFile);
      }
      if (formData.bannerFile) {
        bannerUrl = await uploadFile(formData.bannerFile);
      }

      const id = `${formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
      const now = new Date();
      const startDate = formData.icoProposedAt ? new Date(formData.icoProposedAt).toISOString() : now.toISOString();
      const endgameDate = new Date(new Date(startDate).getTime() + Number(formData.vaultLifespanDays || 100) * 24 * 60 * 60 * 1000).toISOString();

      const payload = {
        id,
        name: formData.name,
        description: formData.description,
        treasuryWallet: formData.treasuryWallet,
        startDate,
        endgameDate,
        timerDuration: Number(formData.timerDuration),
        distributionInterval: Number(formData.airdropInterval),
        minHoldAmount: Number(formData.minHoldAmount),
        vaultAsset: formData.vaultAsset,
        airdropAsset: formData.airdropAsset,
        status: 'pre_ico_scheduled',
        meta: {
          stage: 'stage1',
          ticker: formData.ticker?.slice(0, 10),
          logoUrl: logoUrl,
          bannerUrl: bannerUrl,
          icoAsset: formData.icoAsset,
          icoProposedAt: startDate,
          supplyIntended: formData.supplyIntended,
          bidMultiplier: Number(formData.bidMultiplier),
          vaultLifespanDays: Number(formData.vaultLifespanDays),
          minBuyToReset: Number(formData.minBuyToReset),
          airdropInterval: Number(formData.airdropInterval),
          airdropMode: formData.airdropMode,
          totalTradeFee: Number(formData.totalTradeFee),
          splits: {
            creator: Number(formData.splitCreator),
            treasury: Number(formData.splitTreasury),
            airdrops: Number(formData.splitAirdrops),
            darwin: Number(formData.splitDarwin),
          },
          links: {
            x: formData.xUrl,
            website: formData.websiteUrl,
          },
          icoThresholdUsd: 1000,
        }
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

  const uploadFile = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append('file', file);
    setUploading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/upload`, {
        method: 'POST',
        body: data,
      });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      return json.url as string;
    } finally {
      setUploading(false);
    }
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
                <label className="block text-sm text-white/80 mb-2">Ticker (max 10)</label>
                <input
                  type="text"
                  name="ticker"
                  maxLength={10}
                  value={(formData as any).ticker || ''}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
            </div>

            {/* Image Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Vault Logo (Square)</label>
                <input
                  type="file"
                  name="logoFile"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData(prev => ({ ...prev, logoFile: file }));
                  }}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-white/90"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Banner Image</label>
                <input
                  type="file"
                  name="bannerFile"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData(prev => ({ ...prev, bannerFile: file }));
                  }}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-white/90"
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
            <h2 className="text-lg font-bold text-white mb-4">ICO Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Treasury Wallet (ICO Address) *</label>
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
                <TokenSelector
                  label="ICO Raise Asset"
                  value={formData.icoAsset}
                  onChange={(address) => setFormData(prev => ({ ...prev, icoAsset: address }))}
                  placeholder="Select token for ICO raise..."
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Proposed ICO Date *</label>
                <input
                  type="datetime-local"
                  name="icoProposedAt"
                  value={(formData as any).icoProposedAt || ''}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Timer & Airdrops</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Vault Lifespan (days)</label>
                <input
                  type="number"
                  name="vaultLifespanDays"
                  value={(formData as any).vaultLifespanDays || 100}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Airdrop Interval</label>
                <select
                  name="airdropInterval"
                  value={(formData as any).airdropInterval || 3600}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                >
                  <option value={300}>5 mins</option>
                  <option value={900}>15 mins</option>
                  <option value={1800}>30 mins</option>
                  <option value={3600}>1 hour</option>
                  <option value={21600}>6 hours</option>
                  <option value={43200}>12 hours</option>
                  <option value={86400}>24 hours</option>
                </select>
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
                <label className="block text-sm text-white/80 mb-2">Minimum Hold for Airdrop</label>
                <input
                  type="number"
                  name="minHoldAmount"
                  value={formData.minHoldAmount}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Minimum Buy to Reset Timer</label>
                <input
                  type="number"
                  name="minBuyToReset"
                  value={(formData as any).minBuyToReset || 0}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Airdrop Mode</label>
                <select
                  name="airdropMode"
                  value={(formData as any).airdropMode || 'rewards'}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                >
                  <option value="rewards">Rewards</option>
                  <option value="jackpot">Jackpot</option>
                  <option value="lottery">Lottery</option>
                  <option value="powerball">Powerball</option>
                  <option value="none">No Airdrops</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Assets & Tax Split</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <TokenSelector
                  label="Vault Asset"
                  value={formData.vaultAsset}
                  onChange={(address) => setFormData(prev => ({ ...prev, vaultAsset: address }))}
                  placeholder="Select vault asset token..."
                />
              </div>
              <div>
                <TokenSelector
                  label="Airdrop Asset"
                  value={formData.airdropAsset}
                  onChange={(address) => setFormData(prev => ({ ...prev, airdropAsset: address }))}
                  placeholder="Select airdrop asset token..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 mb-2">Total Trade Fee (%)</label>
                <input
                  type="number"
                  name="totalTradeFee"
                  value={(formData as any).totalTradeFee || 5}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
                <p className="text-xs text-white/60 mt-1">The total percentage fee charged on each trade</p>
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Creator Split (%)</label>
                <input
                  type="number"
                  name="splitCreator"
                  value={(formData as any).splitCreator || 0}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Treasury Split (%)</label>
                <input
                  type="number"
                  name="splitTreasury"
                  value={(formData as any).splitTreasury || 0}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
                <p className="text-xs text-white/60 mt-1">% of total trade fee</p>
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Airdrops Split (%)</label>
                <input
                  type="number"
                  name="splitAirdrops"
                  value={(formData as any).splitAirdrops || 0}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
                <p className="text-xs text-white/60 mt-1">% of total trade fee</p>
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Darwin Builders Fund (%)</label>
                <input
                  type="number"
                  name="splitDarwin"
                  value={(formData as any).splitDarwin || 0}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
                <p className="text-xs text-white/60 mt-1">% of total trade fee</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">X (Twitter) URL</label>
                <input
                  type="url"
                  name="xUrl"
                  value={(formData as any).xUrl || ''}
                  onChange={handleChange}
                  className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Website URL</label>
                <input
                  type="url"
                  name="websiteUrl"
                  value={(formData as any).websiteUrl || ''}
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
              {submitting ? 'Creating...' : (uploading ? 'Uploading...' : 'Create Vault')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}