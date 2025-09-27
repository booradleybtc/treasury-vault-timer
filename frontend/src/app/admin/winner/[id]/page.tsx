'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function WinnerConfirmation() {
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

  const handleConfirmWinner = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`${BACKEND}/api/admin/vaults/${id}/confirm-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        alert('Winner confirmed successfully!');
        router.push('/admin');
      } else {
        alert('Failed to confirm winner');
      }
    } catch (error) {
      console.error('Failed to confirm winner:', error);
      alert('Failed to confirm winner');
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
          <h1 className="text-3xl font-bold text-white mb-6">Winner Confirmation</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Vault Details</h2>
              <div className="space-y-2 text-white/70">
                <p><span className="font-medium">Name:</span> {vault.name}</p>
                <p><span className="font-medium">ID:</span> {vault.id}</p>
                <p><span className="font-medium">Status:</span> {vault.status}</p>
                <p><span className="font-medium">Treasury:</span> {vault.treasuryWallet}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Winner Information</h2>
              <div className="space-y-2 text-white/70">
                <p><span className="font-medium">Last Buyer:</span> {vault.lastPurchaseSignature || 'N/A'}</p>
                <p><span className="font-medium">Total Volume:</span> ${vault.totalVolume || 0}</p>
                <p><span className="font-medium">Total Purchases:</span> {vault.totalPurchases || 0}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleConfirmWinner}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {processing ? 'Processing...' : 'Confirm Winner'}
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
