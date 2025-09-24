'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function VaultDetails() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [vault, setVault] = useState<any>(null);
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/vault/${id}/config`);
        if (res.ok) {
          const js = await res.json();
          setVault(js.vault);
        }
      } catch {}
    };
    if (id) load();
  }, [id, BACKEND]);

  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed" }}>
      <div className="mx-auto max-w-4xl px-4 py-8 text-white">
        <button onClick={()=>router.back()} className="mb-4 bg-white/10 ring-1 ring-white/10 px-3 py-1">Back</button>
        <h1 className="text-2xl font-bold mb-4">Vault Details</h1>
        {!vault ? <div className="text-white/70">Loading…</div> : (
          <div className="space-y-4">
            <div className="bg-white/5 ring-1 ring-white/10 p-4">
              <div className="font-semibold mb-2">Basics</div>
              <div>Name: {vault.name}</div>
              <div>ID: {vault.id}</div>
              <div>Token: {vault.tokenMint}</div>
              <div>Status: {vault.status}</div>
            </div>
            <div className="bg-white/5 ring-1 ring-white/10 p-4">
              <div className="font-semibold mb-2">Wallets</div>
              <div>Treasury: {vault.treasuryWallet}</div>
              <div>Distribution: {vault.distributionWallet}</div>
              <div>Dev: {vault.devWallet}</div>
            </div>
            <div className="bg-white/5 ring-1 ring-white/10 p-4">
              <div className="font-semibold mb-2">Timing</div>
              <div>Start: {vault.startDate}</div>
              <div>Endgame: {vault.endgameDate}</div>
              <div>Timer: {vault.timerDuration}s</div>
              <div>Distribution Interval: {vault.distributionInterval}s</div>
            </div>
            <div className="bg-white/5 ring-1 ring-white/10 p-4">
              <div className="font-semibold mb-2">Assets</div>
              <div>Vault Asset: {vault.vaultAsset}</div>
              <div>Airdrop Asset: {vault.airdropAsset}</div>
            </div>
            <div className="bg-white/5 ring-1 ring-white/10 p-4">
              <div className="font-semibold mb-2">Tax Split</div>
              <div>Dev: {vault.taxSplit?.dev}%</div>
              <div>Holders: {vault.taxSplit?.holders}%</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


