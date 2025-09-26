import React, { useState, useEffect } from 'react';
import { Copy, Clock, AlertCircle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { splTokenService } from '@/services/splTokenService';
import { formatTimerLength } from '@/lib/utils';

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

export type VaultStatus = 'pre_ico' | 'ico' | 'ico_pending' | 'pre_launch' | 'live' | 'winner_confirmation' | 'endgame_processing' | 'extinct';

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
  customTokenData?: {
    customToken?: {
      address: string;
      symbol: string;
      name: string;
      logoURI: string;
    };
    vaultAsset?: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      verified: boolean;
      logoURI: string;
    };
    airdropAsset?: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      verified: boolean;
      logoURI: string;
    };
  };
  status?: VaultStatus;
}

interface VaultPagePreviewProps {
  vault: VaultData;
  status?: VaultStatus;
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
  const [icoCountdown, setIcoCountdown] = useState('');
  const meta = vault.meta || {};
  
  // Get token metadata for vault and airdrop assets
  const vaultAssetMetadata = useTokenMetadata(vault.vaultAsset || '');
  const airdropAssetMetadata = useTokenMetadata(vault.airdropAsset || '');

  // Use custom token data if available, otherwise fall back to fetched metadata
  const customTokenData = vault.customTokenData;
  const finalVaultAssetMetadata = customTokenData?.vaultAsset && vault.vaultAsset === customTokenData.vaultAsset.address
    ? customTokenData.vaultAsset
    : vaultAssetMetadata.metadata;

  const finalAirdropAssetMetadata = customTokenData?.airdropAsset && vault.airdropAsset === customTokenData.airdropAsset.address
    ? customTokenData.airdropAsset
    : airdropAssetMetadata.metadata;

  const customTokenMetadata = customTokenData?.customToken;
  const finalCustomVaultMetadata = customTokenMetadata && vault.vaultAsset === customTokenMetadata.address
    ? customTokenMetadata
    : null;
  const finalCustomAirdropMetadata = customTokenMetadata && vault.airdropAsset === customTokenMetadata.address
    ? customTokenMetadata
    : null;

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
      if (status === 'ico') {
        if (meta.icoEndsAt) {
          setIcoCountdown(formatCountdown(meta.icoEndsAt));
        } else if (meta.icoProposedAt) {
          // Calculate ICO end time: 24 hours from ICO start
          const icoStart = new Date(meta.icoProposedAt);
          const icoEnd = new Date(icoStart.getTime() + 24 * 60 * 60 * 1000);
          setIcoCountdown(formatCountdown(icoEnd.toISOString()));
        } else {
          // Fallback: 24 hours from now
          const fallbackEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
          setIcoCountdown(formatCountdown(fallbackEndTime.toISOString()));
        }
      } else if (status === 'pre_launch' && vault.startDate) {
        setCountdown(formatCountdown(vault.startDate));
      } else if (status === 'pre_ico' && meta.icoProposedAt) {
        setCountdown(formatTimeToICO(meta.icoProposedAt));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status, meta.icoEndsAt, meta.icoProposedAt, vault.startDate]);

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
          <div>
            {/* Title and pre-ICO paragraph */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">{vault.name}</h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto text-center">
                The ICO will run for 24 hours and must raise at least $10,000 to proceed to launch.
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
                    <span className="text-white/70">Vault Token Supply</span>
                    <span className="text-white font-semibold">{meta.vaultTokenSupply ? meta.vaultTokenSupply.toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Timer Duration</span>
                    <span className="text-white font-semibold">{formatTimerLength(vault.timerDuration || 3600)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Vault Lifespan</span>
                    <span className="text-white font-semibold">{meta.vaultLifespanDays || 100} Days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">BID:WIN Multiplier</span>
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
                      <img src={finalCustomVaultMetadata?.logoURI || finalVaultAssetMetadata?.logoURI || getTokenImage(vault.vaultAsset || 'So11111111111111111111111111111111111111112')} alt={finalCustomVaultMetadata?.symbol || finalVaultAssetMetadata?.symbol || getTokenSymbol(vault.vaultAsset || 'So11111111111111111111111111111111111111112')} className="h-5 w-5 object-contain" />
                      <span className="text-white font-semibold">{finalCustomVaultMetadata?.symbol || finalVaultAssetMetadata?.symbol || getTokenSymbol(vault.vaultAsset || 'So11111111111111111111111111111111111111112')}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Airdrop Asset</span>
                    <div className="flex items-center gap-2">
                      <img src={finalCustomAirdropMetadata?.logoURI || finalAirdropAssetMetadata?.logoURI || getTokenImage(vault.airdropAsset || '')} alt={finalCustomAirdropMetadata?.symbol || finalAirdropAssetMetadata?.symbol || getTokenSymbol(vault.airdropAsset || '')} className="h-5 w-5 object-contain" />
                      <span className="text-white font-semibold">{finalCustomAirdropMetadata?.symbol || finalAirdropAssetMetadata?.symbol || getTokenSymbol(vault.airdropAsset || '')}</span>
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
                    <span className="text-white font-semibold capitalize">{meta.airdropMode || 'Rewards'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Frequency</span>
                    <span className="text-white font-semibold">{Math.floor((meta.airdropInterval || 3600) / 60)} mins</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Minimum Hold</span>
                    <span className="text-white font-semibold">{meta.minHoldAmount || 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white/5 border border-white/5">
                  <div className="text-xs text-white/60 mb-2">Mode Explanation:</div>
                  <div className="text-sm text-white/80">
                    {meta.airdropMode === 'rewards' && "Tokens are distributed to all eligible holders based on their holdings."}
                    {meta.airdropMode === 'jackpot' && "Randomly selects 10 holders for distribution with tiered rewards (1st: 40%, 2nd: 20%, 3rd: 10%, others share remaining 30%)."}
                    {meta.airdropMode === 'lottery' && "One random holder wins the entire distributed amount as a prize. More tokens held means more chances to win."}
                    {meta.airdropMode === 'powerball' && "Randomly selects up to 50 holders and distributes equal prizes to each winner. The total distribution amount is split equally among all selected winners."}
                    {meta.airdropMode === 'none' && "No airdrops will be distributed."}
                    {!meta.airdropMode && "Tokens are distributed to all eligible holders based on their holdings."}
                  </div>
                </div>
              </div>

              {/* Trade Fee Splits Card */}
              <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Trade Fee Splits</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 mb-4">
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
                  <p>If the ICO raises less than ${meta.icoThresholdUsd || 10000} USD, the vault may be marked as extinct. If it raises ${meta.icoThresholdUsd || 10000} or more, it will proceed to the live trading stage.</p>
                  <p>Please conduct your own research before participating in any ICO or trading activities.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ico':
        return (
          <div>
            {/* Title and ICO paragraph */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">{vault.name} ICO Live</h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto text-center">
              The ICO fundraise is now live! Send {finalCustomVaultMetadata?.symbol || finalVaultAssetMetadata?.symbol || 'SOL'} to the treasury address below. 
              The ICO runs for 24 hours and must raise at least ${meta.icoThresholdUsd || 10000}.
            </p>
            </div>

            {/* Treasury Address Card */}
            <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 px-6 pt-6 pb-4 mb-6 max-w-2xl mx-auto">
              <div className="text-sm text-white/60 mb-2">Treasury Address (ICO)</div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3 mb-4">
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
              
              <div className="text-xs text-white/50 mb-4">
                Darwin takes 5% • Target: ${meta.icoThresholdUsd || 1000} • ICO Raise Split: 93% to treasury, 7% to liquidity
              </div>
            </div>

            {/* Vault Details and Disclaimer from Pre-ICO */}
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
                    <span className="text-white/70">Vault Token Supply</span>
                    <span className="text-white font-semibold">{meta.vaultTokenSupply ? meta.vaultTokenSupply.toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Timer Duration</span>
                    <span className="text-white font-semibold">{formatTimerLength(vault.timerDuration || 3600)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Vault Lifespan</span>
                    <span className="text-white font-semibold">{meta.vaultLifespanDays || 100} Days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">BID:WIN Multiplier</span>
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
                      <img src={finalCustomVaultMetadata?.logoURI || finalVaultAssetMetadata?.logoURI || getTokenImage(vault.vaultAsset || 'So11111111111111111111111111111111111111112')} alt={finalCustomVaultMetadata?.symbol || finalVaultAssetMetadata?.symbol || getTokenSymbol(vault.vaultAsset || 'So11111111111111111111111111111111111111112')} className="h-5 w-5 object-contain" />
                      <span className="text-white font-semibold">{finalCustomVaultMetadata?.symbol || finalVaultAssetMetadata?.symbol || getTokenSymbol(vault.vaultAsset || 'So11111111111111111111111111111111111111112')}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Airdrop Asset</span>
                    <div className="flex items-center gap-2">
                      <img src={finalCustomAirdropMetadata?.logoURI || finalAirdropAssetMetadata?.logoURI || getTokenImage(vault.airdropAsset || '')} alt={finalCustomAirdropMetadata?.symbol || finalAirdropAssetMetadata?.symbol || getTokenSymbol(vault.airdropAsset || '')} className="h-5 w-5 object-contain" />
                      <span className="text-white font-semibold">{finalCustomAirdropMetadata?.symbol || finalAirdropAssetMetadata?.symbol || getTokenSymbol(vault.airdropAsset || '')}</span>
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
                    <span className="text-white font-semibold capitalize">{meta.airdropMode || 'Rewards'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Frequency</span>
                    <span className="text-white font-semibold">{Math.floor((meta.airdropInterval || 3600) / 60)} mins</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Minimum Hold</span>
                    <span className="text-white font-semibold">{meta.minHoldAmount || 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white/5 border border-white/5">
                  <div className="text-xs text-white/60 mb-2">Mode Explanation:</div>
                  <div className="text-sm text-white/80">
                    {meta.airdropMode === 'rewards' && "Tokens are distributed to all eligible holders based on their holdings."}
                    {meta.airdropMode === 'jackpot' && "Randomly selects 10 holders for distribution with tiered rewards (1st: 40%, 2nd: 20%, 3rd: 10%, others share remaining 30%)."}
                    {meta.airdropMode === 'lottery' && "One random holder wins the entire distributed amount as a prize. More tokens held means more chances to win."}
                    {meta.airdropMode === 'powerball' && "Randomly selects up to 50 holders and distributes equal prizes to each winner. The total distribution amount is split equally among all selected winners."}
                    {meta.airdropMode === 'none' && "No airdrops will be distributed."}
                    {!meta.airdropMode && "Tokens are distributed to all eligible holders based on their holdings."}
                  </div>
                </div>
              </div>

              {/* Trade Fee Splits Card */}
              <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Trade Fee Splits</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 mb-4">
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
                  <p>This vault is currently in the ICO stage. The ICO fundraise is now live and accepting contributions.</p>
                  <p>During the ICO, participants can contribute {finalCustomVaultMetadata?.symbol || finalVaultAssetMetadata?.symbol || 'SOL'} to the treasury wallet. Darwin platform takes 5% of the total raise.</p>
                  <p>If the ICO raises less than ${meta.icoThresholdUsd || 10000} USD, the vault may be marked as extinct. If it raises ${meta.icoThresholdUsd || 10000} or more, it will proceed to the live trading stage.</p>
                  <p>Please conduct your own research before participating in any ICO or trading activities.</p>
                </div>
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

      case 'winner_confirmation':
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Winner Confirmation</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              The timer has expired! The winning wallet needs to place a claim. 
              Our team will review and facilitate the payout and any airdrops to holders.
            </p>
            
            <div className="bg-white/5 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-sm text-white/60 mb-2">Status</div>
              <div className="text-lg font-semibold text-purple-400">Winner Confirmation</div>
              <div className="text-xs text-white/50 mt-2">
                Winner needs to claim, team will process payout
              </div>
            </div>
          </div>
        );

      case 'endgame_processing':
        return (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Endgame Processing</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              The vault has reached the end of its lifespan. Our team will airdrop 
              treasury to holders that meet the minimum threshold.
            </p>
            
            <div className="bg-white/5 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-sm text-white/60 mb-2">Status</div>
              <div className="text-lg font-semibold text-orange-400">Endgame Processing</div>
              <div className="text-xs text-white/50 mt-2">
                Team will process airdrops to eligible holders
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
    <div className={`backdrop-blur-xl ring-1 ring-white/15 rounded-lg overflow-hidden text-white ${className}`}>
      {/* Header */}
      <div className="bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={meta.logoUrl || '/images/token.png'} 
              alt={vault.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{vault.name}</h1>
                {meta.ticker && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="text-emerald-400 font-semibold text-sm">{meta.ticker}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                {status === 'pre_ico' ? (
                  <div className="inline-flex items-center gap-2 rounded-[8px] bg-emerald-500/15 backdrop-blur-[10px] ring-1 ring-emerald-400/30 px-2 py-1 text-xs text-emerald-300 font-semibold">
                    Pre-ICO
                  </div>
                ) : (
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    status === 'ico' ? 'bg-green-600 text-white animate-pulse' :
                    status === 'ico_pending' ? 'bg-yellow-400 text-black' :
                    status === 'pre_launch' ? 'bg-purple-600 text-white' :
                    status === 'live' ? 'bg-emerald-500 text-black' :
                    status === 'winner_confirmation' ? 'bg-purple-500 text-white' :
                    status === 'endgame_processing' ? 'bg-orange-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                  </span>
                )}
                {meta.links?.x && (
                  <a 
                    href={meta.links.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white transition-colors opacity-70 hover:opacity-100"
                    aria-label="View on X"
                  >
                    <img src="/images/X_logo_2023_(white).svg.png" alt="X" className="h-4 w-4" />
                  </a>
                )}
                {meta.links?.website && (
                  <a 
                    href={meta.links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white transition-colors opacity-70 hover:opacity-100"
                    aria-label="External link"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
          <div />
        </div>
      </div>

      {/* Banner */}
      {meta.bannerUrl && (
        <div className="w-full h-64 overflow-hidden relative">
          <img src={meta.bannerUrl} alt="Vault Banner" className="w-full h-full object-cover" />
          {status === 'pre_ico' && meta.icoProposedAt && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="ring-1 ring-white/10 px-8 py-6" style={{ backgroundColor: '#080808' }}>
                <div className="text-center">
                  <div className="text-base font-semibold text-gray-300 mb-3">ICO Date & Time</div>
                  <div className="text-3xl md:text-4xl font-extrabold text-white mb-4">{formatICODate(meta.icoProposedAt)}</div>
                  <a 
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=ICO: ${vault.name}&details=ICO fundraise for ${vault.name} vault&location=Online`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-300 hover:text-gray-200 transition-colors text-base"
                    title="Add to Calendar"
                  >
                    <span>📅</span>
                    <span>Set Reminder</span>
                  </a>
                </div>
              </div>
            </div>
          )}
          {status === 'ico' && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="ring-1 ring-white/10 px-12 py-8 w-96" style={{ backgroundColor: '#080808' }}>
                <div className="text-center">
                  <div className="text-base font-semibold text-gray-300 mb-3">ICO Time Remaining</div>
                  <div className="text-3xl font-bold text-green-400 mb-4">
                    {status === 'ico' ? icoCountdown : countdown}
                  </div>
                  
                  {/* Progress Meter - clean style without title */}
                  <div className="mt-4">
                    <div className="w-full bg-white/10 h-4 relative overflow-hidden mb-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-4 transition-all duration-500"
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white">$0</span>
                      <span className="text-green-400">${meta.icoThresholdUsd || 10000} target</span>
                    </div>
                  </div>
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
