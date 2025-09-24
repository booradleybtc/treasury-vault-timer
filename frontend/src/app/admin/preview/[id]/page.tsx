'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FeaturedVaultCard } from '@/components/darwin/FeaturedVaultCard';
import { TallVaultCard } from '@/components/darwin/TallVaultCard';
import { VaultRow } from '@/components/darwin/VaultRow';

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
          setVault(js.vault);
        }
      } catch {}
    };
    load();
  }, [vaultId, BACKEND]);

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
          <FeaturedVaultCard
            imageUrl="/images/ChatGPT Image Aug 13, 2025, 05_54_57 PM.png"
            title={vault?.name || 'Vault'}
            subtitle={stage.toUpperCase()}
            tokenTicker={vault?.airdropAsset || 'REVS'}
            addressShort={vault?.tokenMint ? `${vault.tokenMint.slice(0,6)}...${vault.tokenMint.slice(-4)}` : '—'}
            tokenPfpUrl="/images/token.png"
            vaultAssetIconSrc="/images/Solana_logo.png"
            tokenBadgeText={vault?.airdropAsset || 'REVS'}
            tokenBadgeClassName="bg-emerald-500 text-black"
            stats={[
              { label: 'Price', value: '$0.0000' },
              { label: 'Vault Asset', value: vault?.vaultAsset || 'SOL' },
              { label: 'Treasury', value: 'N/A' },
              { label: 'Potential Win', value: '—' },
              { label: 'APY*', value: 'N/A' },
            ]}
            timer={{ value: stage==='live' ? '00:59' : stage==='countdown' ? '23:59:59' : '—' }}
            endgameDays={stage==='live' ? 91 : undefined}
            xUrl="https://x.com"
            aspect="3/1"
            onClickTitle={()=>{}}
            onTrade={()=>{}}
          />
        </div>

        {/* Tall card + List row previews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <TallVaultCard
            name={vault?.name || 'Vault'}
            timer={stage==='live' ? '59:00' : '—'}
            imageUrl="/images/ChatGPT Image Aug 13, 2025, 05_54_57 PM.png"
            pfp="/images/token.png"
            price={'N/A'}
            baseAsset={vault?.vaultAsset || 'SOL'}
            treasury={'N/A'}
            potentialWin={'—'}
            apy={'N/A'}
            endgame={stage==='live' ? '91d' : '—'}
            tokenTicker={vault?.airdropAsset || 'REVS'}
            addressShort={vault?.tokenMint ? `${vault.tokenMint.slice(0,6)}...${vault.tokenMint.slice(-4)}` : undefined}
            onTrade={()=>{}}
          />
          <div className="bg-white/5 ring-1 ring-white/10 p-3">
          <VaultRow
            name={vault?.name || 'Vault'}
            timer={stage==='live' ? '59:00' : '—'}
            pfp="/images/token.png"
            price={'N/A'}
            baseAsset={vault?.vaultAsset || 'SOL'}
            treasury={'N/A'}
            potentialWin={'—'}
            apy={'N/A'}
            endgame={stage==='live' ? '91d' : '—'}
            onTrade={()=>{}}
          />
          </div>
        </div>

        {/* Dedicated page preview placeholder */}
        <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-white">Dedicated Page Preview</h2>
            <span className="text-xs text-white/70">Stage: {stage.toUpperCase()}</span>
          </div>
          <div className="text-white/80 text-sm mb-4">This will preview the full vault page with stage-specific UI. Placeholder for now.</div>
          <button 
            className="bg-[#58A6FF] hover:bg-[#4a95e6] text-white px-4 py-2 shadow-[0_0_18px_rgba(88,166,255,0.45)] font-semibold" 
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


