'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Clock, Rocket, CheckCircle, AlertTriangle } from 'lucide-react';

function PrelaunchContent() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [vault, setVault] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [timeUntilLaunch, setTimeUntilLaunch] = useState<string>('');

  const BACKEND = 'https://treasury-vault-timer-backend.onrender.com';

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
    if (!vault?.meta?.stage2?.vaultLaunchDate) return;

    const updateCountdown = () => {
      const launchDate = new Date(vault.meta.stage2.vaultLaunchDate);
      const now = new Date();
      const diff = launchDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilLaunch('Launch time reached!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeUntilLaunch(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeUntilLaunch(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilLaunch(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

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

  const launchDate = vault.meta?.stage2?.vaultLaunchDate;
  const isLaunchTimeReached = launchDate && new Date(launchDate) <= new Date();

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
            Prelaunch Stage
          </Badge>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Vault Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Rocket className="h-5 w-5 text-yellow-400" />
                {vault.name} - Ready for Launch
              </CardTitle>
              <CardDescription className="text-gray-400">
                Vault is configured and waiting for launch date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">Token Address</label>
                  <span className="text-white/80 font-mono text-sm">
                    {vault.tokenMint || 'Not set'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Distribution Wallet</label>
                  <span className="text-white/80 font-mono text-sm">
                    {vault.distributionWallet || 'Not set'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Launch Date</label>
                  <span className="text-white/80">
                    {launchDate ? new Date(launchDate).toLocaleString() : 'Not set'}
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

          {/* Launch Countdown */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Launch Countdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {launchDate ? (
                <div className="text-center">
                  {isLaunchTimeReached ? (
                    <div className="space-y-4">
                      <div className="text-2xl font-bold text-green-400 flex items-center justify-center gap-2">
                        <CheckCircle className="h-6 w-6" />
                        Launch Time Reached!
                      </div>
                      <p className="text-gray-400">
                        The vault should automatically transition to active status.
                      </p>
                      <Button 
                        onClick={() => window.location.reload()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Refresh Status
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-4xl font-bold text-blue-400">
                        {timeUntilLaunch}
                      </div>
                      <p className="text-gray-400">
                        Until vault launch
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-red-400 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Launch date not set
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => router.push(`/admin/details/${id}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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

export default function PrelaunchPage() {
  return (
    <ErrorBoundary>
      <PrelaunchContent />
    </ErrorBoundary>
  );
}
