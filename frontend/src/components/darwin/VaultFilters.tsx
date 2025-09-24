import React from "react";
import { cn } from "./cn";

export function VaultFilters({ active = "All", onChange }: { active?: string; onChange?: (v: string) => void }) {
  const opts = ["All", "Live Vaults", "ICO in Progress", "ICO Now", "Countdown", "Pre-ICO", "Extinct Vaults"];
  return (
    <div className="flex items-center gap-2 sm:gap-3 overflow-x-visible">
      {opts.map((o) => {
        const isActive = o === active;
        return (
          <button
            key={o}
            onClick={() => onChange?.(o)}
            className={cn(
              "relative px-1 pb-1 text-xs sm:text-sm font-medium transition whitespace-nowrap flex-shrink-0",
              isActive 
                ? "text-white border-b-2 border-emerald-400"
                : "text-white/70 hover:text-white hover:border-b hover:border-white/30"
            )}
          >
            <span className="relative z-10">{o}</span>
            {isActive && (
              <span className="pointer-events-none absolute inset-x-[-8px] bottom-[-10px] h-5 rounded-full blur-md bg-emerald-500/30" />
            )}
          </button>
        );
      })}
    </div>
  );
}
