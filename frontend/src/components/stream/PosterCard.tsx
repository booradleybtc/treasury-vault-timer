"use client"
import { Card } from "@/components/ui/Card"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type Props = {
  title: string
  subtitle?: string
  metaLeft?: string
  metaRight?: string
  imageUrl: string
  onClick?: () => void
  className?: string
  topRight?: React.ReactNode  // e.g., Live dot + timer
}

export function PosterCard({
  title, subtitle, metaLeft, metaRight, imageUrl, onClick, className, topRight
}: Props) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.01 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
      <Card onClick={onClick} className={cn("relative overflow-hidden rounded-3xl shadow-glow bg-card", className)}>
        <div className="aspect-[16/9]">
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
        </div>

        {/* Top gradient & meta */}
        <div className="absolute inset-x-0 top-0 p-3">
          <div className="rounded-2xl bg-gradient-to-b from-black/70 to-transparent px-3 py-2">
            <div className="flex items-center justify-between text-[11px] text-white/90">
              <span className="font-medium">{metaLeft}</span>
              <div className="flex items-center gap-2">{topRight}<span className="font-medium">{metaRight}</span></div>
            </div>
          </div>
        </div>

        {/* Bottom gradient & titles */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="rounded-2xl bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-3">
            <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-white/85 line-clamp-2">{subtitle}</p> : null}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
