'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Clock, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

function ICOContent() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [vault, setVault] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [treasuryBalance, setTreasuryBalance] = useState<any>(null);

  const BACKEND = (typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com')
    : 'https://treasury-vault-timer-backend.onrender.com'
  ).replace(/\/$/, '');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !id) return;
    
    const loadVault = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/vault/${id}/config`);
        if (res.ok) {
          const data = await res.json();
          setVault(data.vault);
        }
      } catch (error) {
        console.error('Error loading vault:', error);
      } finally {
        setLoading(false);
      }
    };
    loadVault();
  }, [id, BACKEND, isClient]);

  useEffect(() => {
    if (!vault?.treasuryWallet) return;

    const loadTreasuryBalance = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/admin/vaults/${id}/treasury-balance`);
        if (res.ok) {
          const data = await res.json();
          setTreasuryBalance(data);
        }
      } catch (error) {
        console.error('Error loading treasury balance:', error);
      }
    };

    loadTreasuryBalance();
    const interval = setInterval(loadTreasuryBalance, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [vault, id, BACKEND]);

  useEffect(() => {
    if (!vault?.meta?.icoProposedAt) return;

    const updateCountdown = () => {
      const icoStartTime = new Date(vault.meta.icoProposedAt);
      const icoEndTime = new Date(icoStartTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
      const now = new Date();
      const diff = icoEndTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('ICO Ended');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [vault]);

  const handleForceICOEnd = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/admin/vaults/${id}/force-ico-end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`ICO ended. Status: ${data.newStatus}`);
        window.location.reload();
      } else {
        alert('Failed to force ICO end');
      }
    } catch (error) {
      console.error('Error forcing ICO end:', error);
      alert('Error forcing ICO end');
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading vault data...</div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Vault not found</div>
      </div>
    );
  }

  const thresholdUsd = vault.meta?.icoThresholdUsd || 1000;
  const currentBalance = treasuryBalance?.totalUSDValue || 0;
  const thresholdMet = currentBalance >= thresholdUsd;
  const progressPercentage = Math.min((currentBalance / thresholdUsd) * 100, 100);

  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed" }}>
      <div className="mx-auto max-w-4xl px-4 py-8 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()} 
            className="bg-white/10 ring-1 ring-white/10 px-3 py-1 hover:bg-white/20 transition-colors"
          >
            ← Back
          </button>
          <Badge className="bg-green-600 text-white">
            ICO Active
          </Badge>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Vault Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                {vault.name} - ICO in Progress
              </CardTitle>
              <CardDescription className="text-gray-400">
                Initial Coin Offering is currently active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">ICO Start Time</label>
                  <span className="text-white/80">
                    {vault.meta?.icoProposedAt ? new Date(vault.meta.icoProposedAt).toLocaleString() : 'Not set'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Treasury Wallet</label>
                  <span className="text-white/80 font-mono text-sm">
                    {vault.treasuryWallet || 'Not set'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Status</label>
                  <Badge className="bg-green-600 text-white">
                    {vault.status}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Time Remaining</label>
                  <span className="text-white/80 font-mono">
                    {timeRemaining}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                ICO Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Progress to Threshold</span>
                  <span className="text-white font-mono">
                    ${currentBalance.toFixed(2)} / ${thresholdUsd.toLocaleString()}
                  </span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      thresholdMet ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {thresholdMet ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-green-400 font-semibold">
                        Threshold Met! Ready for Stage 2
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-blue-400" />
                      <span className="text-blue-400">
                        ${(thresholdUsd - currentBalance).toFixed(2)} remaining
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treasury Balance */}
          {treasuryBalance && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Treasury Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/80">Total USD Value:</span>
                    <span className="text-white font-mono">${treasuryBalance.totalUSDValue?.toFixed(2) || '0.00'}</span>
                  </div>
                  {treasuryBalance.assetBalances && Object.entries(treasuryBalance.assetBalances).map(([asset, data]: [string, any]) => (
                    <div key={asset} className="flex justify-between text-sm">
                      <span className="text-white/60">{asset}:</span>
                      <span className="text-white/80 font-mono">
                        {data.amount?.toFixed(4)} (${data.usd?.toFixed(2)})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => router.push(`/admin/details/${id}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              View Details
            </Button>
            <Button 
              onClick={handleForceICOEnd}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Force End ICO
            </Button>
            <Button 
              onClick={() => router.push('/admin')}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Back to Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ICOPage() {
  return (
    <ErrorBoundary>
      <ICOContent />
    </ErrorBoundary>
  );
}
