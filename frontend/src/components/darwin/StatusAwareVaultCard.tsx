import React from 'react';
import { FeaturedVaultCard } from './FeaturedVaultCard';
import { TallVaultCard } from './TallVaultCard';
import { VaultRow } from './VaultRow';
import { Copy, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { splTokenService } from '@/services/splTokenService';
import { useState, useEffect } from 'react';

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

export type VaultStatus = 'pre_ico' | 'ico' | 'ico_pending' | 'pre_launch' | 'live' | 'extinct';

interface VaultData {
  id: string;
  name: string;
  description?: string;
  tokenMint?: string;
  treasuryWallet?: string;
  vaultAsset?: string;
  airdropAsset?: string;
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
  
  // Get token metadata for vault and airdrop assets
  const vaultAssetMetadata = useTokenMetadata(vault.vaultAsset || '');
  const airdropAssetMetadata = useTokenMetadata(vault.airdropAsset || '');
  
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
          disabledTrade: true,
          buttonText: 'View Vault Details',
          showVaultStagePill: true
        };
      case 'ico':
        return {
          subtitle: 'ICO Live • 24h Fundraise',
          timerValue: meta.icoEndsAt ? formatCountdown(meta.icoEndsAt) : '23:59:59',
          badgeText: 'ICO LIVE',
          badgeClass: 'bg-green-500 text-white animate-pulse',
          showTimer: true,
          showICOInfo: true,
          disabledTrade: false
        };
      case 'ico_pending':
        return {
          subtitle: 'ICO Raise Pending • Review Required',
          timerValue: '—',
          badgeText: 'PENDING',
          badgeClass: 'bg-yellow-500 text-black',
          showTimer: false,
          showICOInfo: false,
          disabledTrade: true
        };
      case 'pre_launch':
        return {
          subtitle: 'Pre-Launch • Launch Countdown',
          timerValue: vault.startDate ? formatCountdown(vault.startDate) : '—',
          badgeText: 'PRE-LAUNCH',
          badgeClass: 'bg-purple-500 text-white',
          showTimer: true,
          showICOInfo: false,
          disabledTrade: true
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
          disabledTrade: true
        };
      default:
        return {
          subtitle: 'Unknown Status',
          timerValue: '—',
          badgeText: 'UNKNOWN',
          badgeClass: 'bg-gray-500 text-white',
          showTimer: false,
          showICOInfo: false,
          disabledTrade: true
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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  // Render ICO info overlay for ICO states
  const renderICOInfo = () => {
    if (!config.showICOInfo || status !== 'ico') return null;
    
    return (
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center text-white p-6">
          <h3 className="text-xl font-bold mb-4">ICO Treasury Address</h3>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3 mb-4">
            <code className="text-sm font-mono flex-1">
              {vault.treasuryWallet || 'No wallet address'}
            </code>
            <button 
              onClick={() => copyToClipboard(vault.treasuryWallet || '')}
              className="p-2 hover:bg-white/20 rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-white/70 mb-4">
            Send SOL or USDC to this address to participate in the ICO
          </p>
          <div className="text-xs text-white/50">
            Target: ${meta.icoThresholdUsd || 1000} • Darwin takes 5%
          </div>
        </div>
      </div>
    );
  };

  // Base props for all card variants
  const baseProps = {
    name: vault.name,
    title: vault.name,
    tokenTicker: meta.ticker || airdropAssetMetadata.metadata?.symbol || '—',
    addressShort: vault.tokenMint ? `${vault.tokenMint.slice(0,6)}...${vault.tokenMint.slice(-4)}` : '—',
    imageUrl,
    pfp: meta.logoUrl || '/images/token.png',
    price: status === 'live' ? '$0.0000' : 'N/A',
    baseAsset: vaultAssetMetadata.metadata?.symbol || 'SOL',
    treasury: status === 'live' ? '$12.2M' : 'N/A',
    potentialWin: status === 'live' ? '100×' : (status === 'pre_ico' ? `${meta.bidMultiplier || 100}×` : '—'),
    apy: status === 'live' ? 'N/A' : 'N/A',
    endgame: status === 'live' ? '91d' : (status === 'pre_ico' ? `${meta.vaultLifespanDays || 100}d` : '—'),
        timer: status === 'pre_ico' ? (vault.timerDuration >= 3600 ? `${Math.floor(vault.timerDuration / 3600)}h` : `${Math.floor(vault.timerDuration / 60)}m`) : config.timerValue,
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
            buttonText={config.buttonText || 'Trade'}
            showVaultStagePill={config.showVaultStagePill}
            icoDate={status === 'pre_ico' && meta.icoProposedAt ? formatICODate(meta.icoProposedAt) : undefined}
            tokenPfpUrl={meta.logoUrl || '/images/token.png'}
            vaultAssetLogo={vaultAssetMetadata.metadata?.logoURI || '/images/token.png'}
            airdropAssetLogo={airdropAssetMetadata.metadata?.logoURI || '/images/token.png'}
            xUrl={meta.links?.x}
            websiteUrl={meta.links?.website}
            stats={status === 'pre_ico' ? [
              { label: 'Vault Asset', value: baseProps.baseAsset },
              { label: 'Airdrop Asset', value: airdropAssetMetadata.metadata?.symbol || 'REVS' },
              { label: 'Potential Win', value: `${meta.bidMultiplier || 100}×` },
              { label: 'Timer Length', value: vault.timerDuration >= 3600 ? `${Math.floor(vault.timerDuration / 3600)} Hour${Math.floor(vault.timerDuration / 3600) !== 1 ? 's' : ''}` : `${Math.floor(vault.timerDuration / 60)} Min${Math.floor(vault.timerDuration / 60) !== 1 ? 's' : ''}` },
              { label: 'Lifespan', value: `${meta.vaultLifespanDays || 100} Days` },
            ] : [
              { label: 'Price', value: baseProps.price },
              { label: 'Vault Asset', value: baseProps.baseAsset },
              { label: 'Treasury', value: baseProps.treasury },
              { label: 'Potential Win', value: baseProps.potentialWin },
              { label: 'APY*', value: baseProps.apy },
            ]}
            timer={{ value: config.timerValue }}
            endgameDays={status === 'live' ? 91 : undefined}
            xUrl={meta.links?.x}
            aspect="3/1"
          />
          {renderICOInfo()}
        </div>
      );

        case 'tall':
          return (
            <div className="relative">
      <TallVaultCard 
        {...baseProps}
        status={status}
        icoDate={status === 'pre_ico' && meta.icoProposedAt ? formatICODate(meta.icoProposedAt) : undefined}
        buttonText={config.buttonText || 'Trade'}
        airdropAsset={airdropAssetMetadata.metadata?.symbol || '—'}
        airdropAssetLogo={airdropAssetMetadata.metadata?.logoURI || '/images/token.png'}
        vaultAssetLogo={vaultAssetMetadata.metadata?.logoURI || '/images/token.png'}
        tradeFee={status === 'pre_ico' ? `${(meta.splits?.creator || 0) + (meta.splits?.treasury || 0) + (meta.splits?.airdrops || 0) + (meta.splits?.darwin || 0)}%` : '5%'}
      />
              {renderICOInfo()}
            </div>
          );

    case 'row':
      return (
        <div className="relative">
          <VaultRow 
            {...baseProps}
            status={status}
            icoDate={status === 'pre_ico' && meta.icoProposedAt ? formatICODate(meta.icoProposedAt) : undefined}
            buttonText={config.buttonText || 'Trade'}
            airdropAsset={airdropAssetMetadata.metadata?.symbol || '—'}
            airdropAssetLogo={airdropAssetMetadata.metadata?.logoURI || '/images/token.png'}
            vaultAssetLogo={vaultAssetMetadata.metadata?.logoURI || '/images/token.png'}
          />
          {renderICOInfo()}
        </div>
      );

    default:
      return null;
  }
}
