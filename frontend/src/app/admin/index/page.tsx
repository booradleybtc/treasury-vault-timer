'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndex() {
  const router = useRouter();
  const [vaults, setVaults] = useState<any[]>([]);
  const [pendingVaults, setPendingVaults] = useState<any[]>([]);
  const [stage, setStage] = useState<'all'|'pre_ico'|'ico'|'countdown'|'active'|'extinct'>('all');
  const [deletingVault, setDeletingVault] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/admin/vaults`);
        const js = await res.json();
        setVaults(js.vaults || []);
      } catch {}
    };
    
    const loadPending = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/admin/vaults/pending`);
        const js = await res.json();
        setPendingVaults(js.pendingVaults || []);
      } catch {}
    };
    
    load();
    loadPending();
  }, [BACKEND]);

  // Reset delete state after 5 seconds of inactivity
  useEffect(() => {
    if (deletingVault) {
      const timer = setTimeout(() => {
        setDeletingVault(null);
        setConfirmDelete(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [deletingVault]);

  const handleDeleteVault = async (vaultId: string) => {
    if (deletingVault !== vaultId) {
      // First confirmation
      setDeletingVault(vaultId);
      return;
    }
    
    if (confirmDelete !== vaultId) {
      // Second confirmation
      setConfirmDelete(vaultId);
      return;
    }

    try {
      const res = await fetch(`${BACKEND}/api/admin/vaults/${vaultId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        // Remove vault from local state
        setVaults(vaults.filter(v => v.id !== vaultId));
        alert('Vault deleted successfully');
      } else {
        alert('Failed to delete vault');
      }
    } catch (error) {
      console.error('Error deleting vault:', error);
      alert('Error deleting vault');
    } finally {
      setDeletingVault(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="min-h-screen w-full" style={{
      background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed",
    }}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="text-white/70 hover:text-white flex items-center gap-2"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white mb-6">Vault Management</h1>
        
        {/* Pending Stage 2 Vaults Section */}
        {pendingVaults.length > 0 && (
          <div className="mb-8">
            <div className="bg-yellow-500/10 ring-1 ring-yellow-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-yellow-300 font-semibold flex items-center gap-2">
                  ⚠️ Stage 2 Setup Required ({pendingVaults.length} vault{pendingVaults.length !== 1 ? 's' : ''})
                </div>
                <div className="text-yellow-400 text-sm">
                  48-hour timeout before auto-refund
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {pendingVaults.map(v => (
                  <div key={v.id} className="flex items-center justify-between bg-yellow-500/5 ring-1 ring-yellow-500/20 p-4">
                    <div className="text-white flex-1">
                      <div className="font-semibold text-lg">{v.name}</div>
                      <div className="text-xs text-white/60 mb-1">{v.id}</div>
                      <div className="text-sm text-white/80">
                        <span className="mr-4">Raised: ${(v.totalVolume || 0).toLocaleString()}</span>
                        <span className="mr-4">Pending: {v.pendingInfo?.hoursPending || 0}h</span>
                        <span className="text-yellow-400">
                          Time remaining: {v.pendingInfo?.hoursRemaining || 0}h
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">
                        PENDING
                      </span>
                      <button 
                        onClick={() => router.push(`/admin/stage2/${v.id}`)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 text-sm font-semibold"
                      >
                        Complete Stage 2
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
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
                <div key={v.id} className="flex items-center justify-between bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="text-white flex-1">
                    <div className="font-semibold text-lg">{v.name}</div>
                    <div className="text-xs text-white/60 mb-1">{v.id}</div>
                    <div className="text-sm text-white/80">
                      {v.meta?.ticker && <span className="mr-4">Ticker: {v.meta.ticker}</span>}
                      {v.meta?.vaultAsset && <span className="mr-4">Asset: {v.meta.vaultAsset}</span>}
                      {v.createdAt && <span>Created: {new Date(v.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      v.status === 'active' ? 'bg-green-500/20 text-green-300' :
                      v.status === 'pre_ico' ? 'bg-cyan-500/20 text-cyan-300' :
                      v.status === 'ico' ? 'bg-blue-500/20 text-blue-300' :
                      v.status === 'extinct' ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {(v.status||'draft').toUpperCase()}
                    </span>
                    <button onClick={()=>router.push(`/admin/details/${v.id}`)} className="bg-white text-black px-3 py-1 text-xs hover:bg-gray-200">Details</button>
                    <button onClick={()=>router.push(`/vault/${v.id}`)} className="bg-white/10 ring-1 ring-white/20 text-white px-3 py-1 text-xs hover:bg-white/20">View</button>
                    {deletingVault === v.id ? (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleDeleteVault(v.id)}
                          className={`px-3 py-1 text-xs transition-colors ${
                            confirmDelete === v.id
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                          }`}
                        >
                          {confirmDelete === v.id ? 'Confirm Delete' : 'Click Again'}
                        </button>
                        <button 
                          onClick={() => {
                            setDeletingVault(null);
                            setConfirmDelete(null);
                          }}
                          className="bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 px-3 py-1 text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleDeleteVault(v.id)}
                        className="bg-red-500/20 text-red-300 hover:bg-red-500/30 px-3 py-1 text-xs transition-colors"
                      >
                        Delete
                      </button>
                    )}
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


