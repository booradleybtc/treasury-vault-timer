'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'react-router-dom';

export default function RefundPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [vault, setVault] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refundTxSignature, setRefundTxSignature] = useState('');
  const [notes, setNotes] = useState('');
  
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    const loadVault = async () => {
      try {
        const response = await fetch(`${BACKEND}/api/admin/vaults`);
        const data = await response.json();
        const vaultData = data.vaults.find((v: any) => v.id === params.id);
        setVault(vaultData);
      } catch (error) {
        console.error('Error loading vault:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVault();
  }, [params.id, BACKEND]);

  const processRefund = async () => {
    if (!refundTxSignature.trim()) {
      alert('Please enter a refund transaction signature');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${BACKEND}/api/admin/vaults/${params.id}/process-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundTxSignature: refundTxSignature.trim(),
          notes: notes.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Refund processed successfully!');
        router.push('/admin/index');
      } else {
        alert(`Failed to process refund: ${data.error}`);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Error processing refund');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{
        background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed",
      }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{
        background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed",
      }}>
        <div className="text-white">Vault not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{
      background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed",
    }}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/admin/index')}
            className="text-white/70 hover:text-white flex items-center gap-2"
          >
            ← Back to Admin Dashboard
          </button>
        </div>

        <div className="bg-red-500/10 ring-1 ring-red-500/20 p-6">
          <h1 className="text-2xl font-bold text-red-300 mb-6">Process Refund</h1>
          
          <div className="bg-white/5 ring-1 ring-white/10 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Vault Information</h2>
            <div className="space-y-2 text-white/80">
              <div><span className="font-semibold">Name:</span> {vault.name}</div>
              <div><span className="font-semibold">ID:</span> {vault.id}</div>
              <div><span className="font-semibold">Status:</span> <span className="text-red-400">{vault.status}</span></div>
              <div><span className="font-semibold">Amount to Refund:</span> <span className="text-green-400">${(vault.totalVolume || 0).toLocaleString()}</span></div>
              <div><span className="font-semibold">Treasury Wallet:</span> <span className="font-mono text-sm">{vault.treasuryWallet}</span></div>
            </div>
          </div>

          <div className="bg-white/5 ring-1 ring-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Refund Processing</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Refund Transaction Signature *
                </label>
                <input
                  type="text"
                  value={refundTxSignature}
                  onChange={(e) => setRefundTxSignature(e.target.value)}
                  placeholder="Enter the transaction signature for the refund"
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the refund process"
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={processRefund}
                  disabled={processing || !refundTxSignature.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-semibold"
                >
                  {processing ? 'Processing...' : 'Process Refund'}
                </button>
                
                <button
                  onClick={() => router.push('/admin/index')}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-yellow-500/10 ring-1 ring-yellow-500/20 p-4">
            <div className="text-yellow-300 font-semibold mb-2">⚠️ Important Notes:</div>
            <ul className="text-yellow-200/80 text-sm space-y-1">
              <li>• This action will mark the refund as processed and move the vault to COMPLETED status</li>
              <li>• The actual crypto transfer must be done manually using your wallet</li>
              <li>• Make sure to record the transaction signature for audit purposes</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}