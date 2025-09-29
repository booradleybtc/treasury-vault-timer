import React from "react";
import { Copy } from "lucide-react";
import { cn } from "./cn";
import { normalizeBackendUrl } from "@/lib/utils";
import { formatTimerLength } from "@/lib/utils";

const GRID = "grid grid-cols-[1.7fr_.6fr_.6fr_.6fr_.6fr_.6fr_.6fr_minmax(92px,max-content)]";

function TradeButton({ onClick, label = "Trade" }: { onClick?: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-none px-3 py-1 text-sm font-medium ${
        label === 'View ICO'
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:from-green-400 hover:to-emerald-400'
          : 'border border-white/10 bg-white text-black hover:bg-white/90'
      }`}
    >
      {label}
    </button>
  );
}

function DataCell({ label, children, numeric = false }: { label: string; children: React.ReactNode; numeric?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-[.16em] text-white/60 leading-tight">{label}</div>
      <div className={cn("mt-1.5 text-sm text-white/90", numeric && "tabular-nums")}>{children}</div>
    </div>
  );
}

export type VaultRowProps = {
  name: string;
  timer: string;          // "00:00:32"
  timerDuration?: number;
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
  icoTreasuryAddress?: string;
  icoAsset?: string;
  icoThreshold?: number;
  icoProgress?: number;
  buttonText?: string;
  airdropAsset?: string;
  airdropAssetLogo?: string;
  tradeFee?: string;
  vaultAssetLogo?: string;
};

export function VaultRow(props: VaultRowProps) {
  const { name, timer, timerDuration, pfp, price, baseAsset, treasury, potentialWin, apy, endgame, onTrade, status, icoDate, icoTreasuryAddress, icoAsset, icoThreshold, icoProgress, buttonText, airdropAsset, airdropAssetLogo, vaultAssetLogo, tradeFee } = props;

  const getTokenImage = (tokenSymbol: string) => {
    const tokenImages: { [key: string]: string } = {
      'SOL': '/images/Solana_logo.png',
      'USDC': '/images/token.png', // Using generic token image since USDC.png doesn't exist
      'USDT': '/images/token.png', // Using generic token image since USDT.png doesn't exist
      'REVS': '/images/token.png',
      'BONK': '/images/token.png',
      'WIF': '/images/token.png',
      'JUP': '/images/token.png',
      'RAY': '/images/token.png',
      'ORCA': '/images/token.png',
      'MSOL': '/images/token.png',
      'ETH': '/images/token.png',
    };
    return tokenImages[tokenSymbol.toUpperCase()] || '/images/token.png';
  };

  return (
    <div className={cn(GRID, "gap-1 items-center rounded-none ring-1 ring-white/10 bg-white/5 backdrop-blur-[10px] px-5 py-4")}> 
      {/* Vault + timer */}
      <div className="flex items-center gap-4">
            <img src={normalizeBackendUrl(pfp) || pfp} alt={name} className="h-16 w-16 rounded-md object-cover" />
        <div>
          <div className="flex items-center gap-2 font-bold text-white leading-tight text-base sm:text-lg">
            {name}
            {status === 'pre_ico' && (
              <div className="inline-flex items-center gap-2 rounded-[8px] bg-cyan-500/20 backdrop-blur-[10px] ring-1 ring-cyan-400/30 px-2 py-0.5 text-xs text-cyan-300 font-semibold">
                Pre-ICO
              </div>
            )}
            {status === 'ico' && (
              <div className="inline-flex items-center gap-2 rounded-[8px] bg-green-500/20 backdrop-blur-[10px] ring-1 ring-green-400/30 px-2 py-0.5 text-xs text-green-300 font-semibold">
                ICO
              </div>
            )}
          </div>
          {status === 'pre_ico' && icoDate ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-white/90">
              <span className="text-sm font-medium">{icoDate.split(' - ')[0].replace(/, 2025/, '')}</span>
              <span className="text-sm text-white/70">{icoDate.split(' - ')[1]}</span>
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
          ) : status === 'ico' ? (
            <div className="mt-1 inline-flex items-center gap-2 text-sm md:text-base text-green-400 tabular-nums">{timer}</div>
          ) : (
            <div className="mt-1 inline-flex items-center gap-2 rounded-[8px] bg-white/10 backdrop-blur-[10px] ring-1 ring-white/15 px-2 py-0.5 text-sm md:text-base text-white/90 tabular-nums">{timer}</div>
          )}
        </div>
      </div>

      {status === 'pre_ico' ? (
        <>
          <DataCell label="Vault Asset">
            <div className="flex items-center justify-center gap-2">
              <img src={vaultAssetLogo || getTokenImage(baseAsset)} alt={baseAsset} className="h-4 w-4" />
              <span>{baseAsset}</span>
            </div>
          </DataCell>
          <DataCell label="Airdrop Asset">
            <div className="flex items-center justify-center gap-2">
              <img src={airdropAssetLogo || getTokenImage(airdropAsset || "REVS")} alt={airdropAsset || "REVS"} className="h-4 w-4" />
              <span>{airdropAsset || "REVS"}</span>
            </div>
          </DataCell>
          <DataCell label="BID:WIN" numeric>{potentialWin}</DataCell>
          <DataCell label="Timer">{formatTimerLength(timerDuration || 3600)}</DataCell>
          <DataCell label="Lifespan">{endgame}</DataCell>
          <DataCell label="Trade Fee">
            <div className="text-white/90">{tradeFee || "5%"}</div>
          </DataCell>
        </>
      ) : status === 'ico' ? (
        <>
          <DataCell label="Vault Asset">
            <div className="flex items-center justify-center gap-2">
              <img src={vaultAssetLogo || getTokenImage(baseAsset)} alt={baseAsset} className="h-4 w-4" />
              <span>{baseAsset}</span>
            </div>
          </DataCell>
          <DataCell label="Airdrop Asset">
            <div className="flex items-center justify-center gap-2">
              <img src={airdropAssetLogo || getTokenImage(airdropAsset || "REVS")} alt={airdropAsset || "REVS"} className="h-4 w-4" />
              <span>{airdropAsset || "REVS"}</span>
            </div>
          </DataCell>
          <DataCell label="BID:WIN" numeric>{potentialWin}</DataCell>
          <DataCell label="Timer">{formatTimerLength(timerDuration || 3600)}</DataCell>
          <DataCell label="Lifespan">{endgame}</DataCell>
          <DataCell label="Progress">
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 bg-white/20 h-2 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 transition-all duration-300"
                  style={{ 
                    width: `${Math.min(((icoProgress || 0) / Math.max(icoThreshold || 1000, icoProgress || 0)) * 100, 100)}%` 
                  }}
                ></div>
                <div 
                  className="absolute top-0 h-2 w-0.5 bg-green-400"
                  style={{ 
                    left: `${Math.min((10000 / Math.max(icoThreshold || 1000, icoProgress || 0)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-white/70 text-center">
                ${icoProgress || 0}
              </div>
            </div>
          </DataCell>
        </>
      ) : (
        <>
          <DataCell label="Price" numeric>{price ?? "N/A"}</DataCell>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[.16em] text-white/60">Vault Asset</div>
            <div className="mt-0.5 text-sm text-white/90 flex items-center justify-center gap-2">
              <img src={vaultAssetLogo || getTokenImage(baseAsset)} alt={baseAsset} className="h-4 w-4" />
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
        <TradeButton onClick={onTrade} label={buttonText || "View Vault"} />
      </div>
    </div>
  );
}
