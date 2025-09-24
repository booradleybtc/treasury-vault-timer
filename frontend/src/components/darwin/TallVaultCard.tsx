import React from "react";
import { cn } from "./cn";

export type TallVaultCardProps = {
  name: string;
  timer: string;
  imageUrl: string;
  price?: string;
  baseAsset: string;
  treasury: string;
  potentialWin: string;
  apy: string;
  endgame: string;
  pfp?: string;
  tokenTicker?: string;
  addressShort?: string;
  onTrade?: () => void;
  status?: string;
  icoDate?: string;
  buttonText?: string;
  airdropAsset?: string;
  tradeFee?: string;
};

export function TallVaultCard(props: TallVaultCardProps) {
  const { name, timer, imageUrl, price, baseAsset, treasury, potentialWin, apy, endgame, pfp, tokenTicker, addressShort, onTrade, status, icoDate, buttonText, airdropAsset, tradeFee } = props;

  return (
    <div className={cn(
      "relative rounded-none ring-1 ring-white/10 bg-white/5 backdrop-blur-[10px] shadow-[0_10px_30px_rgba(0,0,0,.25)] overflow-hidden",
      "w-full max-w-none sm:max-w-[380px] h-[320px] sm:h-auto"
    )}>
      {/* Banner image on top - bigger */}
      <div className="w-full h-24 sm:h-28 relative">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Header info over banner - bigger elements */}
        <div className="absolute inset-0 p-4 sm:p-5 flex items-start justify-between text-white">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={pfp || "/images/token.png"} alt={name} className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm sm:text-base font-semibold leading-tight truncate" title={name}>{name}</div>
              <div className="text-xs sm:text-sm text-white/80 mt-1 truncate">{tokenTicker || ""}</div>
            </div>
          </div>
          {status === 'pre_ico' && (
            <div className="inline-flex items-center gap-2 rounded-[8px] bg-cyan-500/20 backdrop-blur-[10px] ring-1 ring-cyan-400/30 px-3 py-1.5 text-xs sm:text-sm text-cyan-300 font-semibold">
              Stage: PRE-ICO
            </div>
          )}
        </div>
      </div>

      {/* ICO Date centered in middle - glowing card */}
      {status === 'pre_ico' && icoDate && (
        <div className="py-4 sm:py-5 text-center">
          <div className="relative inline-block">
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-[10px] ring-1 ring-cyan-400/30 rounded-lg px-4 py-3 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <div className="text-xs text-cyan-300 mb-1">ICO Date</div>
              <div className="text-sm font-semibold text-white mb-2">{icoDate}</div>
              <a 
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=ICO: ${icoDate.split(' - ')[0]}&details=ICO fundraise for this vault&location=Online`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-300 hover:text-cyan-200 transition-colors underline"
              >
                📅 Add to Calendar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid - 3 rows of 2 columns */}
      <div className="p-4 sm:p-5 text-white">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {status === 'pre_ico' ? (
            <>
              <div className="text-center">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-[.16em] text-white/60">Vault Asset</div>
                <div className="mt-1 text-sm sm:text-base text-white/90 inline-flex items-center justify-center gap-2">
                  {baseAsset === 'SOL' && <img src="/images/Solana_logo.png" alt="Solana" className="h-4 w-4 sm:h-5 sm:w-5 object-contain" />}
                  <span>{baseAsset}</span>
                </div>
              </div>
              <Stat label="Airdrop Asset" value={airdropAsset || "REVS"} />
              <Stat label="Potential Win" value={potentialWin} numeric />
              <Stat label="Timer Length" value={timer.includes('h') ? timer : `${Math.floor(parseInt(timer) / 3600)}h`} />
              <Stat label="Lifespan" value={endgame} />
              <Stat label="Trade Fee" value={tradeFee || "5%"} numeric />
            </>
          ) : (
            <>
              <Stat label="Price" value={price ?? "N/A"} numeric />
              <div className="text-center">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-[.16em] text-white/60">Vault Asset</div>
                <div className="mt-1 text-sm sm:text-base text-white/90 inline-flex items-center justify-center gap-2">
                  {baseAsset === 'SOL' && <img src="/images/Solana_logo.png" alt="Solana" className="h-4 w-4 sm:h-5 sm:w-5 object-contain" />}
                  <span>{baseAsset}</span>
                </div>
              </div>
              <Stat label="Treasury" value={treasury} numeric />
              <Stat label="Potential Win" value={potentialWin} numeric />
              <Stat label="APY%" value={apy} numeric />
              <Stat label="Endgame" value={endgame} />
              <Stat label="Trade Fee" value={tradeFee || "5%"} numeric />
            </>
          )}
        </div>

        <button
          onClick={onTrade}
          className="mt-3 sm:mt-4 w-full inline-flex items-center justify-center whitespace-nowrap rounded-none bg-white text-black px-3 py-2 text-xs sm:text-sm font-semibold hover:bg-white/90"
        >
          {buttonText || "Trade"}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, numeric }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[10px] sm:text-[11px] uppercase tracking-[.16em] text-white/60">{label}</div>
      <div className={cn("mt-1 text-sm sm:text-base text-white/90", numeric && "tabular-nums")}>{value}</div>
    </div>
  );
}


