import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, ExternalLink } from "lucide-react";
import { cn } from "./cn";

type Stat = { label: string; value: string };

export type FeaturedVaultCardProps = {
  imageUrl: string;
  title: string;
  subtitle?: string;
  tokenTicker: string;
  addressShort: string;
  tokenPfpUrl?: string;
  verified?: boolean;
  tokenBadgeText?: string;
  tokenBadgeClassName?: string;
  stats?: Stat[];
  timer?: { value: string };
  winnerAddressShort?: string;
  endgameDays?: number;
  vaultAssetIconSrc?: string;
  xUrl?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onClickTitle?: () => void;
  onTrade?: () => void;
  buttonText?: string;
  showVaultStagePill?: boolean;
  icoDate?: string;
  className?: string;
  aspect?: "21/9" | "16/9" | "3/1";
};

export function FeaturedVaultCard({
  imageUrl,
  title,
  subtitle,
  tokenTicker,
  addressShort,
  tokenPfpUrl,
  verified = false,
  tokenBadgeText = "TOKEN",
  tokenBadgeClassName = "bg-orange-500 text-black",
  stats = [],
  timer = { value: "00:00" },
  winnerAddressShort,
  endgameDays,
  vaultAssetIconSrc,
  xUrl,
  onPrev,
  onNext,
  onClickTitle,
  onTrade,
  buttonText = "Trade",
  showVaultStagePill = false,
  icoDate,
  className,
  aspect = "21/9",
}: FeaturedVaultCardProps) {
  
  const getTokenImage = (tokenSymbol: string) => {
    // Common SPL tokens with their image URLs
    const tokenImages: { [key: string]: string } = {
      'SOL': '/images/Solana_logo.png',
      'REVS': '/images/token.png', // Default token image
      'USDC': '/images/USDC.png',
      'USDT': '/images/USDT.png',
      'BTC': '/images/BTC.png',
      'ETH': '/images/ETH.png',
      'zBTC': '/images/zBTC.png',
    };
    
    return tokenImages[tokenSymbol] || '/images/token.png';
  };
  const handleCopy = () => {
    if (addressShort && navigator?.clipboard) {
      navigator.clipboard.writeText(addressShort).catch(() => {});
    }
  };

  return (
    <div className={cn("relative", className)}>

      {/* Outer glass frame */}
      <div className="rounded-none bg-white/5 backdrop-blur-[10px] p-6 ring-1 ring-white/10 shadow-[0_0_120px_rgba(16,185,129,.12)]">
        <motion.div
          whileHover={{ y: -1 }}
          className={cn(
            "relative overflow-hidden rounded-none bg-[#0d101e] ring-1 ring-white/10",
            aspect === "21/9" ? "aspect-[21/9]" : aspect === "16/9" ? "aspect-[16/9]" : "aspect-[3/1]"
          )}
        >
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />

          {/* overlays */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(1000px_400px_at_50%_-10%,rgba(16,185,129,.22),transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/35 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute inset-0 ring-1 ring-white/10 shadow-[inset_0_-60px_120px_rgba(0,0,0,.35)]" />
          </div>

          {/* top-left: pfp cluster + ticker + X icon */}
          <div className="absolute left-5 top-4 flex items-start gap-4 text-white">
            {tokenPfpUrl ? (
              <img src={tokenPfpUrl} alt={tokenTicker} className="h-16 w-16 rounded-lg object-cover" loading="lazy" />
            ) : (
              <div
                className={cn(
                  "grid h-16 w-16 place-items-center rounded-lg text-[13px] font-semibold uppercase tracking-wide shadow-[0_6px_24px_rgba(0,0,0,.35)] bg-white text-black",
                  tokenBadgeClassName
                )}
                title={tokenBadgeText}
              >
                {tokenBadgeText}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 text-[18px] md:text-[20px] font-semibold leading-none">
                <span className="tracking-tight">{tokenTicker}</span>
                {xUrl ? (
                  <a href={xUrl} target="_blank" rel="noreferrer noopener" aria-label="View on X" title="View on X">
                    <img src="/images/X_logo_2023_(white).svg.png" alt="X" className="h-5 w-5 object-contain" />
                  </a>
                ) : null}
                {/* Removed checkmark per design */}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex w-fit items-center gap-2 rounded-[8px] bg-white/10 backdrop-blur-[10px] ring-1 ring-white/15 px-3 py-1.5 text-[12px] text-white/90"
                aria-label="Copy token address"
                title="Copy token address"
              >
                <Copy className="h-4 w-4 opacity-80" />
                <span className="font-mono">{addressShort}</span>
              </button>
            </div>
          </div>

          {/* top-right: stats */}
          <div className="absolute right-5 top-4 hidden items-start gap-10 md:flex">
            {stats.map((s, i) => (
              <div key={i} className="text-center text-white">
                <div className="text-[12px] uppercase tracking-[.18em] text-white/70">{s.label}</div>
                <div className="mt-1 text-[20px] md:text-[26px] font-bold leading-none drop-shadow-[0_1px_6px_rgba(0,0,0,.35)] flex items-center justify-center gap-2">
                  {(s.label === 'Vault Asset' || s.label === 'Airdrop Asset') && (
                    <img src={getTokenImage(s.value)} alt={s.value} className="h-5 w-5 rounded-sm" />
                  )}
                  {s.label === 'Vault Asset' && vaultAssetIconSrc ? (
                    <img src={vaultAssetIconSrc} alt={s.value} className="h-5 w-5 rounded-sm" />
                  ) : null}
                  <span>{s.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* bottom-left: title/subtitle + actions */}
          <div className="absolute bottom-5 left-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-4xl md:text-6xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.6)]">
                {title}
              </div>
              {showVaultStagePill ? (
                <div className="inline-flex items-center gap-2 rounded-[8px] bg-cyan-500/20 backdrop-blur-[10px] ring-1 ring-cyan-400/30 px-3 py-1 text-sm text-cyan-300 font-semibold">
                  {subtitle}
                </div>
              ) : null}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button 
                onClick={onTrade}
                className="inline-flex items-center justify-center rounded-none bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90"
              >
                {buttonText}
              </button>
              {winnerAddressShort ? (
                <div className="inline-flex items-center gap-2 rounded-[8px] bg-white/10 backdrop-blur-[10px] ring-1 ring-white/15 px-3 py-1 text-xs text-white/90">
                  <span className="uppercase tracking-widest text-white/60">Current Winner</span>
                  <span className="font-mono">{winnerAddressShort}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* bottom-right: big timer + endgame pill */}
          <div className="absolute bottom-5 right-5 text-right text-white">
            {icoDate ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-[8px] bg-white/10 backdrop-blur-[10px] ring-1 ring-white/15 px-3 py-1 text-sm text-white/90 font-semibold mb-2">
                  ICO Date
                </div>
                <div className="tabular-nums text-2xl md:text-3xl font-bold leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,.45)]">
                  <div>{icoDate.split(' - ')[0]}</div>
                  <div className="text-lg font-medium text-white/80">{icoDate.split(' - ')[1]}</div>
                  <div className="text-xs text-white/60 mt-1">
                    <a 
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=ICO: ${icoDate.split(' - ')[0]}&details=ICO fundraise for this vault&location=Online`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      📅 Set Reminder
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="tabular-nums text-5xl md:text-7xl font-extrabold leading-none tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,.45)]">
                {timer.value}
              </div>
            )}
            {typeof endgameDays === "number" ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-[8px] bg-white/10 backdrop-blur-[10px] ring-1 ring-white/15 px-3 py-1 text-xs text-white/90">
                <span className="uppercase tracking-widest text-white/60">Endgame</span>
                <span className="font-semibold">{endgameDays} Days</span>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
