'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndex() {
  const router = useRouter();
  const [vaults, setVaults] = useState<any[]>([]);
  const [stage, setStage] = useState<'all'|'pre_ico'|'ico'|'countdown'|'active'|'extinct'>('all');
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/admin/vaults`);
        const js = await res.json();
        setVaults(js.vaults || []);
      } catch {}
    };
    load();
  }, [BACKEND]);

  return (
    <div className="min-h-screen w-full" style={{
      background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed",
    }}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Admin</h1>
        <div className="mb-8">
          <div className="bg-white/5 ring-1 ring-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-semibold">View Vaults on Platform</div>
              <select className="bg-white/10 text-white px-3 py-1" value={stage} onChange={(e)=>setStage(e.target.value as any)}>
                <option value="all">All</option>
                <option value="pre_ico">Pre‑ICO</option>
                <option value="ico">ICO Now</option>
                <option value="countdown">Countdown</option>
                <option value="active">Live</option>
                <option value="extinct">Extinct</option>
              </select>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {vaults.filter(v => stage==='all' || (v.status||'').toLowerCase()===stage).map(v => (
                <div key={v.id} className="flex items-center justify-between bg-white/5 ring-1 ring-white/10 p-3">
                  <div className="text-white">
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-xs text-white/60">{v.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/70">{(v.status||'draft').toUpperCase()}</span>
                    <button onClick={()=>router.push(`/admin/details/${v.id}`)} className="bg-white text-black px-2 py-1 text-xs">Details</button>
                    <button onClick={()=>router.push(`/vault/${v.id}`)} className="bg-white/10 ring-1 ring-white/20 text-white px-2 py-1 text-xs">Open</button>
                  </div>
                </div>
              ))}
              {vaults.length===0 && <div className="text-white/60">No vaults yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


