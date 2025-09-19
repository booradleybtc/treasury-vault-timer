import { PropsWithChildren } from "react"
import { cn } from "@/lib/utils"

export function Rail({ title, children, className }: PropsWithChildren<{title: string, className?: string}>) {
  return (
    <section className={cn("mx-auto w-full max-w-7xl px-4", className)}>
      <h2 className="mb-3 mt-6 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="relative shadow-[inset_0_0_120px_rgba(255,90,40,.08)] rounded-2xl">
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </div>
    </section>
  )
}
