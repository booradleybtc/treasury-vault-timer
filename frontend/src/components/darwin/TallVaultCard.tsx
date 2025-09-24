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
};

export function TallVaultCard(props: TallVaultCardProps) {
  const { name, timer, imageUrl, price, baseAsset, treasury, potentialWin, apy, endgame, pfp, tokenTicker, addressShort, onTrade, status, icoDate, buttonText } = props;

  return (
    <div className={cn(
      "relative rounded-none ring-1 ring-white/10 bg-white/5 backdrop-blur-[10px] shadow-[0_10px_30px_rgba(0,0,0,.25)]",
      "w-full max-w-none sm:max-w-[340px] h-[280px] sm:h-auto"
    )}>
      {/* Header with vault info */}
      <div className="p-3 sm:p-4 border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 text-white">
          <img src={pfp || "/images/token.png"} alt={name} className="h-8 w-8 sm:h-10 sm:w-10 rounded-md object-cover border border-white/10 bg-white flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-semibold leading-tight truncate" title={name}>{name}</div>
            <div className="text-[10px] sm:text-xs text-white/60 mt-0.5 truncate" title={`${addressShort || ''} ${tokenTicker ? `• ${tokenTicker}` : ''}`}>{addressShort || ""}{tokenTicker ? ` • ${tokenTicker}` : ""}</div>
          </div>
          <div className="tabular-nums inline-flex items-center gap-1 sm:gap-2 rounded-[6px] sm:rounded-[8px] bg-white/10 backdrop-blur-[10px] ring-1 ring-white/15 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white/90 font-semibold flex-shrink-0">
            {status === 'pre_ico' && icoDate ? (
              <div className="text-center">
                <div className="text-[10px] text-white/60">ICO Date</div>
                <div className="text-xs">{icoDate}</div>
              </div>
            ) : (
              timer
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-3 sm:p-4 text-white">
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {status === 'pre_ico' ? (
            <>
              <div className="text-center">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[.16em] text-white/60">Vault Asset</div>
                <div className="mt-0.5 text-xs sm:text-sm text-white/90 inline-flex items-center justify-center gap-1 sm:gap-2">
                  {baseAsset === 'SOL' && <img src="/images/Solana_logo.png" alt="Solana" className="h-3 w-3 sm:h-4 sm:w-4 object-contain" />}
                  <span>{baseAsset}</span>
                </div>
              </div>
              <Stat label="Airdrop Asset" value={tokenTicker || "REVS"} />
              <Stat label="Potential Win" value={potentialWin} numeric />
              <Stat label="Timer Length" value={timer.includes('h') ? timer : `${Math.floor(parseInt(timer) / 3600)}h`} />
              <Stat label="Lifespan" value={endgame} />
              <div className="text-center">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[.16em] text-white/60">Stage</div>
                <div className="mt-0.5 text-xs sm:text-sm text-blue-300 font-semibold">PRE-ICO</div>
              </div>
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


