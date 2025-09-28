'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TokenSelector } from '@/components/ui/TokenSelector';

export default function VaultDetails() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [vault, setVault] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/vault/${id}/config`);
        if (res.ok) {
          const js = await res.json();
          setVault(js.vault);
          setFormData(js.vault);
        } else {
          console.error('Failed to load vault:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('Error loading vault:', error);
      }
    };
    if (id) load();
  }, [id, BACKEND]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND}/api/admin/vaults/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setVault(formData);
        setEditing(false);
      } else {
        alert('Failed to update vault');
      }
    } catch (e) {
      alert('Failed to update vault');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('meta.')) {
      const metaKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          [metaKey]: value
        }
      }));
    } else if (name.startsWith('splits.')) {
      const splitKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          splits: {
            ...prev.meta?.splits,
            [splitKey]: Number(value)
          }
        }
      }));
    } else if (name.startsWith('links.')) {
      const linkKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          links: {
            ...prev.meta?.links,
            [linkKey]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const renderField = (label: string, value: any, name?: string, type: string = 'text') => {
    if (editing && name) {
      if (type === 'textarea') {
        return (
          <textarea
            name={name}
            value={value || ''}
            onChange={handleChange}
            rows={3}
            className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
          />
        );
      } else if (type === 'select' && name.includes('airdropMode')) {
        return (
          <select
            name={name}
            value={value || 'rewards'}
            onChange={handleChange}
            className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
          >
            <option value="rewards">Rewards</option>
            <option value="jackpot">Jackpot</option>
            <option value="lottery">Lottery</option>
            <option value="powerball">Powerball</option>
            <option value="none">No Airdrops</option>
          </select>
        );
      } else if (type === 'select' && name.includes('bidMultiplier')) {
        return (
          <select
            name={name}
            value={value || 100}
            onChange={handleChange}
            className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
          >
            <option value={100}>100×</option>
            <option value={200}>200×</option>
            <option value={300}>300×</option>
            <option value={400}>400×</option>
            <option value={500}>500×</option>
            <option value={750}>750×</option>
            <option value={1000}>1,000×</option>
            <option value={1500}>1,500×</option>
            <option value={2000}>2,000×</option>
            <option value={2500}>2,500×</option>
            <option value={3000}>3,000×</option>
            <option value={4000}>4,000×</option>
            <option value={5000}>5,000×</option>
            <option value={7500}>7,500×</option>
            <option value={10000}>10,000×</option>
          </select>
        );
      } else if (type === 'select' && name.includes('airdropInterval')) {
        return (
          <select
            name={name}
            value={value || 3600}
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
        );
      } else if (type === 'datetime-local') {
        return (
          <input
            type="datetime-local"
            name={name}
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={handleChange}
            className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
          />
        );
      } else {
        return (
          <input
            type={type}
            name={name}
            value={value || ''}
            onChange={handleChange}
            className="w-full bg-white/10 text-white px-3 py-2 ring-1 ring-white/10"
          />
        );
      }
    }
    return <span className="text-white/80">{value || 'N/A'}</span>;
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed" }}>
      <div className="mx-auto max-w-6xl px-4 py-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <button onClick={()=>router.back()} className="bg-white/10 ring-1 ring-white/10 px-3 py-1">Back</button>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button 
                  onClick={() => setEditing(false)} 
                  className="bg-white/10 ring-1 ring-white/10 px-4 py-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-[#58A6FF] hover:bg-[#4a95e6] text-white px-4 py-2 shadow-[0_0_18px_rgba(88,166,255,0.45)] font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button 
                onClick={() => setEditing(true)} 
                className="bg-[#58A6FF] hover:bg-[#4a95e6] text-white px-4 py-2 shadow-[0_0_18px_rgba(88,166,255,0.45)] font-semibold"
              >
                Edit Vault
              </button>
            )}
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Vault Details</h1>
        
        {!vault ? (
          <div className="text-white/70">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">Vault Name</label>
                  {renderField('Name', vault.name, 'name')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Ticker</label>
                  {renderField('Ticker', vault.meta?.ticker, 'meta.ticker')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Description</label>
                  {renderField('Description', vault.description, 'description', 'textarea')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Status</label>
                  <span className="text-white/80">{vault.status}</span>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Vault ID</label>
                  <span className="text-white/80 font-mono text-sm">{vault.id}</span>
                </div>
              </div>
            </div>

            {/* Images & Links */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Images & Links</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">Logo URL</label>
                  {renderField('Logo', vault.meta?.logoUrl, 'meta.logoUrl')}
                  {vault.meta?.logoUrl && (
                    <img src={vault.meta.logoUrl} alt="Logo" className="w-16 h-16 object-cover mt-2 rounded" />
                  )}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Banner URL</label>
                  {renderField('Banner', vault.meta?.bannerUrl, 'meta.bannerUrl')}
                  {vault.meta?.bannerUrl && (
                    <img src={vault.meta.bannerUrl} alt="Banner" className="w-full h-24 object-cover mt-2 rounded" />
                  )}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">X (Twitter) URL</label>
                  {renderField('X URL', vault.meta?.links?.x, 'links.x')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Website URL</label>
                  {renderField('Website', vault.meta?.links?.website, 'links.website')}
                </div>
              </div>
            </div>

            {/* ICO Settings */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4">ICO Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">Treasury Wallet</label>
                  {renderField('Treasury', vault.treasuryWallet, 'treasuryWallet')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">ICO Asset</label>
                  {renderField('ICO Asset', vault.meta?.icoAsset, 'meta.icoAsset')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">ICO Proposed Date</label>
                  {renderField('ICO Date', vault.meta?.icoProposedAt, 'meta.icoProposedAt', 'datetime-local')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Supply Intended</label>
                  {renderField('Supply', vault.meta?.supplyIntended, 'meta.supplyIntended')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">ICO Threshold (USD)</label>
                  {renderField('Threshold', vault.meta?.icoThresholdUsd, 'meta.icoThresholdUsd', 'number')}
                </div>
              </div>
            </div>

            {/* Timer & Airdrops */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Timer & Airdrops</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">Vault Token Supply</label>
                  {renderField('Supply', vault.meta?.vaultTokenSupply, 'meta.vaultTokenSupply', 'number')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">BID:WIN Multiplier</label>
                  {renderField('Multiplier', vault.meta?.bidMultiplier, 'meta.bidMultiplier', 'select')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Vault Lifespan (days)</label>
                  {renderField('Lifespan', vault.meta?.vaultLifespanDays, 'meta.vaultLifespanDays', 'number')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Timer Duration (seconds)</label>
                  {renderField('Timer', vault.timerDuration, 'timerDuration', 'number')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Airdrop Interval</label>
                  {renderField('Interval', vault.meta?.airdropInterval, 'meta.airdropInterval', 'select')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Airdrop Mode</label>
                  {renderField('Mode', vault.meta?.airdropMode, 'meta.airdropMode', 'select')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Minimum Hold Amount</label>
                  {renderField('Min Hold', vault.minHoldAmount, 'minHoldAmount', 'number')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Minimum Buy to Reset</label>
                  {renderField('Min Buy', vault.meta?.minBuyToReset, 'meta.minBuyToReset', 'number')}
                </div>
              </div>
            </div>

            {/* Assets */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Assets</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">Vault Asset</label>
                  {renderField('Vault Asset', vault.vaultAsset, 'vaultAsset')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Airdrop Asset</label>
                  {renderField('Airdrop Asset', vault.airdropAsset, 'airdropAsset')}
                </div>
              </div>
            </div>

            {/* Trade Fee Splits */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Trade Fee Splits</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">Total Trade Fee (%)</label>
                  {renderField('Total Fee', vault.meta?.totalTradeFee, 'meta.totalTradeFee', 'number')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Creator Split (%)</label>
                  {renderField('Creator', vault.meta?.splits?.creator, 'splits.creator', 'number')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Treasury Split (%)</label>
                  {renderField('Treasury', vault.meta?.splits?.treasury, 'splits.treasury', 'number')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Airdrops Split (%)</label>
                  {renderField('Airdrops', vault.meta?.splits?.airdrops, 'splits.airdrops', 'number')}
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Darwin Split (%)</label>
                  {renderField('Darwin', vault.meta?.splits?.darwin, 'splits.darwin', 'number')}
                </div>
              </div>
            </div>

            {/* Timing */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Timing</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">Start Date</label>
                  <span className="text-white/80">{vault.startDate ? new Date(vault.startDate).toLocaleString() : 'N/A'}</span>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Endgame Date</label>
                  <span className="text-white/80">{vault.endgameDate ? new Date(vault.endgameDate).toLocaleString() : 'N/A'}</span>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Distribution Interval</label>
                  <span className="text-white/80">{vault.distributionInterval}s</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


