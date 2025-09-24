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
  const [stage, setStage] = useState<'pre_ico'|'ico'|'countdown'|'live'|'extinct'>('pre_ico');
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    const load = async () => {
      try {
        if (!vaultId) return;
        const res = await fetch(`${BACKEND}/api/vault/${vaultId}/config`);
        if (res.ok) {
          const js = await res.json();
          setVault({ ...js.vault, status: stage });
        }
      } catch {}
    };
    load();
  }, [vaultId, BACKEND]);

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
          <h1 className="text-2xl font-bold text-white">Vault Preview</h1>
          <div className="flex items-center gap-2">
            <select className="bg-white/10 text-white px-3 py-2 ring-1 ring-white/10" value={stage} onChange={(e)=>setStage(e.target.value as any)}>
              <option value="pre_ico">Pre‑ICO</option>
              <option value="ico">ICO</option>
              <option value="countdown">Countdown</option>
              <option value="live">Live</option>
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
            className="bg-[#58A6FF] hover:bg-[#4a95e6] text-white px-6 py-3 shadow-[0_0_18px_rgba(88,166,255,0.45)] font-semibold" 
            onClick={async () => {
              try {
                const res = await fetch(`${BACKEND}/api/admin/vaults/${vaultId}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'pre_ico' })
                });
                if (res.ok) {
                  alert('Vault launched as Pre-ICO successfully!');
                  router.push('/admin/index');
                } else {
                  alert('Failed to launch vault');
                }
              } catch (e) {
                alert('Error launching vault');
              }
            }}
          >
            Launch Vault (Pre‑ICO)
          </button>
        </div>
      </div>
    </div>
  );
}


