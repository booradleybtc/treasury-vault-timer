'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EndgameProcessing() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [vault, setVault] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    const loadVault = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/admin/vaults/${id}`);
        if (res.ok) {
          const data = await res.json();
          setVault(data.vault);
        }
      } catch (error) {
        console.error('Failed to load vault:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) loadVault();
  }, [id, BACKEND]);

  const handleProcessEndgame = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`${BACKEND}/api/admin/vaults/${id}/force-endgame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        alert('Endgame processed successfully!');
        router.push('/admin');
      } else {
        alert('Failed to process endgame');
      }
    } catch (error) {
      console.error('Failed to process endgame:', error);
      alert('Failed to process endgame');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading vault data...</div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Vault not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-8 rounded-lg">
          <h1 className="text-3xl font-bold text-white mb-6">Endgame Processing</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Vault Details</h2>
              <div className="space-y-2 text-white/70">
                <p><span className="font-medium">Name:</span> {vault.name}</p>
                <p><span className="font-medium">ID:</span> {vault.id}</p>
                <p><span className="font-medium">Status:</span> {vault.status}</p>
                <p><span className="font-medium">Endgame Date:</span> {vault.endgameDate ? new Date(vault.endgameDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Final Statistics</h2>
              <div className="space-y-2 text-white/70">
                <p><span className="font-medium">Total Volume:</span> ${vault.totalVolume || 0}</p>
                <p><span className="font-medium">Total Purchases:</span> {vault.totalPurchases || 0}</p>
                <p><span className="font-medium">Treasury Balance:</span> {vault.treasuryWallet}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mb-6">
            <p className="text-yellow-200">
              <strong>Warning:</strong> Processing endgame will finalize the vault and distribute rewards. This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleProcessEndgame}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {processing ? 'Processing...' : 'Process Endgame'}
            </button>
            
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
