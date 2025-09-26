'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { StatusAwareVaultCard } from '@/components/darwin/StatusAwareVaultCard';
import { VaultPagePreview } from '@/components/darwin/VaultPagePreview';

export default function PreviewPage() {
  const router = useRouter();
  const routeParams = useParams();
  const vaultId = Array.isArray(routeParams?.id) ? routeParams.id[0] : (routeParams?.id as string);
  const [vault, setVault] = useState<any>(null);
  const [stage, setStage] = useState<'pre_ico'|'ico'|'ico_pending'|'pre_launch'|'live'|'winner_confirmation'|'endgame_processing'|'extinct'>('pre_ico');
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    const load = () => {
      try {
        if (!vaultId) return;
        
        // First try to load from localStorage (for preview data)
        const previewData = localStorage.getItem('vaultPreviewData');
        if (previewData && vaultId.startsWith('preview-')) {
          const parsedData = JSON.parse(previewData);
          setVault({ ...parsedData, status: stage });
          return;
        }
        
        // If not preview data, try to fetch from backend (for existing vaults)
        const loadFromBackend = async () => {
          try {
            const res = await fetch(`${BACKEND}/api/vault/${vaultId}/config`);
            if (res.ok) {
              const js = await res.json();
              setVault({ ...js.vault, status: stage });
            }
          } catch {}
        };
        loadFromBackend();
      } catch {}
    };
    load();
  }, [vaultId, BACKEND, stage]);

  // Update vault status when stage changes
  useEffect(() => {
    if (vault) {
      setVault({ ...vault, status: stage });
    }
  }, [stage]);

  return (
    <div className="min-h-screen w-full" style={{
      background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed",
    }}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                // Store vault data for the wizard to load (convert back to form data format)
                if (vault) {
                  const formData = {
                    name: vault.name || '',
                    description: vault.description || '',
                    ticker: vault.meta?.ticker || '',
                    treasuryWallet: vault.treasuryWallet || '',
                    icoAsset: vault.meta?.icoAsset || 'So11111111111111111111111111111111111111112',
                    icoProposedAt: vault.meta?.icoProposedAt ? new Date(vault.meta.icoProposedAt).toISOString().slice(0, 16) : '',
                    supplyIntended: vault.meta?.supplyIntended || '',
                    bidMultiplier: vault.meta?.bidMultiplier || 100,
                    vaultTokenSupply: vault.meta?.vaultTokenSupply || 1000000,
                    timerDuration: vault.timerDuration ? Math.round(vault.timerDuration / 60) : 60, // convert seconds to minutes
                    vaultLifespanDays: vault.meta?.vaultLifespanDays || 100,
                    minBuyToReset: vault.meta?.minBuyToReset || 0,
                    minHoldAmount: vault.minHoldAmount || 0,
                    airdropInterval: vault.distributionInterval || 3600,
                    airdropMode: vault.meta?.airdropMode || 'rewards',
                    vaultAsset: vault.vaultAsset || 'So11111111111111111111111111111111111111112',
                    airdropAsset: vault.airdropAsset || '',
                    totalTradeFee: vault.meta?.totalTradeFee || 5,
                    splitCreator: vault.meta?.splits?.creator || 0,
                    splitTreasury: vault.meta?.splits?.treasury || 0,
                    splitAirdrops: vault.meta?.splits?.airdrops || 0,
                    splitDarwin: vault.meta?.splits?.darwin || 0,
                    xUrl: vault.meta?.links?.x || '',
                    websiteUrl: vault.meta?.links?.website || '',
                    logoUrl: vault.meta?.logoUrl || '',
                    bannerUrl: vault.meta?.bannerUrl || '',
                    // Also store custom token data if available
                    customTokenData: vault.customTokenData || null
                  };
                  localStorage.setItem('vaultWizardData', JSON.stringify(formData));
                }
                router.push('/admin/launch');
              }}
              className="bg-white/10 text-white px-4 py-2 ring-1 ring-white/10 hover:bg-white/20 flex items-center gap-2"
            >
              ← Back to Wizard
            </button>
            <h1 className="text-2xl font-bold text-white">Vault Preview</h1>
          </div>
          <div className="flex items-center gap-2">
            <select className="bg-white/10 text-white px-3 py-2 ring-1 ring-white/10" value={stage} onChange={(e)=>setStage(e.target.value as any)}>
              <option value="pre_ico">Pre‑ICO</option>
              <option value="ico">ICO Live</option>
              <option value="ico_pending">ICO Pending</option>
              <option value="pre_launch">Pre-Launch</option>
              <option value="live">Live</option>
              <option value="winner_confirmation">Winner Confirmation</option>
              <option value="endgame_processing">Endgame Processing</option>
              <option value="extinct">Extinct</option>
            </select>
            <button className="rounded-none bg-white text-black px-3 py-2" onClick={()=>vaultId && router.push(`/vault/${vaultId}`)}>Open Vault Page</button>
          </div>
        </div>

        {/* Featured card preview */}
        <div className="mb-6">
          <StatusAwareVaultCard
            vault={vault || { id: vaultId || '', name: 'Vault' }}
            variant="featured"
            onTrade={()=>{}}
            onClickTitle={()=>{}}
          />
        </div>

        {/* Tall card preview */}
        <div className="mb-8">
          <StatusAwareVaultCard
            vault={vault || { id: vaultId || '', name: 'Vault' }}
            variant="tall"
            onTrade={()=>{}}
          />
        </div>

        {/* List row preview - full width */}
        <div className="mb-8">
          <StatusAwareVaultCard
            vault={vault || { id: vaultId || '', name: 'Vault' }}
            variant="row"
            onTrade={()=>{}}
            className="w-full"
          />
        </div>

        {/* Dedicated page preview */}
        <VaultPagePreview
          vault={vault || { id: vaultId || '', name: 'Vault' }}
          status={stage}
          className="mb-6"
        />

        {/* Launch button */}
        <div className="text-center">
          <button 
            className="bg-[#58A6FF] hover:bg-[#4a95e6] text-white px-8 py-4 shadow-[0_0_18px_rgba(88,166,255,0.45)] font-semibold text-lg" 
            onClick={async () => {
              if (!confirm('Are you sure you want to launch this vault? This will make it live and visible to users.')) {
                return;
              }
              
              try {
                if (!vault) {
                  alert('No vault data to launch');
                  return;
                }

                // Create the actual vault in the backend
                const vaultPayload = {
                  ...vault,
                  id: vault.id.replace('preview-', ''), // Remove preview prefix
                  status: 'pre_ico' // Set to actual launch status
                };

                const res = await fetch(`${BACKEND}/api/admin/vaults`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(vaultPayload)
                });

                if (res.ok) {
                  const result = await res.json();
                  // Clear preview data
                  localStorage.removeItem('vaultPreviewData');
                  router.push(`/admin/launch-success/${result.vault?.id || vaultPayload.id}`);
                } else {
                  const errorText = await res.text().catch(() => '');
                  alert(`Failed to launch vault: ${res.status} ${errorText}`);
                }
              } catch (e) {
                alert('Error launching vault: ' + (e instanceof Error ? e.message : 'Unknown error'));
              }
            }}
          >
            🚀 Launch Vault (Pre‑ICO)
          </button>
          <p className="text-white/60 text-sm mt-2">
            This will create and launch your vault, making it live and visible to users
          </p>
        </div>
      </div>
    </div>
  );
}


