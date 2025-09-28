'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Clock, Zap, Users, Trophy, AlertTriangle } from 'lucide-react';

function ActiveVaultContent() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [vault, setVault] = useState<any>(null);
  const [vaultData, setVaultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

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
    if (!isClient || !id) return;

    const loadVaultData = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/vaults/data`);
        if (res.ok) {
          const data = await res.json();
          const vaultData = data.vaults.find((v: any) => v.id === id);
          if (vaultData) {
            setVaultData(vaultData);
          }
        }
      } catch (error) {
        console.error('Error loading vault data:', error);
      }
    };

    loadVaultData();
    const interval = setInterval(loadVaultData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [id, BACKEND, isClient]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
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

  const realTimeData = vaultData?.realTimeData;
  const timer = realTimeData?.timer;
  const token = realTimeData?.token;
  const vaultInfo = realTimeData?.vault;

  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed" }}>
      <div className="mx-auto max-w-6xl px-4 py-8 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()} 
            className="bg-white/10 ring-1 ring-white/10 px-3 py-1 hover:bg-white/20 transition-colors"
          >
            ← Back
          </button>
          <Badge className="bg-green-600 text-white">
            Active Vault
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer Section */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Timer Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timer ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      {formatTime(timer.timeLeft)}
                    </div>
                    <div className="text-white/80">
                      {timer.isActive ? 'Timer Active' : 'Timer Inactive'}
                    </div>
                  </div>
                  
                  {timer.lastBuyerAddress && (
                    <div className="space-y-2">
                      <div className="text-sm text-white/80">Last Purchase:</div>
                      <div className="text-sm font-mono text-white">
                        {timer.lastBuyerAddress.slice(0, 8)}...{timer.lastBuyerAddress.slice(-8)}
                      </div>
                      {timer.lastPurchaseAmount && (
                        <div className="text-sm text-white/80">
                          Amount: {timer.lastPurchaseAmount}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  No timer data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Token Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Token Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {token ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/80">Price:</span>
                    <span className="text-white font-mono">${token.price?.toFixed(6) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Market Cap:</span>
                    <span className="text-white font-mono">${token.marketCap?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">24h Volume:</span>
                    <span className="text-white font-mono">${token.volume24h?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Last Updated:</span>
                    <span className="text-white/80 text-sm">
                      {token.lastUpdated ? new Date(token.lastUpdated).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  No token data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Treasury Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-400" />
                Treasury & Winnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vaultInfo ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/80">Treasury Value:</span>
                    <span className="text-white font-mono">
                      ${vaultInfo.treasury?.usdValue?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Potential Winnings:</span>
                    <span className="text-white font-mono">
                      ${vaultInfo.potentialWinnings?.usdValue?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Multiplier:</span>
                    <span className="text-white font-mono">
                      {vaultInfo.potentialWinnings?.multiplier || 'N/A'}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Days Alive:</span>
                    <span className="text-white font-mono">
                      {vaultInfo.timer?.daysAlive || 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  No treasury data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Airdrop Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-green-400" />
                Airdrop Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vaultInfo?.airdrop ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/80">Next Airdrop:</span>
                    <span className="text-white/80 text-sm">
                      {vaultInfo.airdrop.nextAirdropTime ? 
                        new Date(vaultInfo.airdrop.nextAirdropTime).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Daily Time:</span>
                    <span className="text-white font-mono">
                      {vaultInfo.airdrop.dailyTime || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Minimum Hold:</span>
                    <span className="text-white font-mono">
                      {vaultInfo.airdrop.minimumHold?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Eligible Holders:</span>
                    <span className="text-white font-mono">
                      {vaultInfo.airdrop.eligibleHolders || 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  No airdrop data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center mt-8">
          <Button 
            onClick={() => router.push(`/admin/details/${id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            View Details
          </Button>
          <Button 
            onClick={() => router.push(`/vault/${id}`)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            View Public Page
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
  );
}

export default function ActiveVaultPage() {
  return (
    <ErrorBoundary>
      <ActiveVaultContent />
    </ErrorBoundary>
  );
}
