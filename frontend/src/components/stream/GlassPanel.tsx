import { cn } from "@/lib/utils"

export function GlassPanel({ className, children }:{className?: string, children: React.ReactNode}) {
  return (
    <div className={cn(
      "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-glass",
      "ring-1 ring-black/20",
      className
    )}>
      {children}
    </div>
  )
}
