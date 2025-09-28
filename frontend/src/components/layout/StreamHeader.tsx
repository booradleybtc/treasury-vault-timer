"use client"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/Input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/Button"
import { Search } from "lucide-react"

type Props = {
  onSearch?: (q: string) => void
  activeTab?: string
  onTabChange?: (v: string) => void
  rightAction?: React.ReactNode
}

export function StreamHeader({ onSearch, activeTab="home", onTabChange, rightAction }: Props) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/20">
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary shadow-glow grid place-items-center text-primary-foreground font-bold">D</div>
          <div className="font-semibold tracking-tight">Darwin Vaults</div>

          <div className="ml-4 hidden md:block">
            <Tabs value={activeTab} onValueChange={onTabChange} className="rounded-full">
              <TabsList className="rounded-full bg-white/10 border border-white/10 backdrop-blur px-1 py-1 shadow-glass">
                {["home","vaults","admin","docs","about"].map(t => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="rounded-full data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    {t[0].toUpperCase()+t.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 shadow-glass border border-white/10">
              <Search className="h-4 w-4 opacity-80" />
              <Input
                placeholder="Search Vaults"
                onChange={(e)=>onSearch?.(e.target.value)}
                className="h-7 w-48 border-0 bg-transparent focus-visible:ring-0 text-sm placeholder:text-white/60"
              />
            </div>
            {rightAction ?? (
              <Button className="rounded-full bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] hover:opacity-90">
                Launch Vault
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
