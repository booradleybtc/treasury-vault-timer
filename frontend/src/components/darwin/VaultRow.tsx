import React from "react";
import { cn } from "./cn";

const GRID = "grid grid-cols-[1.7fr_.6fr_.6fr_.6fr_.6fr_.6fr_.6fr_minmax(92px,max-content)]";

function TradeButton({ onClick, label = "Trade" }: { onClick?: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-none border border-white/10 bg-white text-black px-3 py-1 text-sm font-medium hover:bg-white/90"
    >
      {label}
    </button>
  );
}

function DataCell({ label, children, numeric = false }: { label: string; children: React.ReactNode; numeric?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-[.16em] text-white/60 leading-tight">{label}</div>
      <div className={cn("mt-0.5 text-sm text-white/90", numeric && "tabular-nums")}>{children}</div>
    </div>
  );
}

export type VaultRowProps = {
  name: string;
  timer: string;          // "00:00:32"
  pfp: string;
  price?: string;
  baseAsset: string;      // "BTC"
  treasury: string;       // "4.52 BTC"
  potentialWin: string;   // "1,000×"
  apy: string;            // "164%"
  endgame: string;        // "100 Days"
  onTrade?: () => void;
  status?: string;
  icoDate?: string;
  buttonText?: string;
  airdropAsset?: string;
};

export function VaultRow(props: VaultRowProps) {
  const { name, timer, pfp, price, baseAsset, treasury, potentialWin, apy, endgame, onTrade, status, icoDate, buttonText, airdropAsset } = props;

  const getTokenImage = (tokenSymbol: string) => {
    const tokenImages: { [key: string]: string } = {
      'SOL': '/images/Solana_logo.png',
      'USDC': '/images/USDC.png',
      'USDT': '/images/USDT.png',
      'REVS': '/images/token.png',
      'BONK': '/images/BONK.png',
      'WIF': '/images/WIF.png',
      'JUP': '/images/JUP.png',
      'RAY': '/images/RAY.png',
      'ORCA': '/images/ORCA.png',
    };
    return tokenImages[tokenSymbol.toUpperCase()] || '/images/token.png';
  };

  return (
    <div className={cn(GRID, "gap-1 items-center rounded-none ring-1 ring-white/10 bg-white/5 backdrop-blur-[10px] px-5 py-4")}> 
      {/* Vault + timer */}
      <div className="flex items-center gap-4">
        <img src={pfp} alt={name} className="h-16 w-16 rounded-md object-cover border border-white/10 bg-white" />
        <div>
          <div className="flex items-center gap-2 font-bold text-white leading-tight">
            {name}
            {status === 'pre_ico' && (
              <div className="inline-flex items-center gap-2 rounded-[8px] bg-cyan-500/20 backdrop-blur-[10px] ring-1 ring-cyan-400/30 px-2 py-0.5 text-xs text-cyan-300 font-semibold">
                Pre-ICO
              </div>
            )}
          </div>
          {status === 'pre_ico' && icoDate ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-white/90">
              <span className="text-sm font-medium">{icoDate.split(' - ')[0].replace(/, 2025/, '')}</span>
              <span className="text-xs text-white/70">{icoDate.split(' - ')[1]}</span>
              <a 
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=ICO: ${icoDate.split(' - ')[0]}&details=ICO fundraise for this vault&location=Online`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white/80 transition-colors"
                title="Add to Calendar"
              >
                📅
              </a>
            </div>
          ) : (
            <div className="mt-1 inline-flex items-center gap-2 rounded-[8px] bg-white/10 backdrop-blur-[10px] ring-1 ring-white/15 px-2 py-0.5 text-sm md:text-base text-white/90 tabular-nums">{timer}</div>
          )}
        </div>
      </div>

      {status === 'pre_ico' ? (
        <>
          <DataCell label="Vault Asset">
            <div className="flex items-center justify-center gap-2">
              <img src={getTokenImage(baseAsset)} alt={baseAsset} className="h-4 w-4" />
              <span>{baseAsset}</span>
            </div>
          </DataCell>
          <DataCell label="Airdrop Asset">
            <div className="flex items-center justify-center gap-2">
              <img src={getTokenImage(airdropAsset || "REVS")} alt={airdropAsset || "REVS"} className="h-4 w-4" />
              <span>{airdropAsset || "REVS"}</span>
            </div>
          </DataCell>
          <DataCell label="BID:WIN" numeric>{potentialWin}</DataCell>
          <DataCell label="Timer">{timer.includes('h') ? timer : `${Math.floor(parseInt(timer) / 3600)}h`}</DataCell>
          <DataCell label="Lifespan">{endgame}</DataCell>
          <DataCell label="Trade Fee">
            <div className="text-white/90">5%</div>
          </DataCell>
        </>
      ) : (
        <>
          <DataCell label="Price" numeric>{price ?? "N/A"}</DataCell>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[.16em] text-white/60">Vault Asset</div>
            <div className="mt-0.5 text-sm text-white/90 flex items-center justify-center gap-2">
              <img src={getTokenImage(baseAsset)} alt={baseAsset} className="h-4 w-4" />
              <span>{baseAsset}</span>
            </div>
          </div>
          <DataCell label="Treasury" numeric>{treasury}</DataCell>
          <DataCell label="BID:WIN" numeric>{potentialWin}</DataCell>
          <DataCell label="APY%" numeric>{apy}</DataCell>
          <DataCell label="Endgame">{endgame}</DataCell>
        </>
      )}
      <div className="justify-self-end self-center whitespace-nowrap">
        <TradeButton onClick={onTrade} label="View Vault" />
      </div>
    </div>
  );
}
