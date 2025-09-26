import React, { useMemo } from 'react';
import { FeaturedVaultCard } from './FeaturedVaultCard';
import { TallVaultCard } from './TallVaultCard';
import { VaultRow } from './VaultRow';
import { formatTimerLength } from '@/lib/utils';
import { Copy, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { splTokenService } from '@/services/splTokenService';
import { useState, useEffect } from 'react';

// Helper function to get token symbol from address
const getTokenSymbol = (address: string): string => {
  const tokenMap: { [key: string]: string } = {
    'So11111111111111111111111111111111111111112': 'SOL',
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
    'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'jitoSOL',
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
    'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 'WIF',
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP',
    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY',
    'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': 'ORCA',
  };
  return tokenMap[address] || 'TOKEN';
};

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
          // Fallback for unknown tokens
          setMetadata({
            symbol: address.length > 10 ? address.slice(0, 4) + '...' : address,
            logoURI: '/images/token.png'
          });
        }
      } catch (error) {
        // Fallback on error
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

export type VaultStatus = 'draft' | 'active' | 'paused' | 'ended' | 'pre_ico' | 'ico' | 'ico_pending' | 'pre_launch' | 'live' | 'extinct';

interface VaultData {
  id: string;
  name: string;
  description?: string;
  tokenMint?: string;
  treasuryWallet?: string;
  vaultAsset?: string;
  airdropAsset?: string;
  startDate?: string;
  timerDuration?: number;
  meta?: {
    ticker?: string;
    logoUrl?: string;
    bannerUrl?: string;
    icoProposedAt?: string;
    icoEndsAt?: string;
    icoAsset?: string;
    supplyIntended?: string;
    bidMultiplier?: number;
    vaultLifespanDays?: number;
    minBuyToReset?: number;
    airdropInterval?: number;
    airdropMode?: string;
    totalTradeFee?: number;
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

interface StatusAwareVaultCardProps {
  vault: VaultData;
  variant: 'featured' | 'tall' | 'row';
  className?: string;
  onTrade?: () => void;
  onClickTitle?: () => void;
}

export function StatusAwareVaultCard({ 
  vault, 
  variant, 
  className,
  onTrade,
  onClickTitle 
}: StatusAwareVaultCardProps) {
  const status = vault.status || 'pre_ico';
  const meta = vault.meta || {};
  const [icoCountdown, setIcoCountdown] = useState('');
  
  // Helper function to format countdown
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
  
  // Helper function to get ICO countdown with fallback logic
  const getICOCountdown = (vault: VaultData): string => {
    const meta = vault.meta || {};
    if (meta.icoEndsAt) {
      return formatCountdown(meta.icoEndsAt);
    } else if (meta.icoProposedAt) {
      // Calculate ICO end time: 24 hours from ICO start
      const icoStart = new Date(meta.icoProposedAt);
      const icoEnd = new Date(icoStart.getTime() + 24 * 60 * 60 * 1000);
      return formatCountdown(icoEnd.toISOString());
    } else {
      // Fallback: 24 hours from now
      const fallbackEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      return formatCountdown(fallbackEndTime.toISOString());
    }
  };
  
  // Update ICO countdown when status is ico - optimized for performance
  useEffect(() => {
    if (status === 'ico') {
      const updateCountdown = () => {
        const newCountdown = getICOCountdown(vault);
        setIcoCountdown(prev => prev !== newCountdown ? newCountdown : prev);
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    } else {
      // Clear countdown when not in ICO status
      setIcoCountdown('');
    }
  }, [status, vault.id, meta.icoEndsAt, meta.icoProposedAt]);
  
  // Get token metadata for vault and airdrop assets - memoized for performance
  // Check for custom token data first (from preview)
  const customTokenData = vault.customTokenData;
  const vaultAssetMetadata = useTokenMetadata(vault.vaultAsset || '');
  const airdropAssetMetadata = useTokenMetadata(vault.airdropAsset || '');
  
  // Override metadata with custom token data if available
  const finalVaultAssetMetadata = customTokenData?.vaultAsset && vault.vaultAsset === customTokenData.vaultAsset.address 
    ? customTokenData.vaultAsset 
    : vaultAssetMetadata.metadata;
    
  const finalAirdropAssetMetadata = customTokenData?.airdropAsset && vault.airdropAsset === customTokenData.airdropAsset.address 
    ? customTokenData.airdropAsset 
    : airdropAssetMetadata.metadata;
    
  // Also check for custom token data (when custom token is used as vault or airdrop asset)
  const customTokenMetadata = customTokenData?.customToken;
  const finalCustomVaultMetadata = customTokenMetadata && vault.vaultAsset === customTokenMetadata.address 
    ? customTokenMetadata 
    : null;
  const finalCustomAirdropMetadata = customTokenMetadata && vault.airdropAsset === customTokenMetadata.address 
    ? customTokenMetadata 
    : null;
    
  // For ICO assets, we need to resolve the ICO asset metadata - memoized
  const icoAssetAddress = useMemo(() => meta.icoAsset || vault.vaultAsset, [meta.icoAsset, vault.vaultAsset]);
  const icoAssetMetadata = useTokenMetadata(icoAssetAddress || '');
  const finalICOCustomMetadata = useMemo(() => 
    customTokenMetadata && icoAssetAddress === customTokenMetadata.address 
      ? customTokenMetadata 
      : null, 
    [customTokenMetadata, icoAssetAddress]
  );
  
  // Status-specific configurations
  const getStatusConfig = (status: VaultStatus) => {
    switch (status) {
      case 'pre_ico':
        return {
          subtitle: 'Pre-ICO',
          timerValue: meta.icoProposedAt ? formatICOStartTime(meta.icoProposedAt) : '—',
          badgeText: 'PRE-ICO',
          badgeClass: 'bg-cyan-500 text-white',
          showTimer: true,
          showICOInfo: false,
          disabledTrade: false, // Allow clicking for overlay
          buttonText: 'View Vault Details',
          showVaultStagePill: true
        };
      case 'ico':
        return {
          subtitle: 'ICO',
          timerValue: icoCountdown || '23:59:59',
          badgeText: 'ICO LIVE',
          badgeClass: 'bg-green-500 text-white animate-pulse',
          showTimer: true,
          showICOInfo: true,
          disabledTrade: false,
          showVaultStagePill: true
        };
      case 'ico_pending':
        return {
          subtitle: 'ICO Raise Pending • Review Required',
          timerValue: '—',
          badgeText: 'PENDING',
          badgeClass: 'bg-yellow-500 text-black',
          showTimer: false,
          showICOInfo: false,
          disabledTrade: false // Allow clicking for overlay
        };
      case 'pre_launch':
        return {
          subtitle: 'Pre-Launch • Launch Countdown',
          timerValue: vault.startDate ? formatCountdown(vault.startDate) : '—',
          badgeText: 'PRE-LAUNCH',
          badgeClass: 'bg-purple-500 text-white',
          showTimer: true,
          showICOInfo: false,
          disabledTrade: false // Allow clicking for overlay
        };
      case 'live':
        return {
          subtitle: 'Live • Active Trading',
          timerValue: '59:00', // This would come from real timer data
          badgeText: 'LIVE',
          badgeClass: 'bg-emerald-500 text-black',
          showTimer: true,
          showICOInfo: false,
          disabledTrade: false
        };
      case 'extinct':
        return {
          subtitle: 'Extinct • Vault Ended',
          timerValue: '—',
          badgeText: 'EXTINCT',
          badgeClass: 'bg-red-500 text-white',
          showTimer: false,
          showICOInfo: false,
          disabledTrade: false // Allow clicking for overlay
        };
      default:
        return {
          subtitle: 'Unknown Status',
          timerValue: '—',
          badgeText: 'UNKNOWN',
          badgeClass: 'bg-gray-500 text-white',
          showTimer: false,
          showICOInfo: false,
          disabledTrade: false // Allow clicking for overlay
        };
    }
  };

  const config = getStatusConfig(status);
  const imageUrl = meta.bannerUrl || '/images/ChatGPT Image Aug 13, 2025, 05_54_57 PM.png';
  const logoUrl = meta.logoUrl || '/images/token.png';

  // Helper functions
  function formatTimeToICO(icoDate: string): string {
    const now = new Date();
    const ico = new Date(icoDate);
    const diff = ico.getTime() - now.getTime();
    
    if (diff <= 0) return 'ICO Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }

  function formatICOStartTime(icoDate: string): string {
    const ico = new Date(icoDate);
    const now = new Date();
    const diff = ico.getTime() - now.getTime();
    
    if (diff <= 0) return 'ICO Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }

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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }


  // Base props for all card variants
  const baseProps = {
    name: vault.name,
    title: vault.name,
    tokenTicker: meta.ticker || finalCustomAirdropMetadata?.symbol || finalAirdropAssetMetadata?.symbol || '—',
    addressShort: vault.tokenMint ? `${vault.tokenMint.slice(0,6)}...${vault.tokenMint.slice(-4)}` : '—',
    imageUrl,
    pfp: meta.logoUrl || '/images/token.png',
    price: status === 'live' ? '$0.0000' : 'N/A',
    baseAsset: finalCustomVaultMetadata?.symbol || finalVaultAssetMetadata?.symbol || 'SOL',
    treasury: status === 'live' ? '$12.2M' : 'N/A',
    potentialWin: status === 'live' ? '100×' : `${meta.bidMultiplier || 100}×`,
    apy: status === 'live' ? 'N/A' : 'N/A',
    endgame: status === 'live' ? '91d' : `${meta.vaultLifespanDays || 100}d`,
        timer: status === 'pre_ico' ? (vault.timerDuration && vault.timerDuration >= 3600 ? `${Math.floor(vault.timerDuration / 3600)}h` : vault.timerDuration ? `${Math.floor(vault.timerDuration / 60)}m` : '—') : { value: config.timerValue },
    onTrade: config.disabledTrade ? undefined : onTrade,
    onClickTitle,
    className,
    buttonText: config.buttonText || 'Trade'
  };

  // Render based on variant
  switch (variant) {
    case 'featured':
      return (
        <div className="relative">
          <FeaturedVaultCard
            {...baseProps}
            subtitle={config.subtitle}
            tokenBadgeText={config.badgeText}
            tokenBadgeClassName={config.badgeClass}
            buttonText={status === 'ico' ? 'Participate in ICO' : (config.buttonText || 'Trade')}
            showVaultStagePill={config.showVaultStagePill}
            icoDate={status === 'pre_ico' && meta.icoProposedAt ? formatICODate(meta.icoProposedAt) : (status === 'ico' ? 'Time Remaining in ICO' : undefined)}
            timer={status === 'ico' ? { value: icoCountdown || '23:59:59' } : { value: config.timerValue }}
            icoTreasuryAddress={status === 'ico' ? vault.treasuryWallet : undefined}
            icoAsset={status === 'ico' ? (finalICOCustomMetadata?.symbol || icoAssetMetadata?.metadata?.symbol || 'SOL') : undefined}
            icoThreshold={status === 'ico' ? meta.icoThresholdUsd || 10000 : undefined}
            icoProgress={status === 'ico' ? 0 : undefined}
            tokenPfpUrl={meta.logoUrl || '/images/token.png'}
            vaultAssetLogo={finalCustomVaultMetadata?.logoURI || finalVaultAssetMetadata?.logoURI || '/images/token.png'}
            airdropAssetLogo={finalCustomAirdropMetadata?.logoURI || finalAirdropAssetMetadata?.logoURI || '/images/token.png'}
            xUrl={meta.links?.x}
            websiteUrl={meta.links?.website}
            stats={status === 'pre_ico' ? [
              { label: 'Vault Asset', value: baseProps.baseAsset },
              { label: 'Airdrop Asset', value: finalCustomAirdropMetadata?.symbol || finalAirdropAssetMetadata?.symbol || 'REVS' },
              { label: 'Potential Win', value: `${meta.bidMultiplier || 100}×` },
              { label: 'Timer Length', value: formatTimerLength(vault.timerDuration || 0) },
              { label: 'Lifespan', value: `${meta.vaultLifespanDays || 100} Days` },
            ] : status === 'ico' ? [
              { label: 'Vault Asset', value: baseProps.baseAsset },
              { label: 'Airdrop Asset', value: finalCustomAirdropMetadata?.symbol || finalAirdropAssetMetadata?.symbol || '—' },
              { label: 'Potential Win', value: `${meta.bidMultiplier || 100}×` },
              { label: 'Timer Length', value: formatTimerLength(vault.timerDuration || 0) },
              { label: 'Lifespan', value: `${meta.vaultLifespanDays || 100} Days` },
            ] : [
              { label: 'Price', value: baseProps.price },
              { label: 'Vault Asset', value: baseProps.baseAsset },
              { label: 'Treasury', value: baseProps.treasury },
              { label: 'Potential Win', value: baseProps.potentialWin },
              { label: 'APY*', value: baseProps.apy },
            ]}
            endgameDays={status === 'live' ? 91 : undefined}
            aspect="3/1"
          />
        </div>
      );

        case 'tall':
          return (
            <div className="relative">
      <TallVaultCard 
        {...baseProps}
        timerDuration={vault.timerDuration || 0}
        status={status}
          icoDate={status === 'pre_ico' && meta.icoProposedAt ? formatICODate(meta.icoProposedAt) : (status === 'ico' ? 'Time Remaining in ICO' : undefined)}
          timer={status === 'ico' ? { value: icoCountdown || '23:59:59' } : undefined}
          icoTreasuryAddress={status === 'ico' ? vault.treasuryWallet : undefined}
          icoAsset={status === 'ico' ? (finalICOCustomMetadata?.symbol || icoAssetMetadata?.metadata?.symbol || 'SOL') : undefined}
          icoThreshold={status === 'ico' ? meta.icoThresholdUsd || 10000 : undefined}
          icoProgress={status === 'ico' ? 0 : undefined}
          buttonText={status === 'ico' ? 'View ICO' : (config.buttonText || 'Trade')}
          airdropAsset={finalCustomAirdropMetadata?.symbol || finalAirdropAssetMetadata?.symbol || '—'}
          airdropAssetLogo={finalCustomAirdropMetadata?.logoURI || finalAirdropAssetMetadata?.logoURI || '/images/token.png'}
          vaultAssetLogo={finalCustomVaultMetadata?.logoURI || finalVaultAssetMetadata?.logoURI || '/images/token.png'}
          tradeFee={status === 'pre_ico' ? `${meta.totalTradeFee || 5}%` : (status === 'ico' ? `${meta.totalTradeFee || 5}%` : '5%')}
        />
            </div>
          );

    case 'row':
      return (
        <div className="relative">
      <VaultRow 
        {...baseProps}
        timerDuration={vault.timerDuration || 0}
        timer={status === 'ico' ? (icoCountdown || '23:59:59') : (typeof baseProps.timer === 'string' ? baseProps.timer : baseProps.timer.value)}
        status={status}
        icoDate={status === 'pre_ico' && meta.icoProposedAt ? formatICODate(meta.icoProposedAt) : undefined}
          icoTreasuryAddress={status === 'ico' ? vault.treasuryWallet : undefined}
          icoAsset={status === 'ico' ? (finalICOCustomMetadata?.symbol || icoAssetMetadata?.metadata?.symbol || 'SOL') : undefined}
          icoThreshold={status === 'ico' ? meta.icoThresholdUsd || 10000 : undefined}
          icoProgress={status === 'ico' ? 0 : undefined}
          buttonText={status === 'ico' ? 'View ICO' : (config.buttonText || 'Trade')}
          airdropAsset={finalCustomAirdropMetadata?.symbol || finalAirdropAssetMetadata?.symbol || '—'}
          airdropAssetLogo={finalCustomAirdropMetadata?.logoURI || finalAirdropAssetMetadata?.logoURI || '/images/token.png'}
          vaultAssetLogo={finalCustomVaultMetadata?.logoURI || finalVaultAssetMetadata?.logoURI || '/images/token.png'}
          tradeFee={status === 'pre_ico' ? `${meta.totalTradeFee || 5}%` : (status === 'ico' ? `${meta.totalTradeFee || 5}%` : '5%')}
        />
        </div>
      );

    default:
      return null;
  }
}
