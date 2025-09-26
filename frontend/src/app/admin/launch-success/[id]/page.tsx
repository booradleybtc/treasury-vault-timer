'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { StatusAwareVaultCard } from '@/components/darwin/StatusAwareVaultCard';

export default function LaunchSuccessPage() {
  const router = useRouter();
  const routeParams = useParams();
  const vaultId = Array.isArray(routeParams?.id) ? routeParams.id[0] : (routeParams?.id as string);
  const [vault, setVault] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [snapshotCopied, setSnapshotCopied] = useState(false);
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    const load = async () => {
      try {
        if (!vaultId) return;
        const res = await fetch(`${BACKEND}/api/admin/vaults`);
        if (res.ok) {
          const js = await res.json();
          const foundVault = js.vaults?.find((v: any) => v.id === vaultId);
          if (foundVault) {
            setVault(foundVault);
          }
        }
      } catch (error) {
        console.error('Failed to load vault:', error);
      }
    };
    load();
  }, [vaultId, BACKEND]);

  const copyUrl = async () => {
    try {
      const url = `${window.location.origin}/vault/${vaultId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const copySnapshot = async () => {
    try {
      // Get the featured card element
      const cardElement = document.getElementById('featured-card-snapshot');
      if (!cardElement) return;

      // Use html2canvas to capture the card as an image
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      // Convert to blob and copy
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]);
            setSnapshotCopied(true);
            setTimeout(() => setSnapshotCopied(false), 2000);
          } catch (error) {
            console.error('Failed to copy image:', error);
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Failed to generate snapshot:', error);
    }
  };

  const vaultUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/vault/${vaultId}`;

  return (
    <div className="min-h-screen w-full" style={{
      background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed",
    }}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Vault Launched Successfully!</h1>
          <p className="text-white/70 text-lg">Your vault is now live and ready for Pre-ICO</p>
        </div>

        {/* Vault Details */}
        {vault && (
          <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Vault Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/80">
              <div>
                <span className="text-white/60">Name:</span> {vault.name}
              </div>
              <div>
                <span className="text-white/60">Ticker:</span> {vault.meta?.ticker || 'N/A'}
              </div>
              <div>
                <span className="text-white/60">Status:</span> 
                <span className="ml-2 px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded">
                  {(vault.status || 'pre_ico').toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-white/60">ICO Date:</span> {vault.meta?.icoProposedAt ? new Date(vault.meta.icoProposedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Featured Card Snapshot */}
        {vault && (
          <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Featured Card Snapshot</h2>
              <button
                onClick={copySnapshot}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                {snapshotCopied ? 'Copied!' : 'Copy Snapshot'}
              </button>
            </div>
            <div id="featured-card-snapshot" className="max-w-md mx-auto">
              <StatusAwareVaultCard
                vault={vault}
                variant="featured"
                onTrade={() => {}}
                onClickTitle={() => {}}
              />
            </div>
            <p className="text-white/60 text-sm text-center mt-3">
              Perfect for sharing on X/Twitter and other social platforms
            </p>
          </div>
        )}

        {/* Share URL */}
        <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Share Your Vault</h2>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={vaultUrl}
              readOnly
              className="flex-1 bg-white/10 text-white px-3 py-2 rounded ring-1 ring-white/10"
            />
            <button
              onClick={copyUrl}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
          <p className="text-white/60 text-sm">
            Share this link with your community to start the Pre-ICO phase
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push(`/vault/${vaultId}`)}
            className="bg-[#58A6FF] hover:bg-[#4a95e6] text-white px-6 py-3 rounded-none shadow-[0_0_18px_rgba(88,166,255,0.45)] font-semibold"
          >
            View Live Vault
          </button>
          <button
            onClick={() => router.push('/admin/index')}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-none ring-1 ring-white/10 font-semibold"
          >
            Manage All Vaults
          </button>
          <button
            onClick={() => router.push('/admin/launch')}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-none ring-1 ring-white/10 font-semibold"
          >
            Launch Another Vault
          </button>
        </div>

        {/* Next Steps */}
        <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-3">What's Next?</h3>
          <div className="space-y-2 text-white/80">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
              <div>
                <strong>Share your vault:</strong> Use the snapshot and URL above to promote your vault on social media
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
              <div>
                <strong>Monitor the ICO:</strong> Track progress toward the $1000 threshold in your vault dashboard
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
              <div>
                <strong>Launch Stage 2:</strong> Once the ICO reaches $1000, you can proceed to the live vault stage
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

