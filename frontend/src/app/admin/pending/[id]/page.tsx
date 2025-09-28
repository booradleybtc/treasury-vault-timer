'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Clock, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';

function PendingContent() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [vault, setVault] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [timePending, setTimePending] = useState<string>('');

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
    if (!vault?.updatedAt) return;

    const updateTimePending = () => {
      const pendingSince = new Date(vault.updatedAt);
      const now = new Date();
      const diff = now.getTime() - pendingSince.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimePending(`${hours}h ${minutes}m`);
      } else {
        setTimePending(`${minutes}m`);
      }
    };

    updateTimePending();
    const interval = setInterval(updateTimePending, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [vault]);

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

  const canProceedToStage2 = vault.status === 'pending' && vault.totalVolume >= (vault.meta?.icoThresholdUsd || 1000);

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
          <Badge className="bg-yellow-600 text-white">
            Pending Stage 2
          </Badge>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Success Message */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                ICO Successfully Completed!
              </CardTitle>
              <CardDescription className="text-gray-400">
                Congratulations! The ICO has met its threshold and is ready for Stage 2 setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">Total Raised</label>
                  <span className="text-green-400 font-bold text-xl">
                    ${vault.totalVolume?.toLocaleString() || '0'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Threshold</label>
                  <span className="text-white/80">
                    ${(vault.meta?.icoThresholdUsd || 1000).toLocaleString()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Time Pending</label>
                  <span className="text-white/80">
                    {timePending}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Status</label>
                  <Badge className="bg-yellow-600 text-white">
                    {vault.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-blue-400" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <div>
                    <div className="text-white font-semibold">Complete Stage 2 Setup</div>
                    <div className="text-gray-400 text-sm">
                      Configure token monitoring, distribution wallet, and launch parameters
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <div>
                    <div className="text-white/60 font-semibold">Set Launch Date</div>
                    <div className="text-gray-500 text-sm">
                      Choose when the vault should go live with timer functionality
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <div>
                    <div className="text-white/60 font-semibold">Vault Goes Live</div>
                    <div className="text-gray-500 text-sm">
                      Timer starts and token purchases reset the countdown
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="bg-white/5 border-yellow-400/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <div className="text-yellow-400 font-semibold">Important</div>
                  <div className="text-gray-400 text-sm">
                    Vaults in pending status will automatically move to refund_required if Stage 2 is not completed within 24 hours.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            {canProceedToStage2 ? (
              <Button 
                onClick={() => router.push(`/admin/stage2/${id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                Complete Stage 2 Setup
              </Button>
            ) : (
              <Button 
                disabled
                className="bg-gray-600 text-gray-400 px-8 py-3 text-lg cursor-not-allowed"
              >
                Complete Stage 2 Setup
              </Button>
            )}
            
            <Button 
              onClick={() => router.push(`/admin/details/${id}`)}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              View Details
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

export default function PendingPage() {
  return (
    <ErrorBoundary>
      <PendingContent />
    </ErrorBoundary>
  );
}
