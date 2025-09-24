import { cn } from "@/lib/utils"

export function GlassPanel({ className, children }:{className?: string, children: React.ReactNode}) {
  return (
    <div className={cn(
      "rounded-3xl border border-white/12 bg-white/[0.05] backdrop-blur-xl shadow-card",
      className
    )}>
      {children}
    </div>
  )
}
