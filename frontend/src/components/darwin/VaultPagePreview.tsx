import React, { useState, useEffect } from 'react';
import { Copy, Clock, AlertCircle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export type VaultStatus = 'pre_ico' | 'ico' | 'ico_pending' | 'pre_launch' | 'live' | 'extinct';

interface VaultData {
  id: string;
  name: string;
  description?: string;
  tokenMint?: string;
  treasuryWallet?: string;
  vaultAsset?: string;
  airdropAsset?: string;
  startDate?: string;
  meta?: {
    ticker?: string;
    logoUrl?: string;
    bannerUrl?: string;
    icoProposedAt?: string;
    icoEndsAt?: string;
    supplyIntended?: string;
    bidMultiplier?: number;
    vaultLifespanDays?: number;
    minBuyToReset?: number;
    airdropInterval?: number;
    airdropMode?: string;
    splits?: {
      creator?: number;
      treasury?: number;
      airdrops?: number;
      darwin?: number;
    };
    links?: {
      x?: string;
      website?: string;
    };
    icoThresholdUsd?: number;
  };
  status?: VaultStatus;
}

interface VaultPagePreviewProps {
  vault: VaultData;
  status: VaultStatus;
  className?: string;
}

export function VaultPagePreview({ vault, status, className }: VaultPagePreviewProps) {
  const [countdown, setCountdown] = useState('');
  const meta = vault.meta || {};

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      if (status === 'ico' && meta.icoEndsAt) {
        setCountdown(formatCountdown(meta.icoEndsAt));
      } else if (status === 'pre_launch' && vault.startDate) {
        setCountdown(formatCountdown(vault.startDate));
      } else if (status === 'pre_ico' && meta.icoProposedAt) {
        setCountdown(formatTimeToICO(meta.icoProposedAt));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status, meta.icoEndsAt, vault.startDate, meta.icoProposedAt]);

  function formatCountdown(endDate: string): string {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return '00:00:00';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function formatTimeToICO(icoDate: string): string {
    const now = new Date();
    const ico = new Date(icoDate);
    const diff = ico.getTime() - now.getTime();
    
    if (diff <= 0) return 'ICO Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const renderStatusContent = () => {
    switch (status) {
      case 'pre_ico':
        return (
          <div className="py-12">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Pre-ICO Stage</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto text-center">
              This vault is scheduled to begin its ICO fundraise. 
              The ICO will run for 24 hours and must raise at least ${meta.icoThresholdUsd || 1000} to proceed to launch.
            </p>
            
            {meta.icoProposedAt && (
              <div className="bg-white/5 rounded-lg p-6 mb-8 max-w-md mx-auto text-center">
                <div className="text-sm text-white/60 mb-2">ICO Begins</div>
                <div className="text-3xl font-bold text-blue-400">{countdown}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-4 text-lg">Vault Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Name:</span>
                    <span className="text-white">{vault.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Ticker:</span>
                    <span className="text-white">{meta.ticker || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Supply:</span>
                    <span className="text-white">{meta.supplyIntended || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Bid:Win:</span>
                    <span className="text-white font-semibold">{meta.bidMultiplier || 100}×</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Lifespan:</span>
                    <span className="text-white">{meta.vaultLifespanDays || 100} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Timer Length:</span>
                    <span className="text-white">{Math.floor(vault.timerDuration / 3600)} hours</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-4 text-lg">Assets & Splits</h3>
                <div className="space-y-3 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-white/70">Vault Asset:</span>
                    <span className="text-white font-semibold">{vault.vaultAsset || 'SOL'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Airdrop Asset:</span>
                    <span className="text-white font-semibold">{meta.ticker || vault.airdropAsset || 'REVS'}</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <h4 className="font-medium text-white mb-3">Tax Splits</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Creator:</span>
                      <span className="text-white">{meta.splits?.creator || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Treasury:</span>
                      <span className="text-white">{meta.splits?.treasury || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Airdrops:</span>
                      <span className="text-white">{meta.splits?.airdrops || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Darwin:</span>
                      <span className="text-white">{meta.splits?.darwin || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ico':
        return (
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <CheckCircle className="w-16 h-16 text-green-400" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">ICO Live</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              The ICO fundraise is now live! Send SOL or USDC to the treasury address below. 
              The ICO runs for 24 hours and must raise at least ${meta.icoThresholdUsd || 1000}.
            </p>
            
            <div className="bg-white/5 rounded-lg p-6 mb-6 max-w-md mx-auto">
              <div className="text-sm text-white/60 mb-2">ICO Time Remaining</div>
              <div className="text-3xl font-bold text-green-400 mb-4">{countdown}</div>
              
              <div className="text-sm text-white/60 mb-2">Treasury Address (ICO)</div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
                <code className="text-sm font-mono flex-1 text-left">
                  {vault.treasuryWallet || 'No wallet address'}
                </code>
                <button 
                  onClick={() => copyToClipboard(vault.treasuryWallet || '')}
                  className="p-2 hover:bg-white/20 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-xs text-white/50 mt-3">
                Darwin takes 5% • Target: ${meta.icoThresholdUsd || 1000}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 max-w-lg mx-auto">
              <div className="text-sm text-white/80">
                <strong>ICO Raise Split:</strong> 93% to treasury, 7% to liquidity
              </div>
            </div>
          </div>
        );

      case 'ico_pending':
        return (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">ICO Raise Pending</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              The 24-hour ICO period has ended. The raise is now under review to determine 
              if it met the ${meta.icoThresholdUsd || 1000} threshold required to proceed.
            </p>
            
            <div className="bg-white/5 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-sm text-white/60 mb-2">Status</div>
              <div className="text-lg font-semibold text-yellow-400">Under Review</div>
              <div className="text-xs text-white/50 mt-2">
                Admin will determine next steps based on ICO performance
              </div>
            </div>
          </div>
        );

      case 'pre_launch':
        return (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Pre-Launch</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              The ICO was successful! The vault is now preparing for launch. 
              Trading will begin when the countdown reaches zero.
            </p>
            
            {vault.startDate && (
              <div className="bg-white/5 rounded-lg p-6 mb-6 max-w-sm mx-auto">
                <div className="text-sm text-white/60 mb-2">Launch Countdown</div>
                <div className="text-3xl font-bold text-purple-400">{countdown}</div>
              </div>
            )}

            <div className="bg-gradient-to-r from-purple-500/20 to-green-500/20 rounded-lg p-4 max-w-lg mx-auto">
              <div className="text-sm text-white/80">
                <strong>Launch Status:</strong> Token deployed, wallets configured, ready to go live
              </div>
            </div>
          </div>
        );

      case 'live':
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Vault Live</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              This vault is now live and actively trading. Users can buy tokens, 
              reset the timer, and participate in airdrops.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-white/60 mb-1">Timer</div>
                <div className="text-xl font-bold text-white">59:00</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-white/60 mb-1">Treasury</div>
                <div className="text-xl font-bold text-white">$12.2M</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-white/60 mb-1">Potential Win</div>
                <div className="text-xl font-bold text-white">100×</div>
              </div>
            </div>
          </div>
        );

      case 'extinct':
        return (
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Vault Extinct</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              This vault has been ended. Either the ICO failed to meet the threshold 
              or the vault reached its natural endgame.
            </p>
            
            <div className="bg-white/5 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-sm text-white/60 mb-2">Status</div>
              <div className="text-lg font-semibold text-red-400">Extinct</div>
              <div className="text-xs text-white/50 mt-2">
                No further trading or activity
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Unknown Status</h2>
            <p className="text-white/70">This vault has an unknown status.</p>
          </div>
        );
    }
  };

  return (
    <div className={`bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={meta.logoUrl || '/images/token.png'} 
              alt={vault.name}
              className="w-12 h-12 rounded-lg object-cover border border-white/10"
            />
            <div>
              <h1 className="text-xl font-bold text-white">{vault.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  status === 'pre_ico' ? 'bg-blue-500 text-white' :
                  status === 'ico' ? 'bg-green-500 text-white animate-pulse' :
                  status === 'ico_pending' ? 'bg-yellow-500 text-black' :
                  status === 'pre_launch' ? 'bg-purple-500 text-white' :
                  status === 'live' ? 'bg-emerald-500 text-black' :
                  'bg-red-500 text-white'
                }`}>
                  {status.replace('_', ' ').toUpperCase()}
                </span>
                {meta.ticker && (
                  <span className="px-2 py-1 bg-emerald-500 text-black text-xs font-semibold rounded">
                    {meta.ticker}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {meta.links?.x && (
              <a 
                href={meta.links.x}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/20 rounded"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {meta.links?.website && (
              <a 
                href={meta.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/20 rounded"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderStatusContent()}
      </div>
    </div>
  );
}
