import React from 'react';
import { FeaturedVaultCard } from './FeaturedVaultCard';
import { TallVaultCard } from './TallVaultCard';
import { VaultRow } from './VaultRow';
import { Copy, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

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
  
  // Status-specific configurations
  const getStatusConfig = (status: VaultStatus) => {
    switch (status) {
      case 'pre_ico':
        return {
          subtitle: 'Vault Stage: Pre-ICO • ICO Begins',
          timerValue: meta.icoProposedAt ? formatICOStartTime(meta.icoProposedAt) : '—',
          badgeText: 'PRE-ICO',
          badgeClass: 'bg-blue-500 text-white',
          showTimer: true,
          showICOInfo: false,
          disabledTrade: true,
          buttonText: 'View Vault'
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
    tokenTicker: meta.ticker || vault.airdropAsset || 'REVS',
    addressShort: vault.tokenMint ? `${vault.tokenMint.slice(0,6)}...${vault.tokenMint.slice(-4)}` : '—',
    imageUrl,
    pfp: logoUrl,
    price: status === 'live' ? '$0.0000' : 'N/A',
    baseAsset: vault.vaultAsset || 'SOL',
    treasury: status === 'live' ? '$12.2M' : 'N/A',
    potentialWin: status === 'live' ? '100×' : (status === 'pre_ico' ? `${meta.bidMultiplier || 100}×` : '—'),
    apy: status === 'live' ? 'N/A' : 'N/A',
    endgame: status === 'live' ? '91d' : (status === 'pre_ico' ? `${meta.vaultLifespanDays || 100}d` : '—'),
    timer: config.timerValue,
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
            stats={status === 'pre_ico' ? [
              { label: 'Vault Asset', value: baseProps.baseAsset },
              { label: 'Airdrop Asset', value: meta.ticker || vault.airdropAsset || 'REVS' },
              { label: 'Potential Win', value: `${meta.bidMultiplier || 100}×` },
              { label: 'Timer Length', value: `${Math.floor(vault.timerDuration / 3600)}h` },
              { label: 'Lifespan', value: `${meta.vaultLifespanDays || 100}d` },
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
          <TallVaultCard {...baseProps} />
          {renderICOInfo()}
        </div>
      );

    case 'row':
      return (
        <div className="relative">
          <VaultRow {...baseProps} />
          {renderICOInfo()}
        </div>
      );

    default:
      return null;
  }
}
