import React, { useState, useEffect } from 'react';
import { Copy, Clock, AlertCircle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { splTokenService } from '@/services/splTokenService';

// Helper function to get token symbol from address
const getTokenSymbol = (address: string): string => {
  const tokenMap: { [key: string]: string } = {
    'So11111111111111111111111111111111111111112': 'SOL',
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
    '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETH',
  };
  
  return tokenMap[address] || (address.length > 10 ? address.slice(0, 4) + '...' : address);
};

// Helper function to get token image from address
const getTokenImage = (address: string): string => {
  const tokenImages: { [key: string]: string } = {
    'So11111111111111111111111111111111111111112': '/images/Solana_logo.png',
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': '/images/token.png', // Using generic token image since USDC.png doesn't exist
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': '/images/token.png', // Using generic token image since USDT.png doesn't exist
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': '/images/token.png', // Using generic token image since mSOL.png doesn't exist
    '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': '/images/token.png', // Using generic token image since ETH.png doesn't exist
  };
  
  return tokenImages[address] || '/images/token.png';
};

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

// Hook to get token metadata
const useTokenMetadata = (address: string) => {
  const [metadata, setMetadata] = useState<{ symbol: string; logoURI?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setMetadata(null);
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      try {
        const tokenData = await splTokenService.getTokenMetadata(address);
        if (tokenData) {
          setMetadata({
            symbol: tokenData.symbol,
            logoURI: tokenData.logoURI
          });
        } else {
          setMetadata({
            symbol: address.length > 10 ? address.slice(0, 4) + '...' : address,
            logoURI: '/images/token.png'
          });
        }
      } catch (error) {
        setMetadata({
          symbol: address.length > 10 ? address.slice(0, 4) + '...' : address,
          logoURI: '/images/token.png'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [address]);

  return { metadata, loading };
};

export function VaultPagePreview({ vault, status, className }: VaultPagePreviewProps) {
  const [countdown, setCountdown] = useState('');
  const meta = vault.meta || {};
  
  // Get token metadata for vault and airdrop assets
  const vaultAssetMetadata = useTokenMetadata(vault.vaultAsset || '');
  const airdropAssetMetadata = useTokenMetadata(vault.airdropAsset || '');

  function formatICODate(icoDate: string): string {
    const date = new Date(icoDate);
    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true,
      timeZoneName: 'short'
    });
    
    // Add ordinal suffix to day
    const getOrdinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${month} ${getOrdinal(day)}, ${year} - ${time}`;
  }

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
            {/* Pre-ICO explanation paragraph */}
            <div className="text-center mb-8">
              <p className="text-white/70 mb-8 max-w-md mx-auto text-center">
                This vault is scheduled to begin its ICO fundraise. 
                The ICO will run for 24 hours and must raise at least ${meta.icoThresholdUsd || 1000} to proceed to launch.
              </p>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vault Details Card */}
              <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Vault Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Vault Name</span>
                    <span className="text-white font-semibold">{vault.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Timer Duration</span>
                    <span className="text-white font-semibold">{Math.floor((vault.timerDuration || 3600) / 3600)} Hour{(Math.floor((vault.timerDuration || 3600) / 3600)) !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Vault Lifespan</span>
                    <span className="text-white font-semibold">{meta.vaultLifespanDays || 100} Days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">BID:WIN Ratio</span>
                    <span className="text-white font-semibold">{meta.bidMultiplier || 100}×</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Minimum Buy to Reset</span>
                    <span className="text-white font-semibold">{meta.minBuyToReset || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Assets Card */}
              <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Assets</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Vault Asset</span>
                    <div className="flex items-center gap-2">
                      <img src={vaultAssetMetadata.metadata?.logoURI || getTokenImage(vault.vaultAsset || 'So11111111111111111111111111111111111111112')} alt={vaultAssetMetadata.metadata?.symbol || getTokenSymbol(vault.vaultAsset || 'So11111111111111111111111111111111111111112')} className="h-5 w-5 object-contain" />
                      <span className="text-white font-semibold">{vaultAssetMetadata.metadata?.symbol || getTokenSymbol(vault.vaultAsset || 'So11111111111111111111111111111111111111112')}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Airdrop Asset</span>
                    <div className="flex items-center gap-2">
                      <img src={airdropAssetMetadata.metadata?.logoURI || getTokenImage(vault.airdropAsset || '')} alt={airdropAssetMetadata.metadata?.symbol || getTokenSymbol(vault.airdropAsset || '')} className="h-5 w-5 object-contain" />
                      <span className="text-white font-semibold">{airdropAssetMetadata.metadata?.symbol || getTokenSymbol(vault.airdropAsset || '')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Airdrop Details Card */}
              <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Airdrop Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Type</span>
                    <span className="text-white font-semibold">{meta.airdropMode || 'Rewards'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Frequency</span>
                    <span className="text-white font-semibold">{Math.floor((meta.airdropInterval || 3600) / 60)} mins</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Minimum Hold</span>
                    <span className="text-white font-semibold">{meta.minHoldAmount || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Minimum Buy to Reset Timer</span>
                    <span className="text-white font-semibold">{meta.minBuyToReset || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Trade Fee Splits Card */}
              <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Trade Fee Splits</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
                    <span className="text-white/70 font-semibold">Total Trade Fee</span>
                    <span className="text-white font-bold">{meta.totalTradeFee || 5}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Creator</span>
                    <span className="text-white font-semibold">{meta.splits?.creator || 0}% of total</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Treasury</span>
                    <span className="text-white font-semibold">{meta.splits?.treasury || 0}% of total</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Airdrops</span>
                    <span className="text-white font-semibold">{meta.splits?.airdrops || 0}% of total</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Darwin Builder Fund</span>
                    <span className="text-white font-semibold">{meta.splits?.darwin || 0}% of total</span>
                  </div>
                </div>
              </div>

              {/* Disclaimer Card */}
              <div className="lg:col-span-2 bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Disclaimer</h3>
                <div className="text-white/70 text-sm space-y-2">
                  <p>This vault is currently in the Pre-ICO stage. The ICO will begin on the specified date and time above.</p>
                  <p>During the ICO, participants can contribute SOL or USDC to the treasury wallet. Darwin platform takes 5% of the total raise.</p>
                  <p>If the ICO raises less than ${meta.icoThresholdUsd || 1000} USD, the vault may be marked as extinct. If it raises ${meta.icoThresholdUsd || 1000} or more, it will proceed to the live trading stage.</p>
                  <p>Please conduct your own research before participating in any ICO or trading activities.</p>
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
                {status === 'pre_ico' ? (
                  <div className="inline-flex items-center gap-2 rounded-[8px] bg-cyan-500/20 backdrop-blur-[10px] ring-1 ring-cyan-400/30 px-2 py-1 text-xs text-cyan-300 font-semibold">
                    Pre-ICO
                  </div>
                ) : (
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    status === 'ico' ? 'bg-green-500 text-white animate-pulse' :
                    status === 'ico_pending' ? 'bg-yellow-500 text-black' :
                    status === 'pre_launch' ? 'bg-purple-500 text-white' :
                    status === 'live' ? 'bg-emerald-500 text-black' :
                    'bg-red-500 text-white'
                  }`}>
                    {status.replace('_', ' ').toUpperCase()}
                  </span>
                )}
                {meta.ticker && (
                  <span className="px-2 py-1 bg-emerald-500 text-black text-xs font-semibold rounded">
                    {meta.ticker}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {meta.links?.x && (
              <a 
                href={meta.links.x}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="View on X"
              >
                <img src="/images/X_logo_2023_(white).svg.png" alt="X" className="h-5 w-5" />
              </a>
            )}
            {meta.links?.website && (
              <a 
                href={meta.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Website"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Banner */}
      {meta.bannerUrl && (
        <div className="relative w-full h-64 overflow-hidden">
          <img src={meta.bannerUrl} alt="Vault Banner" className="w-full h-full object-cover" />
          {/* ICO Date Card overlay */}
          {status === 'pre_ico' && meta.icoProposedAt && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-[10px] ring-1 ring-gray-700/50 px-6 py-4 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-300 mb-2">ICO Date & Time</div>
                  <div className="text-3xl font-bold text-white mb-3">{formatICODate(meta.icoProposedAt)}</div>
                  <a 
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=ICO: ${vault.name}&details=ICO fundraise for ${vault.name} vault&location=Online`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
                    title="Add to Calendar"
                  >
                    <span>📅</span>
                    <span>Set Reminder</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {renderStatusContent()}
      </div>
    </div>
  );
}
