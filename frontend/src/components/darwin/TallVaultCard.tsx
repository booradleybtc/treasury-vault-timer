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
      "w-full max-w-none sm:max-w-[340px] h-[280px] sm:h-auto"
    )}>
      {/* Banner image on top */}
      <div className="w-full h-16 sm:h-20 relative">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Header info over banner */}
        <div className="absolute inset-0 p-3 sm:p-4 flex items-start justify-between text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={pfp || "/images/token.png"} alt={name} className="h-6 w-6 sm:h-8 sm:w-8 rounded-md object-cover border border-white/20 bg-white flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-semibold leading-tight truncate" title={name}>{name}</div>
              <div className="text-[10px] sm:text-xs text-white/80 mt-0.5 truncate">{tokenTicker || ""}</div>
            </div>
          </div>
          {status === 'pre_ico' && (
            <div className="inline-flex items-center gap-2 rounded-[6px] bg-cyan-500/20 backdrop-blur-[10px] ring-1 ring-cyan-400/30 px-2 py-0.5 text-[10px] text-cyan-300 font-semibold">
              Stage: PRE-ICO
            </div>
          )}
        </div>
      </div>

      {/* ICO Date centered in middle */}
      {status === 'pre_ico' && icoDate && (
        <div className="py-3 sm:py-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-[8px] bg-white/10 backdrop-blur-[10px] ring-1 ring-white/15 px-3 py-2">
            <div className="text-xs text-white/60">ICO Date</div>
            <div className="text-sm font-semibold text-white">{icoDate}</div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="p-3 sm:p-4 text-white">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {status === 'pre_ico' ? (
            <>
              <div className="text-center">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[.16em] text-white/60">Vault Asset</div>
                <div className="mt-0.5 text-xs sm:text-sm text-white/90 inline-flex items-center justify-center gap-1 sm:gap-2">
                  {baseAsset === 'SOL' && <img src="/images/Solana_logo.png" alt="Solana" className="h-3 w-3 sm:h-4 sm:w-4 object-contain" />}
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
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[.16em] text-white/60">Vault Asset</div>
                <div className="mt-0.5 text-xs sm:text-sm text-white/90 inline-flex items-center justify-center gap-1 sm:gap-2">
                  {baseAsset === 'SOL' && <img src="/images/Solana_logo.png" alt="Solana" className="h-3 w-3 sm:h-4 sm:w-4 object-contain" />}
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
      <div className="text-[9px] sm:text-[10px] uppercase tracking-[.16em] text-white/60">{label}</div>
      <div className={cn("mt-0.5 text-xs sm:text-sm text-white/90", numeric && "tabular-nums")}>{value}</div>
    </div>
  );
}


